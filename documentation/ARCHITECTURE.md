# 03. Arquitectura del Sistema y Mecanismos de Aislamiento

## 1. Visión General de la Arquitectura

Koin sigue una **Arquitectura Cliente-Servidor Híbrida (Cloud + Offline-First)** adaptada para despliegue en **Heroku** con base de datos **Heroku Postgres**, dividida en 4 capas operativas:

```mermaid
flowchart TD
    subgraph Clients ["Capa 1: Clientes (Web SPA & Android Native)"]
        WebBrowser["Navegador Web (PWA / Desktop)"]
        AndroidApp["App Android (Capacitor WebView + Native Plugins)"]
        ClientCache["Cache Local & Cola Offline (Dexie.js / IndexedDB)"]
    end

    subgraph HerokuDyno ["Capa 2: Heroku Dyno (Node.js API & Static Assets)"]
        StaticServer["Servidor de Estáticos (Sirve la SPA de React)"]
        APIServer["API RESTful (Fastify / Express en TypeScript)"]
        AuthGuard["Auth & Tenant Isolation Middleware (profileId Scoper)"]
    end

    subgraph DataLayer ["Capa 3: Base de Datos Relacional (Heroku Postgres)"]
        PostgresDB[(Heroku Postgres)]
        DrizzleORM["Drizzle ORM (Modelos, Migraciones, Connection Pool)"]
    end

    subgraph NativeBridge ["Capa 4: Servicios Nativos en Android"]
        CapHaptics["@capacitor/haptics"]
        CapStatusBar["@capacitor/status-bar"]
        CapBiometrics["@capacitor/biometrics"]
    end

    WebBrowser --> StaticServer
    WebBrowser --> APIServer
    AndroidApp --> APIServer
    AndroidApp --> NativeBridge
    AndroidApp <--> ClientCache
    WebBrowser <--> ClientCache

    StaticServer -.-> WebBrowser
    APIServer --> AuthGuard
    AuthGuard --> DrizzleORM
    DrizzleORM --> PostgresDB
```

---

## 2. Aislamiento Multi-Perfil (Tenant Isolation)

Para cumplir con el requisito estricto: *"lo usarán diferentes personas o sea cada perfil tiene que estar por separado"*:

### 2.1 Principios de Aislamiento
1. **Identificador Global Único (`profileId`)**: Toda entidad persistida en el sistema (`Account`, `Transaction`, `Category`, `Budget`, `RecurringRule`) contiene obligatoriamente una clave foránea `profileId`.
2. **Repositorio con Ámbito Automático (Scoped Repositories)**: Ninguna vista o componente consulta la base de datos de manera directa. Todas las consultas pasan por repositorios interceptados que inyectan automáticamente la cláusula `WHERE profileId = activeProfileId`.
3. **Imposibilidad de Cruce Accidental**:
   - Las cuentas bancarias de la Persona A jamás aparecen en el selector de cuentas de la Persona B.
   - Las categorías personalizadas de la Persona A pertenecen exclusivamente a su perfil.
   - Las estadísticas y gráficos de flujo de caja se calculan estrictamente sobre el subconjunto de transacciones del perfil activo.

### 2.2 Seguridad y Protección de Privacidad por Perfil
- Cada perfil puede configurarse con o sin seguridad:
  - **Sin PIN**: Acceso directo con un solo toque (ideal para perfiles rápidos propios, ej. Personal vs Trabajo).
  - **Con PIN numérico (4 o 6 dígitos)**: Bloqueo inmediato al conmutar hacia ese perfil.
  - **Biometría en Android**: Huella dactilar o reconocimiento facial disponible mediante Capacitor Biometrics.
- Al cambiar de perfil:
  1. Se bloquea el perfil saliente si tiene PIN activo.
  2. Si el perfil entrante requiere credenciales, se despliega la pantalla de desbloqueo ("Lock Screen").
  3. Una vez validado, se actualiza `activeProfileId` en el estado global.
  4. Se limpian de memoria los datos del perfil anterior y se cargan los registros del nuevo perfil.
  5. Se dispara el cambio de variables CSS para adaptar instantáneamente la paleta del perfil.

---

## 3. Motor Dinámico de Colores y Temas (Dynamic Theming Engine)

### 3.1 Funcionamiento Técnico
El diseño visual se rige mediante **Variables CSS HSL** inyectadas en tiempo de ejecución en el elemento raíz `<html>` o en el contenedor de la aplicación.

```css
:root {
  /* Variables dinámicas modificables en vivo */
  --primary: 158 64% 42%;        /* Color principal HSL */
  --primary-foreground: 0 0% 100%;
  --primary-hover: 158 64% 36%;
  --accent: 38 92% 50%;
  --background: 220 18% 10%;
  --surface: 220 18% 14%;
  --border: 220 14% 20%;
}
```

