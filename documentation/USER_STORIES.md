# 08. Especificación Detallada de Historias de Usuario (Backlog Técnico de Koin)

Este documento contiene la especificación funcional y técnica exhaustiva de las **24 Historias de Usuario** del proyecto **Koin**. Cada historia define: narrativa ágil, actores, precondiciones, reglas de negocio matemáticas y de seguridad, contratos de API (DTOs y códigos HTTP), escenarios de prueba en formato **Gherkin**, consideraciones de plataforma (Web vs Android) y Criterios de Aceptación / Definition of Done (DoD).

---

## 📑 Índice de Historias de Usuario

| Épica | ID | Título | Prioridad | SP |
| :--- | :--- | :--- | :---: | :---: |
| **EP-01: Auth & Seguridad** | [US-001](#us-001-registro-de-cuenta-titular-sign-up-con-argon2id) | Registro de Cuenta Titular (*Sign-Up*) con Argon2id | Must | 3 |
| | [US-002](#us-002-inicio-de-sesión-sign-in-con-rate-limiting-y-jwt) | Inicio de Sesión (*Sign-In*) con Rate Limiting y JWT | Must | 3 |
| | [US-003](#us-003-cierre-de-sesión-y-gestión-de-sesión-activa) | Cierre de Sesión y Revocación de Tokens | Should | 2 |
| **EP-02: Perfiles & Personalización** | [US-004](#us-004-creación-y-edición-de-perfiles-independientes) | Creación y Edición de Perfiles Independientes | Must | 5 |
| | [US-005](#us-005-conmutador-rápido-de-perfiles-profile-switcher) | Conmutador Rápido de Perfiles (*Bottom Sheet* <100ms) | Must | 3 |
| | [US-006](#us-006-motor-de-personalización-dinámica-de-colores-y-temas) | Motor de Personalización Dinámica de Colores y Temas | Must | 5 |
| | [US-007](#us-007-bloqueo-de-perfil-con-pin-criptográfico-y-antifuerza-bruta) | Bloqueo de Perfil con PIN Criptográfico y Antifuerza Bruta | Must | 5 |
| **EP-03: Cuentas & Colaboración** | [US-008](#us-008-creación-y-gestión-de-cuentas-financieras-privadas) | Creación y Gestión de Cuentas Financieras Privadas | Must | 3 |
| | [US-009](#us-009-creación-de-cuentas-compartidas-e-invitaciones-rbac) | Cuentas Compartidas e Invitaciones con RBAC | Must | 5 |
| | [US-010](#us-010-aceptación-y-vinculación-de-cuentas-compartidas) | Aceptación y Vinculación de Cuentas Compartidas | Must | 3 |
| | [US-011](#us-011-administración-de-miembros-y-desvinculación) | Administración de Miembros y Desvinculación | Should | 2 |
| **EP-04: Registro Rápido & Divisas** | [US-012](#us-012-modal-de-registro-ultrarrápido-con-teclado-integrado) | Modal de Registro Ultrarrápido con Teclado Integrado | Must | 5 |
| | [US-013](#us-013-guardado-en-2-toques-con-categorías-frecuentes-y-deshacer) | Guardado en 2 Toques con Categorías Frecuentes y Deshacer | Must | 5 |
| | [US-014](#us-014-motor-multidivisa-con-conversión-a-moneda-base) | Motor Multidivisa con Conversión Automática a Moneda Base | Must | 5 |
| | [US-015](#us-015-transferencias-entre-cuentas-con-transacciones-acid) | Transferencias entre Cuentas con Transacciones ACID | Must | 3 |
| | [US-016](#us-016-historial-de-transacciones-con-filtros-y-búsqueda) | Historial de Transacciones con Filtros y Búsqueda en Vivo | Must | 3 |
| **EP-05: Categorías & Presupuestos**| [US-017](#us-017-gestión-de-categorías-personalizadas-con-iconos-lucide) | Gestión de Categorías Personalizadas con Iconos Lucide | Should | 3 |
| | [US-018](#us-018-presupuestos-mensuales-con-alertas-al-80-y-100) | Presupuestos Mensuales con Alertas al 80% y 100% | Should | 5 |
| **EP-06: Analíticas & Reportes** | [US-019](#us-019-gráfico-de-distribución-de-gastos-por-categoría-recharts) | Gráfico de Distribución de Gastos por Categoría (Dona) | Should | 3 |
| | [US-020](#us-020-flujo-de-caja-mensual-consolidado-a-6-meses) | Flujo de Caja Mensual Consolidado (Ingresos vs Gastos) | Should | 3 |
| | [US-021](#us-021-exportación-de-datos-a-csv-y-copia-de-seguridad-json) | Exportación de Datos a CSV y Copia de Seguridad JSON | Could | 2 |
| **EP-07: Android Nativo & Seguridad**| [US-022](#us-022-feedback-táctil-y-háptico-en-android-capacitorhaptics) | Feedback Táctil y Háptico en Android (`@capacitor/haptics`) | Must | 2 |
| | [US-023](#us-023-sincronización-del-tema-con-el-sistema-android) | Sincronización del Tema con el Sistema Android | Must | 2 |
| | [US-024](#us-024-privacidad-financiera-con-flag_secure-y-auto-lock) | Privacidad Financiera con `FLAG_SECURE` y Auto-Lock | Must | 3 |

---

## EP-01: Autenticación, Usuarios y Seguridad Base

### US-001: Registro de Cuenta Titular (*Sign-Up*) con Argon2id

- **Identificador**: `US-001`
- **Épica**: `EP-01: Autenticación y Seguridad Base`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Visitante / Administrador del Hogar.
- **Narrativa**:
  - **Como**: Usuario nuevo o cabeza de hogar.
  - **Quiero**: Registrar una cuenta administradora indicando mi nombre completo, email y contraseña segura.
  - **Para**: Disponer de un espacio privado en la nube de Heroku donde crear y alojar los diferentes perfiles familiares o personales.

#### Reglas de Negocio
1. **Contraseña Segura**: Mínimo 8 caracteres, al menos 1 letra mayúscula, 1 número y 1 símbolo especial.
2. **Criptografía**: La contraseña debe hashearse en el servidor utilizando **Argon2id** (memoria: 64MB, iteraciones: 3, paralelismo: 4) antes de tocar la base de datos.
3. **Unicidad de Email**: El correo se normaliza a minúsculas y no pueden existir duplicados.
4. **Semilla Inicial Automática**: Tras crear el usuario exitosamente, el backend debe crear en la misma transacción (`db.transaction`):
   - Un perfil inicial llamado "Personal".
   - Dos cuentas iniciales vinculadas al perfil: "Efectivo" ($0.00) y "Cuenta Bancaria" ($0.00).
   - El conjunto de 9 categorías estándar (Comida, Transporte, Vivienda, Salud, Ocio, Ropa, Salario, Inversiones, Otros).

#### Contrato de API
- **Endpoint**: `POST /api/v1/auth/register`
- **Request Body (Zod DTO)**:
  ```json
  {
    "fullName": "Dylan Gamero",
    "email": "dylan@example.com",
    "password": "Password123!"
  }
  ```
- **Respuestas HTTP**:
  - `201 Created`:
    ```json
    {
      "success": true,
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": { "id": "uuid-v4", "email": "dylan@example.com", "fullName": "Dylan Gamero" },
      "initialProfile": { "id": "uuid-v4", "name": "Personal", "baseCurrency": "USD" }
    }
    ```
  - `400 Bad Request`: Error de validación Zod (contraseña débil o email inválido).
  - `409 Conflict`: `{"error": "UserAlreadyExists", "message": "El correo electrónico ya se encuentra registrado"}`.

#### Escenarios de Aceptación (Gherkin)
- **Escenario 1: Registro Exitoso de Cuenta con Inicialización**
  - **Dado** que el usuario envía un email "nuevo@koin.com" no existente y una contraseña válida.
  - **Cuando** la petición es procesada por `auth.controller.ts`.
  - **Entonces** se inserta el usuario con contraseña hasheada en Argon2id, se crea el perfil "Personal" y sus cuentas por defecto, y se retorna status `201` con el token JWT.
- **Escenario 2: Intento con Correo Duplicado**
  - **Dado** que ya existe una cuenta con el correo "dylan@example.com".
  - **Cuando** se envía una solicitud de registro con ese mismo correo.
  - **Entonces** el servidor retorna status `409 Conflict` sin revelar contraseñas ni datos sensibles.

---

### US-002: Inicio de Sesión (*Sign-In*) con Rate Limiting y JWT

- **Identificador**: `US-002`
- **Épica**: `EP-01: Autenticación y Seguridad Base`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario registrado.
- **Narrativa**:
  - **Como**: Usuario registrado.
  - **Quiero**: Iniciar sesión ingresando mis credenciales con protección contra ataques de fuerza bruta.
  - **Para**: Acceder a la plataforma desde la Web o la App Android y sincronizar mis perfiles.

#### Reglas de Negocio
1. **Protección Antifuerza Bruta**: Máximo 5 intentos fallidos por dirección IP cada 15 minutos en `/api/v1/auth/login`. Al 6to fallo, responder `429 Too Many Requests`.
2. **Mitigación de Timing Attacks**: La verificación de la contraseña debe realizarse en tiempo constante contra el hash de Argon2id.
3. **Payload del Token JWT**: Contiene `{ userId: string, email: string, exp: 7 días }`.

#### Contrato de API
- **Endpoint**: `POST /api/v1/auth/login`
- **Request Body**:
  ```json
  {
    "email": "dylan@example.com",
    "password": "Password123!"
  }
  ```
- **Respuestas HTTP**:
  - `200 OK`: `{"token": "jwt...", "user": {"id": "...", "fullName": "...", "email": "..."}}`
  - `401 Unauthorized`: `{"error": "InvalidCredentials", "message": "Correo o contraseña incorrectos"}`.
  - `429 Too Many Requests`: `{"error": "RateLimitExceeded", "message": "Demasiados intentos. Intente en 15 minutos."}`.

---

### US-003: Cierre de Sesión y Gestión de Sesión Activa

- **Identificador**: `US-003`
- **Épica**: `EP-01: Autenticación y Seguridad Base`
- **Prioridad**: `Should Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario autenticado.
- **Narrativa**:
  - **Como**: Usuario autenticado en un dispositivo prestado o personal.
  - **Quiero**: Cerrar mi sesión y purgar mis datos locales.
  - **Para**: Asegurar que nadie más pueda ver la información financiera tras retirarme del dispositivo.

#### Criterios de Aceptación
1. Al presionar "Cerrar Sesión", el cliente React elimina el token JWT de `localStorage` o `@capacitor/preferences`.
2. TanStack Query cancela todas las consultas pendientes y limpia la memoria (`queryClient.clear()`).
3. El estado de Zustand del perfil activo se resetea a `null`.
4. La aplicación redirige inmediatamente a la vista de `/login`.

---

## EP-02: Gestión de Perfiles Independientes y Personalización Visual

### US-004: Creación y Edición de Perfiles Independientes

- **Identificador**: `US-004`
- **Épica**: `EP-02: Perfiles Independientes y Personalización`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario Titular de Cuenta.
- **Narrativa**:
  - **Como**: Usuario titular de una cuenta Koin.
  - **Quiero**: Crear perfiles independientes (ej. "Dylan", "María", "Negocio Freelance") con avatar, moneda base y tema propio.
  - **Para**: Separar radicalmente los presupuestos, gastos y transacciones de diferentes personas o actividades en el mismo sistema.

#### Reglas de Negocio
1. **Límite de Perfiles**: Hasta 10 perfiles por cuenta titular.
2. **Aislamiento Estricto**: Un perfil recién creado no tiene acceso a las cuentas bancarias ni a los gastos de ningún otro perfil de la cuenta titular.
3. **Moneda Base**: El perfil define su divisa base obligatoria (ej. USD, COP, EUR, MXN). Todos los reportes consolidados del perfil se calculan en dicha moneda.
4. **Semillas del Perfil**: Cada perfil nuevo incluye sus propias cuentas por defecto ("Efectivo", "Bancos") y sus propias categorías.

#### Contrato de API
- **Endpoint**: `POST /api/v1/profiles`
- **Headers**: `Authorization: Bearer <jwt>`
- **Request Body**:
  ```json
  {
    "name": "María",
    "avatarEmoji": "🌸",
    "baseCurrency": "COP",
    "themeConfig": {
      "preset": "coral",
      "primaryHex": "#F43F5E",
      "accentHex": "#F59E0B",
      "baseMode": "dark"
    },
    "hasPin": false
  }
  ```
- **Respuestas**:
  - `201 Created`: Objeto del perfil con su `id` UUID.
  - `400 Bad Request`: Si el nombre está vacío o la moneda ISO no es válida.

---

### US-005: Conmutador Rápido de Perfiles (*Profile Switcher*)

- **Identificador**: `US-005`
- **Épica**: `EP-02: Perfiles Independientes y Personalización`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Cualquier persona usando la aplicación.
- **Narrativa**:
  - **Como**: Usuario que comparte el teléfono con su pareja o maneja perfil personal y laboral.
  - **Quiero**: Conmutar de perfil con un solo toque desde la barra superior mediante una bandeja inferior (*Bottom Sheet*).
  - **Para**: Cambiar de contexto inmediatamente en menos de 100 milisegundos sin cerrar la sesión maestra.

#### Criterios de Aceptación Técnicos
1. Al tocar el avatar del header, se abre el componente `ProfileSwitcherSheet` listando todos los perfiles de la cuenta.
2. Cada tarjeta de perfil muestra: Emoji, Nombre, Indicador de tema y un candado si requiere PIN.
3. Si se toca un perfil **sin PIN**:
   - `activeProfileId` se actualiza inmediatamente en el store global Zustand.
   - El motor de temas inyecta las nuevas variables CSS en el elemento raíz `<html>`.
   - TanStack Query ejecuta `queryClient.invalidateQueries()` refrescando las cuentas y gastos en segundo plano.
4. Si se toca un perfil **con PIN**:
   - Se despliega el modal `PinLockModal` antes de cambiar de perfil. No se muestra ningún saldo ni dato financiero hasta que el PIN sea validado en el backend.

---

### US-006: Motor de Personalización Dinámica de Colores y Temas

- **Identificador**: `US-006`
- **Épica**: `EP-02: Perfiles Independientes y Personalización`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario de cualquier perfil.
- **Narrativa**:
  - **Como**: Usuario en un perfil activo.
  - **Quiero**: Cambiar entre 6 paletas cromáticas preconfiguradas o elegir un color Hex `#RRGGBB` libre, además de elegir modo Claro, Oscuro o Negro AMOLED.
  - **Para**: Disfrutar de una app personalizada que me indique visualmente en qué perfil me encuentro al instante.

#### Reglas de Negocio y Algoritmos
1. **Conversión Hex a HSL**: El motor descompone el Hex en valores `H` (tono), `S` (saturación) y `L` (luminosidad) para inyectar en CSS:
   ```css
   --primary: 158 64% 42%;
   --primary-foreground: 0 0% 100%;
   ```
2. **Cálculo de Contraste WCAG**:
   - Si la luminancia relativa del color primario es mayor a 0.5, el texto `--primary-foreground` se establece en negro `#000000`. De lo contrario, se establece en blanco `#FFFFFF`. Garantiza ratio mínimo de contraste de 4.5:1 (WCAG AA).
3. **Modo AMOLED**: Establece `--background: 0 0% 0%` (negro absoluto para apagar píxeles en pantallas OLED y ahorrar batería).
4. **Android Status Bar**: Invoca `StatusBar.setBackgroundColor({ color: primaryHex })` y `StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })`.

---

### US-007: Bloqueo de Perfil con PIN Criptográfico y Antifuerza Bruta

- **Identificador**: `US-007`
- **Épica**: `EP-02: Perfiles Independientes y Personalización`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario que comparte el teléfono con terceros.
- **Narrativa**:
  - **Como**: Usuario de un perfil privado.
  - **Quiero**: Asignar un PIN numérico de 4 o 6 dígitos para entrar a mi perfil.
  - **Para**: Mantener la confidencialidad total de mis gastos frente a otras personas que usen la misma app.

#### Reglas de Seguridad
1. **Hashing**: El PIN se hashea en el backend usando **Argon2id**.
2. **Endpoint de Validación**: `POST /api/v1/profiles/:id/unlock`.
3. **Bloqueo Exponencial por Fallos**:
   - 1 a 4 intentos fallidos: Retorna `401 Unauthorized` con el número de intentos restantes.
   - 5to intento fallido: Bloquea el perfil durante **15 minutos** y retorna `429 Too Many Requests`.
4. **Header de Contexto**: Al validar el PIN exitosamente, el backend emite un token de perfil temporal que se envía en las cabeceras subsiguientes: `X-Profile-ID: <profileId>` y `X-Profile-Token: <token>`.

---

## EP-03: Cuentas Financieras y Colaboración Compartida (RBAC)

### US-008: Creación y Gestión de Cuentas Financieras Privadas

- **Identificador**: `US-008`
- **Épica**: `EP-03: Cuentas y Colaboración Compartida`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario en perfil activo.
- **Narrativa**:
  - **Como**: Usuario en un perfil activo.
  - **Quiero**: Crear cuentas bancarias, billeteras de efectivo, tarjetas o ahorros con saldo inicial y moneda específica.
  - **Para**: Organizar mi dinero y registrar gastos imputados a cuentas reales.

#### Contrato de API
- **Endpoint**: `POST /api/v1/accounts`
- **Request Body**:
  ```json
  {
    "name": "Billetera Efectivo",
    "type": "cash",
    "currency": "USD",
    "initialBalance": 150.00,
    "color": "#10B981",
    "icon": "Wallet"
  }
  ```
- **Comportamiento**:
  - Se registra con `isShared = false` y `createdByProfileId = activeProfileId`.
  - El `currentBalance` inicializa con el valor de `initialBalance`.

---

### US-009: Creación de Cuentas Compartidas e Invitaciones con RBAC

- **Identificador**: `US-009`
- **Épica**: `EP-03: Cuentas y Colaboración Compartida`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario Propietario de Cuenta.
- **Narrativa**:
  - **Como**: Usuario que administra gastos comunes del hogar o de un proyecto.
  - **Quiero**: Invitar a otros perfiles o usuarios externos a una cuenta compartida asignándoles un rol (`owner`, `editor`, `viewer`).
  - **Para**: Que podamos registrar y ver transacciones en conjunto sin compartir nuestras cuentas privadas.

#### Matriz de Roles y Permisos (RBAC)
| Acción | Owner (Propietario) | Editor | Viewer (Observador) |
| :--- | :---: | :---: | :---: |
| Ver saldo y transacciones | ✅ | ✅ | ✅ |
| Registrar gastos e ingresos | ✅ | ✅ | ❌ |
| Editar/Eliminar transacciones propias | ✅ | ✅ | ❌ |
| Editar transacciones de otros miembros | ✅ | ❌ | ❌ |
| Invitar o expulsar miembros | ✅ | ❌ | ❌ |
| Eliminar o archivar la cuenta | ✅ | ❌ | ❌ |

#### Reglas de Invitación
- Se emite un token criptográfico HMAC-SHA256 con vencimiento a los 7 días.
- URL generada: `https://koin-finance.herokuapp.com/invite?token=<token>`.

---

### US-010: Aceptación y Vinculación de Cuentas Compartidas

- **Identificador**: `US-010`
- **Épica**: `EP-03: Cuentas y Colaboración Compartida`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario invitado.
- **Narrativa**:
  - **Como**: Usuario que recibe un enlace de invitación a una cuenta compartida.
  - **Quiero**: Abrir el enlace y elegir en cuál de mis perfiles deseo vincular esa cuenta.
  - **Para**: Participar de las finanzas comunes desde mi perfil habitual sin mezclar mis cuentas personales.

#### Criterios de Aceptación
1. Si el usuario no ha iniciado sesión, el enlace lo redirige a `/login?redirect=/invite?token=...`.
2. Al estar autenticado, se despliega una pantalla: *"Dylan te ha invitado a co-administrar la cuenta 'Gastos Casa' como Editor. Selecciona tu perfil para unirte."*
3. Al seleccionar un perfil, se actualiza la tabla `account_members` con `status = 'accepted'` y `profile_id = selectedProfileId`.
4. La cuenta aparece inmediatamente en la vista del perfil con un badge: *"Compartida (Editor)"*.

---

### US-011: Administración de Miembros y Desvinculación

- **Identificador**: `US-011`
- **Épica**: `EP-03: Cuentas y Colaboración Compartida`
- **Prioridad**: `Should Have` | **Estimación**: `2 Story Points`
- **Actores**: Propietario de la cuenta o miembro colaborador.
- **Narrativa**:
  - **Como**: Propietario de una cuenta compartida o miembro que desea retirarse.
  - **Quiero**: Cambiar roles, eliminar miembros o salirme voluntariamente de una cuenta compartida.
  - **Para**: Mantener el control de acceso en caso de disolución del grupo.

#### Criterios de Aceptación
1. El `owner` puede presionar "Eliminar miembro", lo que revoca el acceso del perfil expulsado inmediatamente.
2. Un miembro puede presionar "Abandonar cuenta compartida".
3. **Integridad Contable**: Los movimientos registrados por el miembro retirado permanecen intactos en el historial de la cuenta compartida para que el saldo acumulado no se altere.

---

## EP-04: Registro Ultrarrápido (<3s) y Motor Multidivisa

### US-012: Modal de Registro Ultrarrápido con Teclado Integrado

- **Identificador**: `US-012`
- **Épica**: `EP-04: Registro Rápido y Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario en movilidad / calle.
- **Narrativa**:
  - **Como**: Usuario que acaba de realizar un pago en la calle.
  - **Quiero**: Pulsar el botón flotante (+) y acceder a un teclado numérico táctil en pantalla con chips de montos rápidos.
  - **Para**: Digitar el valor en menos de 2 segundos sin esperar la animación del teclado nativo del sistema.

#### Especificación UI/UX
1. El botón flotante central (+) despliega un modal inferior (*Bottom Sheet*) en menos de **80 milisegundos**.
2. **Visualizador de Monto**: Tipografía de 36px, visible, que inicia en `$ 0.00`.
3. **Teclado Táctil Integrado**: Botones grandes de 64px de alto: `1-9`, `.`, `0`, `⌫`.
4. **Chips de Suma Rápida**: Chips superiores: `+$5`, `+$10`, `+$20`, `+$50` que aumentan el monto acumulado al tocarlos.
5. **Selector Rápido de Cuenta**: Por defecto preselecciona la última cuenta utilizada o "Efectivo".

---

### US-013: Guardado en 2 Toques con Categorías Frecuentes y Deshacer

- **Identificador**: `US-013`
- **Épica**: `EP-04: Registro Rápido y Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario habitual de Koin.
- **Narrativa**:
  - **Como**: Usuario que desea registrar un gasto habitual (ej. café, transporte).
  - **Quiero**: Digitar el monto y pulsar directamente la categoría frecuente deseada para que el gasto se guarde automáticamente.
  - **Para**: Completar el proceso total de registro en **menos de 3 segundos reales** sin formularios interminables.

#### Flujo de 2 Toques
```
[ Toque 1: Digitar Monto "3.50" ] ──► [ Toque 2: Pulsar "🍔 Comida" ] ──► [ ¡GUARDADO! ]
```

#### Reglas Técnicas
1. Al tocar la categoría:
   - Se despacha la mutación a TanStack Query.
   - El modal se cierra instantáneamente con animación suave.
   - En Android, se emite una vibración de confirmación (`ImpactStyle.Light`).
   - Se muestra un Snackbar inferior durante 5 segundos: *"Gasto de $3.50 guardado en Comida. [DESHACER]"*.
2. Si el usuario toca "DESHACER", la mutación optimista revierte el cambio y llama a `DELETE /api/v1/transactions/:id`.

---

### US-014: Motor Multidivisa con Conversión a Moneda Base

- **Identificador**: `US-014`
- **Épica**: `EP-04: Registro Rápido y Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario con cuentas en múltiples monedas o que viaja al exterior.
- **Narrativa**:
  - **Como**: Usuario que realiza compras en monedas distintas a la moneda base de su perfil.
  - **Quiero**: Que el sistema registre el monto en la divisa original de la cuenta y calcule automáticamente el monto equivalente en mi divisa base.
  - **Para**: Ver mis reportes consolidados sin inconsistencias matemáticas de cambio.

#### Reglas de Cálculo Financiero
1. Si la cuenta opera en `USD` y el perfil opera en `COP`:
   - El sistema consulta la tabla `exchange_rates` para el par `USD_COP` (ej. tasa: `4,150.25`).
   - Se almacena:
     - `amount`: `50.00` (USD)
     - `currency`: `'USD'`
     - `exchangeRateToBase`: `4150.250000`
     - `baseAmount`: `207512.50` (COP)
2. **Precisión Numérica**: Todos los campos usan `NUMERIC(14, 2)` en dinero y `NUMERIC(18, 6)` en tasas de cambio en PostgreSQL. Prohibido el uso de flotantes `float/double`.

---

### US-015: Transferencias entre Cuentas con Transacciones ACID

- **Identificador**: `US-015`
- **Épica**: `EP-04: Registro Rápido y Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario con fondos en banco y efectivo.
- **Narrativa**:
  - **Como**: Usuario que retira dinero del banco o transfiere fondos entre cuentas.
  - **Quiero**: Registrar una transferencia indicando cuenta origen, cuenta destino y monto.
  - **Para**: Mantener cuadrados los balances de ambas cuentas sin tener que crear un gasto y un ingreso por separado.

#### Criterios de Aceptación
1. La operación se ejecuta en una transacción atómica PostgreSQL:
   ```typescript
   await db.transaction(async (tx) => {
     await tx.update(accounts).set({ currentBalance: sql`current_balance - ${amount}` }).where(eq(accounts.id, fromId));
     await tx.update(accounts).set({ currentBalance: sql`current_balance + ${convertedAmount}` }).where(eq(accounts.id, toId));
     await tx.insert(transactions).values({ type: 'transfer', ... });
   });
   ```
2. Si falla cualquiera de las dos actualizaciones, toda la operación se revierte (*rollback*) evitando inconsistencias contables.

---

### US-016: Historial de Transacciones con Filtros y Búsqueda

- **Identificador**: `US-016`
- **Épica**: `EP-04: Registro Rápido y Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario auditando sus gastos.
- **Narrativa**:
  - **Como**: Usuario de Koin.
  - **Quiero**: Un historial cronológico agrupado por fechas con buscador en tiempo real y filtros por cuenta, categoría y mes.
  - **Para**: Encontrar gastos pasados y auditar mis movimientos con total rapidez.

#### Criterios de Aceptación
1. Lista agrupada por cabeceras de fecha: "Hoy", "Ayer", "Lunes 27 de Octubre".
2. Búsqueda instantánea con *debounce* de 250ms filtrando por texto en las notas.
3. Filtros combinados: Tipo (Gasto/Ingreso), Cuenta específica y Categoría.
4. Renderizado virtual con TanStack Virtual para mantener 60 fps con más de 5,000 registros.

---

## EP-05: Categorías, Presupuestos y Umbrales de Alerta

### US-017: Gestión de Categorías Personalizadas con Iconos Lucide

- **Identificador**: `US-017`
- **Épica**: `EP-05: Categorías y Presupuestos`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario del perfil activo.
- **Narrativa**:
  - **Como**: Usuario con gastos específicos (ej. mascotas, suscripciones de software).
  - **Quiero**: Crear categorías personalizadas eligiendo su nombre, icono del catálogo Lucide y color.
  - **Para**: Categorizar mis finanzas según mi estilo de vida exacto.

#### Criterios de Aceptación
1. Selector visual de iconos con catálogo de Lucide Icons (búsqueda por palabras clave: "comida", "carro", "casa", "juego").
2. No se permite eliminar una categoría que tenga transacciones asociadas para prevenir violaciones de integridad referencial. Se ofrece la opción de "Archivar categoría".

---

### US-018: Presupuestos Mensuales con Alertas al 80% y 100%

- **Identificador**: `US-018`
- **Épica**: `EP-05: Categorías y Presupuestos`
- **Prioridad**: `Should Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario que controla sus gastos mensuales.
- **Narrativa**:
  - **Como**: Usuario que desea ahorrar.
  - **Quiero**: Fijar límites de gasto mensual para categorías específicas (ej. $200 en Entretenimiento) y ver barras de progreso con alertas.
  - **Para**: No excederme en mis presupuestos antes de fin de mes.

#### Reglas de Negocio Visuales
1. Cálculo: `consumido = sum(transactions.baseAmount) WHERE category_id = X AND mes = actual`.
2. Porcentaje: `(consumido / limite) * 100`.
3. Estados visuales:
   - `< 70%`: Barra en color Verde / Primario.
   - `70% a 99%`: Barra en Amarillo Ámbar (Alerta preventiva).
   - `>= 100%`: Barra en Rojo con icono de alerta (Presupuesto excedido).
4. Al registrar un gasto que supere el 80% o 100%, el Toast muestra una advertencia adicional: *"¡Has alcanzado el 85% de tu presupuesto de Comida!"*.

---

## EP-06: Analíticas, Reportes Visuales y Exportación

### US-019: Gráfico de Distribución de Gastos por Categoría (Dona Recharts)

- **Identificador**: `US-019`
- **Épica**: `EP-06: Analíticas y Reportes Visuales`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario analítico.
- **Narrativa**:
  - **Como**: Usuario que desea entender en qué se va su dinero.
  - **Quiero**: Un gráfico de dona interactivo que muestre el porcentaje de gasto por categoría en el mes seleccionado.
  - **Para**: Identificar de un vistazo mis mayores fuentes de egreso.

#### Criterios de Aceptación
1. Gráfico renderizado mediante **Recharts** completamente responsive.
2. Al pulsar una sección de la dona, muestra tooltip con monto formateado y porcentaje relativo.
3. Se acompaña de una lista inferior ordenada de mayor a menor gasto con barras de porcentaje.

---

### US-020: Flujo de Caja Mensual Consolidado a 6 Meses

- **Identificador**: `US-020`
- **Épica**: `EP-06: Analíticas y Reportes Visuales`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario que planifica sus finanzas.
- **Narrativa**:
  - **Como**: Usuario de Koin.
  - **Quiero**: Un gráfico de barras de los últimos 6 meses comparando Ingresos vs Gastos con el Ahorro Neto.
  - **Para**: Medir la evolución de mi capacidad de ahorro en el tiempo.

#### Criterios de Aceptación
1. Barras dobles por mes: Verde (Ingresos) y Rojo (Gastos).
2. Cálculo de tasa de ahorro mensual: `((Ingresos - Gastos) / Ingresos) * 100`.
3. Todos los valores normalizados a la **moneda base** del perfil.

---

### US-021: Exportación de Datos a CSV y Copia de Seguridad JSON

- **Identificador**: `US-021`
- **Épica**: `EP-06: Analíticas y Reportes Visuales`
- **Prioridad**: `Could Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario precavido.
- **Narrativa**:
  - **Como**: Usuario que audita sus cuentas en Excel o desea respaldar sus datos.
  - **Quiero**: Descargar mis transacciones en CSV y exportar la base relacional completa de mi perfil en JSON.
  - **Para**: Garantizar la soberanía total de mis datos financieros sin quedar atado a la aplicación.

#### Criterios de Aceptación
1. Exportación CSV genera archivo descargable con columnas: `Fecha`, `Cuenta`, `Tipo`, `Categoría`, `Monto_Original`, `Divisa`, `Tasa_Cambio`, `Monto_Base_COP`, `Nota`.
2. El archivo se genera tanto en navegador web (descarga directa) como en Android usando `@capacitor/filesystem` y diálogo de compartir nativo.

---

## EP-07: Experiencia Nativa en Android y Seguridad Móvil

### US-022: Feedback Táctil y Háptico en Android (`@capacitor/haptics`)

- **Identificador**: `US-022`
- **Épica**: `EP-07: Android Nativo y Seguridad Móvil`
- **Prioridad**: `Must Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario de la aplicación Android.
- **Narrativa**:
  - **Como**: Usuario operando la app en Android con una mano.
  - **Quiero**: Sentir vibraciones sutiles al pulsar los números del teclado y una vibración de éxito al guardar transacciones.
  - **Para**: Tener confirmación física inmediata sin tener que mirar fijamente la pantalla.

#### Criterios de Aceptación
1. Al tocar cada tecla numérica: `Haptics.impact({ style: ImpactStyle.Light })`.
2. Al pulsar borrar `⌫`: `Haptics.impact({ style: ImpactStyle.Medium })`.
3. Al confirmar guardado exitoso: `Haptics.notification({ type: NotificationType.Success })`.
4. En navegadores web de escritorio, la ejecución detecta la plataforma y no arroja errores.

---

### US-023: Sincronización del Tema con el Sistema Android

- **Identificador**: `US-023`
- **Épica**: `EP-07: Android Nativo y Seguridad Móvil`
- **Prioridad**: `Must Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario de teléfono móvil Android.
- **Narrativa**:
  - **Como**: Usuario de Android.
  - **Quiero**: Que la barra de estado y la barra de navegación del teléfono adopten el color del tema de mi perfil.
  - **Para**: Sentir una integración visual de nivel nativo en mi dispositivo.

#### Criterios de Aceptación
1. Al conmutar de perfil, `@capacitor/status-bar` actualiza el color de la barra del sistema operativo inmediatamente.
2. Si el fondo es oscuro, los iconos del sistema (batería, reloj, wifi) se colorean de blanco; si es claro, se colorean de negro.

---

### US-024: Privacidad Financiera con `FLAG_SECURE` y Auto-Lock

- **Identificador**: `US-024`
- **Épica**: `EP-07: Android Nativo y Seguridad Móvil`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario preocupado por su privacidad bancaria.
- **Narrativa**:
  - **Como**: Usuario que abre la app en público.
  - **Quiero**: Que el sistema impida capturas de pantalla, oculte la app en la vista de multitarea y se bloquee tras 3 minutos de inactividad.
  - **Para**: Evitar que software espía o terceros vean mis finanzas personales.

#### Criterios de Aceptación
1. Activación de la directiva nativa de Android `FLAG_SECURE` mediante `@capacitor-community/privacy-screen`.
2. Al pulsar el botón de aplicaciones recientes de Android, la tarjeta de la app se muestra opacada o con cortina de privacidad neutra.
3. Si la aplicación pasa a segundo plano durante más de 180 segundos (3 minutos), al regresar despliega la pantalla de desbloqueo de PIN si el perfil activo tiene seguridad habilitada.
