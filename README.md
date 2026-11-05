# Koin — High-Velocity Multi-Profile Personal Finance Application

<div align="center">
  <img src="apps/web/public/logo.svg" alt="Koin Logo" width="96" height="96" />
  <p><strong>Finanzas personales soberanas, ultrarrápidas y colaborativas.</strong></p>
  <p>Construido con Go (Chi), React 19, PostgreSQL 16 Multi-Schema y arquitectura monorepo de alto rendimiento.</p>
</div>

---

## 💡 ¿Qué es Koin?

**Koin** es una plataforma de gestión financiera personal diseñada para usuarios que exigen velocidad extrema (<3 segundos para registrar un gasto), soberanía de datos, soporte multidivisa real y administración colaborativa o compartida sin fricción.

Incorpora un modelo de **perfiles independientes estilo streaming** (similar a Netflix o Prime Video) bajo una misma cuenta titular, permitiendo separar finanzas personales, proyectos de negocio o fondos familiares con conmutación instantánea (<100ms), protección criptográfica por PIN individual y personalización visual dinámica.

---

## ⚡ Características Principales

### 1. 👥 Perfiles Estilo Streaming & Seguridad Criptográfica
- **Conmutador instantáneo (<100ms):** Cambio de perfil sin recargar la aplicación mediante bottom sheet y selector en barra lateral.
- **Seguridad por PIN Argon2id:** Bloqueo opcional con PIN numérico de 4 a 6 dígitos con teclado numérico en pantalla y soporte para teclado físico (Enter / Escape).
- **Protección contra fuerza bruta:** Bloqueo temporal automático de 15 minutos tras 5 intentos fallidos consecutivos (HTTP 429).
- **Motor de Temas Dinámico:** Cálculo matemático de luminancia relativa y contraste WCAG 2.1 en tiempo real para texto sobre colores primarios, presets soberanos (Oro Soberano, Titanio, Obsidiana, Esmeralda, Índigo) y modo **AMOLED Pure Black** (#000000).

### 2. 🏦 Cuentas Financieras & RBAC Colaborativo
- **Instituciones financieras populares:** Autodetección y chips de sugerencia con colores corporativos (Nu, Bancolombia, Nequi, Daviplata, BBVA, Mercado Pago, Revolut, Santander, Chase).
- **Control de Acceso Basado en Roles (RBAC):** Roles `owner`, `editor` y `viewer` por cuenta.
- **Invitaciones criptográficas firmadas:** Enlaces de invitación de un solo uso con expiración a 7 días y aceptación atómica con bloqueo de filas en PostgreSQL (`FOR UPDATE`).

### 3. 💸 Motor Multidivisa & Transacciones de Alta Velocidad
- **Registro rápido en 2 toques:** Modal ágil con selector intuitivo (Gasto, Ingreso, Transferencia) y respuesta háptica.
- **Doble registro contable:** Almacenamiento simultáneo del monto en divisa de cuenta y en divisa base del perfil (`base_amount`) con precisión `NUMERIC(14,2)` y tasas de cambio reales precargadas (`NUMERIC(18,6)`).
- **Transferencias atómicas ACID:** Conexión de cuentas con conversión de divisas, débito en origen y crédito en destino dentro de una única transacción SQL aislada.
- **Undo Toast de 5 segundos:** Notificación flotante con contador regresivo para revertir de inmediato transacciones accidentales y restaurar saldos.

### 4. 📅 Compromisos Recurrentes & Amortización de Deudas
- **Salario fijo nómina y gastos periódicos:** Registro de ingresos recurrentes y suscripciones mensuales con periodicidades configurables (mensual, quincenal, semanal, anual).
- **Motor de amortización francesa:** Cálculo en tiempo real de cuota fija, desglose de capital e intereses, y barra de progreso de cuotas.
- **Aplicación en vivo y transición de estado:** Registro manual o automático de cuotas con actualización en vivo de saldos y transición automática a `completed` al abonar la cuota final N/N.
- **Cero ventanas emergentes nativas:** Modales de confirmación personalizados de borde fino de 1px con atajos de teclado (Escape / Enter), reemplazando por completo `confirm()` o `alert()`.

### 5. 🧭 Arquitectura SPA, Navbar Retráctil & Scrollbar Personalizado
- **Enrutamiento SPA bidireccional:** Integración con HTML5 History API (`window.history.pushState` y evento `popstate`) con soporte para botones atrás/adelante y recargas F5 vía Nginx `try_files`.
- **Navbar retráctil inteligente:** Ocultamiento automático suave al desplazarse hacia abajo (`-translate-y-full`) y reaparición fluida al subir (`translate-y-0`) con efecto frosted glass (`backdrop-blur-md`).
- **Navegación unificada en Movimientos:** Erradicación de botones redundantes, centralizando la alternancia entre *Historial* y *Compromisos* exclusivamente en el dropdown del navbar superior.
- **Scrollbar minimalista a medida:** Barra de desplazamiento delgada de 6px con pista transparente y thumb sutil adaptado dinámicamente a los tokens de color claro, oscuro y AMOLED.
- **Estética Cardless 1px:** Eliminación de tarjetas elevadas y sombras artificiales en favor de divisores sutiles de 1px y 100% iconos vectoriales Lucide SVG (cero emojis en la interfaz).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
| :--- | :--- |
| **Backend** | **Go 1.24+**, Chi HTTP Router, pgxpool, Argon2id, JWT (HMAC-SHA256) |
| **Frontend** | **React 19**, TypeScript 5.7, Vite 6, Tailwind CSS 3.4, Zustand 5, Lucide SVG |
| **Base de Datos** | **PostgreSQL 16** con esquemas delimitados (`auth`, `finance`, `analytics`, `system`) |
| **Contenedores** | **Docker Compose**, Alpine Linux multi-stage builds (API: ~33MB, Web: ~75MB) |
| **Monorepo** | **Turborepo 2.11**, pnpm Workspaces |
| **Móvil** | **Capacitor 7** (Android listo con soporte `FLAG_SECURE`) |

---

## 💻 Estructura del Monorepo

```
.
├── apps/
│   ├── server/             # API REST en Go de alto rendimiento (Chi router + pgxpool)
│   │   ├── cmd/api/        # Punto de entrada principal (main.go)
│   │   └── internal/       # Módulos: auth, profiles, accounts, transactions, recurring...
│   └── web/                # SPA React 19 + Vite + Tailwind CSS + Lucide Icons
│       ├── public/         # Logo SVG oficial de 12 monedas 3D y favicon
│       └── src/            # Componentes, vistas, stores de Zustand y temas dinámicos
├── packages/
│   └── shared/             # Contratos DTO Zod, interfaces TypeScript y constantes compartidas
├── docker/                 # Scripts de inicialización PostgreSQL (01-init.sql) y Nginx config
├── documentation/          # Suite exhaustiva de documentación técnica y entregables
│   ├── done/               # Registro formal de entregables backend y frontend por HU
│   └── changelog/          # Bitácora diaria estructurada de cambios
├── docker-compose.yml      # Orquestación local multicontenedor (koin-db, koin-api, koin-web)
├── package.json            # Scripts del monorepo Turborepo
└── turbo.json              # Configuración de pipelines y caché distribuido
```

---

## 🚀 Despliegue Rápido con Docker

La forma recomendada y más rápida de ejecutar todo el ecosistema Koin en local es utilizando Docker Compose:

```bash
# 1. Clonar el repositorio
git clone https://github.com/dypok/koin.git
cd koin

# 2. Levantar toda la infraestructura (PostgreSQL 16, Go API, React Web)
docker compose up -d --build

# 3. Verificar estado de los contenedores
docker compose ps
```

Una vez levantado:
- **Frontend Web:** [http://localhost:5173](http://localhost:5173)
- **API REST Backend:** [http://localhost:3000](http://localhost:3000)
- **Base de Datos PostgreSQL:** `localhost:5432` (Usuario: `koin_user`, BD: `koin_db`)

---

## 🔧 Comandos de Desarrollo Local

Si prefieres ejecutar los servicios de forma nativa en tu máquina:

```bash
# Instalar dependencias en todo el monorepo con pnpm
pnpm install

# Iniciar servidor backend y cliente web en paralelo con Turborepo
pnpm dev

# Compilar todos los paquetes y aplicaciones (TypeScript + Vite + Go)
pnpm build

# Verificación estricta de tipos TypeScript en todo el monorepo
pnpm check-types

# Ejecutar suite de pruebas unitarias y de integración
pnpm test
```

---

## 📚 Documentación Técnica Detallada

Toda la arquitectura, decisiones de diseño, modelo de datos y entregables están organizados en [`documentation/`](documentation/):

1. **[Visión y Alcance del Proyecto](documentation/PROJECT_OVERVIEW.md)**: Objetivos, casos de uso colaborativos y métricas de velocidad (<3s).
2. **[Evaluación Tecnológica](documentation/TECH_STACK_AND_EVALUATION.md)**: Justificación del stack monorepo, Go backend, React 19 y PostgreSQL.
3. **[Arquitectura de Software](documentation/ARCHITECTURE.md)**: Jerarquía de usuarios, perfiles independientes y multi-esquema PostgreSQL.
4. **[Modelo de Datos](documentation/DATA_MODEL.md)**: DDL SQL, esquemas `auth`, `finance`, `analytics` y `system`.
5. **[Directrices de Seguridad](documentation/SECURITY_GUIDELINES.md)**: Hash Argon2id, JWT de 7 días, limitadores de tasa y RBAC.
6. **[Historias de Usuario](documentation/USER_STORIES.md)**: Catálogo de 24 Historias de Usuario organizadas en 7 épicas.
7. **[Registro de Entregables](documentation/done/)**: Bitácora de entregables completados por rama y número de tarea.

---

## 📈 Historial de Versiones

- **v0.4.2 (Actual):**
  - Scrollbar minimalista personalizado integrado a la paleta de tokens claro/oscuro/AMOLED.
  - Actualización exhaustiva del README y documentación general de la suite.
  - Preparación de pull request a rama principal `main`.
- **v0.4.1:**
  - Navbar retráctil inteligente con glassmorphism (`backdrop-blur-md`).
  - Erradicación de redundancias de navegación en Movimientos (único selector en dropdown de cabecera).
  - Eliminación de estrella en la vista de Próximamente para diseño tipográfico puro.
- **v0.4.0:**
  - Enrutamiento SPA bidireccional nativo con HTML5 History API y botones del navegador.
  - Motor de compromisos periódicos, salario nómina y amortización francesa de deudas con cálculo de cuotas e intereses.
  - Modales de confirmación personalizados (cero alertas nativas).
  - Sugerencias automáticas de instituciones bancarias y fintechs.
- **v0.3.0:**
  - Cuentas financieras con control de acceso basado en roles (RBAC).
  - Motor transaccional multidivisa con tasas de cambio del sistema.
  - Transferencias atómicas ACID entre cuentas.
  - Modal de registro rápido en 2 toques y Undo Toast de reversión de saldos.
- **v0.2.0:**
  - Migración a backend ultra-eficiente en Go con Chi Router y pgxpool (~18MB RAM).
  - Contenedorización completa con Docker Compose.
  - Logo oficial Koin con 12 monedas 3D acuñadas en Oro Soberano.
  - Perfiles estilo streaming con PIN Argon2id y conmutación en menos de 100ms.
- **v0.1.0:**
  - Configuración inicial del monorepo Turborepo.
  - Autenticación segura con Argon2id y siembra automática de usuario, perfil y categorías.

---

**Autor:** Dylan Gamero  
**Licencia:** Propietaria / Uso privado para Koin Personal Finance
