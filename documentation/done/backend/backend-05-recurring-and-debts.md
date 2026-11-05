# Backend Deliverable: Motor de Movimientos Recurrentes, Salario Fijo y Amortización de Deudas con Intereses

- **Módulo:** Movimientos Recurrentes y Amortización de Deudas (Fijos y Créditos a Plazos)
- **Rama:** `feat/backend-recurring-and-debts`
- **Fecha:** 04/11/2026
- **Autor:** Dylan Gamero

---

## 1. Resumen Arquitectónico

Se implementó el motor backend para la programación y automatización de compromisos financieros periódicos en Koin, cubriendo dos modalidades esenciales:

1. **Ingresos y Gastos Fijos Indefinidos:**
   - Salarios mensuales, nóminas, arriendos, servicios públicos y suscripciones.
   - Sin fecha de caducidad; se repiten automáticamente o bajo demanda cada ciclo (`monthly`, `biweekly`, `weekly`, `yearly`).
   - Cálculo dinámico de próxima fecha de ejecución (`next_run_date`) con ajuste por número de días del mes.

2. **Créditos, Préstamos y Deudas a Plazo Finito (con Intereses):**
   - Compromisos a $N$ cuotas fijas (ej. 6, 12, 24 meses).
   - Desglose contable transparente de **Capital vs Intereses**:
     $$\text{Cuota Total} = \text{Porción Capital} + \text{Porción Interés}$$
   - Amortización progresiva: en cada pago se asienta una transacción etiquetada con `Cuota X/N (Capital: $A | Interés: $B)`.
   - Transición automática de estado: al registrar la última cuota ($N/N$), la deuda pasa automáticamente a estado `completed` y cesan los cobros periódicos.

---

## 2. Contratos y Endpoints REST (`/api/v1/recurring`)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/api/v1/recurring` | Lista todos los compromisos del perfil activo (soporta `?status=active\|paused\|completed`) |
| `POST` | `/api/v1/recurring` | Registra una nueva regla periódica (salario, gasto fijo o deuda con cuotas) |
| `GET` | `/api/v1/recurring/:id` | Obtiene el detalle de una regla recurrente con datos enriquecidos de cuenta y categoría |
| `PATCH` | `/api/v1/recurring/:id` | Modifica parámetros, pausa (`paused`) o reactiva (`active`) la regla |
| `DELETE` | `/api/v1/recurring/:id` | Elimina una regla recurrente |
| `POST` | `/api/v1/recurring/:id/apply` | Ejecuta de forma inmediata el cobro/abono de la cuota pendiente en transacción atómica |
| `POST` | `/api/v1/recurring/process-due` | Evalúa y ejecuta masivamente todas las reglas activas con fecha vencida (`next_run_date <= TODAY`) |

---

## 3. Modelo de Persistencia (PostgreSQL)

### Tabla: `finance.recurring_rules`
- `id uuid PRIMARY KEY`
- `profile_id uuid REFERENCES auth.profiles(id)`
- `account_id uuid REFERENCES finance.accounts(id)`
- `category_id uuid REFERENCES finance.categories(id)`
- `name varchar(100)`
- `type varchar(20)` (`income`, `expense`, `transfer`)
- `amount numeric(14, 2)`
- `currency varchar(3)`
- `frequency varchar(20)` (`monthly`, `biweekly`, `weekly`, `yearly`)
- `day_of_month integer` (1 a 31)
- `is_installment boolean`
- `total_installments integer`
- `current_installment integer`
- `principal_amount numeric(14, 2)`
- `total_interest_amount numeric(14, 2)`
- `installment_principal numeric(14, 2)`
- `installment_interest numeric(14, 2)`
- `interest_rate numeric(6, 3)`
- `auto_apply boolean`
- `next_run_date date`
- `last_run_at timestamp with time zone`
- `status varchar(20)` (`active`, `paused`, `completed`)
- `note text`

### Extensión de `finance.transactions`
- `recurring_rule_id uuid REFERENCES finance.recurring_rules(id)`
- `installment_number integer`
- `principal_portion numeric(14, 2)`
- `interest_portion numeric(14, 2)`

---

## 4. Pruebas y Verificación

1. **Compilación de Contratos Compartidos:**
   ```bash
   pnpm --filter=@koin/shared build # 100% exitoso (tsc)
   ```
2. **Compilación Estática de Go:**
   ```bash
   go vet ./... && CGO_ENABLED=0 go build -o bin/api ./cmd/api # 100% exitoso
   ```
3. **Prueba Integral E2E:**
   - Registro de usuario con cuenta bancaria.
   - Creación de salario mensual (\$2,500 USD).
   - Aplicación de salario: transacción creada, balance actualizado, `nextRunDate` avanzada al mes siguiente.
   - Creación de deuda a 6 cuotas de \$220 (\$1,200 capital, \$120 intereses, \$200 capital por cuota, \$20 interés por cuota).
   - Pago de cuota 1 a 6 secuenciales:
     - Cada cuota generó transacción con desglose de capital/interés.
     - En la cuota 6/6 el estado cambió automáticamente a `completed`.
