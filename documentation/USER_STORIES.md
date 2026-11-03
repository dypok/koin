# 08. Especificación de Épicas, Features e Historias de Usuario (Koin)

Este documento estructura el backlog de producto e ingeniería bajo la jerarquía estándar de desarrollo de software: **Épicas** → **Features (Características / Capacidades del Sistema)** → **Historias de Usuario (US)** con especificación de funcionalidades entregadas, contratos técnicos de API, reglas de negocio y criterios Gherkin.

### ⚠️ Directivas UI Obligatorias para Todas las Historias de Usuario
1. **Cero Emojis (100% SVG Icons)**: Prohibido terminantemente el uso de emojis en cualquier vista o modelo de datos. Se emplean exclusivamente iconos SVG vectoriales (Lucide React).
2. **Cero Badges**: Prohibido el uso de componentes Badge o etiquetas pastilla de colores. La información se comunica mediante tipografía limpia, texto atenuado (`text-muted-foreground`) o indicadores de estado discretos.
3. **Diseño Plano sin Exceso de Cards**: Erradicación del antipatrón de tarjetas dentro de tarjetas con sombras y bordes pesados. Se utilizan filas de lista planas con líneas divisorias sutiles (`border-b border-border/40`) y espaciado minimalista.

---

## 🗺️ Mapa Jerárquico: Épicas y Features

```
KOIN PRODUCT BACKLOG
│
├── EP-01: ACCESO, IDENTIDAD Y SEGURIDAD BASE
│   ├── FEAT-01: Onboarding y Registro de Cuentas Maestras
│   │   └── US-001: Registro de Cuenta Titular con Argon2id y Semilla Base
│   └── FEAT-02: Autenticación Segura y Control de Sesiones
│       ├── US-002: Inicio de Sesión con JWT y Protección Antifuerza Bruta
│       └── US-003: Cierre de Sesión y Revocación de Tokens
│
├── EP-02: ARQUITECTURA MULTI-PERFIL Y PERSONALIZACIÓN VISUAL
│   ├── FEAT-03: Espacio de Trabajo Multi-Perfil (Streaming-Style)
│   │   ├── US-004: Creación y Parametrización de Perfiles Independientes
│   │   └── US-005: Conmutador Instantáneo de Perfiles (<100ms)
│   ├── FEAT-04: Motor Dinámico de Personalización Cromática (CSS Engine)
│   │   └── US-006: Personalizador Dinámico de Temas HSL y Contraste WCAG
│   └── FEAT-05: Seguridad Perimetral por Perfil
│       └── US-007: Bloqueo de Perfil con PIN Criptográfico y Bloqueo Exponencial
│
├── EP-03: CUENTAS FINANCIERAS Y COLABORACIÓN COMPARTIDA (RBAC)
│   ├── FEAT-06: Gestión de Cuentas y Billeteras Privadas
│   │   └── US-008: Creación y Balanceo en Tiempo Real de Cuentas Privadas
│   └── FEAT-07: Espacios Colaborativos y Cuentas Compartidas
│       ├── US-009: Cuentas Compartidas e Invitaciones con Enlaces Criptográficos
│       ├── US-010: Aceptación y Vinculación de Cuentas a Perfiles Invitados
│       └── US-011: Administración de Membresías y Revocación de Accesos
│
├── EP-04: REGISTRO FINANCIERO ULTRARRÁPIDO Y MULTIDIVISA (CORE FINANCE)
│   ├── FEAT-08: Quick-Entry Pad (<3 Segundos)
│   │   ├── US-012: Modal Inferior con Teclado Numérico Táctil Integrado
│   │   └── US-013: Guardado en 2 Toques con Categorías Frecuentes y Deshacer
│   ├── FEAT-09: Motor de Conversión Multidivisa en Tiempo Real
│   │   └── US-014: Registro Dual de Transacciones y Conversión a Moneda Base
│   └── FEAT-10: Conciliación de Fondos y Auditoría de Movimientos
│       ├── US-015: Transferencias entre Cuentas con Transacciones Atómicas ACID
│       └── US-016: Historial Cronológico con Búsqueda en Vivo y Filtros
│
├── EP-05: PLANIFICACIÓN Y CONTROL FINANCIERO (BUDGETS & CATEGORIES)
│   ├── FEAT-11: Taxonomía y Categorización Financiera
│   │   └── US-017: Gestión de Categorías Personalizadas con Iconos Lucide
│   └── FEAT-12: Sistema de Presupuestación y Alertas Preventivas
│       └── US-018: Presupuestos Mensuales con Alertas Visuales al 80% y 100%
│
├── EP-06: INTELIGENCIA FINANCIERA Y SOBERANÍA DE DATOS (ANALYTICS & EXPORT)
│   ├── FEAT-13: Visualización de Datos y Análisis de Gastos
│   │   ├── US-019: Gráfico de Distribución de Gastos por Categoría (Dona Recharts)
│   │   └── US-020: Flujo de Caja Mensual Consolidado a 6 Meses
│   └── FEAT-14: Portabilidad y Respaldo Soberano de Información
│       └── US-021: Exportación a CSV y Copia de Seguridad Relacional JSON
│
└── EP-07: EXPERIENCIA MÓVIL NATIVA Y HARDWARE (ANDROID & CAPACITOR)
    ├── FEAT-15: Interacción Táctil y Háptica de Alta Fidelidad
    │   └── US-022: Feedback Háptico (@capacitor/haptics) en Teclado y Guardado
    ├── FEAT-16: Integración Profunda con el Sistema Operativo Android
    │   └── US-023: Sincronización Cromática de Status Bar y Navigation Bar
    └── FEAT-17: Blindaje de Privacidad en Entorno Móvil
        └── US-024: Protección de Pantalla con FLAG_SECURE y Bloqueo por Inactividad
```

