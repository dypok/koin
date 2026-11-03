# 08. Especificación de Historias de Usuario (User Stories - Koin)

Este documento contiene la totalidad de las **Historias de Usuario (US)** del proyecto **Koin**, organizadas por Épicas funcionales, con criterios de aceptación detallados (formato Gherkin / Checklist), priorización MoSCoW y estimación de complejidad.

---

## 📋 Resumen de Épicas

| Épica | Nombre de la Épica | Cantidad de US | Prioridad |
| :--- | :--- | :---: | :---: |
| **EP-01** | Autenticación de Cuentas y Seguridad Base | 3 US | Must Have |
| **EP-02** | Gestión de Perfiles Independientes y Personalización Visual | 4 US | Must Have |
| **EP-03** | Cuentas Financieras y Colaboración Compartida (RBAC) | 4 US | Must Have |
| **EP-04** | Registro Ultrarrápido (<3s) y Motor Multidivisa | 5 US | Must Have |
| **EP-05** | Categorías, Presupuestos y Umbrales de Alerta | 2 US | Should Have |
| **EP-06** | Analíticas, Reportes Visuales y Exportación | 3 US | Should Have |
| **EP-07** | Experiencia Nativa en Android y Seguridad Móvil | 3 US | Must Have |

---

## EP-01: Autenticación de Cuentas y Seguridad Base

### US-001: Registro de Cuenta Titular (Sign-Up)
- **Como**: Usuario nuevo o cabeza de hogar.
- **Quiero**: Crear una cuenta titular con mi correo electrónico, nombre y contraseña.
- **Para**: Tener un espacio seguro en la nube donde administrar mis perfiles y finanzas familiares.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] **Dado** que un usuario visita `/register`, **cuando** ingresa un email válido, nombre y contraseña de al menos 8 caracteres (con números y mayúsculas), **entonces** el backend hashea la contraseña con **Argon2id** y crea el registro en PostgreSQL.
  - [ ] **Dado** un email ya registrado, **cuando** se intenta registrar nuevamente, **entonces** el sistema devuelve un error `409 Conflict` con un mensaje genérico sin filtrar detalles de usuarios existentes.
  - [ ] Al crearse la cuenta titular, se crea automáticamente un primer perfil por defecto ("Principal") con moneda USD y tema Esmeralda.
  - [ ] Se emite un JWT firmado y se redirige a la selección de perfiles.

---

### US-002: Inicio de Sesión Seguro (Sign-In) y Rate Limiting
- **Como**: Usuario registrado.
- **Quiero**: Iniciar sesión con mi email y contraseña con limitación de intentos.
- **Para**: Acceder a mis finanzas de forma segura protegiendo mis datos contra ataques de fuerza bruta.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] **Dado** que el usuario ingresa sus credenciales correctas, **cuando** envía el formulario, **entonces** recibe un JWT de sesión con expiración de 7 días y es redirigido a la pantalla de perfiles.
  - [ ] **Dado** que un atacante intenta más de 5 contraseñas erróneas en menos de 1 minuto desde la misma IP, **cuando** intenta de nuevo, **entonces** `express-rate-limit` bloquea las peticiones con código `429 Too Many Requests`.
  - [ ] La comparación del hash de contraseña se realiza con `crypto.timingSafeEqual` para prevenir ataques de canal lateral por tiempo.

---

### US-003: Cierre de Sesión y Gestión de Sesión Activa
- **Como**: Usuario autenticado.
- **Quiero**: Poder cerrar sesión en cualquier momento o revocar tokens.
- **Para**: Evitar que personas no autorizadas accedan a mi cuenta si presto mi dispositivo.
- **Prioridad**: Should Have | **Estimación**: 2 SP
- **Criterios de Aceptación**:
  - [ ] Al presionar "Cerrar Sesión", se invalidan los tokens en el cliente y se eliminan del almacenamiento seguro.
  - [ ] El backend dispone de un endpoint `/api/auth/logout` que permite registrar tokens revocados en una lista de desautorización.

---

## EP-02: Gestión de Perfiles Independientes y Personalización Visual

