# Entregable Frontend 05: Menú Desplegable de Navegación para Compromisos, Fijos y Deudas

## 📋 Resumen del Entregable
- **Módulo / HU:** Arquitectura de Navegación UX/UI para "Compromisos, Fijos y Deudas", Mini Menú Desplegable en Navbar, Submenú en Sidebar y Botones de Acción Duales.
- **Rama de Trabajo:** `feat/frontend-compromisos-navbar-menu`
- **Fecha:** 04-11-2026
- **Autor:** Dylan Gamero

---

## 🎯 Requisitos Implementados

1. **Mini Menú Desplegable en el Navbar Superior (Desktop):**
   - Se transformó el título estático de "Movimientos" en el header desktop en un menú desplegable interactivo (`isMovimientosDropdownOpen`).
   - El botón desplegable muestra dinámicamente el estado activo:
     - **"Historial de Movimientos"** con icono `History` y color primario.
     - **"Compromisos, Fijos y Deudas"** con icono `Calendar`, color púrpura y contador de reglas activas en vivo.
   - Al desplegarse, presenta dos opciones claras con descripciones pedagógicas:
     - **Historial de Movimientos**: *"Ingresos, gastos y transferencias registradas"*.
     - **Compromisos, Fijos y Deudas**: *"Salarios nómina, gastos mensuales y amortización de deudas"*.
   - Cuenta con overlay click-outside para cerrarse automáticamente al interactuar con cualquier otra parte de la pantalla.

2. **Navegación Jerárquica en el Sidebar Lateral (Desktop):**
   - Bajo el elemento de menú "Movimientos" en la barra lateral, se añadió un submenú expandible que aparece automáticamente cuando la sección está activa.
   - Ofrece dos accesos directos con indicador de selección visual (punto activo):
     - `• Historial`
     - `• Compromisos y Deudas` (con indicador numérico de compromisos activos vigentes).

3. **Botones de Acción Duales en Navbar y en la Vista (`TransactionsView`):**
   - En el Navbar superior y en la cabecera de `TransactionsView`, ahora coexisten **ambos botones de acción directa**:
     - **`+ Nuevo Movimiento`** (Botón principal para registrar ingresos, gastos o transferencias inmediatas).
     - **`+ Programar Compromiso`** (Botón destacado en tonos púrpura con borde de 1px que abre directamente el modal `RecurringRuleModal` para configurar un salario fijo nómina, suscripción o compra/deuda a cuotas con intereses).
   - Se eliminó la fricción de tener que buscar dónde se programan los compromisos: el usuario puede programar un compromiso en 1 solo clic desde cualquier parte del módulo de Movimientos.

4. **Sincronización Bidireccional de Estado (`App.tsx` <-> `TransactionsView.tsx`):**
   - `TransactionsView` ahora recibe las props `activeMainTab`, `onTabChange` y `openRecurringModalTrigger`.
   - Si el usuario selecciona "Compromisos y Deudas" desde el desplegable del navbar o el sidebar, la vista cambia instantáneamente a la pestaña correspondiente.
   - Si el usuario hace clic en el botón superior "+ Programar Compromiso", se dispara el trigger que abre de inmediato el modal de creación de regla recurrente.

---

## 🛠️ Archivos Modificados
- `apps/web/src/App.tsx`: Incorporación del mini menú desplegable en el header de navegación, submenú anidado en el sidebar lateral, botones duales de acción rápida y cableado de props hacia `TransactionsView`.
- `apps/web/src/components/transactions/TransactionsView.tsx`: Soporte para pestañas controladas externamente (`activeMainTabProp`), callback de sincronización (`onTabChange`), trigger de apertura de modal (`openRecurringModalTrigger`) y botones duales en cabecera de vista.

---

## 🧪 Verificación y Pruebas
1. **Verificación de Tipos TypeScript:**
   - `pnpm check-types`: 4/4 paquetes exitosos (0 errores de tipos en `@koin/shared`, `@koin/web` y `@koin/server`).
2. **Compilación de Producción:**
   - `pnpm --filter=@koin/web build`: Generación de bundles Vite exitosa en 3.67s sin warnings de sintaxis.
3. **Despliegue y Pruebas en Contenedores Docker:**
   - `docker compose up -d --build koin-web`: Imagen de frontend recreada e iniciada exitosamente.
   - `curl -sI http://localhost:5173`: HTTP 200 OK verificado.
   - Servidor backend API en `localhost:3000` y base de datos PostgreSQL en `localhost:5432` 100% operativos.