---

## 📦 Desglose Detallado por Épica, Feature e Historia de Usuario

---

### EP-01: Acceso, Identidad y Seguridad Base

#### FEAT-01: Onboarding y Registro de Cuentas Maestras
- **Identificador**: `FEAT-01`
- **Descripción**: Proporciona el flujo inicial de entrada al sistema mediante la creación de cuentas titulares en la nube (Heroku), garantizando aislamiento multi-inquilino desde el primer segundo.

##### US-001: Registro de Cuenta Titular con Argon2id y Semilla Base
- **Feature Perteneciente**: `FEAT-01: Onboarding y Registro de Cuentas Maestras`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Visitante / Administrador del Hogar.
- **Narrativa**:
  - **Como**: Usuario nuevo o cabeza de hogar.
  - **Quiero**: Registrar una cuenta administradora indicando mi nombre completo, email y contraseña segura.
  - **Para**: Disponer de un espacio privado en la nube de Heroku donde crear y alojar los diferentes perfiles familiares o personales.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Formulario de Registro React*: Validación en vivo de fortaleza de contraseña con medidor visual de entropía.
  2. *Pipeline de Hashing Seguro*: Integración de algoritmo **Argon2id** (64MB memoria, 3 iteraciones) en Express.
  3. *Semilla Transaccional Automática*: Creación automática de perfil "Personal", 2 cuentas iniciales ("Efectivo", "Banco") y 9 categorías estándar en una sola transacción PostgreSQL (`db.transaction`).
  4. *Emisión de Sesión*: Generación de JWT inicial firmado con expiración de 7 días.
- **Contrato de API**:
  - `POST /api/v1/auth/register`
  - Payload: `{ "fullName": "Dylan Gamero", "email": "dylan@example.com", "password": "Password123!" }`
  - Respuestas: `201 Created` (retorna token, user y initialProfile), `400 Bad Request`, `409 Conflict`.
- **Escenarios Gherkin**:
  - **Escenario 1 (Happy Path)**: Dado un email no registrado y contraseña válida, cuando se envía el formulario, entonces se inserta en PostgreSQL, se ejecuta la semilla y se retorna 201 con JWT.
  - **Escenario 2 (Email Duplicado)**: Dado un email ya existente, cuando se envía el formulario, entonces retorna 409 Conflict genérico.

---

#### FEAT-02: Autenticación Segura y Control de Sesiones
- **Identificador**: `FEAT-02`
- **Descripción**: Control de acceso a la API RESTful mediante tokens criptográficos, limitación de tasa contra ataques de fuerza bruta y revocación segura de credenciales.