### US-004: Creación y Edición de Múltiples Perfiles (Estilo Streaming)
- **Como**: Usuario titular de la cuenta.
- **Quiero**: Crear perfiles independientes dentro de mi cuenta (ej. "Dylan", "María", "Freelance").
- **Para**: Que diferentes personas lleven sus finanzas separadas en la misma aplicación sin mezclar sus datos.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] **Dado** un usuario autenticado, **cuando** accede a "Crear Perfil", **entonces** puede definir: Nombre, Avatar Emoji, Paleta de Color inicial, Moneda Base y configurar si desea PIN o no.
  - [ ] Cada perfil tiene un `id` UUID único asignado en PostgreSQL.
  - [ ] Un perfil no puede ver las cuentas privadas ni las transacciones de otro perfil a menos que hayan sido explícitamente compartidas.
  - [ ] Al crear el perfil, se generan automáticamente las cuentas básicas ("Efectivo", "Banco") y categorías esenciales preconfiguradas.

---

### US-005: Conmutador Rápido de Perfiles (Profile Switcher)
- **Como**: Usuario que comparte el teléfono o maneja finanzas personales y de trabajo.
- **Quiero**: Alternar entre perfiles con un solo toque desde el encabezado o menú inferior.
- **Para**: Cambiar de contexto en menos de 1 segundo sin tener que cerrar e iniciar sesión.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Al pulsar el avatar activo en el header, se despliega un panel inferior (*Bottom Sheet*) con la lista de perfiles disponibles con su avatar y color temático.
  - [ ] Si el perfil destino **no tiene PIN**, la conmutación se completa en menos de 100 milisegundos, actualizando los datos y el tema en pantalla.
  - [ ] Si el perfil destino **tiene PIN activo**, se despliega el teclado numérico de desbloqueo antes de conceder acceso a los datos.
  - [ ] Al cambiar de perfil, TanStack Query invalida el cache previo y carga exclusivamente los datos del nuevo perfil activo.

---

### US-006: Motor de Personalización de Colores y Temas Dinámicos
- **Como**: Usuario de un perfil.
- **Quiero**: Elegir entre paletas predefinidas o seleccionar cualquier color Hexadecimal personalizado, junto con modo Claro, Oscuro o Negro AMOLED.
- **Para**: Que mi perfil tenga una identidad visual inconfundible y visualmente atractiva adaptada a mi gusto.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] **Dado** que el usuario entra a "Ajustes > Apariencia", **cuando** selecciona una paleta predefinida (Esmeralda, Índigo, Amatista, Coral, Ámbar) o ingresa un color Hex `#RRGGBB`, **entonces** la interfaz completa inyecta las variables CSS HSL en tiempo real sin requerir recarga de página.
  - [ ] El sistema calcula automáticamente el contraste del color de texto contra el fondo para asegurar cumplimiento con **WCAG AA (mínimo 4.5:1)**.
  - [ ] En Android, el color de la barra de estado del sistema operativo se sincroniza con el color seleccionado utilizando `@capacitor/status-bar`.
  - [ ] La preferencia queda guardada en el backend en la columna `theme_config JSONB` del perfil.

---

### US-007: Bloqueo de Perfil con PIN Numérico y Protección Antifuerza Bruta
- **Como**: Usuario que comparte su dispositivo con familiares o amigos.
- **Quiero**: Proteger mi perfil con un PIN numérico de 4 o 6 dígitos.
- **Para**: Que nadie pueda ver mis transacciones o balances aunque la cuenta principal esté abierta.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] El PIN se hashea en el servidor con **Argon2id**. Nunca se guarda ni se transmite en texto plano.
  - [ ] Al fallar 5 intentos consecutivos de PIN en menos de 15 minutos, el perfil se bloquea automáticamente por 15 minutos y emite código `429`.
  - [ ] La verificación del PIN en el backend se evalúa mediante `crypto.timingSafeEqual` para evitar ataques de tiempo.

---

## EP-03: Cuentas Financieras y Colaboración Compartida (RBAC)

### US-008: Creación y Gestión de Cuentas Financieras Privadas
- **Como**: Usuario en un perfil activo.
- **Quiero**: Crear cuentas bancarias, billeteras de efectivo, tarjetas de crédito o ahorros indicando su saldo inicial y divisa.
- **Para**: Llevar el control exacto de dónde tengo mi dinero.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] El usuario puede crear cuentas definiendo: Nombre, Tipo (`cash`, `bank`, `credit`, `savings`), Moneda (ej. USD, COP, EUR), Saldo inicial, Color e Icono.
  - [ ] La cuenta creada nace con `is_shared: false` y pertenece exclusivamente al perfil creador.
  - [ ] Se calcula el balance actual en tiempo real en función de las transacciones asociadas.

---

