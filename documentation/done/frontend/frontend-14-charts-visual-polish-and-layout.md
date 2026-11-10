# Entregable Frontend 14: Pulido Visual y Arquitectura de Gráficos Financieros

**Fecha:** 09/11/2026  
**Versión:** v0.7.1-dev  
**Autor:** Dylan Gamero  
**Rama:** `feat/frontend-charts-visual-polish`  
**Vistas Afectadas:** `HomeDashboardView.tsx`, `CashflowBarChart.tsx`, `CategoryDonutChart.tsx`, `currency.ts`

---

## 1. Diagnóstico y Problemas Resueltos

1. **Incompatibilidad de Variables CSS en SVG de Recharts**:
   - Variables CSS como `--muted-foreground: 240 5% 65%` y `--border: 240 4% 16%` son tuplas de canales HSL diseñadas para Tailwind (`hsl(var(...))`). Al inyectarse directamente en atributos SVG (`fill="var(--muted-foreground)"` o `stroke="var(--border)"`), el motor SVG del navegador las interpretaba como valores de color inválidos, cayendo en negro por defecto e invisibilizando los números de los ejes X/Y y las líneas de cuadrícula sobre fondo negro obsidiana.
   - **Solución:** Se reemplazaron por colores hex de alto contraste `#a1a1aa` (zinc-400 para textos y números con contraste 7:1) y `#27272a` (zinc-800 para líneas de eje y rejillas punteadas `CartesianGrid`).

2. **Corte y Superposición en Gráfico de Flujo de Caja (`CashflowBarChart`)**:
   - Margen negativo recortaba etiquetas y colisionaba con la leyenda interna de Recharts flotando sobre las barras.
   - **Solución:** 
     - Generación dinámica garantizada de la secuencia continua de 6 meses (rellenando meses en 0 si no tienen movimientos) con micro-indicadores basales `minPointSize={2}` y línea de referencia horizontal en Y=0.
     - Formateador de eje X a nombres cortos estrictos de 3 letras (`Jun`, `Jul`, `Ago`, `Sep`, `Oct`, `Nov`).
     - Formateador monetario compacto `formatCompactMoney` para el eje Y (`$ 1.5M`, `$ 500k`, `$ 20k`, `$ 0`).
     - Margen limpio con `width={54}` en `YAxis` y padding `dy={6}` en `XAxis`.
     - Tooltip interactivo flotante con nombres completos (`Noviembre 2026`), cifras monetarias exactas con separadores de miles y tasa de ahorro.
     - Agregación en encabezado de ingresos y gastos totales del periodo de 6 meses (eliminando leyenda invasiva interna de Recharts).

3. **Soporte Dual de Gastos e Ingresos y Eliminación de Cajas Vacías en Dona (`CategoryDonutChart`)**:
   - Al registrar únicamente ingresos iniciales sin gastos, el gráfico de dona mostraba una caja negra vacía de 340px con "Sin gastos registrados", desbalanceando la interfaz.
   - **Solución:**
     - Soporte completo para **Gastos** e **Ingresos** con conmutador en encabezado `[ Gastos ] [ Ingresos ]`. Si no hay gastos pero sí ingresos, autoselecciona Ingresos para mostrar la distribución inmediata de la liquidez percibida.
     - Diseño de dos columnas en tarjeta completa: Dona vectorial a la izquierda con agujero central de 58px y total resumido; lista jerárquica a la derecha con porcentaje, monto y barra de progreso.
     - Si no hay movimientos en una pestaña, conserva el encabezado y ofrece botón directo `[ + Registrar gasto/ingreso ]`.

4. **Arquitectura de Disposición en Panel (`HomeDashboardView`)**:
   - Se otorgó ancho completo a las tarjetas analíticas en la columna principal (8 columnas, ~650px de ancho), permitiendo que la línea de tiempo de 6 meses y la dona con desglose respiren holgadamente sin solapamientos tipográficos ni cajas comprimidas.
   - Conmutador de modo: `Ambos` (apilado vertical de alta resolución), `Flujo de Caja` y `Categorías`.

---

## 2. Verificación Técnica

- `pnpm --filter @koin/web exec tsc --noEmit`: 0 errores en TypeScript.
- `pnpm --filter @koin/web build`: Build de producción de Vite exitoso en 6.18s.
- `docker compose up -d --build koin-web`: Contenedor web reconstruido y actualizado en `http://localhost:5173`.
- `chromium --headless`: Capturas de pantalla reales verificadas con renderizado perfecto de ejes, colores `#a1a1aa`, barras de flujo y dona de ingresos.
