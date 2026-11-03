# Koin - Fast Multi-Profile Personal Finance App

Koin es una aplicación de finanzas personales ultrarrápida, desplegada en **Heroku** con base de datos **Heroku Postgres**, diseñada con soporte nativo para múltiples perfiles independientes (ideal para parejas, familias, compañeros de piso o separación de gastos personales/freelance) y personalización visual profunda (temas y colores configurables por perfil).

## 🚀 Documentación del Proyecto

Toda la arquitectura, decisiones de diseño, modelo de datos y planificación están documentadas en el directorio [`documentation/`](file:///home/dypok/Projects/Koin/documentation):

1. **[Visión y Alcance del Proyecto](file:///home/dypok/Projects/Koin/documentation/PROJECT_OVERVIEW.md)**: Objetivos, perfiles de usuario, casos de uso y métricas de velocidad.
2. **[Evaluación Tecnológica y Stack en Heroku](file:///home/dypok/Projects/Koin/documentation/TECH_STACK_AND_EVALUATION.md)**: Comparativa técnica Capacitor vs React Native, justificación de PostgreSQL en Heroku y stack completo.
3. **[Arquitectura de Software y Aislamiento](file:///home/dypok/Projects/Koin/documentation/ARCHITECTURE.md)**: Arquitectura en Dyno Heroku (API Fastify + React SPA), aislamiento estricto de perfiles y motor dinámico de temas.
4. **[Modelo de Datos y Esquemas](file:///home/dypok/Projects/Koin/documentation/DATA_MODEL.md)**: DDL SQL de PostgreSQL, esquemas Drizzle ORM y cache local Dexie.js.
5. **[Especificación UI/UX y Sistema de Diseño](file:///home/dypok/Projects/Koin/documentation/UI_UX_SPECIFICATION.md)**: Flujos críticos (<3 segundos para registrar gasto), conmutador de perfiles, selector de color y wireframes.
6. **[Hoja de Ruta (Roadmap)](file:///home/dypok/Projects/Koin/documentation/ROADMAP.md)**: Fases de desarrollo, entregables e hitos desde el MVP hasta el despliegue en producción en Heroku.

---
**Fecha de inicio**: 03/11/2026  
**Autor**: Dylan Gamero
