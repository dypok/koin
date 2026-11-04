# Koin - Fast Multi-Profile Personal Finance App

Koin es una aplicación de finanzas personales ultrarrápida estructurada como un **Monorepo con Turborepo**, desplegada en **Heroku** con base de datos **Heroku Postgres**. Diseñada con cuentas titulares, soporte para múltiples perfiles independientes estilo streaming (con colores configurables y PIN opcional), cuentas financieras compartidas con roles de colaboración (`owner`, `editor`, `viewer`) y un motor multidivisa integral.

## 🚀 Documentación del Proyecto

Toda la arquitectura, decisiones de diseño, modelo de datos y planificación están documentadas en el directorio [`documentation/`](file:///home/dypok/Projects/Koin/documentation):

1. **[Visión y Alcance del Proyecto](file:///home/dypok/Projects/Koin/documentation/PROJECT_OVERVIEW.md)**: Objetivos, casos de uso colaborativos y métricas de velocidad (<3s).
2. **[Evaluación Tecnológica y Stack Definitivo](file:///home/dypok/Projects/Koin/documentation/TECH_STACK_AND_EVALUATION.md)**: Turborepo, Express.js, React + Vite, TanStack Query, Swagger y Heroku Postgres.
3. **[Arquitectura de Software y Aislamiento](file:///home/dypok/Projects/Koin/documentation/ARCHITECTURE.md)**: Arquitectura en Dyno Heroku, jerarquía User -> Profiles -> Shared Accounts y motor multidivisa.
4. **[Modelo de Datos y Esquemas](file:///home/dypok/Projects/Koin/documentation/DATA_MODEL.md)**: DDL SQL de PostgreSQL, esquemas Drizzle ORM, tablas de membresías y tasas de cambio.
5. **[Directrices y Políticas de Seguridad](file:///home/dypok/Projects/Koin/documentation/SECURITY_GUIDELINES.md)**: Seguridad en Express (Helmet, CORS, Rate Limit, HPP, Zod), hash Argon2id, RBAC y protección de pantalla en Android (`FLAG_SECURE`).
6. **[Especificación UI/UX y Sistema de Diseño](file:///home/dypok/Projects/Koin/documentation/UI_UX_SPECIFICATION.md)**: Flujos críticos (<3 segundos para registrar gasto), conmutador de perfiles estilo streaming y personalizador de color.
7. **[Historias de Usuario del Proyecto](file:///home/dypok/Projects/Koin/documentation/USER_STORIES.md)**: Especificación de las 24 Historias de Usuario (US-001 a US-024) divididas en 7 épicas con criterios Gherkin y MoSCoW.
8. **[Hoja de Ruta (Roadmap)](file:///home/dypok/Projects/Koin/documentation/ROADMAP.md)**: Fases de desarrollo detalladas con Turborepo hasta el despliegue en producción en Heroku.

## 💻 Estructura del Monorepo

```
.
├── apps/
│   ├── server/           # API REST con Express, TypeScript y Drizzle ORM
│   └── web/              # Frontend React 19 + Vite + Tailwind CSS + Capacitor
├── packages/
│   └── shared/           # Contratos DTO Zod, interfaces TypeScript y constantes compartidas
├── documentation/        # Suite completa de documentación técnica y de diseño
├── package.json          # Root npm workspaces y scripts de Turborepo
└── turbo.json            # Configuración de pipelines cacheados
```

## 🛠️ Comandos de Desarrollo

```bash
# Instalar todas las dependencias del Monorepo con pnpm
pnpm install

# Iniciar servidor y cliente web en modo desarrollo en paralelo
pnpm dev

# Compilar todos los paquetes y aplicaciones (con caché de Turborepo)
pnpm build

# Verificación estricta de tipos TypeScript en todo el proyecto
pnpm check-types

# Generar migraciones de base de datos con Drizzle Kit
pnpm db:generate

# Aplicar migraciones a la base de datos PostgreSQL
pnpm db:migrate

# Iniciar el servidor en producción (Dyno unificado)
pnpm start
```

## 🚀 Despliegue en Heroku

El proyecto está preparado para desplegarse en un **Dyno Unificado** en Heroku:
- El backend Express sirve tanto la API REST (`/api/*`), la documentación Swagger (`/api/docs`), como los archivos estáticos de la aplicación React (`apps/web/dist`).
- Las variables de entorno se configuran mediante `heroku config:set`.

---
**Fecha de inicio**: 03/11/2026  
**Autor**: Dylan Gamero
