# Entregable: PROF-02 & PROF-03 — Conmutador Rápido de Perfiles (<100ms) y Motor Dinámico HSL / AMOLED

**Historias de Usuario:** `PROF-02`, `PROF-03`
**Rama:** `feature/profile-switcher-and-theming`
**Fecha de Entrega:** 04/11/2026
**Autor:** Dylan Gamero

---

## 1. Resumen Ejecutivo
Se implementaron de extremo a extremo las historias de usuario **PROF-02** y **PROF-03** correspondientes a la **Épica 3 (Perfiles Independientes y Personalización Visual)**:
1. **PROF-02**: Conmutador rápido de perfiles mediante `ProfileSwitcherSheet` accesible instantáneamente al tocar el avatar o nombre del perfil en desktop y mobile. Ofrece conmutación <100ms para perfiles sin PIN, solicitando desbloqueo numérico con `ProfilePinModal` en perfiles protegidos sin alterar el contexto previo.
2. **PROF-03**: Motor dinámico de personalización de apariencia HSL (`theme.ts` y `AppearanceSettingsView.tsx`), que incluye 8 presets calibrados, selector de color libre Hex `#RRGGBB` con cálculo matemático de contraste WCAG AA en tiempo real, modo AMOLED negro puro (`#000000`) para ahorro de energía en pantallas OLED, inyección dinámica en `:root` sin recarga de React, y persistencia en base de datos mediante el endpoint `PATCH /api/v1/profiles/:id/theme`.

---

## 2. Componentes Desarrollados

### Backend (Go Chi + pgxpool)
- **Endpoint `PATCH /api/v1/profiles/{id}/theme`**:
  - Implementado en `apps/server/internal/profiles/handler.go` (`UpdateTheme`).
  - Permite actualizar y persistir el objeto `theme_config` JSONB de forma atómica.
  - Validación de sesión JWT y propiedad del perfil.

### Frontend (React 19 + TypeScript + Zustand + Tailwind CSS)
- **Motor de Tema y Contraste WCAG (`apps/web/src/lib/theme.ts`)**:
  - `hexToRgb`, `hexToHsl`: conversión precisa a modelos de color HSL.
  - `getRelativeLuminance`: cálculo estandarizado WCAG 2.1 de luminancia relativa lineal.
  - `getContrastRatio`: relación matemática de contraste (1:1 a 21:1).
  - `getAccessibleTextColor`: evaluación automática de legibilidad. Si el fondo es claro, inyecta texto negro `#000000`; si el fondo es oscuro, inyecta blanco `#FFFFFF`, garantizando cumplimiento WCAG AA ($\ge 4.5:1$).
  - `applyTheme`: inyección inmediata en `document.documentElement` (`--primary`, `--accent`, `--primary-foreground`) y alternancia de clases `dark` / `amoled`.
- **Conmutador Rápido de Perfiles (`apps/web/src/components/profiles/ProfileSwitcherSheet.tsx`)**:
  - Hoja inferior deslizante en móvil y popover centrado en desktop.
  - Diseño plano con divisores de 1px (cero cards, cero emojis, 100% SVG Lucide).
  - Conmutación en caliente <100ms.
  - Protección de acceso: si el perfil destino requiere PIN, despliega `ProfilePinModal`.
- **Vista de Apariencia & Colores (`apps/web/src/components/profiles/AppearanceSettingsView.tsx`)**:
  - Selector de 8 presets (Oro Soberano, Esmeralda, Índigo, Zafiro, Amatista, Coral, Ámbar, Titanium, Obsidian).
  - Selector de color libre con input nativo y código Hex.
  - Medidor de contraste dinámico con badge de estado WCAG AA y barra de previsualización en vivo.
  - Selector de Modo: Claro, Oscuro, Negro AMOLED.
  - Persistencia de configuración con botón `Guardar Apariencia`.
- **Centro de Ajustes (`apps/web/src/components/profiles/SettingsHub.tsx`)**:
  - Pestañas planas para alternar entre *Perfiles Soberanos* y *Apariencia y Colores HSL*.

---

## 3. Pruebas y Verificación

1. **Compilación y Linters**:
   - `pnpm build`: 100% exitoso (Turborepo: `@koin/shared`, `@koin/server`, `@koin/web`).
   - `pnpm check-types` & `pnpm lint`: 0 errores.
2. **Pruebas de API HTTP (curl)**:
   - `PATCH /api/v1/profiles/{id}/theme` con nuevo tema `sapphire` (#3B82F6) en modo `amoled`: 200 OK.
   - Verificación en PostgreSQL `auth.profiles.theme_config`: JSONB actualizado correctamente.
   - Restauración a `gold` (#F59E0B): 200 OK.
3. **Contenedores Docker**:
   - `koin-api` y `koin-web` reconstruidos e inicializados en `localhost:5173`.
