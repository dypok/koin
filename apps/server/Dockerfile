# Ultra-lightweight minimal runtime image for Go backend
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata \
    && addgroup -S koin && adduser -S koin -G koin

WORKDIR /app

COPY bin/api /app/bin/api

USER koin:koin

EXPOSE 3000

ENV PORT=3000 \
    NODE_ENV=production

ENTRYPOINT ["/app/bin/api"]
