# Entregable Backend: Motor de Transacciones, Transferencias ACID y Multidivisa (Épica 5)

> **ID de Épica:** EPIC-05 — Motor de transacciones financieras, transferencias y multidivisa  
> **Historias de Usuario:** TXN-02, TXN-03, TXN-04, TXN-05 (y cimientos de BUD-01)  
> **Rama:** `feat/backend-epic-5-transactions-engine`  
> **Fecha:** 04/11/2026  
> **Desarrollador / Asistente:** Dylan Gamero / Antigravity  

---

## 1. Resumen Arquitectónico

Se implementó el motor central de transacciones financieras para Koin en Go (arquitectura hexagonal y desacoplada), con persistencia en PostgreSQL bajo esquema multi-tenant (`finance.transactions`, `finance.categories`, `system.exchange_rates`, `finance.accounts`).

### Capas Implementadas:
- **`internal/models/models.go`:** Modelos y DTOs estructurados para `Transaction`, `ExchangeRate`, `CategoryWithUsage`, `CreateTransactionRequest`, `UpdateTransactionRequest`, `CreateTransferRequest`, y filtros con paginación `TransactionFilter` y `PaginatedTransactions`.
- **`internal/transactions/repository.go`:** Persistencia en PostgreSQL mediante transacciones ACID (`pgx.Tx`). Operaciones atómicas de inserción de gastos/ingresos, actualización de balances en tiempo real (`syncAccountBalance`), transferencias con conversión multidivisa y eliminación con reversión de saldos.
- **`internal/transactions/service.go`:** Lógica de negocio, validaciones contables, resolución de divisas, cálculo de equivalencia a moneda base (`base_amount`) con precisión `NUMERIC(14,2)` y verificación de roles (`owner` / `editor`) sobre cuentas origen y destino.
- **`internal/transactions/handler.go`:** Endpoints RESTful con autenticación JWT, resolución dinámica de perfil activo (`X-Profile-ID`), filtros combinados y control de errores HTTP semánticos.
- **`internal/categories/`:** Repositorio, servicio y controlador para categorías (`GET`, `POST`, `PATCH`, `DELETE`). Incluye conteo de frecuencia de uso por perfil (`usageCount`) para permitir el algoritmo de guardado rápido en 2 toques, e integridad referencial estricta (no permite eliminar categorías con movimientos registrados).

---

## 2. Contratos y Endpoints REST