##### US-002: Inicio de Sesión con JWT y Protección Antifuerza Bruta
- **Feature Perteneciente**: `FEAT-02: Autenticación Segura y Control de Sesiones`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario registrado.
- **Narrativa**:
  - **Como**: Usuario registrado.
  - **Quiero**: Iniciar sesión con mi email y contraseña con limitación de intentos por IP.
  - **Para**: Acceder a la plataforma protegiendo mis datos financieros de ataques automatizados.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Rate Limiter Estricto*: `express-rate-limit` restringido a 5 intentos fallidos cada 15 minutos en `/login`.
  2. *Anti-Timing Attack*: Comparación de contraseña en tiempo constante contra el hash de Argon2id.
  3. *Persistencia Segura en Cliente*: Almacenamiento del JWT en `@capacitor/preferences` (Android Keystore en móvil / localStorage seguro en Web).
- **Contrato de API**:
  - `POST /api/v1/auth/login`
  - Payload: `{ "email": "...", "password": "..." }`
  - Respuestas: `200 OK` (token + info básica), `401 Unauthorized`, `429 Too Many Requests`.

##### US-003: Cierre de Sesión y Revocación de Tokens
- **Feature Perteneciente**: `FEAT-02: Autenticación Segura y Control de Sesiones`
- **Prioridad**: `Should Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario autenticado.
- **Narrativa**:
  - **Como**: Usuario autenticado.
  - **Quiero**: Cerrar mi sesión voluntariamente.
  - **Para**: Impedir accesos no autorizados al dejar mi dispositivo.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Limpieza de Estado Global*: Reset completo del store de Zustand (`activeProfileId: null`, `user: null`).
  2. *Purga de Cache*: Cancelación y purga de consultas en memoria con `queryClient.clear()`.
  3. *Eliminación de Tokens*: Borrado del token en el cliente y redirección inmediata a `/login`.

---

### EP-02: Arquitectura Multi-Perfil y Personalización Visual

#### FEAT-03: Espacio de Trabajo Multi-Perfil (Streaming-Style)
- **Identificador**: `FEAT-03`
- **Descripción**: Permite que una sola cuenta titular contenga múltiples perfiles completamente aislados (estilo Netflix), cada uno con sus propias cuentas, transacciones, moneda base e identidad.

##### US-004: Creación y Parametrización de Perfiles Independientes
- **Feature Perteneciente**: `FEAT-03: Espacio de Trabajo Multi-Perfil`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario Titular de la Cuenta.
- **Narrativa**:
  - **Como**: Titular de la cuenta.
  - **Quiero**: Crear perfiles independientes (ej. "Dylan", "María", "Negocio Freelance") definiendo su nombre, avatar, tema y moneda base.
  - **Para**: Llevar contabilidades y finanzas completamente segregadas en la misma aplicación.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Selector de Avatar SVG (Cero Emojis)*: Cuadrícula de iconos vectoriales SVG de Lucide (ej: `User`, `Briefcase`, `Shield`, `Heart`, `Sparkles`, `Zap`).
  2. *Selector de Moneda Base*: Selector ISO 4217 (USD, COP, EUR, MXN, etc.) que regirá los cálculos del perfil.
  3. *Aislamiento Estricto de Base de Datos*: Asignación de UUID único y generación automática de cuentas y categorías base para ese perfil.
- **Contrato de API**:
  - `POST /api/v1/profiles`
  - Payload: `{ "name": "María", "avatarIcon": "Heart", "baseCurrency": "COP", "themeConfig": {...}, "hasPin": false }`
  - Respuestas: `201 Created` con la entidad Profile creada.

##### US-005: Conmutador Instantáneo de Perfiles (<100ms)
- **Feature Perteneciente**: `FEAT-03: Espacio de Trabajo Multi-Perfil`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario compartiendo dispositivo o alternando contextos.
- **Narrativa**:
  - **Como**: Usuario que comparte el teléfono o cambia de perfil personal a profesional.
  - **Quiero**: Cambiar de perfil mediante un panel inferior (*Bottom Sheet*) en menos de 100 milisegundos.
  - **Para**: Trabajar fluidamente entre perfiles sin fricción ni recargas completas.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Bottom Sheet UI*: Componente deslizante con la lista de perfiles, avatars y distintivos de color.
  2. *Inyección Rápida de Contexto*: Cambio de `activeProfileId` en el store global y re-evaluación inmediata de consultas TanStack Query.
  3. *Disparo de Bloqueo por PIN*: Detección automática si el perfil destino requiere PIN antes de renderizar la vista.

---

#### FEAT-04: Motor Dinámico de Personalización Cromática (CSS Engine)
- **Identificador**: `FEAT-04`
- **Descripción**: Motor dinámico que convierte cualquier color Hex a variables CSS HSL en tiempo de ejecución, sincronizando la apariencia de la app y la barra de estado de Android con cálculos de contraste WCAG AA.

##### US-006: Personalizador Dinámico de Temas HSL y Contraste WCAG
- **Feature Perteneciente**: `FEAT-04: Motor Dinámico de Personalización Cromática`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario de cualquier perfil.
- **Narrativa**:
  - **Como**: Usuario en un perfil activo.
  - **Quiero**: Escoger entre 6 paletas cromáticas preconfiguradas o ingresar un color Hexadecimal `#RRGGBB` libre, junto con modo Claro, Oscuro o Negro AMOLED.
  - **Para**: Personalizar la app a mi gusto y diferenciar inmediatamente en qué perfil me encuentro.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Motor HSL en Tiempo Real*: Conversor Hex-to-HSL que inyecta `--primary`, `--accent` en `:root` al instante sin re-renderizar React.
  2. *Calculador de Contraste WCAG AA*: Determina si el texto sobre el color debe ser blanco o negro para garantizar contraste 4.5:1.
  3. *Soporte Negro AMOLED*: Modo de pantalla `#000000` para ahorro de batería en pantallas OLED móviles.
  4. *Sincronización con Android*: Llamada a `@capacitor/status-bar` para colorear la barra del sistema.

