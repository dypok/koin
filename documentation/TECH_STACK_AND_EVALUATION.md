# 02. Evaluación Tecnológica: Capacitor vs React Native y Stack Definitivo

## 1. Contexto del Requerimiento

El usuario solicita:
> *"Tiene que tener colores configurables y tiene que tener versión web y andrior (podemos usar capacitor o react native cual sea más rápida y mejor)."*

Para tomar la decisión correcta, evaluamos ambas tecnologías bajo cuatro criterios cuantitativos:
1. **Velocidad de Desarrollo (Developer Velocity / Time to Market)**.
2. **Facilidad de Personalización Dinámica de Colores/Temas por Perfil**.
3. **Paridad y Rendimiento 100% Compartido entre Web y Android**.
4. **Almacenamiento Local Offline-First y Ecosistema**.

---

## 2. Comparativa Técnica Exhaustiva

| Criterio | Capacitor (Vite + React + Tailwind) | React Native (Expo / Native) | Ganador para Koin |
| :--- | :--- | :--- | :---: |
| **Reutilización de Código Web/Android** | **100% idéntico**: El mismo código HTML5/CSS/TS corre en navegador y dentro del WebView de Android. | **~80-85%**: Requiere `react-native-web`. Ciertas librerías nativas tienen comportamiento dispar en web. | **Capacitor** 🏆 |
| **Motor de Temas y Colores Dinámicos** | **Trivial con CSS Variables**: Basta actualizar `--primary`, `--accent`, etc. en el DOM; todo Tailwind y componentes cambian en 1 frame sin re-renderizar. | **Complejo**: Requiere inyectar temas vía React Context, re-renderizar el árbol o usar trucos de NativeWind. | **Capacitor** 🏆 |
| **Velocidad de iteración y testing** | **Ultra rápida (< 50ms HMR)** con Vite. Se depura en Chrome DevTools estándar y se compila a APK en 1 comando (`cap sync`). | Buena con Expo Go, pero la compilación web y debugging móvil cruzado suele presentar discrepancias. | **Capacitor** 🏆 |
| **Librerías de Gráficos Financieros** | Acceso inmediato al rico ecosistema web: **Recharts, Chart.js, Tremor, Canvas**. Idénticos en web y Android. | Fragmentado: Victory Native o react-native-svg, con diferencias al exportar o renderizar en web. | **Capacitor** 🏆 |
| **Rendimiento UI y Animaciones** | Excelente (60-120 fps en WebViews Chromium modernos) si el DOM es ligero y optimizado. | Ligeramente superior en gestos nativos complejos (reanimated), pero innecesario para un dashboard financiero. | **Empate técnico** ⚖️ |
| **Capacidades Nativas en Android** | Plugins oficiales para Biometría, Notificaciones, Haptics (vibración al tocar teclas), SQLite y Status Bar. | Acceso nativo total mediante Expo Modules. | **Empate** ⚖️ |
| **Peso final de la App (APK)** | Muy ligero (~3 MB a 5 MB) ya que aprovecha el Android System WebView integrado en el sistema. | ~15 MB a 30 MB (incluye motor JS Hermes y runtime nativo). | **Capacitor** 🏆 |

---

## 3. Conclusión y Decisión Arquitectónica

### 🎯 Elección Definitiva: **Capacitor + Vite + React + TypeScript + Tailwind CSS**

**¿Por qué es la más rápida y mejor para Koin?**
1. **Velocidad de entrega ("Más rápida")**: Con Vite y React, la interfaz web está lista y funcional en tiempo récord. El despliegue a Android con `@capacitor/android` toma solo minutos sin necesidad de reescribir una sola vista.
2. **Colores configurables al instante**: La personalización de colores por perfil es nativa en CSS (`document.documentElement.style.setProperty('--color-primary', hex)`), lo que permite que el usuario elija cualquier color en una paleta o color picker y la app completa responda en tiempo real sin lag.
3. **Mantenimiento Cero Bifurcación**: Un solo repositorio, un solo set de estilos Tailwind, un solo árbol de componentes. No hay dolores de cabeza de "funciona en móvil pero falla en web".

---

## 4. Stack Tecnológico Seleccionado

### Frontend Core & UI
- **Runtime & Build Tool**: [Vite](https://vitejs.dev/) (para arranque instantáneo y HMR).
- **Framework UI**: [React 19 / 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) (estricto).
- **Estilos & Diseño**: [Tailwind CSS](https://tailwindcss.com/) + variables CSS dinámicas (soporte completo de paletas custom y Dark/Light/AMOLED).
- **Sistema de Componentes**: [Radix UI](https://www.radix-ui.com/) / [shadcn/ui](https://ui.shadcn.com/) (accesible, ligero y sin dependencias pesadas).
- **Iconografía**: [Lucide React](https://lucide.dev/) (iconos modernos y personalizables).
- **Animaciones fluidas**: [Framer Motion](https://www.framer.com/motion/) o transiciones CSS aceleradas por GPU.
- **Gráficos y Visualización**: [Recharts](https://recharts.org/) (optimizado para dashboards de ingresos vs gastos).

### Almacenamiento & Base de Datos
- **Base de Datos Principal**: **PostgreSQL (Heroku Postgres)**.
  - Justificación: Los dynos de Heroku tienen un sistema de archivos efímero (ephemeral filesystem), lo que descarta bases de datos basadas en archivos locales como SQLite en el servidor. PostgreSQL es el estándar dorado en Heroku, con transacciones ACID, integridad referencial estricta para finanzas y soporte de JSONB para paletas de colores dinámicas.
- **ORM / Query Builder**: [Drizzle ORM](https://orm.drizzle.team/) (o Prisma). Drizzle ofrece tipado estricto TypeScript de extremo a extremo, cero sobrecarga en runtime, arranques instantáneos y migraciones automáticas.
- **Capa Local/Cache Offline (Cliente Móvil/Web)**: Dexie.js (IndexedDB) para cache reactivo y cola de sincronización offline (offline-first sync queue).

### Backend & API en Heroku
- **Servidor API**: Node.js con [Fastify](https://fastify.dev/) o [Express](https://expressjs.com/) en TypeScript.
- **Arquitectura de Despliegue en Dyno**:
  - Servidor unificado: El backend expone la API RESTful bajo `/api/*` y sirve los archivos estáticos de la SPA de React (`dist/`) en la misma instancia de Heroku.
  - Ventajas: Cero problemas de CORS en Web, despliegue simple con `git push heroku main` o GitHub Actions, y uso eficiente de un solo Dyno.
- **Conexión Android (Capacitor)**: La app en Android consume la API en `https://koin-finance.herokuapp.com/api` con persistencia local/cola de sincronización para que registrar un gasto nunca falle, incluso sin internet.

### Capa Móvil Nativa (Android)
- **Runtime Nativo**: `@capacitor/core` y `@capacitor/android`.
- **Plugins Nativos**:
  - `@capacitor/status-bar`: Sincronización del color de la barra de estado de Android con el color activo del perfil.
  - `@capacitor/haptics`: Vibración sutil táctil al teclear cantidades o confirmar transacciones ("tactile feedback").
  - `@capacitor/preferences`: Almacenamiento seguro de tokens de sesión y PIN.
  - `@capacitor/keyboard`: Control inteligente del teclado numérico nativo.
  - `@capacitor/local-notifications`: Recordatorios diarios de registro de gastos.
