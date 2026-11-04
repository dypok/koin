# 05. Especificación UI/UX y Sistema de Diseño (Koin)

## 1. Directivas Visuales y Filosofía de Diseño Minimalista

Para mantener una interfaz sobria, profesional y de carga ultrarrápida, el diseño de **Koin** se rige por tres directivas visuales estrictas:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   DIRECTIVAS VISUALES OBLIGATORIAS                     │
├────────────────────────────────────────────────────────────────────────┤
│ 1. CERO EMOJIS (100% SVG ICONS):                                       │
│    Queda prohibido el uso de emojis en cualquier elemento de la UI     │
│    (avatares, categorías, cuentas, estados). Se utilizan               │
│    exclusivamente iconos SVG vectoriales limpios (Lucide Icons).       │
│                                                                        │
│ 2. CERO BADGES (ANTI-CLUTTER):                                         │
│    No se utilizan componentes <Badge> ni pastillas de color flotantes. │
│    Los estados y tipos se comunican mediante jerarquía tipográfica,   │
│    colores de texto discretos (muted-foreground) o puntos sutiles      │
│    (status dots de 4px).                                               │
│                                                                        │
│ 3. PROHIBICIÓN DE CARDS EN EXCESO (FLAT & DIVIDER DESIGN):             │
│    Se erradica el antipatrón de "cards dentro de cards" con bordes y  │
│    sombras pesadas. La interfaz utiliza líneas divisorias sutiles      │
│    (border-b border-border/40), espaciado en blanco y filas planas     │
│    (list rows), logrando un aspecto elegante y minimalista.            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Flujo Crítico 1: Registro Ultrarrápido (< 3 Segundos)

El objetivo es permitir registrar un gasto habitual en **2 toques** sin pasos intermedios innecesarios.

```mermaid
sequenceDiagram
    autonumber
    actor User as Usuario
    participant FAB as Botón (+)
    participant Modal as Teclado Rápido Inferior
    participant Store as Finance Store
    participant Haptic as Android Haptic

    User->>FAB: Toca el botón flotante (+)
    FAB->>Modal: Despliega hoja inferior con teclado numérico activo
    User->>Modal: Digita "12.50" (o pulsa chip sugerido +10 +2)
    User->>Modal: Toca la categoría [SVG: Utensils] "Alimentación"
    Modal->>Store: Guarda transacción automáticamente
    Store->>Haptic: Emite vibración háptica suave
    Store->>User: Muestra Toast plano no intrusivo ("$12.50 en Alimentación [Deshacer]")
    Modal->>User: Cierra hoja inferior instantáneamente
```