---

#### FEAT-05: Seguridad Perimetral por Perfil
- **Identificador**: `FEAT-05`
- **Descripción**: Capa de protección individualizada por perfil para resguardar la privacidad de cada persona en dispositivos compartidos.

##### US-007: Bloqueo de Perfil con PIN Criptográfico y Bloqueo Exponencial
- **Feature Perteneciente**: `FEAT-05: Seguridad Perimetral por Perfil`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario que comparte el dispositivo con terceros.
- **Narrativa**:
  - **Como**: Usuario de un perfil privado.
  - **Quiero**: Proteger mi perfil con un PIN numérico de 4 o 6 dígitos.
  - **Para**: Que nadie pueda ver mis transacciones o balances aunque la cuenta principal esté abierta.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Teclado Numérico Seguro*: Teclado UI que desordena opcionalmente los números para evitar espionaje de patrones táctiles.
  2. *Hashing con Sal Dinámica*: Almacenamiento seguro del PIN con Argon2id.
  3. *Bloqueo Exponencial tras 5 Fallos*: Bloqueo temporal por 15 minutos en el backend con respuesta HTTP `429`.
  4. *Comparación Segura*: Uso de `crypto.timingSafeEqual` para prevenir ataques de canal lateral por análisis de tiempo.

---

### EP-03: Cuentas Financieras y Colaboración Compartida (RBAC)

#### FEAT-06: Gestión de Cuentas y Billeteras Privadas
- **Identificador**: `FEAT-06`
- **Descripción**: Módulo de administración de fuentes de dinero (efectivo, bancos, tarjetas de crédito, inversiones) privadas para cada perfil.

##### US-008: Creación y Balanceo en Tiempo Real de Cuentas Privadas
- **Feature Perteneciente**: `FEAT-06: Gestión de Cuentas y Billeteras Privadas`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario en perfil activo.
- **Narrativa**:
  - **Como**: Usuario en un perfil activo.
  - **Quiero**: Crear cuentas financieras indicando su tipo, divisa y saldo inicial.
  - **Para**: Llevar el control exacto de mis fondos disponibles en cada instrumento financiero.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Formulario de Cuenta*: Selector de tipo (`cash`, `bank`, `credit`, `savings`), moneda, color distintivo e icono Lucide.
  2. *Cálculo de Balance en Tiempo Real*: Saldo calculado derivado de `initialBalance` más la suma de transacciones asociadas.
  3. *Aislamiento Estricto*: Clave foránea `createdByProfileId` indexada en PostgreSQL.

---

#### FEAT-07: Espacios Colaborativos y Cuentas Compartidas
- **Identificador**: `FEAT-07`
- **Descripción**: Sistema de co-administración de cuentas financieras entre perfiles propios o perfiles de otros usuarios mediante invitaciones criptográficas y control de acceso basado en roles (RBAC).