### US-009: Creación de Cuentas Compartidas e Invitación de Perfiles (RBAC)
- **Como**: Usuario que administra gastos comunes (pareja, familia, negocio).
- **Quiero**: Habilitar una cuenta como compartida e invitar a otros perfiles o usuarios asignándoles un rol (`owner`, `editor`, `viewer`).
- **Para**: Co-administrar un presupuesto conjunto de forma coordinada.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] El creador de la cuenta puede invitar:
    - A otro perfil de la misma cuenta titular (asignación directa).
    - A otro usuario externo mediante correo electrónico o enlace firmado.
  - [ ] Se genera un token de invitación firmado con HMAC-SHA256 con vencimiento de 7 días.
  - [ ] Roles implementados:
    - `owner`: Puede modificar la cuenta, administrar miembros o eliminarla.
    - `editor`: Puede registrar gastos/ingresos y ver balances.
    - `viewer`: Solo lectura (no puede crear ni editar transacciones).

---

### US-010: Aceptación y Vinculación de Cuentas Compartidas
- **Como**: Usuario invitado a una cuenta compartida.
- **Quiero**: Aceptar la invitación seleccionando en cuál de mis perfiles deseo vincular la cuenta.
- **Para**: Integrar los gastos comunes dentro de la vista de mi perfil sin mezclar mis cuentas privadas.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Al abrir el enlace de invitación, si el usuario está autenticado, elige en qué perfil desea participar.
  - [ ] El registro en `account_members` cambia de `status: 'pending'` a `status: 'accepted'`.
  - [ ] La cuenta compartida aparece inmediatamente en el listado de cuentas del perfil invitado con un distintivo visual ("Compartida con [Nombre]").

---

### US-011: Revocación de Miembros y Desvinculación de Cuentas Compartidas
- **Como**: Propietario (`owner`) de una cuenta compartida o miembro participante.
- **Quiero**: Poder expulsar a un miembro o desvincularme voluntariamente de la cuenta.
- **Para**: Mantener el control de acceso en caso de disolución del grupo o cambios en el hogar.
- **Prioridad**: Should Have | **Estimación**: 2 SP
- **Criterios de Aceptación**:
  - [ ] El `owner` puede cambiar el rol de un miembro o revocar su acceso con efecto inmediato.
  - [ ] Si un miembro es revocado, pierde el acceso a la cuenta y deja de ver sus transacciones en su próximo refresco.
  - [ ] Las transacciones registradas históricamente por el miembro revocado se conservan para no alterar los saldos contables.

---

## EP-04: Registro Ultrarrápido (<3s) y Motor Multidivisa

### US-012: Modal de Registro Ultrarrápido con Teclado Numérico Integrado
- **Como**: Usuario en movimiento que acaba de realizar una compra.
- **Quiero**: Abrir un modal de registro inmediato con teclado numérico integrado y chips de montos rápidos.
- **Para**: Ingresar el valor del gasto en menos de 2 segundos sin esperar a que cargue el teclado del sistema operativo.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] El botón central flotante (+) abre instantáneamente (<100ms) el modal de registro en la mitad inferior de la pantalla.
  - [ ] Muestra un teclado numérico táctil en pantalla de botones amplios (1-9, punto, 0, borrar).
  - [ ] Dispone de chips de adición rápida de monto (+$5, +$10, +$20, +$50) que suman al valor con un toque.
  - [ ] En Android, cada pulsación numérica produce una sutil respuesta táctil (`@capacitor/haptics`).

---

### US-013: Guardado en 2 Toques con Categorías Frecuentes
- **Como**: Usuario habitual de la app.
- **Quiero**: Que al presionar una categoría frecuente se guarde automáticamente la transacción sin requerir confirmaciones adicionales.
- **Para**: Completar el registro total del gasto en menos de 3 segundos reales.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] **Dado** que el usuario ingresó un monto mayor a cero, **cuando** pulsa directamente sobre el icono de una categoría en la cuadrícula de frecuentes, **entonces**:
    1. Se genera la transacción y se envía al backend.
    2. El modal se cierra inmediatamente con una mutación optimista de TanStack Query (<100ms).
    3. Aparece una notificación Toast no intrusiva: *"Gasto de $15.00 registrado en 🍔 Alimentación [Deshacer]"*.
  - [ ] Si el usuario pulsa "Deshacer" en menos de 5 segundos, la transacción se cancela y se elimina.

---