### Wireframe: Entrada Rápida (Diseño Plano y Minimalista)
```
┌──────────────────────────────────────────────────────────────┐
│  Gasto (Activo)         Ingreso         Transferencia        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│                          $ 12.50                             │
│                  Cuenta: [SVG: Wallet] Efectivo              │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│  Categorías frecuentes (1 toque para guardar)                │
│  [SVG: Utensils]     [SVG: Car]          [SVG: Home]         │
│  Alimentación        Transporte          Vivienda            │
│                                                              │
│  [SVG: Film]         [SVG: Activity]     [SVG: Plus]         │
│  Ocio                Salud               Más categorías      │
├──────────────────────────────────────────────────────────────┤
│                       TECLADO TÁCTIL                         │
│             1                 2                 3            │
│             4                 5                 6            │
│             7                 8                 9            │
│             .                 0                 ⌫            │
├──────────────────────────────────────────────────────────────┤
│  [SVG: FileText] Nota opcional                   [ GUARDAR ] │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. Flujo Crítico 2: Conmutador de Perfiles (Diseño Plano de Filas)

En lugar de tarjetas abultadas, los perfiles se muestran en un listado plano con separadores sutiles:

```
┌──────────────────────────────────────────────────────────────┐
│  Perfiles                                     [SVG: Plus]    │
├──────────────────────────────────────────────────────────────┤
│  [SVG: User]  Dylan (Personal) • Activo                      │
│               Tema Esmeralda • USD                           │
├──────────────────────────────────────────────────────────────┤
│  [SVG: Briefcase] Dylan (Freelance)                          │
│                   Tema Ámbar • USD                           │
├──────────────────────────────────────────────────────────────┤
│  [SVG: Heart] María                           [SVG: Lock]    │
│               Tema Coral • COP • Requiere PIN                │
└──────────────────────────────────────────────────────────────┘
```
*(Nota: Sin badges ni tarjetas elevadas; solo filas limpias con divisores finos y estado tipográfico sobrio).*

---

## 4. Flujo Crítico 3: Personalizador de Colores y Apariencia

Cada perfil cuenta con su propio menú de personalización dentro de **Ajustes > Apariencia**.

```
┌──────────────────────────────────────────────────────────────┐
│  ← Apariencia del Perfil: Dylan                              │
├──────────────────────────────────────────────────────────────┤
│  MODO DE PANTALLA                                            │
│  Claro            Oscuro (Activo)            AMOLED (Negro)  │
├──────────────────────────────────────────────────────────────┤
│  PALETAS RECOMENDADAS                                        │
│  (●) Esmeralda   ( ) Índigo   ( ) Amatista                   │
│  ( ) Coral       ( ) Ámbar    ( ) Zafiro                     │
├──────────────────────────────────────────────────────────────┤
│  COLOR PERSONALIZADO                                         │
│  Hex: #10B981   [ Muestra visual SVG ]                       │
├──────────────────────────────────────────────────────────────┤
│  VISTA PREVIA                                                │
│  Balance Total: $ 4,250.00                                   │
│  Contraste verificado WCAG AA (Ratio 7.2:1)                  │
├──────────────────────────────────────────────────────────────┤
│  [ GUARDAR CAMBIOS ]                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Arquitectura de Pantallas Principales (Escritorio Responsive y Minimalista)

Koin está concebida como una aplicación **Desktop-First Responsive**: aprovecha al máximo el espacio visual en monitores de escritorio y portátiles (1080p, 1440p, 4K) sin confinarse a columnas estrechas tipo móvil, adaptándose de forma fluida a tablets y teléfonos móviles.

### 5.1. Estructura para Escritorio (`md:` y `lg:`)
- **Sidebar Izquierdo Fijo (`w-64` a `w-72`)**:
  - Encabezado con isotipo vectorial (`Coins` SVG) y versión.
  - Selector plano de perfil con avatar SVG, divisa base y dropdown de conmutación rápida.
  - Navegación vertical plana (`Inicio`, `Movimientos`, `Presupuestos`, `Cuentas`, `Ajustes`) con indicador de borde activo `border-l-2 border-primary`.
  - Zona inferior con datos del titular y botón de cierre de sesión (`LogOut`).
- **Barra Superior de Escritorio**:
  - Título dinámico de la vista activa y divisa base del perfil en tipografía monospace.
  - Botón primario de acción rápida: `+ Nuevo Movimiento (<3s)`.
- **Canvas Central Multi-Columna (`max-w-7xl mx-auto grid grid-cols-12 gap-8`)**:
  - **Hero Métrico (Ancho Total)**:
    - Balance total consolidado en tipografía grande (`$ 14,820.50`).
    - Barra de 3 métricas planas con divisores de 1px (`Ingresos Mes`, `Gastos Mes`, `Ahorro Neto Proyectado`).
  - **Columna Principal (`lg:col-span-8`)**:
    - Pestañas planas de filtrado (`Todos`, `Gastos`, `Ingresos`).
    - Listado plano de transacciones con separadores `divide-y divide-border/30` e iconos vectoriales SVG Lucide.
  - **Columna Secundaria (`lg:col-span-4`)**:
    - Bloque de Cuentas Financieras con saldos actuales e iconos específicos.
    - Bloque de Presupuestos del Mes con líneas de progreso sutiles de 4px (sin tarjetas abultadas).

### 5.2. Adaptabilidad para Dispositivos Móviles (`< md`)
- El sidebar se colapsa automáticamente (`hidden md:flex`).
- Se activa la barra de navegación inferior compacta (`md:hidden`).
- El botón de acción rápida se transforma en un botón flotante circular (+) en la esquina inferior derecha.
- Las columnas de escritorio se reorganizan fluidamente en un flujo vertical apilado de una sola columna.
