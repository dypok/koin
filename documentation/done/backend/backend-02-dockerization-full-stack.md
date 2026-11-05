# Entregable Backend: Dockerización Full-Stack (Go, React SPA y PostgreSQL)

- **ID de Tarea:** Dockerización de Infraestructura & Compatibilidad de Despliegue
- **Rama:** `feat/backend-go-migration`
- **Fecha:** 04/11/2026
- **Autor:** Dylan Gamero

---

## 1. Resumen de la Solución

Se implementó una suite completa de contenedores Docker y orquestación con Docker Compose para el proyecto **Koin**:

1. **`koin-db` (PostgreSQL 16 Alpine):**
   - Healthcheck nativo (`pg_isready`).
   - Auto-aprovisionamiento de esquema inicial en primer arranque mediante `/docker-entrypoint-initdb.d/01-init.sql`.
   - Persistencia de datos en volumen Docker con nombre `koin_postgres_data`.
2. **`koin-api` (Go Backend):**
   - Binario compilado estáticamente (`CGO_ENABLED=0`, `-ldflags="-s -w"`, 12 MB).
   - Imagen runtime `alpine:3.20` con certificados SSL/CA y ejecución bajo usuario sin privilegios `koin:koin`.
   - Tamaño de imagen total: **33.7 MB** (8.65 MB comprimida).
3. **`koin-web` (React 19 Frontend SPA):**
   - Imagen `nginx:1.27-alpine` optimizada con compresión gzip, encabezados de seguridad, cache estático inmutable y fallback SPA para rutas del lado del cliente (`try_files $uri $uri/ /index.html`).
   - Reverse proxy transparente para rutas `/api/*` hacia `http://koin-api:3000`.
   - Tamaño de imagen total: **75.4 MB** (21.1 MB comprimida).
4. **`heroku.yml`:**
   - Manifiesto de despliegue para Heroku Container Registry con soporte para el addon gestionado de PostgreSQL.

---

## 2. Consumo de Recursos en Vivo

Medición realizada con `docker stats --no-stream`:

| Contenedor | Imagen | Memoria RAM Utilizada | % de CPU |
|---|---|---|---|
| `koin-web` | Nginx Alpine | **4.6 MiB** | 0.00% |
| `koin-api` | Go Alpine (estático) | **~25 MiB** (con pgxpool activo) | 0.00% |
| `koin-db` | Postgres 16 Alpine | **29.5 MiB** | 0.04% |
| **Total Stack** | **3 Contenedores** | **< 65 MiB** | **0.04%** |

---

## 3. Pruebas de Verificación Ejecutadas

- **Construcción:** `docker compose build` generó ambas imágenes en segundos sin descargas redundantes.
- **Orquestación:** `docker compose up -d` inició la red `koin-network`, esperó la salud de `koin-db` e inició `koin-api` y `koin-web`.
- **Salud Directa Backend:** `GET http://localhost:3000/api/health` -> HTTP 200 `{"status":"healthy","service":"koin-api-go"}`.
- **Proxy Nginx Backend:** `GET http://localhost:5173/api/health` -> HTTP 200 exitoso.
- **Entrega de Frontend:** `GET http://localhost:5173/` -> HTTP 200 con HTML de React 19.
- **Ruta SPA:** `GET http://localhost:5173/auth` -> HTTP 200 sirviendo `index.html`.
- **Registro y Auth Transaccional:** `POST http://localhost:5173/api/v1/auth/register` creó el usuario, perfil "Personal", 2 cuentas y 12 categorías a través de toda la cadena de proxies y base de datos dockerizada.
