# Entregable Frontend 08: Rutas SPA con Historial del Navegador y Sustitución de 404 por "Próximamente" (Versión 0.4)

## 📋 Resumen del Entregable
- **Módulo / HU:** Cierre formal de la Versión 0.4: Sistema de enrutamiento SPA bidireccional (HTML5 History API) para navegación y recarga directa sin 404, y rediseño de vistas en construcción para sustituir el código 404 por un banner elegante de "Próximamente".
- **Rama de Trabajo:** `feat/frontend-spa-routing-and-proximamente-view`
- **Fecha:** 04-11-2026
- **Autor:** Dylan Gamero

---

## 🎯 Requisitos Implementados

1. **Sustitución de 404 por "Próximamente" (`UnimplementedView.tsx`):**
   - Se erradicó el texto `404` que daba la falsa impresión de un error de página caída.
   - Se diseñó un layout minimalista de borde de 1px con:
     - Icono sutil animado `Sparkles` con halo en color primario.
     - Indicador tipográfico superior: `PRÓXIMAMENTE` (fuente monoespaciada, tracking amplio).
     - Nombre del módulo (`Presupuestos`, `Inicio y Balance`).
     - Mensaje pedagógico: *"Esta sección se encuentra en desarrollo activo y estará disponible en una próxima actualización de Koin."*
     - Botones de acción directa: **"Ver Cuentas"** (lleva directamente a `/cuentas`) e **"Ir a Configuración"** (lleva a `/configuracion`).

2. **Sistema de Enrutamiento SPA Bidireccional (`App.tsx`):**
   - Se implementó un enrutador SPA nativo, ligero y reactivo basado en la API HTML5 History (`window.history.pushState`, `replaceState`, evento `popstate`):
     - `/` -> Normalizado automáticamente a `/cuentas`.
     - `/inicio` o `/home` -> Vista "Inicio y Balance".
     - `/cuentas` o `/accounts` -> Vista "Cuentas Financieras".
     - `/movimientos` -> Vista "Movimientos" (sub-pestaña Historial).
     - `/movimientos/compromisos` -> Vista "Movimientos" (sub-pestaña Compromisos, Fijos y Deudas).
     - `/presupuestos` o `/budgets` -> Vista "Presupuestos" (Próximamente).
     - `/configuracion` o `/configuracion/perfiles` -> "Configuración: Perfiles".
     - `/configuracion/apariencia` -> "Configuración: Apariencia y Colores".
     - `/configuracion/seguridad` -> "Configuración: Seguridad y PIN".
   - Soporte total para **botones Atrás y Adelante del navegador**: la SPA detecta el cambio de URL y actualiza el estado sincronizadamente sin recargar.
   - Soporte total para **recarga de página (F5)** y enlaces directos: Nginx sirve `index.html` vía `try_files $uri $uri/ /index.html` y la aplicación restaura la vista exacta.
   - Sincronización en subpestañas: al cambiar de pestaña en `SettingsHub` o `TransactionsView`, la URL del navegador se actualiza instantáneamente.

3. **Verificación Integral de Flujo y Pruebas (Versión 0.4):**
   - **Autenticación:** Login, registro y protección contra ataques de fuerza bruta (Rate Limiting HTTP 429 tras 10 registros/h y 5 intentos/15m).
   - **Perfiles:** Creación automática de perfiles, conmutación instantánea <100ms y persistencia en PostgreSQL.
   - **Cuentas Financieras:** Cuentas predeterminadas (Billetera y Banco), multicurrency con tasas de cambio reales precargadas.
   - **Transacciones:** Creación de gastos/ingresos puntuales con cálculo atómico de saldos en moneda base y de cuenta.
   - **Compromisos y Deudas:** Programación de deudas a cuotas con cálculo automático de amortización francesa (capital e intereses), aplicación en vivo de cuotas y actualización de progreso.
   - **Typecheck Monorepo:** 4/4 paquetes compilando sin errores (`pnpm check-types`).
   - **Build Frontend:** Vite generando bundles en 3.58s sin advertencias.
   - **Docker:** Contenedores `koin-db`, `koin-api` y `koin-web` 100% operativos.
