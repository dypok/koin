# Entregable Frontend: Módulo de Transacciones, Guardado en 2 Toques, Multidivisa y Transferencias ACID (Épica 5)

> **ID de Épica:** EPIC-05 — Motor de transacciones financieras, transferencias y multidivisa  
> **Historias de Usuario:** TXN-02, TXN-03, TXN-04, TXN-05 (y cimientos de BUD-01)  
> **Rama:** `feat/frontend-epic-5-transactions-view`  
> **Fecha:** 04/11/2026  
> **Desarrollador / Asistente:** Dylan Gamero / Antigravity  

---

## 1. Resumen Arquitectónico

Se desarrolló la experiencia de usuario completa para la gestión de transacciones en Koin con React 19, Tailwind CSS y Zustand:
- **`useTransactionStore` (`apps/web/src/stores/transactionStore.ts`):** Estado global para transacciones, categorías frecuentes con recuento de uso, tasas de cambio en vivo, mutaciones optimistas y orquestación del temporizador Toast de 5 segundos con reversión atómica de balance ("Deshacer").
- **`QuickTransactionModal` (`apps/web/src/components/transactions/QuickTransactionModal.tsx`):** Modal de registro rápido optimizado para móvil y escritorio.
  - **Guardado en 2 Toques (TXN-02):** El usuario digita el importe numérico y toca directamente una de las 6 categorías más frecuentes para disparar el guardado inmediato y el cierre del modal en <100ms con vibración háptica.
  - **Selector de Modo:** Pestañas superiores planas para alternar instantáneamente entre *Gasto*, *Ingreso* y *Transferencia*.
  - **Motor Multidivisa en vivo (TXN-03):** Si la cuenta seleccionada tiene divisa distinta a la moneda base del perfil, calcula en vivo el equivalente en moneda base con la tasa del sistema y permite ajuste manual de tasa.
  - **Transferencias entre Cuentas (TXN-04):** Permite elegir cuenta origen y destino; si difieren en divisa, calcula la conversión exacta a recibir en la cuenta destino (`toAmount`).
- **`UndoToast` (`apps/web/src/components/transactions/UndoToast.tsx`):** Notificación flotante inferior de 5 segundos con barra de progreso decreciente y botón *"Deshacer"*, que revierte el movimiento en el backend y restaura los saldos contables en pantalla en tiempo real.
- **`TransactionsView` (`apps/web/src/components/transactions/TransactionsView.tsx`):** Vista de historial cronológico agrupada por cabeceras de fecha legibles (*Hoy*, *Ayer*, nombres de día completos), buscador en vivo con debounce de 250ms, filtros por tipo (*Todos*, *Gastos*, *Ingresos*, *Transferencias*), selector por Cuenta y Categoría, y eliminación directa.
- **`App.tsx`:** Integración de la pestaña "Movimientos", botón global "+ Nuevo Movimiento" en el encabezado superior y montaje de componentes flotantes globales.

---

## 2. Componentes y Vistas Implementadas

| Componente | Ubicación | Descripción |
| :--- | :--- | :--- |
| `useTransactionStore` | `apps/web/src/stores/transactionStore.ts` | Store Zustand con caché de movimientos, categorías, tasas y temporizador de deshacer |
| `QuickTransactionModal` | `apps/web/src/components/transactions/QuickTransactionModal.tsx` | Modal rápido de 2 toques, selector multidivisa y transferencias ACID |
| `UndoToast` | `apps/web/src/components/transactions/UndoToast.tsx` | Banner flotante de 5 segundos con progreso visual y acción de reversión contable |
| `TransactionsView` | `apps/web/src/components/transactions/TransactionsView.tsx` | Vista principal del historial cronológico con filtros combinados y buscador con debounce |
| `App.tsx` | `apps/web/src/App.tsx` | Integración de vistas, pestaña de navegación `history` y botón de acción en header |

---

## 3. Consumo de API REST

- `GET /api/v1/categories`: Carga de categorías ordenadas por frecuencia de uso (`usageCount DESC`).
- `GET /api/v1/currencies/rates`: Carga de tasas de cambio del sistema.
- `GET /api/v1/transactions`: Consulta paginada con filtros de búsqueda, cuenta, categoría y tipo.
- `POST /api/v1/transactions`: Registro atómico de gastos e ingresos.
- `POST /api/v1/transfers`: Registro atómico de transferencias entre cuentas.
- `DELETE /api/v1/transactions/:id`: Eliminación y reversión matemática del saldo.

---

## 4. Pruebas y Verificación

- **Compilación de Producción Web:** `pnpm --filter=@koin/web build` completado en 2.55s sin errores TypeScript ni lints.
- **Chequeo de Tipos en Monorepo:** `turbo run check-types` con 4/4 paquetes exitosos (`@koin/shared`, `@koin/server`, `@koin/web`).
- **Despliegue en Contenedor Docker:** Imagen `koin-koin-web` reconstruida y corriendo en `localhost:5173` (Nginx Alpine con HTTP 200 OK).
- **Aislamiento Backend:** No se modificó el código de `apps/server/` ni esquemas de base de datos durante esta fase.