##### US-009: Cuentas Compartidas e Invitaciones con Enlaces Criptográficos
- **Feature Perteneciente**: `FEAT-07: Espacios Colaborativos y Cuentas Compartidas`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario Propietario de la Cuenta.
- **Narrativa**:
  - **Como**: Usuario que gestiona gastos compartidos (hogar, viaje, pareja).
  - **Quiero**: Marcar una cuenta como compartida e invitar a otros perfiles o usuarios por enlace/email con un rol (`owner`, `editor`, `viewer`).
  - **Para**: Co-administrar un presupuesto conjunto de forma coordinada y segura.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Generador de Tokens HMAC-SHA256*: Tokens firmados criptográficamente con vigencia de 7 días.
  2. *Matriz de Roles RBAC*:
     - `owner`: Control administrativo absoluto (editar cuenta, miembros, archivar).
     - `editor`: Registrar gastos/ingresos, editar movimientos propios.
     - `viewer`: Consulta exclusiva de saldos y reportes en modo solo lectura.
  3. *Diálogo de Invitación*: Copiado de enlace directo o envío por correo.

##### US-010: Aceptación y Vinculación de Cuentas a Perfiles Invitados
- **Feature Perteneciente**: `FEAT-07: Espacios Colaborativos y Cuentas Compartidas`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario invitado.
- **Narrativa**:
  - **Como**: Usuario invitado a una cuenta compartida.
  - **Quiero**: Abrir el enlace de invitación y seleccionar en cuál de mis perfiles deseo vincular la cuenta.
  - **Para**: Participar de las finanzas comunes desde mi perfil habitual sin mezclar mis cuentas privadas.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Pantalla de Redención de Invitación*: Muestra el nombre de la cuenta, anfitrión y rol asignado.
  2. *Selector de Perfil Destino*: Permite vincular la membresía al perfil que el usuario elija.
  3. *Actualización Transaccional*: Marca la invitación como `accepted` y actualiza la tabla `account_members`.

##### US-011: Administración de Membresías y Revocación de Accesos
- **Feature Perteneciente**: `FEAT-07: Espacios Colaborativos y Cuentas Compartidas`
- **Prioridad**: `Should Have` | **Estimación**: `2 Story Points`
- **Actores**: Propietario de la cuenta o miembro colaborador.
- **Narrativa**:
  - **Como**: Propietario de una cuenta compartida o miembro que desea retirarse.
  - **Quiero**: Modificar roles, expulsar colaboradores o abandonar la cuenta.
  - **Para**: Mantener el control de acceso en caso de disolución del grupo.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Panel de Gestión de Miembros*: Listado de miembros activos con opción de cambio de rol o expulsión inmediata.
  2. *Botón de Desvinculación Voluntaria*: Permite al usuario abandonar la cuenta.
  3. *Preservación de Trazabilidad Contable*: Las transacciones históricas registradas por el usuario se conservan para no quebrar el balance.

---

### EP-04: Registro Financiero Ultrarrápido y Multidivisa (Core Finance)

#### FEAT-08: Quick-Entry Pad (<3 Segundos)
- **Identificador**: `FEAT-08`
- **Descripción**: Experiencia de usuario de alta velocidad para registrar transacciones en movilidad en menos de 3 toques o 3 segundos reales.

##### US-012: Modal Inferior con Teclado Numérico Táctil Integrado
- **Feature Perteneciente**: `FEAT-08: Quick-Entry Pad`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario en movilidad / calle.
- **Narrativa**:
  - **Como**: Usuario que acaba de realizar un pago.
  - **Quiero**: Tocar el botón flotante (+) y acceder a un teclado numérico táctil en pantalla de carga instantánea (<80ms).
  - **Para**: Digitar el valor en menos de 2 segundos sin depender del teclado del sistema operativo.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Bottom Sheet Optimizado*: Despliegue en <80ms mediante animaciones CSS aceleradas por GPU.
  2. *Teclado Numérico en Pantalla*: Botones grandes táctiles de 64px (`1-9`, `.`, `0`, `⌫`).
  3. *Chips de Monto Rápido*: Botones sugeridos (`+$5`, `+$10`, `+$20`, `+$50`) que incrementan el importe con un solo toque.

