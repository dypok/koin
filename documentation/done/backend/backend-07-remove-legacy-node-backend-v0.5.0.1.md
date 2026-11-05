# Entregable: Eliminación Completa del Backend Legacy Node.js Express

> **ID de Tarea:** Limpieza de Arquitectura Backend & Depuración de Monorepo.  
> **Versión de Release:** `v0.5.0.1` (Beta 0.5.0.1).  
> **Rama:** `feat/backend-remove-legacy-node-backend-v0.5.0.1`.  
> **Fecha:** 05/11/2026.  
> **Autor:** Dylan Gamero.

---

## 1. Resumen de la Intervención

Habiéndose completado y estabilizado al 100% el backend nativo en **Go 1.24+ (Chi + pgxpool)** y certificado su funcionamiento en producción con esquemas aislados `koin_*`, se procedió a la remoción definitiva de todos los artefactos, carpetas y dependencias de la implementación legacy de Node.js Express y Drizzle ORM en `apps/server/`.

---

## 2. Archivos y Carpetas Eliminados

1. **Código fuente legacy de Node.js:**
   - `apps/server/src/`: Eliminados todos los módulos, middlewares, controladores y resolvers Express.
2. **Configuración y artefactos Drizzle ORM:**
   - `apps/server/drizzle/`: Migraciones y metadatos SQL obsoletos.
   - `apps/server/drizzle.config.ts`: Archivo de configuración de drizzle-kit.
3. **Compilados y TypeScript de Node:**
   - `apps/server/dist/`: Salida transpilada de Node.
   - `apps/server/tsconfig.json`: Configuración TS de backend.
4. **Dependencias y Tareas Depuradas:**
   - `apps/server/package.json`: Eliminadas 181 dependencias obsoletas (`express`, `drizzle-orm`, `argon2`, `helmet`, `hpp`, `jsonwebtoken`, `pg`, `swagger-ui-express`, `drizzle-kit`, `tsx`, `@types/*`). Conserva exclusivamente los scripts de orquestación de Turborepo hacia el binario de Go.
   - `package.json` raíz & `turbo.json`: Eliminadas las tareas `db:generate` y `db:migrate` de Drizzle.

---

## 3. Impacto y Mejoras

- **Reducción de dependencias:** Se purgaron 181 paquetes del árbol de node_modules en el workspace (`pnpm install` liberó decenas de megabytes).
- **Cero ambigüedad arquitectónica:** La carpeta `apps/server` ahora contiene de forma 100% pura el proyecto en Go (`cmd/api/`, `internal/`, `go.mod`, `go.sum`).
- **Verificación de Calidad:**
  - `pnpm check-types`: 4/4 proyectos exitosos sin fallos.
  - `pnpm test`: Suite completa de pruebas ejecutada con éxito.
  - Versión del monorepo y paquetes actualizada a **`0.5.0.1`** (`0.5.0-1`).
