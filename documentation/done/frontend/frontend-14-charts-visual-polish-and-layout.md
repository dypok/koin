# Entregable Frontend 14: Pulido Visual y Arquitectura de Gráficos Financieros

**Fecha:** 09/11/2026  
**Versión:** v0.7.1-dev  
**Autor:** Dylan Gamero  
**Rama:** `feat/frontend-charts-visual-polish`  
**Vistas Afectadas:** `HomeDashboardView.tsx`, `CashflowBarChart.tsx`, `CategoryDonutChart.tsx`, `currency.ts`

---

## 1. Diagnóstico y Problemas Resueltos

1. **Compresión de Contenedor en CSS Grid**:
   - Anteriormente los gráficos estaban encerrados en una grilla rígida `grid-cols-1 md:grid-cols-2` dentro de una columna de 8/12 sin `min-w-0`, comprimiendo cada gráfica a ~250px-300px en monitores medianos/laptops y provocando cálculo erróneo del tamaño en `ResponsiveContainer`.
   - **Solución:** Se añadió `min-w-0` a todos los contenedores y se implementó un conmutador de vista (`Dividida`, `Flujo de Caja`, `Categorías`) para permitir vistas ampliadas individuales o comparativa lado a lado con proporciones armónicas.

2. **Corte y Superposición en Gráfico de Flujo de Caja (`CashflowBarChart`)**:
   - `margin={{ left: -20 }}` recortaba las etiquetas numéricas del eje Y (ej. `$ 1.500.000 COP`).
   - El eje X mostraba textos crudos de 7 caracteres (`2026-11`) que colisionaban entre sí.
   - Si la base de datos solo tenía movimientos en el mes en curso, se renderizaba una única barra gigante aislada en lugar de una línea de tiempo continua.
   - **Solución:** 
     - Generación dinámica garantizada de la secuencia continua de 6 meses (rellenando meses en 0 si no tienen movimientos) para una cronología limpia y estable.
     - Formateador de eje X a nombres cortos de 3 letras en español con mayúscula inicial (`Jun`, `Jul`, `Ago`, `Sep`, `Oct`, `Nov`).
     - Nuevo formateador monetario compacto `formatCompactMoney` para el eje Y (`$ 1.5M`, `$ 500k`, `$ 20k`, `$ 0`).
     - Margen izquierdo positivo `left: 4` con `width={52}` en `YAxis` y cuadrícula punteada sutil (`CartesianGrid`).
     - Tooltip interactivo flotante con nombres completos (`Noviembre 2026`), cifras monetarias exactas con separadores de miles y tasa de ahorro.
     - Agregación en encabezado de ingresos y gastos totales del periodo de 6 meses.

3. **Desbordamiento de Texto y Asimetría en Gráfico de Dona (`CategoryDonutChart`)**:
   - En montos de varios millones o nombres largos de categoría, el texto interior del donut colisionaba con los segmentos de la dona.
   - La lista de categorías extendía verticalmente el componente de forma desmedida frente al gráfico de barras.
   - **Solución:**
     - Restricción de ancho máximo con truncado (`max-w-[100px] truncate`) y tooltips nativos en el agujero central del donut.
     - Formato compacto o porcentual dinámico que garantiza que nunca colisione con los arcos.
     - Contenedor con scroll vertical elegante (`max-h-48 overflow-y-auto`) con barras delgadas de progreso por categoría y sincronización bidireccional al pasar el cursor (hover).
     - Estado vacío visualmente balanceado y proporcional cuando no hay gastos en el mes seleccionado.

---

## 2. Verificación Técnica

- `pnpm --filter @koin/web exec tsc --noEmit`: 0 errores en TypeScript.
- `pnpm --filter @koin/web build`: Build de Vite completado en 5.98s sin incidencias.
- `docker compose up -d --build koin-web`: Imagen de Docker reconstruida y desplegada en `http://localhost:5173`.
- `curl -I http://localhost:5173`: HTTP 200 OK verificado.
