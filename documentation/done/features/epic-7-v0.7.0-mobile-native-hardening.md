# Entregable: Épica 7 (v0.7.0) — Experiencia Nativa Android & Mobile Hardening

**Versión:** `v0.7.0`  
**Épica:** Épica 7 — Experiencia nativa Android y despliegue en Heroku  
**Fecha:** 08/11/2026  
**Autor:** Dylan Gamero  

---

## 1. Resumen de Implementación

En esta entrega se eleva Koin a la versión **`v0.7.0`**, incorporando los parches críticos de usabilidad financiera (saldos iniciales configurables, cuentas con saldo en contra/deuda, erradicación de datos quemados y separadores de miles con formato nativo `$ 1.500.000` en COP) e implementando las capacidades nativas móviles de la **Épica 7**:

### A. MOB-01 — Feedback Háptico Nativo (`@capacitor/haptics`)
- **Servicio `apps/web/src/lib/haptics.ts`**:
  - Encapsula llamadas a `@capacitor/haptics` con verificación de plataforma nativa (`Capacitor.isNativePlatform()`).
  - `hapticFeedback.light()`: Micro-impactos suaves al pulsar teclas numéricas del teclado rápido (`QuickEntryPad`) y chips de importe.
  - `hapticFeedback.medium()`: Vibración media para teclas de borrado (⌫) y limpieza (C).
  - `hapticFeedback.success()`: Patrón de vibración táctil confirmando el guardado exitoso de transacciones o transferencias.
  - `hapticFeedback.error()`: Patrón háptico de error para entradas no válidas o PIN incorrecto.
  - Degrada limpiamente en navegadores web de escritorio sin emitir advertencias en consola.

### B. MOB-02 — Sincronización Cromática de Status Bar (`@capacitor/status-bar`)
- **Función `syncNativeStatusBar` en `apps/web/src/lib/theme.ts`**:
  - Conectada al motor reactivo de temas (`applyTheme`).
  - Al cambiar de perfil o paleta de color (Gold, Emerald, Indigo, Sapphire, Amethyst, Coral, Amber, Titanium, Obsidian), sincroniza de inmediato el color de fondo de la barra de estado de Android (`StatusBar.setBackgroundColor`).
  - Configura los iconos del sistema (hora, batería, señal wifi) en claro (`Style.Light`) u oscuro (`Style.Dark`) según la luminosidad del modo activo (`dark`, `amoled` o `light`).

### C. MOB-03 — Privacidad Móvil con `FLAG_SECURE` y Bloqueo por Inactividad
- **Protección Hardware `FLAG_SECURE` (`MainActivity.java`)**:
  - Configurado a nivel de ventana Android (`getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE)`).
  - Bloquea capturas de pantalla, grabaciones y oculta la vista previa de datos financieros en el menú de multitarea / aplicaciones recientes del sistema operativo.
- **Bloqueo por Inactividad tras 180 Segundos (`App.tsx`)**:
  - Monitorea el ciclo de vida tanto en la app nativa (`@capacitor/app` `appStateChange`) como en web (`visibilitychange`).
  - Si la aplicación permanece en segundo plano durante más de 180 segundos (3 minutos) y el perfil activo tiene configurado un PIN de seguridad, se activa de forma obligatoria el modal de desbloqueo (`ProfilePinModal` con `isMandatory={true}`).
  - El usuario debe autenticarse con su PIN para retomar el control de sus cuentas y transacciones.

---

## 2. Verificación Técnica

1. **Tipos e Integridad TypeScript**:
   - `pnpm check-types`: 0 errores en los 3 paquetes (`@koin/server`, `@koin/shared`, `@koin/web`).
2. **Compilación de Producción**:
   - `pnpm build`: Monorepo compilado limpiamente con Turborepo.
3. **Sincronización Capacitor Android**:
   - `cap sync android`: 3 plugins detectados y sincronizados (`@capacitor/app`, `@capacitor/haptics`, `@capacitor/status-bar`).
4. **Backend en Go**:
   - `go test -v ./...`: 100% de tests unitarios aprobados.
