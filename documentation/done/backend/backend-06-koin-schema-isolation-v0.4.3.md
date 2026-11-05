# Backend Deliverable: Aislamiento Multiapp de Esquemas PostgreSQL (`koin_*`) - Versión 0.4.3

- **Módulo:** Persistencia & Multi-tenancy / Aislamiento de Base de Datos
- **Rama:** `feat/database-koin-schema-isolation-v0.4.3`
- **Fecha:** 05/11/2026
- **Autor:** Dylan Gamero

---

## 1. Resumen Arquitectónico

Se completó el aislamiento estricto de los esquemas de base de datos bajo el espacio de nombres de la aplicación Koin (`koin_*`). Esta reestructuración permite que una misma instancia de PostgreSQL sea compartida de manera segura y sin colisiones de nombres por múltiples aplicaciones o microservicios que utilicen sus propios esquemas (ej. `koin_auth`, `app2_auth`, etc.).

### Mapeo de Esquemas:
| Esquema Original | Esquema Aislado (`v0.4.3`) | Propósito y Contenido |
|---|---|---|
| `auth` | `koin_auth` | Usuarios maestros (`users`), perfiles aislados (`profiles`), credenciales y PINs |
| `finance` | `koin_finance` | Cuentas (`accounts`), membresías compartidas (`account_members`), invitaciones (`account_invitations`), categorías (`categories`), transacciones (`transactions`), presupuestos (`budgets`), reglas recurrentes (`recurring_rules`) |
| `analytics` | `koin_analytics` | Vistas materializadas / analíticas (`v_category_expenses`, `v_monthly_cashflow`, `v_budget_health`) |
| `system` | `koin_system` | Tasas de cambio multimoneda (`exchange_rates`), logs de auditoría (`audit_logs`) |

---

## 2. Cambios en Persistencia y Repositorios Go

1. **Configuración de Conexión (`apps/server/internal/database/database.go`):**
   - Configuración explícita de `search_path`:
     ```go
     cfg.ConnConfig.RuntimeParams["search_path"] = "koin_finance,koin_auth,koin_analytics,koin_system,public"
     ```
2. **Scripts de Inicialización (`docker/postgres/01-init.sql`):**
   - Creación de esquemas `koin_auth`, `koin_finance`, `koin_analytics`, `koin_system`.
   - Todas las tablas, índices, llaves foráneas, triggers y vistas actualizados al namespace `koin_*`.
3. **Repositorios y Handlers Go (`apps/server/internal/...`):**
   - `internal/auth/repository.go`: Queries actualizadas a `koin_auth.users`, `koin_auth.profiles`, `koin_finance.accounts`, `koin_finance.account_members`, `koin_finance.categories`.
   - `internal/profiles/repository.go`: Queries actualizadas a `koin_auth.profiles`, `koin_finance.accounts`, etc.
   - `internal/accounts/repository.go` & `handler.go`: Queries actualizadas a `koin_finance.accounts`, `koin_finance.account_members`, `koin_finance.account_invitations`, `koin_finance.transactions`, `koin_auth.profiles`.
   - `internal/categories/repository.go` & `handler.go`: Queries actualizadas a `koin_finance.categories`, `koin_finance.transactions`, `koin_auth.profiles`.
   - `internal/transactions/repository.go` & `handler.go`: Queries actualizadas a `koin_finance.transactions`, `koin_finance.accounts`, `koin_system.exchange_rates`, `koin_auth.profiles`.
   - `internal/recurring/repository.go` & `handler.go`: Queries actualizadas a `koin_finance.recurring_rules`, `koin_finance.transactions`, `koin_finance.accounts`, `koin_system.exchange_rates`, `koin_auth.profiles`.

---

## 3. Migración en Caliente (Docker PostgreSQL)

Se ejecutó la migración atómica en el contenedor activo `koin-db`:
```sql
BEGIN;
ALTER SCHEMA auth RENAME TO koin_auth;
ALTER SCHEMA finance RENAME TO koin_finance;
ALTER SCHEMA analytics RENAME TO koin_analytics;
ALTER SCHEMA system RENAME TO koin_system;
-- Recreación de vistas en koin_analytics apuntando a koin_finance
...
COMMIT;
```
Preservación del 100% de la información previa y cero pérdida de datos.

---

## 4. Pruebas y Verificación

- `pnpm check-types`: 4/4 proyectos exitosos sin errores de tipos.
- `pnpm build`: Compilación exitosa de `@koin/shared`, `@koin/server` (Go binary) y `@koin/web`.
- `pnpm test`: Ejecución limpia de suite de pruebas.
- `docker compose up -d --build koin-api koin-web`: Recreación y arranque exitoso de contenedores.
- Petición HTTP `/api/v1/auth/login`: Verificada respuesta en 2.3ms consultando `koin_auth.users`.