##### US-013: Guardado en 2 Toques con Categorías Frecuentes y Deshacer
- **Feature Perteneciente**: `FEAT-08: Quick-Entry Pad`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario habitual de Koin.
- **Narrativa**:
  - **Como**: Usuario que desea registrar un gasto recurrente (ej. café, almuerzo).
  - **Quiero**: Digitar el monto y pulsar directamente la categoría frecuente para que el gasto se guarde automáticamente.
  - **Para**: Completar el registro total en **menos de 3 segundos reales**.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Cuadrícula de Frecuentes*: Algoritmo que posiciona en primer plano las 6 categorías más usadas del perfil.
  2. *Auto-Save en 1 Toque*: Tocar la categoría dispara inmediatamente la creación de la transacción.
  3. *Mutación Optimista TanStack Query*: Cierre inmediato del modal e inserción instantánea en la lista (<100ms visuales).
  4. *Snackbar con Función Deshacer*: Notificación flotante de 5 segundos con botón "[DESHACER]" que revierte el movimiento si fue un error.

---

#### FEAT-09: Motor de Conversión Multidivisa en Tiempo Real
- **Identificador**: `FEAT-09`
- **Descripción**: Módulo financiero que normaliza automáticamente los gastos registrados en divisas secundarias hacia la divisa base del perfil sin pérdida de precisión.

