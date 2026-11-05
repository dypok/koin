# Entregable Frontend 04: Selección de Gastos Recurrentes y Sistema de Modales de Confirmación / Edición

## 📋 Resumen del Entregable
- **Módulo / HU:** Selección de Gastos Recurrentes, Modal de Detalle/Acción de Reglas y Erradicación Total de `confirm()` / `alert()` nativos del navegador.
- **Rama de Trabajo:** `feat/frontend-recurring-selection-and-confirm-modals`
- **Fecha:** 04-11-2026
- **Autor:** Dylan Gamero

---

## 🎯 Requisitos Implementados

1. **Selección y Carga de Gastos Recurrentes en el Frontend:**
   - **En `QuickTransactionModal` ("Nuevo Movimiento"):** Selector inteligente *"¿Es un gasto fijo programado? Cargar desde compromiso"* cuando el usuario está en modo Gasto. Muestra los compromisos y cuotas activas (ej. Netflix, Arriendo, Crédito Bancario); al seleccionar uno, auto-completa el importe, cuenta, categoría y nota. Al guardar, aplica directamente la cuota o movimiento recurrente vía `applyRuleNow`.
   - **En `QuickTransactionModal` (Detalles adicionales):** Opción *"Guardar como compromiso recurrente mensual"* para programar cualquier nuevo gasto como regla periódica directamente desde el flujo rápido.
   - **En `TransactionsView` ("Fijos y Deudas"):** Cada tarjeta (`InstallmentCard`) ahora es 100% interactiva y seleccionable. Al hacer click en cualquier compromiso, abre el modal de inspección y acción `RecurringRuleDetailModal`.

2. **Modal Visible de Detalle y Acciones (`RecurringRuleDetailModal.tsx`):**
   - Vista enriquecida para cualquier regla recurrente (Salario, Gasto Fijo, Deuda a Cuotas).
   - Muestra desglose financiero completo: Capital solicitado, Abono a capital mensual, Interés mensual, Intereses totales proyectados, Saldo pendiente y Barra de progreso interactiva.
   - Botones visibles y accesibles para el usuario:
     - **"Editar"**: Abre el modal de edición (`RecurringRuleModal`) con todos los valores precargados.
     - **"Aplicar / Pagar Cuota Ahora"**: Ejecuta la transacción atómica inmediatamente.
     - **"Pausar" / "Reanudar"**: Alterna el estado de la regla.
     - **"Eliminar"**: Abre el diálogo de confirmación visual (`ConfirmModal`).
     - **"Cerrar / Cancelar"**: Cierra el modal sin cambios.

3. **Erradicación Absoluta de `window.confirm()` y `alert()`:**
   - Se creó el componente reutilizable `ConfirmModal.tsx` con estética cardless de borde de 1px, soporte de modo oscuro/AMOLED/claro, navegación con teclado (`Escape` / `Enter`), variantes `danger` / `warning` / `primary` y estados de carga (`isLoading`).
   - Se sustituyeron **todas** las llamadas nativas de `confirm()` y `alert()` a lo largo de toda la suite frontend:
     - `TransactionsView.tsx`: Eliminación de movimientos y de reglas recurrentes con `ConfirmModal`; reemplazo de alerts por toasts flotantes no-bloqueantes.
     - `InstallmentCard.tsx`: Botón directo de eliminar conectado a `ConfirmModal`, botón de editar y selección de tarjeta.
     - `QuickTransactionModal.tsx`: Errores de validación mostrados en banners internos con icono de advertencia.
     - `AccountsView.tsx`: Eliminación de cuentas protegida por `ConfirmModal`.
     - `AccountShareModal.tsx`: Expulsión de miembros y abandono de cuentas compartidas protegidas por `ConfirmModal`.
     - `SecuritySettingsView.tsx`: Deshabilitación de PIN protegida por `ConfirmModal`.
     - `ProfileStreamingView.tsx`: Eliminación de perfiles protegida por `ConfirmModal`.
     - `ProfileManagerView.tsx`: Eliminación de perfiles protegida por `ConfirmModal`.
   - Verificación con `tgrep`: **0 coincidencias** de `confirm(`, `alert(`, `window.confirm` o `window.alert`.

---

## 🛠️ Archivos Creados y Modificados
- `apps/web/src/components/common/ConfirmModal.tsx` (Nuevo)
- `apps/web/src/components/recurring/RecurringRuleDetailModal.tsx` (Nuevo)
- `apps/web/src/components/recurring/InstallmentCard.tsx` (Modificado)
- `apps/web/src/components/transactions/TransactionsView.tsx` (Modificado)
- `apps/web/src/components/transactions/QuickTransactionModal.tsx` (Modificado)
- `apps/web/src/components/accounts/AccountsView.tsx` (Modificado)
- `apps/web/src/components/accounts/AccountShareModal.tsx` (Modificado)
- `apps/web/src/components/profiles/SecuritySettingsView.tsx` (Modificado)
- `apps/web/src/components/profiles/ProfileStreamingView.tsx` (Modificado)
- `apps/web/src/components/profiles/ProfileManagerView.tsx` (Modificado)

---

## 🧪 Verificación y Pruebas
1. **Verificación de Tipos TypeScript:**
   - `pnpm check-types`: 4/4 paquetes exitosos (0 errores).
2. **Compilación de Producción:**
   - `pnpm --filter=@koin/web build`: Éxito en 3.27s (1640 módulos transformados).
3. **Despliegue en Docker:**
   - Contenedor `koin-web` reconstruido y reiniciado con `docker compose up -d --build koin-web`.
   - `curl -s -I http://localhost:5173/`: HTTP 200 OK.