### 3.2 Paletas Preconfiguradas y Selector Libre (Color Picker)
Cada perfil almacena un objeto `themeConfig`:
- **Modo de Base**: `dark` (Oscuro profundo), `light` (Claro limpio), `amoled` (Negro puro `#000000` para ahorrar batería en pantallas OLED).
- **Color Primario (Hex o Preset)**:
  - 🌲 **Esmeralda / Menta**: `#10B981` (Finanzas clásicas / Crecimiento)
  - 💎 **Azul Zafiro / Índigo**: `#3B82F6` o `#6366F1` (Corporativo / Confianza)
  - 🍇 **Púrpura / Amatista**: `#8B5CF6` (Moderno / Exclusivo)
  - 🌅 **Atardecer Coral / Rosa**: `#F43F5E` o `#EC4899` (Creativo / Dinámico)
  - ⚡ **Ámbar / Neón Solar**: `#F59E0B` (Alerta / Vitalidad)
  - 🎨 **Personalizado (Hex Libre)**: El usuario puede elegir cualquier color `#RRGGBB`.
- **Cálculo Automático de Contraste**: El motor calcula automáticamente el tono óptimo de texto (`foreground`) con contraste WCAG AA/AAA para garantizar accesibilidad independientemente del color elegido.
- **Sincronización con Android**: Cuando se conmuta el tema o perfil en Android, `@capacitor/status-bar` y `@capacitor/navigation-bar` actualizan el color del sistema nativo del teléfono para una inmersión completa.

---

## 4. Estructura de Directorios del Proyecto

El código base se organiza bajo una arquitectura modular limpia y escalable:

```
Koin/
├── android/                         # Proyecto nativo Android generado por Capacitor
│   └── app/
├── documentation/                   # Documentación oficial del proyecto
│   ├── changelog/                   # Registro diario de cambios
│   ├── ARCHITECTURE.md              # Este documento
│   ├── DATA_MODEL.md                # Esquema de base de datos y tipos
│   ├── PROJECT_OVERVIEW.md          # Visión, objetivos y KPIs
│   ├── ROADMAP.md                   # Fases de desarrollo e hitos
│   ├── TECH_STACK_AND_EVALUATION.md # Justificación Capacitor vs React Native
│   └── UI_UX_SPECIFICATION.md       # Flujos de pantalla y diseño
├── server/                          # Backend API en Node.js / Fastify para Heroku
│   ├── src/
│   │   ├── config/                  # Conexión DATABASE_URL a Heroku Postgres
│   │   ├── db/                      # Esquemas Drizzle ORM y migraciones SQL
│   │   │   ├── schema.ts            # Tablas PostgreSQL (profiles, accounts, etc.)
│   │   │   └── migrations/          # Archivos de migración de Drizzle
│   │   ├── middleware/              # Scoper de perfil activo y validación de PIN
│   │   ├── routes/                  # Endpoints RESTful (/api/profiles, /api/transactions)
│   │   └── index.ts                 # Servidor Fastify + servicio de archivos estáticos
│   ├── tsconfig.json                # Configuración TypeScript del servidor
│   └── package.json                 # Dependencias del backend
├── src/                             # Frontend React + Vite (Web SPA & Capacitor)
│   ├── assets/                      # Iconos, logos y sonidos táctiles
│   ├── components/                  # Componentes reutilizables (Radix / Tailwind)
│   ├── config/                      # Paletas predefinidas y constantes
│   ├── hooks/                       # useTheme, useProfile, useSync
│   ├── services/                    # Cliente API HTTP (Axios/Ky) y Capacitor Bridge
│   ├── stores/                      # Estados Zustand (profileStore, financeStore)
│   ├── types/                       # Interfaces TypeScript compartidas
│   ├── views/                       # Vistas (Dashboard, Transactions, Accounts, etc.)
│   ├── App.tsx                      # Enrutador principal
│   ├── index.css                    # Definición de tokens Tailwind y variables CSS
│   └── main.tsx                     # Punto de entrada Vite
├── capacitor.config.ts              # Configuración oficial de Capacitor para Android
├── Procfile                         # Definición de proceso web para Heroku Dyno (`web: npm start`)
├── package.json                     # Monorepo / Scripts raíz (build:client, build:server, start)
├── tailwind.config.js               # Configuración de Tailwind CSS con temas dinámicos
├── tsconfig.json                    # Configuración estricta de TypeScript
└── vite.config.ts                   # Configuración del bundler Vite
```