##### US-014: Registro Dual de Transacciones y Conversión a Moneda Base
- **Feature Perteneciente**: `FEAT-09: Motor de Conversión Multidivisa`
- **Prioridad**: `Must Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario con cuentas en múltiples monedas o que viaja al exterior.
- **Narrativa**:
  - **Como**: Usuario con cuentas en varias monedas.
  - **Quiero**: Registrar compras en la divisa original de la cuenta y que el sistema calcule automáticamente el equivalente en la moneda base de mi perfil.
  - **Para**: Conocer mi balance global consolidado sin inconsistencias de cambio.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Tabla de Tasas de Cambio (`exchange_rates`)*: Almacenamiento de tasas de cambio con precisión `NUMERIC(18, 6)`.
  2. *Registro Dual de Transacción*: Almacena `amount` en moneda original, `currency`, `exchangeRateToBase` y `baseAmount` normalizado en `NUMERIC(14, 2)`.
  3. *Sobreescritura Manual de Tasa*: Permite al usuario editar la tasa de cambio aplicada si su banco cobró una tarifa específica.

---

#### FEAT-10: Conciliación de Fondos y Auditoría de Movimientos
- **Identificador**: `FEAT-10`
- **Descripción**: Módulo de transferencias atómicas entre cuentas y auditoría visual de movimientos históricos con filtros avanzados.

##### US-015: Transferencias entre Cuentas con Transacciones Atómicas ACID
- **Feature Perteneciente**: `FEAT-10: Conciliación de Fondos y Auditoría`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario con fondos en múltiples cuentas.
- **Narrativa**:
  - **Como**: Usuario que mueve dinero de su cuenta bancaria al efectivo.
  - **Quiero**: Registrar transferencias indicando cuenta origen, destino y monto.
  - **Para**: Mantener cuadrados mis saldos sin crear un gasto y un ingreso por separado.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Transacción Atómica PostgreSQL*: Uso de `db.transaction()` para debitar la cuenta origen y acreditar la destino. Si una falla, ambas se revierten.
  2. *Soporte Multidivisa en Transferencias*: Conversión automática si la cuenta origen y destino tienen monedas distintas.

##### US-016: Historial Cronológico con Búsqueda en Vivo y Filtros
- **Feature Perteneciente**: `FEAT-10: Conciliación de Fondos y Auditoría`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario auditando sus movimientos.
- **Narrativa**:
  - **Como**: Usuario de Koin.
  - **Quiero**: Un historial cronológico agrupado por fechas con buscador en tiempo real y filtros combinados.
  - **Para**: Auditar mis finanzas y encontrar compras pasadas al instante.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Agrupador Cronológico*: Encabezados por días ("Hoy", "Ayer", "Viernes 28").
  2. *Buscador con Debounce*: Búsqueda en vivo con 250ms de debounce por texto en notas.
  3. *Filtros Combinados*: Filtro por Tipo, Cuenta, Categoría y Rango de Fechas.
  4. *Scroll Virtual*: Integración de TanStack Virtual para renderizado fluido a 60 fps con miles de filas.

---

### EP-05: Planificación y Control Financiero (Budgets & Categories)

#### FEAT-11: Taxonomía y Categorización Financiera
- **Identificador**: `FEAT-11`
- **Descripción**: Sistema de clasificación jerárquica de movimientos con iconografía moderna y personalización de color.

##### US-017: Gestión de Categorías Personalizadas con Iconos Lucide
- **Feature Perteneciente**: `FEAT-11: Taxonomía y Categorización Financiera`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario del perfil activo.
- **Narrativa**:
  - **Como**: Usuario con gastos específicos (mascotas, suscripciones, hobbies).
  - **Quiero**: Crear categorías personalizadas eligiendo su nombre, icono Lucide y color.
  - **Para**: Clasificar mis movimientos según mi estilo de vida particular.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Catálogo Visual Lucide*: Buscador visual de iconos Lucide categorizados.
  2. *Control de Dependencias*: Prohibición de eliminar categorías con transacciones asociadas (soporte para archivar).

---

#### FEAT-12: Sistema de Presupuestación y Alertas Preventivas
- **Identificador**: `FEAT-12`
- **Descripción**: Establecimiento de techos de gasto mensual por categoría y emisión de alertas visuales escalonadas.

##### US-018: Presupuestos Mensuales con Alertas Visuales al 80% y 100%
- **Feature Perteneciente**: `FEAT-12: Sistema de Presupuestación y Alertas`
- **Prioridad**: `Should Have` | **Estimación**: `5 Story Points`
- **Actores**: Usuario que controla sus límites de gasto mensual.
- **Narrativa**:
  - **Como**: Usuario que desea ahorrar.
  - **Quiero**: Definir límites mensuales por categoría y ver barras de progreso con alertas.
  - **Para**: No excederme en mis presupuestos antes de finalizar el mes.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Barra de Progreso Dinámica*: Código de color semafórico (Verde <70%, Amarillo 70-99%, Rojo >=100%).
  2. *Alertas Preventivas (Sin Badges)*: Notificación Toast y texto de advertencia en color semafórico al alcanzar el 80% y 100% del presupuesto asignado.

---

### EP-06: Inteligencia Financiera y Soberanía de Datos (Analytics & Export)

#### FEAT-13: Visualización de Datos y Análisis de Gastos
- **Identificador**: `FEAT-13`
- **Descripción**: Dashboards gráficos interactivos de egresos e ingresos consolidados en la moneda base del perfil.

##### US-019: Gráfico de Distribución de Gastos por Categoría (Dona Recharts)
- **Feature Perteneciente**: `FEAT-13: Visualización de Datos y Análisis`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario analítico.
- **Narrativa**:
  - **Como**: Usuario que desea entender en qué se va su dinero.
  - **Quiero**: Un gráfico de dona interactivo con el porcentaje de gasto por categoría en el mes seleccionado.
  - **Para**: Identificar mis mayores fugas de capital de un solo vistazo.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Gráfico Dona Responsive*: Renderizado vectorial con Recharts adaptado a la paleta del perfil.
  2. *Tooltips Interactivos*: Monto formateado y porcentaje relativo al pulsar cada sección.

##### US-020: Flujo de Caja Mensual Consolidado a 6 Meses
- **Feature Perteneciente**: `FEAT-13: Visualización de Datos y Análisis`
- **Prioridad**: `Should Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario que planifica sus finanzas.
- **Narrativa**:
  - **Como**: Usuario de Koin.
  - **Quiero**: Un gráfico de barras de los últimos 6 meses comparando Ingresos vs Gastos con el Ahorro Neto.
  - **Para**: Evaluar si mi patrimonio crece o disminuye mes a mes.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Barras Comparativas*: Barras pareadas mensuales (Ingresos vs Egresos) normalizadas en moneda base.
  2. *Indicador de Tasa de Ahorro*: Cálculo porcentual de ahorro neto mensual.

---

#### FEAT-14: Portabilidad y Respaldo Soberano de Información
- **Identificador**: `FEAT-14`
- **Descripción**: Mecanismos de exportación abierta para garantizar la propiedad total de los datos financieros.

