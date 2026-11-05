# Entregable: PROF-04 — Bloqueo de Perfil con PIN Criptográfico y Bloqueo Exponencial

**Historia de Usuario:** `PROF-04`
**Rama:** `feature/profile-switcher-and-theming`
**Fecha de Entrega:** 04/11/2026
**Autor:** Dylan Gamero

---

## 1. Resumen Ejecutivo
Se implementó de extremo a extremo la historia de usuario **PROF-04**, culminando la totalidad de la **Épica 3 (Perfiles Independientes y Personalización Visual)**. Koin ahora protege perfiles individuales con PIN numérico de 4 a 6 dígitos respaldado por cifrado de memoria dura Argon2id, verificación en tiempo constante, feedback háptico en dispositivos táctiles y una estricta política de protección contra fuerza bruta con bloqueo preventivo de 15 minutos tras 5 intentos fallidos consecutivos (código HTTP 429).

---

## 2. Componentes Desarrollados

### Base de Datos (PostgreSQL Multi-Schema)
- Migración aplicada a `auth.profiles`:
  - `failed_attempts INT NOT NULL DEFAULT 0`: contador persistente de fallos.
  - `locked_until TIMESTAMPTZ`: marca temporal de bloqueo activo.
  - Actualizado bootstrap en `docker/postgres/01-init.sql`.

### Backend (Go Chi + Argon2id)
- **Repositorio (`apps/server/internal/profiles/repository.go`)**:
  - `GetProfileSecurity`: consulta atómica del estado de seguridad y bloqueo.
  - `IncrementFailedAttempts`: incrementa fallos y activa `locked_until = NOW() + INTERVAL '15 minutes'` al alcanzar 5 intentos.
  - `ResetFailedAttempts`: restablece fallos a 0 y `locked_until` a `NULL` tras un desbloqueo exitoso.
  - `SetPIN`: configura o elimina el hash Argon2id del perfil con reset de contadores.
- **Servicio (`apps/server/internal/profiles/service.go`)**:
  - `VerifyPIN`: verifica si el perfil está bloqueado en tiempo real; compara el PIN mediante comparación segura Argon2id; gestiona contador decreciente de intentos restantes.
  - `SetPIN`: valida longitud (4-6 dígitos numéricos) y genera hash Argon2id con salt criptográfico.
- **Controlador HTTP (`apps/server/internal/profiles/handler.go`)**:
  - `POST /api/v1/profiles/:id/pin`: configuración o actualización segura de PIN.
  - `POST /api/v1/profiles/:id/unlock`: validación de PIN; responde con `HTTP 429 Too Many Requests` ante perfil bloqueado o `HTTP 401 Unauthorized` indicando intentos restantes.

### Frontend (React 19 + TypeScript + Zustand)
- **Modal de Desbloqueo (`apps/web/src/components/profiles/ProfilePinModal.tsx`)**:
  - Teclado numérico táctil plano con botones accesibles.
  - Verificación automática al completar 6 dígitos o manual mediante botón de confirmación.
  - Vibración háptica (`navigator.vibrate`) en pulsaciones y errores.
  - Efecto visual de sacudida (*shake*) y feedback dinámico de intentos restantes.
  - Bloqueo visual de interfaz ante respuesta HTTP 429.

---

## 3. Pruebas y Verificación

1. **Ataque de fuerza bruta simulado (curl)**:
   - Intentos 1 a 4 con PIN erróneo: `401 Unauthorized` con mensaje dinámico `"PIN incorrecto (X intentos restantes antes de bloqueo)"`.
   - Intento 5: `429 Too Many Requests` con mensaje `"perfil bloqueado temporalmente por seguridad debido a 5 intentos fallidos consecutivos. Intente de nuevo en 15 minutos"`.
   - Intento 6 (incluso con PIN correcto): `429 Too Many Requests` con mensaje `"perfil bloqueado por seguridad. Intente de nuevo en 15 minutos"`.
2. **Compilación cruzada**:
   - `pnpm build`, `pnpm check-types`, `pnpm lint` 100% exitosos sin errores.
3. **Contenedores Docker**:
   - `koin-db`, `koin-api` y `koin-web` en ejecución y sincronizados.
