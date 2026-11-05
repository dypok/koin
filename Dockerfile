# Multi-stage build for Koin Unified Production / Heroku Container
# Stage 1: Build Frontend Web SPA (React 19 + TypeScript + Vite)
FROM node:20-alpine AS web-builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@12.6.0 --activate

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN pnpm install --frozen-lockfile
RUN pnpm --filter=@koin/shared build && pnpm --filter=@koin/web build

# Stage 2: Build Backend Go API (Chi + pgxpool)
FROM golang:alpine AS api-builder

WORKDIR /app

ENV GOTOOLCHAIN=auto
RUN apk add --no-cache git ca-certificates

COPY apps/server/go.mod apps/server/go.sum ./
RUN go mod download

COPY apps/server ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o /app/bin/api ./cmd/api

# Stage 3: Minimal Production Image (Alpine Linux)
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S koin && adduser -S koin -G koin

WORKDIR /app

COPY --from=api-builder /app/bin/api /app/bin/api
COPY --from=web-builder /app/apps/web/dist /app/web/dist
COPY docker/postgres/01-init.sql /app/docker/01-init.sql

USER koin:koin

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

ENTRYPOINT ["/app/bin/api"]
