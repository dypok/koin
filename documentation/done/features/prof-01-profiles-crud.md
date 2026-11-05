# Entregable: PROF-01 — Creación y Gestión de Perfiles Independientes (Estilo Streaming)

**Historia de Usuario:** `PROF-01`
**Rama:** `feature/profiles-crud`
**Fecha de Entrega:** 04/11/2026
**Autor:** Dylan Gamero

---

## 1. Resumen Ejecutivo
Se implementó de extremo a extremo la historia de usuario **PROF-01** para Koin, dotando a la aplicación de un sistema de gestión multi-perfil soberano e independiente estilo streaming. Cada perfil cuenta con su propio libro contable, cuentas de efectivo/banco privadas y 12 categorías iniciales creadas en una sola transacción atómica de PostgreSQL.

---

## 2. Componentes y Arquitectura Desarrollada

### Backend (Go Chi + pgxpool)
- **Modelo de Dominio (`apps/server/internal/models/models.go`)**:
  - DTOs tipados: `CreateProfileRequest`, `UpdateProfileRequest`, `VerifyPINRequest`.
  - Serialización `ThemeConfig` con fallback por defecto a Oro Soberano (`#F59E0B`).
- **Capa Repositorio (`apps/server/internal/profiles/repository.go`)**:
  - `FindProfilesByUserID`: recupera perfiles del usuario autenticado ordenados cronológicamente.
  - `CreateProfileWithSeed`: transacción atómica `tx` que inserta en `auth.profiles`, siembra dos cuentas iniciales (*Billetera Efectivo* y *Cuenta Bancaria*) con sus roles de membresía `owner` en `finance.accounts` y `finance.account_members`, y registra 12 categorías base en `finance.categories`.
  - `UpdateProfile`: actualiza dinámicamente nombre, avatar, tema, divisa base o PIN con hash Argon2id.
  - `DeleteProfile`: protege contra el borrado del último perfil de la cuenta titular (retorna `409 Conflict`).
  - `GetProfilePINHash`: recupera el hash criptográfico para verificación de acceso.
- **Capa de Negocio y Validación (`apps/server/internal/profiles/service.go`)**:
  - Validación de nombre (1-100 caracteres) y códigos de moneda ISO (3 letras).
  - Validación de PIN (4 a 6 dígitos numéricos) y hasheo mediante Argon2id.
  - Verificación en tiempo constante contra ataques de canal lateral / timing.
- **Controlador HTTP y Enrutador (`apps/server/internal/profiles/handler.go` & `cmd/api/main.go`)**:
  - `GET /api/v1/profiles`: listar perfiles del usuario en sesión.
  - `POST /api/v1/profiles`: crear perfil con siembra atómica de cuentas y categorías.
  - `GET /api/v1/profiles/{id}`: detalle del perfil.
  - `PATCH /api/v1/profiles/{id}`: actualizar perfil.
  - `DELETE /api/v1/profiles/{id}`: eliminar perfil con control de integridad.
  - `POST /api/v1/profiles/{id}/verify-pin`: verificar PIN numérico.

### Frontend (React 19 + Tailwind CSS + Zustand)
- **Store Centralizado (`apps/web/src/stores/authStore.ts`)**:
  - Métodos integrados: `fetchProfiles`, `createProfile`, `updateProfile`, `deleteProfile`.
  - Conmutación automática de tema visual CSS en vivo (`applyTheme`) al cambiar de perfil.
- **Modal de Creación y Edición (`apps/web/src/components/profiles/ProfileModal.tsx`)**:
  - Selector visual con los 12 iconos SVG autorizados de Lucide (`ALLOWED_AVATAR_ICONS`) — **cero emojis**.
  - Selector de divisas base (`USD`, `EUR`, `COP`, `MXN`, etc.).
  - Selector de paletas soberanas (Oro Soberano, Esmeralda, Titanium, etc.).
  - Configuración opcional de PIN numérico cifrado.
- **Modal de Desbloqueo por PIN (`apps/web/src/components/profiles/ProfilePinModal.tsx`)**:
  - Teclado numérico táctil plano en pantalla con feedback de dots y validación contra backend.
- **Vista de Gestión de Perfiles (`apps/web/src/components/profiles/ProfileManagerView.tsx`)**:
  - Diseño plano, incrustado en el lienzo sin cards elevadas ni sombras pesadas.
  - Divisores hairline sutiles de 1px.
  - Acciones rápidas: conmutar (<100ms), editar y eliminar (con protección al último perfil).
- **Integración en `App.tsx`**:
  - Selector de perfiles en la barra lateral desktop y en el encabezado móvil con apertura deslizante.
  - Pestaña `Ajustes y Apariencia` conectada a `ProfileManagerView`.

---

## 3. Pruebas y Verificación

1. **Compilación cruzada Go & TypeScript**:
   - `pnpm build`: 100% exitoso (Turborepo: `@koin/shared`, `@koin/server`, `@koin/web`).
   - `pnpm check-types`: 100% exitoso con cero errores TypeScript ni linter.
2. **Pruebas de API HTTP (curl)**:
   - `GET /api/v1/profiles` con token JWT: 200 OK.
   - `POST /api/v1/profiles` creando perfil `Freelance Pro` en EUR: 201 Created.
   - Verificación de inserción en PostgreSQL: 2 cuentas creadas en EUR y 12 categorías asociadas.
   - `PATCH /api/v1/profiles/{id}` asignando PIN: 200 OK.
   - `POST /api/v1/profiles/{id}/verify-pin`: PIN correcto `1234` -> `valid: true`; PIN erróneo -> 401 Unauthorized.
   - `DELETE /api/v1/profiles/{id}` sobre el perfil secundario: 200 OK.
   - `DELETE /api/v1/profiles/{id}` sobre el perfil único restante: 409 Conflict (`no es posible eliminar el único perfil activo de la cuenta`).
3. **Contenedores Docker**:
   - `koin-db`, `koin-api` y `koin-web` reconstruidos y corriendo en `docker-compose.yml`.