##### US-021: Exportación a CSV y Copia de Seguridad Relacional JSON
- **Feature Perteneciente**: `FEAT-14: Portabilidad y Respaldo Soberano`
- **Prioridad**: `Could Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario que audita en Excel o respalda su información.
- **Narrativa**:
  - **Como**: Usuario precavido.
  - **Quiero**: Descargar mis transacciones en CSV y generar una copia de seguridad JSON del perfil.
  - **Para**: Disponer de mis datos en cualquier momento sin depender de la plataforma.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Generador CSV*: Archivo descargable con encabezados y montos originales y base.
  2. *Backup JSON*: Estructura relacional completa de cuentas, transacciones y categorías.

---

### EP-07: Experiencia Móvil Nativa y Hardware (Android & Capacitor)

#### FEAT-15: Interacción Táctil y Háptica de Alta Fidelidad
- **Identificador**: `FEAT-15`
- **Descripción**: Integración con el motor de vibración del hardware móvil para ofrecer respuesta táctil de grado nativo.

##### US-022: Feedback Háptico (@capacitor/haptics) en Teclado y Guardado
- **Feature Perteneciente**: `FEAT-15: Interacción Táctil y Háptica`
- **Prioridad**: `Must Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario en la app Android.
- **Narrativa**:
  - **Como**: Usuario operando la app en Android con una mano.
  - **Quiero**: Sentir vibraciones sutiles al pulsar los números y una vibración de éxito al guardar.
  - **Para**: Recibir confirmación física táctil instantánea al interactuar con el sistema.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Micro-Vibraciones Numéricas*: `Haptics.impact({ style: ImpactStyle.Light })` en cada toque del teclado.
  2. *Vibración de Éxito*: `Haptics.notification({ type: NotificationType.Success })` al confirmar una transacción.
  3. *Degradación Elegante en Web*: Detección de plataforma para evitar llamadas nulas en navegadores de escritorio.

---

#### FEAT-16: Integración Profunda con el Sistema Operativo Android
- **Identificador**: `FEAT-16`
- **Descripción**: Adaptación dinámica de las barras del sistema operativo Android al color del tema seleccionado en el perfil.

##### US-023: Sincronización Cromática de Status Bar y Navigation Bar
- **Feature Perteneciente**: `FEAT-16: Integración Profunda con Android`
- **Prioridad**: `Must Have` | **Estimación**: `2 Story Points`
- **Actores**: Usuario de teléfono Android.
- **Narrativa**:
  - **Como**: Usuario de Android.
  - **Quiero**: Que la barra de estado y la barra de navegación del sistema adopten el color del tema de mi perfil.
  - **Para**: Disfrutar de una experiencia inmersiva indistinguible de una app nativa en Kotlin.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Status Bar Coloreada*: Llamada a `@capacitor/status-bar` al cargar o conmutar de perfil.
  2. *Contraste Automático de Iconos*: Iconos del sistema claros u oscuros según la luminosidad del color seleccionado.

---

#### FEAT-17: Blindaje de Privacidad en Entorno Móvil
- **Identificador**: `FEAT-17`
- **Descripción**: Protección contra software espía, bloqueo de capturas de pantalla y auto-bloqueo por inactividad en segundo plano.

##### US-024: Protección de Pantalla con FLAG_SECURE y Bloqueo por Inactividad
- **Feature Perteneciente**: `FEAT-17: Blindaje de Privacidad en Entorno Móvil`
- **Prioridad**: `Must Have` | **Estimación**: `3 Story Points`
- **Actores**: Usuario bancario y financiero precavido.
- **Narrativa**:
  - **Como**: Usuario que consulta sus balances en lugares públicos.
  - **Quiero**: Que la app bloquee capturas de pantalla y oculte mis saldos en la vista de aplicaciones recientes.
  - **Para**: Evitar que software espía o terceros espíen mis datos financieros.
- **Funcionalidades / Features Específicas Entregadas en esta US**:
  1. *Activación de FLAG_SECURE*: Integración de `@capacitor-community/privacy-screen` bloqueando capturas y grabación de pantalla.
  2. *Cortina de Seguridad en Multitarea*: Pantalla neutral al pasar a la vista de aplicaciones recientes del sistema.
  3. *Timer de Auto-Lock*: Bloqueo del perfil activo si la app permanece en segundo plano durante más de 180 segundos.
