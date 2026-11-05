# Entregable Frontend 09: Navbar Retráctil, Limpieza de Redundancias de Navegación e Iconografía Minimalista (Versión 0.4.1)

## 📋 Resumen del Entregable
- **Módulo / HU:** Versión 0.4.1: Unificación de navegación en Movimientos exclusivamente en el dropdown del navbar (eliminación de sub-items en el sidebar y pills redundantes en la vista), barra de navegación superior retráctil inteligente con glassmorphism, y eliminación del icono de estrella en la vista de Próximamente.
- **Rama de Trabajo:** `feat/frontend-v0.4.1-retractable-navbar-and-clean-navigation`
- **Fecha:** 04-11-2026
- **Autor:** Dylan Gamero

---

## 🎯 Requisitos Implementados

1. **Eliminación Total de Redundancias en la Sección de Movimientos:**
   - **Problema previo:** El usuario podía cambiar de pestaña de 3 formas distintas (el dropdown del navbar, los sub-elementos del sidebar `• Historial` / `• Compromisos y Deudas`, y los botones tipo pill en la cabecera de `TransactionsView`).
   - **Solución Versión 0.4.1:**
     - Se eliminaron los botones/pills de selección dentro de `TransactionsView.tsx`. La cabecera de la sección ahora presenta un diseño limpio con título contextual (`Historial de Movimientos` o `Compromisos, Fijos y Deudas`), subtítulo descriptivo y su único botón de acción correspondiente (`+ Nuevo Movimiento` o `+ Programar Compromiso`).
     - Se eliminó el sub-menú anidado bajo "Movimientos" en el sidebar de escritorio de `App.tsx`. Ahora el sidebar cuenta con un único botón consistente de Movimientos con badge numérico si hay compromisos activos.
     - Se centralizó el control de sub-vistas **estrictamente en el dropdown del navbar superior**:
       - Disponible tanto en vista escritorio como en vista móvil.
       - Muestra el estado activo, descripción del contenido y badge de compromisos pendientes.
       - Cierre automático al seleccionar opción o al hacer scroll hacia abajo.

2. **Navbar Retráctil Inteligente con Glassmorphism (`App.tsx`):**
   - Se implementó un navbar superior auto-retráctil para maximizar el área de lectura vertical en listas de transacciones y balances:
     - **Al hacer scroll hacia abajo (`delta > 6px` y `scrollTop > 60px`):** Se oculta suavemente hacia arriba con `-translate-y-full` y `pointer-events-none`.
     - **Al hacer scroll hacia arriba (`delta < -6px`):** Se despliega fluidamente en la pantalla con `translate-y-0`.
     - **En la cabecera superior (`scrollTop <= 40px`):** Permanece visible de forma garantizada.
     - **Al cambiar de pestaña:** El navbar reaparece automáticamente en posición visible.
     - **Estética visual:** `bg-background/95 backdrop-blur-md` con transición CSS acelerada por hardware (`transition-transform duration-300 ease-in-out`).

3. **Iconografía Minimalista en Vista Próximamente (`UnimplementedView.tsx`):**
   - Se removió el icono de estrella (`Sparkles`) y su contenedor circular con pulso.
   - La vista presenta una estética tipográfica sobria, minimalista y libre de distracciones con badge font-mono superior `PRÓXIMAMENTE`, título del módulo y botones directos hacia Cuentas y Configuración.

---

## 🧪 Pruebas y Verificación

- **Typecheck Monorepo:** 4/4 paquetes compilando con éxito (`pnpm check-types`).
- **Compilación de Producción:** `pnpm --filter=@koin/web build` completado sin errores.
- **Suite de Pruebas:** `pnpm test` ejecutado exitosamente.
- **Despliegue en Docker:** Contenedor `koin-web` reconstruido y sirviendo la versión 0.4.1 con HTTP 200 en rutas simples y anidadas (`/movimientos`, `/movimientos/compromisos`).