### US-014: Motor Multidivisa con Conversión Automática a Moneda Base
- **Como**: Usuario con cuentas en varias monedas o que viaja al extranjero.
- **Quiero**: Registrar transacciones en la divisa nativa de la cuenta y que el sistema calcule automáticamente el equivalente en la moneda base de mi perfil.
- **Para**: Conocer mi balance global consolidado sin inconsistencias matemáticas entre monedas.
- **Prioridad**: Must Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] Al seleccionar una cuenta en USD en un perfil cuya moneda base es COP, el sistema consulta la tasa de cambio vigente `USD_COP` en la tabla `exchange_rates`.
  - [ ] Se guardan en la transacción: `amount` (monto original en USD), `currency` ("USD"), `exchange_rate_to_base` (ej. 4200.50) y `base_amount` (ej. 210,025 COP) usando tipo `NUMERIC(14, 2)`.
  - [ ] El usuario puede sobreescribir manualmente la tasa de cambio si el banco le aplicó una tarifa diferente.

---

### US-015: Transferencias Entre Cuentas
- **Como**: Usuario con múltiples cuentas o fondos en efectivo y banco.
- **Quiero**: Registrar transferencias de fondos entre dos cuentas seleccionadas.
- **Para**: Mover dinero entre cuentas reflejando el débito en la cuenta origen y el crédito en la cuenta destino.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] La transacción de tipo `transfer` descuenta saldo de `accountId` e incrementa saldo en `toAccountId` dentro de una **transacción atómica ACID** en PostgreSQL (`db.transaction`).
  - [ ] Si las dos cuentas tienen divisas distintas, se solicita el monto recibido en la moneda de destino o se calcula con la tasa de conversión.

---

### US-016: Historial de Transacciones con Filtros y Búsqueda Instantánea
- **Como**: Usuario que desea auditar sus finanzas.
- **Quiero**: Visualizar el historial cronológico agrupado por días con buscador y filtros por cuenta, categoría y rango de fechas.
- **Para**: Encontrar rápidamente compras pasadas y verificar en qué gasté mi dinero.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Las transacciones se agrupan por días ("Hoy", "Ayer", "Viernes 28 de Octubre").
  - [ ] Dispone de buscador en tiempo real por texto en la nota de la transacción.
  - [ ] Filtros rápidos combinables por: Tipo (Gasto / Ingreso / Transferencia), Cuenta específica, Categoría y Mes/Año.
  - [ ] Scroll virtual o paginación infinita que asegura fluidez constante a 60 fps con miles de registros.

---

## EP-05: Categorías, Presupuestos y Umbrales de Alerta

### US-017: Gestión de Categorías Personalizadas
- **Como**: Usuario de un perfil.
- **Quiero**: Crear, editar o archivar categorías de gastos e ingresos eligiendo su nombre, color e icono de Lucide.
- **Para**: Clasificar mis movimientos según mi estilo de vida particular.
- **Prioridad**: Should Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] El usuario puede crear categorías con: Nombre, Tipo (`expense` o `income`), Icono (selector visual con catálogo de iconos Lucide) y Color.
  - [ ] Las categorías creadas por el perfil son privadas a dicho perfil.
  - [ ] No se permite eliminar una categoría si posee transacciones asociadas (se ofrece la opción de "Archivar" o reasignar movimientos).

---

### US-018: Presupuestos Mensuales por Categoría con Alertas Visuales
- **Como**: Usuario que desea controlar sus gastos y ahorrar.
- **Quiero**: Definir un límite de gasto mensual para categorías específicas (ej. $300 en Restaurantes) y recibir alertas visuales de exceso.
- **Para**: No sobrepasar mis metas financieras del mes.
- **Prioridad**: Should Have | **Estimación**: 5 SP
- **Criterios de Aceptación**:
  - [ ] El usuario define un monto límite mensual y un porcentaje de umbral de aviso (por defecto 80%).
  - [ ] La vista de presupuestos muestra una barra de progreso con código de color dinámico:
    - **Verde**: Menos del 70% del presupuesto consumido.
    - **Amarillo / Ámbar**: Entre el 70% y el 99% consumido.
    - **Rojo pulsante**: 100% o más (presupuesto excedido).
  - [ ] Al registrar un gasto que cause que el presupuesto alcance el umbral del 80% o 100%, se despliega un aviso visual inmediato.

---

## EP-06: Analíticas, Reportes Visuales y Exportación

### US-019: Gráfico de Distribución de Gastos por Categoría (Dona Recharts)
- **Como**: Usuario analítico.
- **Quiero**: Ver un gráfico interactivo de dona con el porcentaje de gasto asignado a cada categoría en el mes seleccionado.
- **Para**: Identificar de un vistazo mis mayores centros de costo y fugas de capital.
- **Prioridad**: Should Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Gráfico renderizado con **Recharts** totalmente responsivo en web y móvil.
  - [ ] Al pulsar una porción de la dona, se muestra el valor total gastado y el porcentaje relativo.
  - [ ] Los colores de las porciones respetan la paleta cromática configurada en el perfil.

