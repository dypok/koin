# Entregable Frontend 12: Épica 6 — Presupuestos, Dashboard y Exportación

**Fecha:** 06/11/2026  
**Versión:** v0.6.0 (Beta 0.6)  
**Autor:** Dylan Gamero  
**Rama:** `feat/epic-6-complete-v0.6.0`  
**Vistas Afectadas:** `BudgetsView.tsx`, `HomeDashboardView.tsx`, `CategoryDonutChart.tsx`, `CashflowBarChart.tsx`, `CategoriesManagerView.tsx`, `IconPickerModal.tsx`, `DataExportView.tsx`, `UndoToast.tsx`, `App.tsx`

---

## 1. Resumen Ejecutivo
Se implementaron todos los componentes visuales e interactivos de la **ÉPICA 6**, reemplazando las vistas provisionales (`UnimplementedView`) en `/home` y `/budgets`:
1. **`BUD-01` — Catálogo Visual de Iconos SVG de Lucide y CRUD de Categorías**:
   - `IconPickerModal.tsx`: Selector modal con buscador de texto en vivo y catálogo completo de iconos Lucide SVG (incluyendo `Dumbbell`, `Coffee`, `Car`, `Utensils`, etc.). Cero emojis.
   - `CategoryModal.tsx` & `CategoriesManagerView.tsx`: Gestión integral de categorías de gasto e ingreso con protección ante borrado cuando existen transacciones asociadas.
   - Nueva pestaña de "Categorías" en `SettingsHub.tsx` (`/settings/categories`).
2. **`BUD-02` — Presupuestos Mensuales con Barras Delgadas de 4px y Semáforo**:
   - `BudgetsView.tsx` (`/budgets`): Filas minimalistas con categoría, montos consumidos vs límite, saldo restante y porcentaje.
   - Barra de progreso delgada de exactamente 4px (`h-1`) con código semafórico:
     - Verde (<70%): `bg-emerald-500`
     - Amarillo Ámbar (70%-99%): `bg-amber-500`
     - Rojo (>=100% excedido): `bg-rose-500`
   - Alerta preventiva en `UndoToast.tsx` al registrar un gasto que alcance o supere el umbral del 80% o 100%.
3. **`ANL-01` & `ANL-02` — Dashboard de Inicio y Gráficos Recharts**:
   - `HomeDashboardView.tsx` (`/home`): 4 KPIs superiores (Patrimonio Neto, Ingresos Mes, Gastos Mes, Tasa de Ahorro).
   - `CashflowBarChart.tsx`: Gráfico de barras pareadas mensuales a 6 meses con Recharts (Ingresos `#10B981` y Gastos `#F43F5E`) con tooltip contextual.
   - `CategoryDonutChart.tsx`: Gráfico vectorial de dona con Recharts totalmente responsive y texto central dinámico, acompañado de desglose plano con porcentajes en texto sobrio.
4. **`ANL-03` — Exportación Soberana de Datos**:
   - `DataExportView.tsx` en `SettingsHub.tsx` (`/settings/data`): Descarga por Blob de archivo CSV formateado con UTF-8 BOM y copia de seguridad relacional en JSON.

---

## 2. Verificación de Compilación y Tipado
- `pnpm --filter @koin/shared build`: Exitoso.
- `pnpm --filter @koin/web check-types`: 0 errores, 0 advertencias.
- `pnpm --filter @koin/web build`: Generado bundle de producción en 6.10s.