| Método | Endpoint | Descripción | Seguridad / RBAC |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/transactions` | Historial cronológico con filtros combinados (`accountId`, `categoryId`, `type`, `startDate`, `endDate`, `search`) y paginación | JWT + Perfil Activo |
| `POST` | `/api/v1/transactions` | Registro atómico de ingreso o gasto con deducción/adición de saldo | Rol `owner` o `editor` |
| `GET` | `/api/v1/transactions/:id` | Consulta detallada con joins de cuenta y categoría | Rol en cuenta o propietario |
| `PATCH` | `/api/v1/transactions/:id` | Modificación de nota, categoría, fecha, tags o importe con recálculo atómico de saldo | Rol `owner` o `editor` |
| `DELETE` | `/api/v1/transactions/:id` | Eliminación y reversión matemática inmediata del saldo de la cuenta | Rol `owner` o `editor` |
| `POST` | `/api/v1/transfers` | Transferencia ACID entre dos cuentas con conversión automática de divisa y actualización de ambos saldos | Rol `owner`/`editor` en origen y destino |
| `GET` | `/api/v1/currencies/rates` | Listado de tasas de cambio registradas en el sistema (ej: `USD_COP`, `USD_EUR`) | Pública / Autenticada |
| `GET` | `/api/v1/categories` | Listado de categorías ordenadas por frecuencia de uso (`usageCount DESC`) para guardado en 2 toques | JWT + Perfil Activo |
| `POST` | `/api/v1/categories` | Creación de categoría personalizada con icono SVG Lucide y color hexadecimal | JWT + Perfil Activo |
| `PATCH` | `/api/v1/categories/:id` | Edición de propiedades de categoría | Propietario del perfil |
| `DELETE` | `/api/v1/categories/:id` | Eliminación protegida (rechaza con 409 si tiene movimientos vinculados) | Propietario del perfil |

---

## 3. Modelo de Datos y Esquema Relacional

### Modificaciones en `docker/postgres/01-init.sql`:
- **`finance.transactions`**:
  - `category_id uuid NULL` (permite que transferencias no requieran categoría obligatoria forzada).
  - `to_amount numeric(14, 2) NULL` (almacena el importe exacto acreditado en la cuenta destino cuando las divisas difieren).
  - `exchange_rate_to_base numeric(18, 6)` y `base_amount numeric(14, 2)` con precisión estricta para evitar errores de coma flotante.
- **`system.exchange_rates`**:
  - Poblado inicial de 23 pares de divisas comunes (`USD`, `EUR`, `COP`, `MXN`, `BRL`, `ARS`, `CLP`, `PEN`, `GBP`, `CAD`).
- **`finance.accounts`**:
  - Recálculo en tiempo real del saldo contable integrando `to_amount`:
  ```sql
  WHEN t.type = 'transfer' AND t.to_account_id = a.id THEN COALESCE(t.to_amount, t.amount)
  ```

---

## 4. Pruebas y Verificación

Se ejecutó una suite automatizada de pruebas de integración completa (`test_epic5_backend.sh`) sobre el contenedor en vivo de `koin-api`:

```bash
=== 1. Checking Exchange Rates ===
Found 23 exchange rates in system.exchange_rates
PASS: Multicurrency rates verified
=== 2. Registering Test User ===
PASS: Registered user. Profile ID: d980b61d-30f5-4396-b144-25812069e5cc
=== 3. Checking Profile Default Categories & Usage Sorting ===
Profile has 12 categories
PASS: Food Cat: 492a59f7-90b1-4ba1-b867-04bfa84d9650, Salary Cat: 492a59f7-90b1-4ba1-b867-04bfa84d9650
=== 4. Creating Accounts (ACC-A: USD $1000, ACC-B: USD $500, ACC-C: EUR 100) ===
PASS: Accounts created: A, B, C
=== 5. TXN-02: Expense Creation and Real-time Balance Deduction ===
PASS: Expense atomic balance deduction verified ($1000 - $150 = $850)
=== 6. TXN-02: Income Creation and Real-time Balance Addition ===
PASS: Income atomic balance increment verified ($850 + $300 = $1150)
=== 7. TXN-03: Multicurrency Engine & Base Amount Resolution ===
PASS: Multicurrency dual amount calculated successfully (50 EUR => 54.35 USD Base Amount)
=== 8. TXN-04: ACID Account Transfers (Same Currency) ===
PASS: ACID Transfer debit & credit verified simultaneously ($200 transferred: A -> $950, B -> $700)
=== 9. TXN-04: Cross-Currency Transfer with Currency Conversion ===
PASS: Cross-currency transfer balance computed correctly ($100 USD transferred to EUR account -> 92.00 EUR credited, balance = 142.00 EUR)
=== 10. TXN-05: Transaction History, Search and Filters ===
PASS: Transaction listing, filtering and live search verified
=== 11. TXN-02: Undo / Delete Reversal ===
PASS: Undo / Delete atomic balance reversal verified (Deleting $150 expense restored balance to $1000.00)
=== 12. Categories Management and Constraints (BUD-01 & TXN-02) ===
PASS: Foreign key integrity constraint preserved (409 Conflict when deleting category with transactions)
PASS: Custom category created and deleted cleanly
==========================================================
🎉 ALL EPIC 5 BACKEND TESTS PASSED WITH 100% SUCCESS!
==========================================================
```

- **Typecheck Monorepo:** `turbo run check-types` completado exitosamente (0 errores en `@koin/shared`, `@koin/server`, `@koin/web`).
- **Aislamiento Frontend:** `apps/web/` no sufrió ninguna modificación.