---

### US-020: Flujo de Caja Mensual Consolidado (Ingresos vs Gastos)
- **Como**: Usuario que planifica sus finanzas.
- **Quiero**: Un gráfico de barras comparativo de Ingresos vs Gastos de los últimos 6 meses con el saldo neto resultante.
- **Para**: Conocer si mi patrimonio crece o disminuye mes a mes.
- **Prioridad**: Should Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Muestra barras pareadas (Verde para ingresos, Rojo/Naranja para gastos) mes a mes.
  - [ ] Muestra una tarjeta resumen con el Ahorro Neto del mes y la tasa de ahorro (`(Ingresos - Gastos) / Ingresos * 100`).
  - [ ] Todos los montos se computan en la **moneda base** del perfil activo.

---

### US-021: Exportación e Importación de Datos (JSON y CSV)
- **Como**: Usuario que valora la soberanía y respaldo de sus datos.
- **Quiero**: Exportar mis transacciones en formato CSV (compatible con Excel/Google Sheets) y respaldar mi perfil completo en JSON cifrado.
- **Para**: Hacer auditorías externas o migrar mis datos libremente.
- **Prioridad**: Could Have | **Estimación**: 2 SP
- **Criterios de Aceptación**:
  - [ ] Opción "Exportar a CSV" genera un archivo descargable con columnas: Fecha, Cuenta, Categoría, Tipo, Monto, Moneda, Tasa de Cambio, Monto Base y Nota.
  - [ ] Opción "Copia de Seguridad JSON" exporta la estructura relacional completa del perfil activo.

---

## EP-07: Experiencia Nativa en Android y Seguridad Móvil

### US-022: Feedback Táctil y Háptico en Android (`@capacitor/haptics`)
- **Como**: Usuario en la aplicación Android.
- **Quiero**: Sentir vibraciones sutiles y precisas al tocar las teclas numéricas y al confirmar un guardado.
- **Para**: Tener una sensación física táctil de confirmación ("tactile feedback") de alta calidad.
- **Prioridad**: Must Have | **Estimación**: 2 SP
- **Criterios de Aceptación**:
  - [ ] Al pulsar un botón del teclado numérico en Android, se ejecuta `Haptics.impact({ style: ImpactStyle.Light })`.
  - [ ] Al confirmar el guardado de una transacción, se ejecuta `Haptics.notification({ type: NotificationType.Success })`.
  - [ ] En navegadores web donde la API de vibración no esté soportada, la app degrada elegantemente sin emitir errores de consola.

---

### US-023: Sincronización del Sistema Android con el Tema del Perfil
- **Como**: Usuario con teléfono Android.
- **Quiero**: Que la barra de estado (*Status Bar*) y la barra de navegación del sistema coincidan con el color primario de mi perfil.
- **Para**: Disfrutar de una experiencia inmersiva nativa idéntica a una app desarrollada en Kotlin.
- **Prioridad**: Must Have | **Estimación**: 2 SP
- **Criterios de Aceptación**:
  - [ ] Al iniciar la app o conmutar de perfil, `@capacitor/status-bar` colorea la barra superior con el color de fondo o acento del perfil activo.
  - [ ] El estilo de los iconos del sistema (batería, wifi, hora) se ajusta automáticamente a iconos claros u oscuros según la luminosidad del color seleccionado.

---

### US-024: Privacidad en Android con `FLAG_SECURE` y Bloqueo por Inactividad
- **Como**: Usuario bancario y financiero precavido.
- **Quiero**: Que la app bloquee capturas de pantalla y oculte mis saldos cuando cambio de aplicación en Android.
- **Para**: Proteger mi información confidencial de miradas ajenas o software malicioso.
- **Prioridad**: Must Have | **Estimación**: 3 SP
- **Criterios de Aceptación**:
  - [ ] Se activa la bandera nativa de Android `FLAG_SECURE` (`@capacitor-community/privacy-screen`).
  - [ ] Si el usuario o una app de terceros intenta tomar una captura de pantalla, el sistema operativo muestra: *"No se puede tomar captura de pantalla debido a la política de seguridad"*.
  - [ ] En la vista de aplicaciones recientes de Android (multitarea), la pantalla de Koin se muestra en blanco o con una cortina de seguridad con el logo.
  - [ ] Si la aplicación pasa a segundo plano durante más de 3 minutos, al volver se solicita el PIN o huella dactilar.
