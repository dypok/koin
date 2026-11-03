# KOIN — Backlog Jira-Ready
> Épicas 1–7 con DoD global, historias refinadas, subtasks por capa y directivas de diseño estrictas.
> Sprint 0 → Épica 1 | Sprint 1 → Épicas 2-4 | Sprint 2 → Épicas 5-7

---

## ✅ DEFINITION OF DONE (DoD) — Aplica a TODAS las historias de usuario

Antes de mover cualquier Story a "Done" en Jira, se deben cumplir TODOS estos puntos:

- [ ] El código está en una rama `feature/` propia del integrante responsable
- [ ] Se abrió y aprobó un Pull Request hacia `develop` con al menos 1 revisión
- [ ] Los commits siguen el formato convencional (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`)
- [ ] Los criterios de aceptación de la US están cumplidos y verificados manualmente
- [ ] No hay errores en consola del navegador ni en los logs del servidor Express
- [ ] El endpoint funciona correctamente en `/api/docs` de Swagger / OpenAPI (si aplica)
- [ ] **Directiva Visual 1 (Cero Emojis)**: Se usan exclusivamente iconos SVG vectoriales de Lucide React (cero emojis en vistas y en base de datos)
- [ ] **Directiva Visual 2 (Cero Badges)**: Cero componentes `<Badge>` o etiquetas pastilla; la jerarquía se comunica con tipografía sobria y status dots
- [ ] **Directiva Visual 3 (Diseño Plano)**: Sin exceso de cards ni sombras pesadas; uso de líneas divisorias sutiles (`border-b border-border/40`) y filas planas
- [ ] `.env` nunca subido al repositorio (`.env.example` actualizado)
- [ ] La Story fue movida a "Done" en el tablero de Jira
- [ ] El integrante puede explicar el código desarrollado

---

## 🟡 EPIC 1 — Configuración técnica, Monorepo y DevOps
`Sprint 0 · v0.1 · Color Jira: Amarillo`

---

### SETUP-01 — Inicializar Monorepo con Turborepo, Express y React
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/setup-turborepo-monorepo

**Historia de usuario:**
> "Como equipo de desarrollo, queremos tener la estructura de Monorepo configurada con Turborepo, Express y React,
> para compartir contratos TypeScript y esquemas Zod con builds paralelos cacheados."

**Criterios de aceptación:**
- Turborepo operativo con workspaces: `apps/server`, `apps/web`, `packages/shared`
- `npm run build` y `npm run dev` ejecutan en paralelo con cache funcional
- `packages/shared` exporta tipos e interfaces consumidos por cliente y servidor
- TypeScript estricto configurado en todos los paquetes

**Subtasks:**
- [ ] [DEVOPS] Crear `package.json` raíz con configuración de npm workspaces
- [ ] [DEVOPS] Configurar `turbo.json` con pipelines de build, dev, lint y test
- [ ] [DEVOPS] Crear paquete `packages/shared` con compilación TypeScript para Zod DTOs
- [ ] [DEVOPS] Configurar `.gitignore` integral (node_modules, dist, android/, .env)
- [ ] [DOCS] Documentar comandos de desarrollo en el README principal

**DoD adicional para esta US:**
- `npm run check-types` pasa sin errores en todo el Monorepo

---

### SETUP-02 — Configurar Base de Datos Heroku Postgres y Drizzle ORM
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/setup-postgres-drizzle

**Historia de usuario:**
> "Como desarrollador backend, quiero tener la base de datos PostgreSQL conectada mediante Drizzle ORM,
> para ejecutar migraciones, consultas tipadas y transacciones financieras con precisión exacta."

**Criterios de aceptación:**
- Conexión a PostgreSQL verificada mediante `pg.Pool` con soporte de SSL
- Drizzle ORM configurado con CLI de migraciones (`drizzle-kit`)
- Precisión monetaria configurada como `NUMERIC(14, 2)` y tasas como `NUMERIC(18, 6)`
- Campo `avatar_icon` configurado como `VARCHAR(50)` para nombres de iconos SVG

**Subtasks:**
- [ ] [BD] Configurar instancia local PostgreSQL y preparar conexión para Heroku Postgres
- [ ] [BACKEND] Configurar cliente Drizzle en `apps/server/src/db/index.ts`
- [ ] [BACKEND] Escribir modelos Drizzle en `schema.ts`: users, profiles, accounts, transactions
- [ ] [BACKEND] Configurar scripts de migración: `npm run db:generate` y `npm run db:migrate`
- [ ] [TEST] Ejecutar migración inicial y verificar tablas creadas con constraints e índices

**DoD adicional para esta US:**
- Migración ejecuta limpiamente y se puede insertar/leer un registro de prueba

---

### SETUP-03 — Configurar Capacitor para Android y Sistema de Iconos SVG
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/setup-capacitor-svg

**Historia de usuario:**
> "Como desarrollador frontend, quiero inicializar Capacitor con Android y la librería Lucide SVG,
> para disponer del contenedor móvil nativo y la iconografía vectorial sin ningún emoji."

**Criterios de aceptación:**
- Capacitor configurado en `apps/web` con plataforma Android (`apps/web/android/`)
- Librería `lucide-react` instalada y configurada para uso exclusivo de SVGs
- Directiva de cero emojis y diseño plano establecida en tokens de Tailwind
- Sincronización exitosa con Android Studio vía `npx cap sync android`

**Subtasks:**
- [ ] [FRONTEND] Instalar `@capacitor/core`, `@capacitor/cli` y `@capacitor/android`
- [ ] [FRONTEND] Crear archivo `capacitor.config.ts` con appId `com.koin.finance`
- [ ] [FRONTEND] Ejecutar `npx cap add android` y verificar proyecto Gradle
- [ ] [FRONTEND] Instalar `lucide-react` y crear diccionario de iconos SVG reutilizables
- [ ] [FRONTEND] Configurar variables CSS HSL dinámicas en `index.css` de Tailwind

**DoD adicional para esta US:**
- Compilar la app web y verificar que `npx cap sync android` no arroja advertencias

---

## 🟣 EPIC 2 — Autenticación y gestión de cuentas titulares
`Sprint 1 · v1.0 · Color Jira: Morado`

---

### AUTH-01 — Registro de Cuenta Titular con Argon2id y Semilla Base
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/auth-register-seed

**Historia de usuario:**
> "Como usuario nuevo, quiero registrar una cuenta titular con mi nombre, email y contraseña segura,
> para tener mi espacio en la nube con un perfil inicial y cuentas listas para usar."

**Criterios de aceptación:**
- Contraseña hasheada en backend con Argon2id (mínimo 8 caracteres, mayúscula, número y símbolo)
- Correo normalizado; error 409 Conflict si ya está registrado
- Creación transaccional (`db.transaction`): Usuario + Perfil "Personal" + Cuentas "Efectivo" y "Banco" + 9 Categorías estándar con iconos SVG
- Retorna JWT de sesión válido por 7 días

**Subtasks:**
- [ ] [BACKEND] Implementar `auth.schema.ts` en `packages/shared` con validación Zod
- [ ] [BACKEND] `auth.service.ts`: función de hashing con `argon2` y creación transaccional
- [ ] [BACKEND] `auth.controller.ts`: endpoint `POST /api/v1/auth/register` (código 201)
- [ ] [FRONTEND] Formulario plano de registro en React con medidor de entropía de contraseña
- [ ] [FRONTEND] Almacenar JWT en storage seguro y redirigir al selector de perfiles

**DoD adicional para esta US:**
- Registro completo verificado en base de datos: usuario, perfil inicial y cuentas creadas en 1 sola transacción

---

### AUTH-02 — Inicio de Sesión Seguro con JWT y Protección Antifuerza Bruta
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/auth-login-ratelimit

**Historia de usuario:**
> "Como usuario registrado, quiero iniciar sesión de forma segura con protección antifuerza bruta,
> para ingresar a mi cuenta protegiendo mis datos de ataques automatizados."

**Criterios de aceptación:**
- Validación de credenciales con tiempo constante (`crypto.timingSafeEqual`) contra hash de Argon2id
- Limitación de tasa: máximo 5 intentos fallidos cada 15 minutos por IP (código 429)
- Emite JWT firmado con `userId` y `email`
- Persistencia de sesión en cliente al recargar la app

**Subtasks:**
- [ ] [BACKEND] Configurar `loginRateLimiter` para `POST /api/v1/auth/login` (5 intentos / 15 min)
- [ ] [BACKEND] `auth.service.ts`: verificación de contraseña con Argon2id y firma de JWT
- [ ] [BACKEND] `auth.middleware.ts`: verificación de token Bearer en rutas protegidas
- [ ] [FRONTEND] Formulario de login limpio con inputs minimalistas y botón primario
- [ ] [FRONTEND] Interceptor HTTP: adjuntar automáticamente `Authorization: Bearer <token>`
- [ ] [FRONTEND] Redirección automática si el token es válido al arrancar la app

**DoD adicional para esta US:**
- Intentar 6 logins fallidos seguidos y verificar que el 6to responde código `429 Too Many Requests`

---

### AUTH-03 — Cierre de Sesión y Purga de Estado Cliente
**Tipo:** Story | **SP:** 2 | **Prioridad:** Media | **Asignado:** Dylan
**Rama sugerida:** feature/auth-logout

**Historia de usuario:**
> "Como usuario autenticado, quiero cerrar sesión en cualquier momento,
> para asegurar que nadie pueda consultar mis finanzas si cedo mi dispositivo."

**Criterios de aceptación:**
- Purga completa de tokens en cliente
- Limpieza de memoria y cache de TanStack Query
- Reseteo del store de Zustand a valores nulos
- Redirección inmediata a la pantalla de login

**Subtasks:**
- [ ] [BACKEND] Endpoint `POST /api/v1/auth/logout`: registro de revocación de sesión
- [ ] [FRONTEND] Botón "Cerrar sesión" en menú de ajustes (fila plana con icono SVG `LogOut`)
- [ ] [FRONTEND] Eliminar token de `@capacitor/preferences` y `localStorage`
- [ ] [FRONTEND] Ejecutar `queryClient.clear()` eliminando todo dato de la memoria RAM
- [ ] [FRONTEND] Resetear stores Zustand y redirigir a `/login`

**DoD adicional para esta US:**
- Verificar que tras cerrar sesión, presionar el botón "Atrás" del navegador no muestra datos en cache

---

## 🟠 EPIC 3 — Perfiles independientes y personalización visual
`Sprint 1 · v1.0 · Color Jira: Naranja`

---

### PROF-01 — Creación y Gestión de Perfiles Independientes (Estilo Streaming)
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/profiles-crud

**Historia de usuario:**
> "Como usuario titular, quiero crear múltiples perfiles (ej. Dylan, María, Freelance) con avatar SVG y moneda base propia,
> para que cada persona o actividad maneje sus finanzas de manera totalmente aislada."

**Criterios de aceptación:**
- Perfiles vinculados a la cuenta titular pero con datos contables estrictamente segregados
- Selector de avatar basado exclusivamente en iconos SVG de Lucide (ej: `User`, `Briefcase`, `Heart`, `Shield`, `Zap`) — **cero emojis**
- Moneda base configurable por perfil (USD, COP, EUR, MXN, etc.)
- Al crear el perfil, se generan automáticamente sus cuentas y categorías privadas

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `profiles` con columna `avatar_icon VARCHAR(50) NOT NULL DEFAULT 'User'`
- [ ] [BACKEND] Endpoint `GET /api/v1/profiles`: listar perfiles del usuario en sesión
- [ ] [BACKEND] Endpoint `POST /api/v1/profiles`: crear perfil + cuentas/categorías base en transacción PostgreSQL
- [ ] [BACKEND] Endpoint `PATCH /api/v1/profiles/:id`: editar nombre, icono SVG o moneda base
- [ ] [FRONTEND] Vista de perfiles: lista plana con divisores sutiles de 1px (sin cards flotantes)
- [ ] [FRONTEND] Modal de creación de perfil: selector visual de iconos SVG Lucide y selector de moneda ISO

**DoD adicional para esta US:**
- Confirmar que ningún perfil nuevo tiene acceso a las cuentas de los otros perfiles existentes

---

### PROF-02 — Conmutador Rápido de Perfiles (Bottom Sheet <100ms)
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/profile-switcher

**Historia de usuario:**
> "Como usuario que comparte el dispositivo o alterna entre vida personal y trabajo,
> quiero conmutar de perfil en menos de 100ms desde un Bottom Sheet,
> para cambiar de contexto sin cerrar sesión ni experimentar demoras."

**Criterios de aceptación:**
- Bottom Sheet con lista plana de perfiles activable desde el header tocando el avatar SVG actual
- Conmutación en <100ms para perfiles sin PIN: actualiza estado Zustand y variables CSS
- Si el perfil destino tiene PIN, solicita desbloqueo antes de desplegar cualquier dato
- Invalidación de cache en TanStack Query para refrescar cuentas y gastos del nuevo perfil

**Subtasks:**
- [ ] [FRONTEND] Componente `ProfileSwitcherSheet`: hoja inferior deslizante con diseño plano y separadores finos
- [ ] [FRONTEND] Renderizar cada fila con: icono SVG del perfil, nombre, moneda base y candado SVG si requiere PIN
- [ ] [FRONTEND] Al seleccionar perfil sin PIN: actualizar `activeProfileId` en Zustand e inyectar tema visual
- [ ] [FRONTEND] Llamar `queryClient.invalidateQueries()` refrescando el dashboard con los datos del nuevo perfil
- [ ] [FRONTEND] Al seleccionar perfil con PIN: abrir modal numérico de desbloqueo sin cambiar el contexto previo

**DoD adicional para esta US:**
- Conmutar de Perfil 1 a Perfil 2 en un teléfono Android real y verificar fluidez absoluta (<100ms)

---

### PROF-03 — Motor Dinámico de Colores HSL (Presets, Hex libre, AMOLED y WCAG)
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/theming-engine-hsl

**Historia de usuario:**
> "Como usuario de un perfil, quiero personalizar la paleta de colores de mi perfil con presets o código Hex libre y modo AMOLED,
> para tener una identidad visual inconfundible con contraste accesible."

**Criterios de aceptación:**
- Inyección en vivo de variables CSS HSL (`--primary`, `--accent`) en el elemento `:root` sin re-renderizar React
- 6 Presets disponibles: Esmeralda (`#10B981`), Índigo (`#6366F1`), Amatista (`#8B5CF6`), Coral (`#F43F5E`), Ámbar (`#F59E0B`), Zafiro (`#3B82F6`)
- Selector libre de color Hexadecimal `#RRGGBB` con cálculo matemático de contraste WCAG AA (mínimo 4.5:1)
- Modo Negro AMOLED (`#000000`) para ahorro de energía en pantallas OLED
- Persistencia de la paleta en `theme_config JSONB` en PostgreSQL

**Subtasks:**
- [ ] [FRONTEND] Utilidad `themeEngine.ts`: función conversora Hex-to-HSL (`hexToHsl(hex)`)
- [ ] [FRONTEND] Función de luminancia relativa y ratio de contraste WCAG: calcula texto blanco o negro automáticamente
- [ ] [FRONTEND] Pantalla "Ajustes > Apariencia": selector de presets, input Hex libre y selector Claro/Oscuro/AMOLED
- [ ] [FRONTEND] Aplicar cambios en vivo en el DOM: `document.documentElement.style.setProperty('--primary', hsl)`
- [ ] [BACKEND] Endpoint `PATCH /api/v1/profiles/:id/theme`: persistir objeto `themeConfig` en la base de datos

**DoD adicional para esta US:**
- Probar un color primario claro (amarillo) y oscuro (azul marino); el texto debe cambiar dinámicamente entre negro y blanco garantizando legibilidad

---

### PROF-04 — Bloqueo de Perfil con PIN Criptográfico y Bloqueo Exponencial
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/profile-pin-security

**Historia de usuario:**
> "Como usuario de un perfil privado, quiero proteger mi perfil con un PIN numérico de 4 o 6 dígitos,
> para que terceros que usen el mismo dispositivo no puedan ver mis cuentas ni movimientos."

**Criterios de aceptación:**
- PIN hasheado en backend con Argon2id (cero texto plano en base de datos)
- Teclado numérico táctil en pantalla de botones amplios
- Bloqueo temporal por 15 minutos al fallar 5 intentos consecutivos (código HTTP 429)
- Verificación en tiempo constante con `crypto.timingSafeEqual`

**Subtasks:**
- [ ] [BD] Columnas `has_pin`, `pin_hash`, `failed_attempts`, `locked_until` en tabla `profiles`
- [ ] [BACKEND] Endpoint `POST /api/v1/profiles/:id/pin`: configurar o actualizar PIN (hasheo con Argon2id)
- [ ] [BACKEND] Endpoint `POST /api/v1/profiles/:id/unlock`: validar PIN con comparación segura `timingSafeEqual`
- [ ] [BACKEND] Contador de reintentos fallidos en servidor con bloqueo a los 5 intentos
- [ ] [FRONTEND] Componente `PinPadModal`: teclado numérico táctil plano en pantalla
- [ ] [FRONTEND] Respuesta visual de error: vibración háptica suave y mensaje sutil indicando intentos restantes

**DoD adicional para esta US:**
- Bloqueo verificado contra ataques de fuerza bruta en pruebas automatizadas

---

## 🔵 EPIC 4 — Cuentas financieras y colaboración compartida (RBAC)
`Sprint 1 · v1.0 · Color Jira: Celeste`

---

### ACC-01 — Creación y Balanceo en Tiempo Real de Cuentas Privadas
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/accounts-private-crud

**Historia de usuario:**
> "Como usuario en un perfil activo, quiero crear mis cuentas bancarias, billeteras de efectivo y tarjetas de crédito,
> para tener organizado mi dinero y registrar gastos imputados a fondos reales."

**Criterios de aceptación:**
- Cuentas clasificadas por tipo: Efectivo, Banco, Crédito, Ahorros, Inversiones
- Saldo calculado en tiempo real derivado de `initialBalance` + transacciones
- Cada cuenta tiene asignado un icono SVG de Lucide (ej: `Wallet`, `Landmark`, `CreditCard`, `PiggyBank`) y color distintivo
- Lista de cuentas en diseño minimalista con divisores sutiles (sin tarjetas elevadas)

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `accounts` con constraints e índices por `created_by_profile_id`
- [ ] [BACKEND] Endpoint `GET /api/v1/accounts`: retornar cuentas del perfil activo con balance calculado
- [ ] [BACKEND] Endpoint `POST /api/v1/accounts`: crear cuenta privada vinculada a `activeProfileId`
- [ ] [BACKEND] Endpoint `PATCH /api/v1/accounts/:id`: editar nombre, icono SVG o color
- [ ] [FRONTEND] Formulario plano para creación de cuenta con selector de tipo e icono SVG
- [ ] [FRONTEND] Vista de Cuentas: listado plano de filas con icono SVG, nombre, divisa y saldo en texto grande

**DoD adicional para esta US:**
- Crear una cuenta con saldo inicial de $500 y verificar que el balance en el listado es exactamente $500.00

---

### ACC-02 — Cuentas Compartidas e Invitaciones con Enlaces Criptográficos
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/accounts-sharing-rbac

**Historia de usuario:**
> "Como usuario que maneja gastos compartidos, quiero habilitar una cuenta como compartida e invitar a otros miembros con un rol,
> para co-administrar finanzas del hogar o de un proyecto conjunto de forma segura."

**Criterios de aceptación:**
- Cuenta marcada con `is_shared: true`
- Sistema de roles RBAC: `owner` (propietario total), `editor` (registra transacciones), `viewer` (solo lectura de saldos)
- Generación de token criptográfico HMAC-SHA256 con vencimiento de 7 días
- Enlace de invitación generado: `https://koin-finance.herokuapp.com/invite?token=<token>`

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `account_members` con `account_id`, `profile_id`, `role`, `status`
- [ ] [BACKEND] `invitation.service.ts`: generación y firma de tokens HMAC-SHA256 con expiración
- [ ] [BACKEND] Endpoint `POST /api/v1/accounts/:id/invite`: genera enlace de invitación con rol asignado
- [ ] [BACKEND] Middleware `rbac.middleware.ts`: validar permisos antes de mutar cuentas o transacciones compartidas
- [ ] [FRONTEND] Diálogo plano "Compartir Cuenta": selector de rol (`Editor` u `Observador`) y botón para copiar enlace

**DoD adicional para esta US:**
- Verificar que el token de invitación expira exactamente a los 7 días y no puede reutilizarse una vez aceptado

---

### ACC-03 — Aceptación y Vinculación de Cuentas Compartidas a Perfiles
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/accept-account-invitation

**Historia de usuario:**
> "Como usuario que recibe una invitación a una cuenta compartida, quiero abrir el enlace y elegir en cuál de mis perfiles vincularla,
> para colaborar en los gastos comunes desde mi perfil preferido sin mezclar mis cuentas personales."

**Criterios de aceptación:**
- Validación del token de invitación en backend; error 400 si expiró o fue usado
- Si el usuario no ha iniciado sesión, se redirige a login preservando la URL de retorno
- Pantalla limpia que muestra anfitrión, nombre de la cuenta y rol asignado
- Al aceptar, la cuenta compartida aparece inmediatamente en la lista de cuentas del perfil seleccionado con distintivo sutil de texto: "Compartida (Rol)" (sin badges)

**Subtasks:**
- [ ] [BACKEND] Endpoint `GET /api/v1/invitations/validate?token=...`: valida token y retorna info de la cuenta
- [ ] [BACKEND] Endpoint `POST /api/v1/invitations/accept`: asocia `profile_id` a `account_members` en transacción PostgreSQL
- [ ] [FRONTEND] Ruta `/invite`: pantalla de aceptación con selector del perfil al que se desea unir la cuenta
- [ ] [FRONTEND] Botón "Unirse a la Cuenta": despacha mutación y redirige al dashboard del perfil elegido
- [ ] [FRONTEND] Renderizado en listado de cuentas con icono SVG de usuarios compartidos y rol en texto atenuado

**DoD adicional para esta US:**
- Flujo completo verificado: Usuario A invita por link → Usuario B abre enlace en incógnito → Inicia sesión → Selecciona perfil → Cuenta compartida visible

---

### ACC-04 — Gestión de Miembros y Control de Accesos RBAC
**Tipo:** Story | **SP:** 2 | **Prioridad:** Media | **Asignado:** Dylan
**Rama sugerida:** feature/accounts-members-management

**Historia de usuario:**
> "Como propietario de una cuenta compartida o colaborador que desea salir, quiero gestionar los miembros o abandonar la cuenta,
> para mantener el control de acceso en caso de cambios en el grupo."

**Criterios de aceptación:**
- Solo el `owner` puede cambiar roles de otros miembros o expulsarlos
- Un miembro colaborador puede desvincularse voluntariamente ("Abandonar cuenta")
- Las transacciones registradas históricamente por el miembro retirado se conservan intactas para no quebrar la contabilidad

**Subtasks:**
- [ ] [BACKEND] Endpoint `DELETE /api/v1/accounts/:id/members/:memberId`: revocar acceso de un miembro (solo `owner`)
- [ ] [BACKEND] Endpoint `POST /api/v1/accounts/:id/leave`: desvinculación voluntaria del perfil en sesión
- [ ] [FRONTEND] Panel "Miembros de la Cuenta": lista plana con nombre del perfil, rol actual y botón sutil de eliminar
- [ ] [FRONTEND] Diálogo de confirmación antes de expulsar o abandonar la cuenta
- [ ] [FRONTEND] Actualización inmediata de la lista de cuentas tras desvincularse

**DoD adicional para esta US:**
- Probar que tras expulsar a un miembro, este pierde acceso inmediatamente en su próxima petición HTTP (error 403)

---

## 🟢 EPIC 5 — Registro financiero ultrarrápido (<3s) y motor multidivisa
`Sprint 2 · v1.0 · Color Jira: Verde`

---

### TXN-01 — Modal de Entrada Rápida con Teclado Táctil Integrado y Chips
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/quick-entry-pad

**Historia de usuario:**
> "Como usuario en la calle que acaba de pagar un producto, quiero abrir un modal inferior con teclado táctil integrado y chips de montos,
> para digitar la cantidad en menos de 2 segundos sin esperar a que cargue el teclado del sistema operativo."

**Criterios de aceptación:**
- Botón flotante (+) despliega la hoja inferior en menos de 80 milisegundos mediante aceleración GPU
- Teclado numérico táctil en pantalla de botones de 64px (`1-9`, `.`, `0`, `⌫`)
- Chips de adición rápida de monto (`+$5`, `+$10`, `+$20`, `+$50`) que incrementan el valor con un toque
- Selector horizontal plano para elegir cuenta origen (preselecciona la última usada)
- En Android, cada pulsación emite una micro-vibración háptica (`@capacitor/haptics`)

**Subtasks:**
- [ ] [FRONTEND] Componente `QuickEntryPad`: hoja inferior deslizante con diseño plano y limpio
- [ ] [FRONTEND] Visualizador de monto en tipografía grande (36px) que arranca en `$ 0.00`
- [ ] [FRONTEND] Teclado táctil en cuadrícula con botones grandes accesibles a una sola mano
- [ ] [FRONTEND] Lógica de adición de chips de monto rápido
- [ ] [FRONTEND] Selector de cuenta plana integrado en la cabecera del modal
- [ ] [FRONTEND] Integrar llamada a `Haptics.impact({ style: ImpactStyle.Light })` en cada pulsación en Android
- [ ] [TEST] Verificar tiempo de apertura del modal en DevTools (<80ms)

**DoD adicional para esta US:**
- Probar en un teléfono físico Android que digitar "$15.50" con chips y teclas toma menos de 2 segundos

---

### TXN-02 — Guardado en 2 Toques con Categorías Frecuentes y Acción Deshacer
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/two-tap-transaction-save

**Historia de usuario:**
> "Como usuario habitual, quiero digitar el monto y pulsar directamente la categoría frecuente para que se guarde automáticamente,
> para completar el registro en menos de 3 segundos con opción de deshacer si me equivoqué."

**Criterios de aceptación:**
- Algoritmo que ordena en primer plano las 6 categorías más usadas del perfil
- Tocar la categoría dispara el guardado inmediato y cierra el modal en <100ms
- Notificación Toast inferior plana por 5 segundos: *"Gasto de $X.XX guardado en [Categoría] [Deshacer]"*
- Si pulsa "Deshacer", la mutación optimista se revierte y se elimina la transacción en el servidor

**Subtasks:**
- [ ] [FRONTEND] Algoritmo en cliente que computa las 6 categorías con mayor frecuencia de uso del perfil
- [ ] [FRONTEND] Renderizado de cuadrícula de categorías con iconos SVG vectoriales de Lucide (cero emojis)
- [ ] [FRONTEND] Acción de guardado al tocar categoría: mutación optimista con TanStack Query
- [ ] [FRONTEND] Cierre inmediato del modal con vibración háptica de éxito en Android
- [ ] [FRONTEND] Componente Toast con temporizador de 5 segundos y botón de acción "Deshacer"
- [ ] [BACKEND] Endpoint `POST /api/v1/transactions`: inserción y actualización atómica del balance de cuenta
- [ ] [BACKEND] Endpoint `DELETE /api/v1/transactions/:id`: eliminación y reversión del saldo

**DoD adicional para esta US:**
- Medir cronometrado en video: Toque (+) → "15" → Tocar "Comida" → Guardado. Total: < 3 segundos reales

---

### TXN-03 — Motor de Conversión Multidivisa y Registro Dual a Moneda Base
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/multicurrency-engine

**Historia de usuario:**
> "Como usuario con cuentas en diferentes monedas o que viaja al exterior, quiero registrar transacciones en la divisa de la cuenta,
> para que el sistema calcule automáticamente el equivalente en la moneda base de mi perfil sin distorsión contable."

**Criterios de aceptación:**
- Tabla `exchange_rates` en PostgreSQL con tasas diarias de conversión
- Registro dual en cada transacción: `amount` en moneda original y `base_amount` normalizado a la moneda base del perfil
- Precisión numérica con tipos `NUMERIC(14, 2)` en importes y `NUMERIC(18, 6)` en tasas de cambio (cero errores de punto flotante)
- El usuario puede editar manualmente la tasa de cambio si el banco le cobró una tarifa diferente

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `exchange_rates` con pares de divisas (`pair VARCHAR(7) PK`, ej: `'USD_COP'`)
- [ ] [BACKEND] `currency.service.ts`: servicio que consulta tasas de cambio y computa `base_amount`
- [ ] [BACKEND] Carga de seed data con tasas de cambio comunes (USD, EUR, COP, MXN)
- [ ] [FRONTEND] En el modal de gasto: si la cuenta tiene divisa distinta a la base, mostrar campo sutil de tasa de cambio y equivalente calculado
- [ ] [FRONTEND] Permitir edición manual de la tasa de cambio con recálculo en vivo
- [ ] [TEST] Test unitario: verificar que 100 USD con tasa 4,150.25 produce exactamente 415,025.00 COP

**DoD adicional para esta US:**
- Verificar en PostgreSQL que la transacción guarda ambos montos con precisión exacta

---

### TXN-04 — Transferencias entre Cuentas con Transacciones Atómicas ACID
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/account-transfers-acid

**Historia de usuario:**
> "Como usuario con fondos en múltiples cuentas, quiero transferir dinero entre dos cuentas seleccionadas,
> para mantener cuadrados mis saldos de forma atómica sin registrar un gasto y un ingreso por duplicado."

**Criterios de aceptación:**
- Transacción atómica en PostgreSQL (`db.transaction`): debita cuenta origen y acredita cuenta destino
- Si ocurre un error a mitad de camino, se ejecuta rollback automático y ningún saldo se altera
- Soporte para transferencias entre cuentas con divisas distintas aplicando tasa de conversión

**Subtasks:**
- [ ] [BACKEND] Endpoint `POST /api/v1/transfers`: recibe `fromAccountId`, `toAccountId`, `amount`, `convertedAmount`
- [ ] [BACKEND] `transfer.service.ts`: ejecución atómica dentro de `db.transaction()` con verificación de permisos en cuentas compartidas
- [ ] [FRONTEND] Selector de modo "Transferencia" en el modal rápido
- [ ] [FRONTEND] Selectores de cuenta origen y cuenta destino
- [ ] [FRONTEND] Actualización optimista de ambos balances en pantalla
- [ ] [TEST] Test de estrés: simular caída a mitad de la transferencia y verificar que los saldos quedan intactos

**DoD adicional para esta US:**
- Ejecutar una transferencia y verificar en base de datos que el débito y crédito son simultáneos

---

### TXN-05 — Historial Cronológico con Búsqueda en Vivo y Filtros
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/transaction-history-filters

**Historia de usuario:**
> "Como usuario que audita sus finanzas, quiero ver mi historial de movimientos agrupado por fechas con buscador en vivo y filtros,
> para encontrar cualquier compra pasada de inmediato sin lentitud en la interfaz."

**Criterios de aceptación:**
- Movimientos agrupados por cabeceras de fecha legibles ("Hoy", "Ayer", "Lunes 28 de Octubre")
- Buscador con debounce de 250ms filtrando por texto en la nota de la transacción
- Filtros planos combinados por Tipo (Gasto/Ingreso), Cuenta y Categoría
- Renderizado virtualizado con TanStack Virtual manteniendo 60 fps constantes con más de 2,000 registros

**Subtasks:**
- [ ] [BACKEND] Endpoint `GET /api/v1/transactions`: paginación cursor-based con soporte de filtros combinados
- [ ] [FRONTEND] Barra de búsqueda plana integrada en la cabecera de la sección
- [ ] [FRONTEND] Filtros de texto horizontales desplazables (Todo, Gastos, Ingresos, Cuentas)
- [ ] [FRONTEND] Lista virtualizada con `@tanstack/react-virtual`
- [ ] [FRONTEND] Cada fila de movimiento: icono SVG de categoría, descripción/nota, fecha y monto en formato de divisa
- [ ] [TEST] Probar rendimiento de scroll con 2,000 transacciones simuladas

**DoD adicional para esta US:**
- El scroll de la lista de transacciones se mantiene fluido a 60 fps en un dispositivo móvil de gama media

---

## 🟣 EPIC 6 — Presupuestos, analíticas y exportación de datos
`Sprint 2 · v1.0 · Color Jira: Índigo`

---

### BUD-01 — Gestión de Categorías Personalizadas con Iconos SVG Lucide
**Tipo:** Story | **SP:** 3 | **Prioridad:** Media | **Asignado:** Dylan
**Rama sugerida:** feature/categories-crud

**Historia de usuario:**
> "Como usuario con gastos particulares, quiero crear categorías personalizadas con iconos SVG de Lucide y colores,
> para clasificar mis finanzas de acuerdo a mis necesidades exactas."

**Criterios de aceptación:**
- Categorías clasificadas como gasto o ingreso
- Selector de catálogo visual de iconos SVG de Lucide (ej: `Utensils`, `Car`, `Home`, `Heart`, `ShoppingBag`, `Coffee`) — **cero emojis**
- No se permite eliminar una categoría con transacciones asociadas (se ofrece la opción de "Archivar")

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `categories` con campo `icon VARCHAR(50)` y clave foránea `profile_id`
- [ ] [BACKEND] Endpoints CRUD para categorías en `categories.controller.ts`
- [ ] [FRONTEND] Catálogo modal de selección de iconos SVG de Lucide con buscador de texto
- [ ] [FRONTEND] Lista plana de categorías con opción de editar o archivar
- [ ] [TEST] Test de integridad: verificar error 400 al intentar borrar categoría con movimientos

**DoD adicional para esta US:**
- Crear una categoría "Gimnasio" con icono SVG `Dumbbell` y verificar que se visualiza correctamente en el modal de gasto

---

### BUD-02 — Presupuestos Mensuales con Barras de Progreso y Alertas
**Tipo:** Story | **SP:** 5 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/monthly-budgets-alerts

**Historia de usuario:**
> "Como usuario que busca ahorrar, quiero definir presupuestos mensuales por categoría y ver barras de progreso con alertas,
> para no sobrepasar mis límites antes de fin de mes."

**Criterios de aceptación:**
- Límite de gasto mensual definido por categoría
- Barra de progreso delgada (4px de alto) directamente bajo la fila de la categoría (sin cards abultadas ni badges)
- Código de color semafórico: Verde (<70%), Amarillo Ámbar (70%-99%), Rojo (>=100% excedido)
- Alerta preventiva en Toast y texto destacado al registrar un gasto que alcance el 80% o 100% del presupuesto

**Subtasks:**
- [ ] [BD] Migración Drizzle de tabla `budgets` con constraints únicos `[profile_id, category_id, period]`
- [ ] [BACKEND] Endpoint `GET /api/v1/budgets`: calcula suma consumida en el mes y porcentaje restante
- [ ] [BACKEND] Endpoint `POST /api/v1/budgets`: fijar o actualizar presupuesto
- [ ] [FRONTEND] Vista de Presupuestos: filas minimalistas con nombre, monto gastado vs límite y barra delgada de 4px
- [ ] [FRONTEND] Lógica visual de colores semafóricos según el porcentaje consumido
- [ ] [FRONTEND] Alerta Toast no intrusiva al guardar un gasto que exceda el umbral del 80% o 100%

**DoD adicional para esta US:**
- Registrar un gasto que supere el presupuesto mensual de una categoría y comprobar que la barra cambia a rojo inmediatamente

---

### ANL-01 — Gráfico Interactivo de Distribución de Gastos por Categoría (Dona Recharts)
**Tipo:** Story | **SP:** 3 | **Prioridad:** Media | **Asignado:** Dylan
**Rama sugerida:** feature/analytics-donut-chart

**Historia de usuario:**
> "Como usuario analítico, quiero ver un gráfico interactivo de dona con el porcentaje de gasto por categoría,
> para identificar de un vistazo mis mayores centros de costo en el mes seleccionado."

**Criterios de aceptación:**
- Gráfico vectorial renderizado con Recharts totalmente responsive
- Paleta cromática adaptada automáticamente al tema activo del perfil
- Al pulsar una sección muestra el importe total gastado y el porcentaje relativo
- Acompañado de un desglose en lista plana con porcentajes en texto sobrio (sin badges)

**Subtasks:**
- [ ] [BACKEND] Endpoint `GET /api/v1/analytics/categories`: retorna suma agrupada por categoría en moneda base
- [ ] [FRONTEND] Componente de gráfico de dona con Recharts sin marcos ni bordes innecesarios
- [ ] [FRONTEND] Tooltip personalizado con formato de moneda local y porcentaje
- [ ] [FRONTEND] Lista plana inferior ordenada de mayor a menor gasto con divisores sutiles
- [ ] [TEST] Verificar responsividad del gráfico en pantalla móvil y desktop

**DoD adicional para esta US:**
- Gráfico renderizado sin pérdida de nitidez en pantallas de alta densidad (Retina / AMOLED)

---

### ANL-02 — Flujo de Caja Mensual Consolidado a 6 Meses
**Tipo:** Story | **SP:** 3 | **Prioridad:** Media | **Asignado:** Dylan
**Rama sugerida:** feature/analytics-cashflow-bars

**Historia de usuario:**
> "Como usuario que planifica sus finanzas, quiero ver un gráfico comparativo de barras de Ingresos vs Gastos de los últimos 6 meses,
> para conocer la evolución de mi ahorro neto a lo largo del tiempo."

**Criterios de aceptación:**
- Barras pareadas mensuales (Verde para ingresos, Rojo/Naranja para gastos)
- Tarjeta resumen con métricas clave: Total Ingresos, Total Gastos, Ahorro Neto y Tasa de Ahorro (`(Ahorro / Ingresos) * 100`)
- Todos los montos consolidados en la **moneda base** del perfil

**Subtasks:**
- [ ] [BACKEND] Endpoint `GET /api/v1/analytics/cashflow`: retorna totales agrupados por los últimos 6 meses
- [ ] [FRONTEND] Componente de barras comparativas con Recharts
- [ ] [FRONTEND] Indicador tipográfico de Tasa de Ahorro en texto sobrio
- [ ] [FRONTEND] Selector de mes para consultar datos históricos

**DoD adicional para esta US:**
- Verificar que las transacciones en divisas extranjeras están correctamente convertidas a la moneda base en las barras

---

### ANL-03 — Exportación Soberana a CSV y Copia de Seguridad JSON
**Tipo:** Story | **SP:** 2 | **Prioridad:** Baja | **Asignado:** Dylan
**Rama sugerida:** feature/export-csv-json

**Historia de usuario:**
> "Como usuario precavido, quiero exportar mis movimientos a un archivo CSV y generar un backup completo en JSON,
> para analizar mis finanzas en hojas de cálculo y ser dueño total de mis datos."

**Criterios de aceptación:**
- Descarga directa de archivo CSV formateado con columnas: Fecha, Cuenta, Categoría, Tipo, Monto_Original, Divisa, Tasa_Cambio, Monto_Base, Nota
- Generación de copia de seguridad JSON con la estructura completa del perfil
- Funcional tanto en navegador web de escritorio como en Android mediante diálogo nativo de compartir (`@capacitor/filesystem` / `@capacitor/share`)

**Subtasks:**
- [ ] [BACKEND] Endpoint `GET /api/v1/export/csv`: genera stream de texto CSV con encoding UTF-8
- [ ] [BACKEND] Endpoint `GET /api/v1/export/json`: genera volcado relacional del perfil activo
- [ ] [FRONTEND] Botones de exportación en la sección de Ajustes
- [ ] [FRONTEND] Integración condicional: descarga por blob en Web y guardado con `@capacitor/filesystem` en Android

**DoD adicional para esta US:**
- Descargar el archivo CSV y abrirlo en Microsoft Excel y Google Sheets verificando que no hay caracteres rotos de encoding

---

## 🔴 EPIC 7 — Experiencia nativa Android y despliegue en Heroku
`Sprint 2 · v1.0 · Color Jira: Rojo`

---

### MOB-01 — Integración de Feedback Háptico en Android (@capacitor/haptics)
**Tipo:** Story | **SP:** 2 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/mobile-haptics

**Historia de usuario:**
> "Como usuario en la aplicación Android, quiero sentir vibraciones precisas al teclear y al confirmar operaciones,
> para recibir una confirmación física táctil que eleve la calidad de la experiencia a nivel nativo."

**Criterios de aceptación:**
- Micro-vibración suave al pulsar cada tecla numérica del teclado rápido (`ImpactStyle.Light`)
- Vibración media al pulsar la tecla de borrar (`ImpactStyle.Medium`)
- Vibración de éxito al confirmar el guardado de una transacción (`NotificationType.Success`)
- En navegadores web, el sistema detecta la plataforma y degrada elegantemente sin emitir errores de consola

**Subtasks:**
- [ ] [FRONTEND] Servicio `haptics.service.ts` encapsulando `@capacitor/haptics` con chequeo de plataforma
- [ ] [FRONTEND] Vincular micro-impacto en el componente `QuickEntryPad` en cada toque numérico
- [ ] [FRONTEND] Vincular vibración de éxito en el callback de mutación optimista de TanStack Query
- [ ] [TEST] Verificar respuesta háptica en dispositivo físico Android

**DoD adicional para esta US:**
- Probar la app en Chrome de escritorio y verificar que la consola está libre de warnings o excepciones de haptics

---

### MOB-02 — Sincronización Cromática de Status Bar de Android
**Tipo:** Story | **SP:** 2 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/mobile-statusbar-sync

**Historia de usuario:**
> "Como usuario en Android, quiero que la barra de estado del sistema operativo adopte el color del tema de mi perfil,
> para disfrutar de una inmersión visual total indistinguible de una app nativa en Kotlin."

**Criterios de aceptación:**
- Al cambiar de perfil o paleta, `@capacitor/status-bar` actualiza el color de la barra del sistema
- Iconos del sistema (hora, batería, señal) se configuran automáticamente como claros u oscuros según la luminosidad del tema

**Subtasks:**
- [ ] [FRONTEND] Integrar plugin `@capacitor/status-bar` en el arranque de la app
- [ ] [FRONTEND] Hook `useTheme`: invocar `StatusBar.setBackgroundColor` y `StatusBar.setStyle` al cambiar de perfil
- [ ] [TEST] Verificar en emulador y teléfono físico Android la transición de color entre temas

**DoD adicional para esta US:**
- Pasar de un perfil con tema Esmeralda a uno con tema Coral y comprobar que la barra superior cambia de color al instante

---

### MOB-03 — Privacidad Móvil con FLAG_SECURE y Bloqueo por Inactividad
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/mobile-security-privacy

**Historia de usuario:**
> "Como usuario bancario precavido, quiero que la app impida capturas de pantalla y se bloquee tras 3 minutos en segundo plano,
> para proteger mis datos financieros de software espía o personas curiosas."

**Criterios de aceptación:**
- Activación de `FLAG_SECURE` en Android mediante `@capacitor-community/privacy-screen`
- Al pulsar el botón de multitarea del sistema, la app se muestra oculta con una cortina neutra
- Si la app pasa más de 180 segundos en segundo plano, al reabrir solicita el PIN si el perfil tiene seguridad

**Subtasks:**
- [ ] [FRONTEND] Configurar `@capacitor-community/privacy-screen` en `MainActivity.java` / Capacitor
- [ ] [FRONTEND] Hook de ciclo de vida (`App.addListener('appStateChange')`): calcular tiempo en background
- [ ] [FRONTEND] Si transcurren > 180 segundos en segundo plano, cambiar estado de perfil a bloqueado
- [ ] [TEST] Intentar tomar una captura de pantalla en Android físico y verificar que el sistema operativo la bloquea

**DoD adicional para esta US:**
- Verificar que al minimizar la app y volver tras 4 minutos, la pantalla de desbloqueo por PIN aparece de inmediato

---

### DEPLOY-01 — Despliegue en Heroku (Dyno Unificado Express/SPA + Heroku Postgres)
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** feature/deploy-heroku

**Historia de usuario:**
> "Como equipo, queremos desplegar la solución en Heroku en un Dyno unificado con base de datos Heroku Postgres,
> para tener la API y la Web SPA disponibles públicamente en producción."

**Criterios de aceptación:**
- Build automatizado de Turborepo para el servidor Express y el cliente web React
- Servidor Express sirve la API REST (`/api/*`) y la SPA compilada (`dist/`) en el mismo puerto `$PORT`
- Base de datos Heroku Postgres conectada con SSL activo
- Migraciones Drizzle ejecutadas automáticamente en release phase

**Subtasks:**
- [ ] [DEVOPS] Crear `Procfile` en la raíz: `web: npm run start --filter=@koin/server`
- [ ] [DEVOPS] Configurar scripts en `package.json`: `build`, `start`, `db:migrate`
- [ ] [DEVOPS] Aprovisionar Add-on: `heroku addons:create heroku-postgresql:essential-0`
- [ ] [DEVOPS] Configurar variables de entorno en Heroku: `NODE_ENV=production`, `JWT_SECRET`
- [ ] [TEST] Verificar que `/health` responde `{"status": "ok"}` en la URL pública de Heroku
- [ ] [TEST] Probar navegación de la Web SPA en el dominio `https://<app>.herokuapp.com`

**DoD adicional para esta US:**
- La aplicación web carga en producción y se pueden registrar transacciones reales conectadas a Heroku Postgres

---

### DEPLOY-02 — Documentación de Casos de Prueba y Métricas de Rendimiento
**Tipo:** Story | **SP:** 3 | **Prioridad:** Alta | **Asignado:** Dylan
**Rama sugerida:** docs/casos-prueba-evidencias

**Historia de usuario:**
> "Como equipo de desarrollo, queremos tener la matriz de pruebas funcionales documentada con evidencias,
> para validar la estabilidad de la plataforma y sustentar técnicamente el proyecto."

**Criterios de aceptación:**
- Tabla con al menos 1 caso de prueba por cada Story del proyecto
- Bugs identificados y resueltos documentados
- Evidencias de pruebas de velocidad (<3 segundos en registro) incluidas

**Subtasks:**
- [ ] [TEST] Elaborar matriz de pruebas con columnas: ID, Historia, Datos de Entrada, Resultado Esperado, Resultado Obtenido, Estado
- [ ] [TEST] Validar flujos de autenticación, conmutación de perfiles, RBAC y motor multidivisa
- [ ] [TEST] Registrar tiempos de respuesta y tiempos de registro de transacciones (<3s)
- [ ] [DOCS] Consolidar evidencias fotográficas y métricas en la documentación técnica

**DoD adicional para esta US:**
- Matriz de pruebas completa con 100% de casos en estado "Pasado"

---

## 📊 Resumen del Backlog Jira-Ready de Koin

| Épica | Sprint | Stories | SP Total | Color Jira |
|---|---|:---:|:---:|---|
| **Epic 1 — Configuración técnica, Monorepo y DevOps** | Sprint 0 | 3 | 9 | Amarillo |
| **Epic 2 — Autenticación y cuentas titulares** | Sprint 1 | 3 | 8 | Morado |
| **Epic 3 — Perfiles independientes y personalización visual** | Sprint 1 | 4 | 18 | Naranja |
| **Epic 4 — Cuentas financieras y colaboración (RBAC)** | Sprint 1 | 4 | 13 | Celeste |
| **Epic 5 — Registro financiero ultrarrápido (<3s) y multidivisa** | Sprint 2 | 5 | 21 | Verde |
| **Epic 6 — Presupuestos, analíticas y exportación de datos** | Sprint 2 | 5 | 16 | Índigo |
| **Epic 7 — Experiencia nativa Android y despliegue en Heroku** | Sprint 2 | 5 | 13 | Rojo |
| **TOTAL GENERAL** | | **29** | **98** | |
