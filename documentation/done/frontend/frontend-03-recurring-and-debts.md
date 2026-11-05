# Frontend Deliverable: Gestión de Movimientos Recurrentes, Salario Fijo y Amortización de Deudas con Intereses

- **Módulo:** Movimientos Recurrentes y Deudas a Cuotas (Frontend)
- **Rama:** `feat/frontend-recurring-and-debts`
- **Fecha:** 04/11/2026
- **Autor:** Dylan Gamero

---

## 1. Resumen de Componentes Implementados

Se construyó la interfaz completa para gestionar compromisos financieros periódicos, salarios mensuales y deudas con intereses:

1. **`apps/web/src/stores/recurringStore.ts`:**
   - Store reactivo con Zustand para consulta (`fetchRules`), creación (`createRule`), edición/pausa (`updateRule`), eliminación (`deleteRule`), ejecución inmediata (`applyRuleNow`) y procesamiento masivo (`processDueRules`).

2. **`apps/web/src/components/recurring/RecurringRuleModal.tsx`:**
   - Selector visual de 3 modos:
     - 🟢 **Salario / Ingreso Fijo** (Nóminas, rentas).
     - 🔵 **Gasto Fijo Mensual** (Arriendo, internet, suscripciones).
     - 🟣 **Deuda a Cuotas con Intereses** (Préstamos bancarios, compras a crédito).
   - En el modo Deuda a Cuotas:
     - Ingreso de Capital inicial y número de meses/cuotas.
     - Selector de cálculo de interés: **Cuota Fija del Banco** vs **Tasa % Mensual M.V.**.
     - Cálculo en tiempo real del Costo Total del Crédito, Intereses Totales y desglose mensual (Capital vs Intereses).
   - Configuración de frecuencia (`monthly`, `biweekly`, `weekly`, `yearly`), día de pago (1-31), fecha inicial y toggle de ejecución automática silenciosa vs aviso de confirmación.

3. **`apps/web/src/components/recurring/InstallmentCard.tsx`:**
   - Tarjeta minimalista de 1px con paleta adaptativa:
     - Para Deudas: Barra de progreso de amortización, porcentaje pagado (`Cuota X de N`), capital amortizado, intereses pagados hasta hoy, saldo restante y botón principal `"Pagar Cuota (X/N)"`.
     - Para Salarios / Gastos Fijos: Monto destacado con signo (`+$X` / `-$X`), frecuencia, fecha de próximo cobro y botón `"Aplicar Ahora"`.
     - Acciones de Pausar / Reanudar y Eliminar.

4. **`apps/web/src/components/transactions/TransactionsView.tsx`:**
   - Barra superior con pestañas dobles:
     - **Historial de Movimientos** (con búsqueda 250ms, filtros por cuenta, categoría y tipo).
     - **Fijos y Deudas** (con indicador de reglas activas).
   - KPIs de cabecera:
     - Salarios e Ingresos Fijos (`+$X/mes`).
     - Gastos Fijos (`-$X/mes`).
     - Saldo Pendiente de Deudas en Amortización.
   - Filtros rápidos horizontales (`Todos`, `Salarios e Ingresos`, `Gastos Fijos`, `Deudas a Cuotas`).

---

## 2. Pruebas y Verificación

1. **Typecheck del Monorepo:**
   ```bash
   pnpm check-types # 4/4 exitoso sin errores de tipos
   ```
2. **Compilación de Producción:**
   ```bash
   pnpm --filter=@koin/web build # 1638 módulos transformados en 3.23s
   ```
3. **Despliegue en Docker:**
   - Contenedor `koin-web` recreado e iniciado en `http://localhost:5173`.
