import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { CategoryExpenseItemDTO } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { formatMoney, formatCompactMoney } from '../../lib/currency';

interface CategoryDonutChartProps {
  items: CategoryExpenseItemDTO[];
  currency: string;
  monthPeriod?: string;
  expanded?: boolean;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  currency,
  monthPeriod,
  expanded = false,
}) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const chartData = items.map((item) => ({
    name: item.categoryName,
    value: parseFloat(item.totalSpent) || 0,
    percentage: item.percentage,
    color: item.categoryColor || '#3B82F6',
    icon: item.categoryIcon,
    count: item.transactionCount,
    avg: item.averageTicket,
  }));

  const totalSpent = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (items.length === 0 || totalSpent === 0) {
    return (
      <div className="border border-border/40 bg-card p-6 flex flex-col items-center justify-center text-center space-y-2.5 h-[340px]">
        <div className="w-10 h-10 border border-border/40 flex items-center justify-center text-muted-foreground bg-muted/20">
          <PieChartIcon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Sin gastos registrados</p>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            No se registran gastos categorizados en{' '}
            {monthPeriod ? `el periodo ${monthPeriod}` : 'este mes'}.
          </p>
        </div>
      </div>
    );
  }

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className="border border-border/40 bg-card p-4 space-y-3 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-border/40 pb-2.5">
        <div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground block">
            Gastos por Categoría
          </span>
          <span className="text-[11px] text-muted-foreground">
            {chartData.length} {chartData.length === 1 ? 'categoría activa' : 'categorías activas'}{' '}
            en {monthPeriod || 'el mes'}
          </span>
        </div>
        <div className="text-right self-start sm:self-auto font-mono text-xs">
          <span className="text-muted-foreground text-[11px]">Total: </span>
          <span className="font-semibold text-foreground">{formatMoney(totalSpent, currency)}</span>
        </div>
      </div>

      {/* Main Body: Expanded 2-Column or Stacked */}
      <div
        className={
          expanded
            ? 'grid grid-cols-1 md:grid-cols-12 gap-6 items-center'
            : 'space-y-3'
        }
      >
        {/* Donut Chart Vectorial Responsive */}
        <div
          className={`relative flex items-center justify-center ${
            expanded ? 'md:col-span-5 h-64' : 'h-52'
          }`}
        >
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border/40 p-2.5 shadow-md text-xs space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block"
                          style={{ backgroundColor: data.color }}
                        />
                        <span>{data.name}</span>
                      </div>
                      <div className="font-mono text-muted-foreground">
                        Monto:{' '}
                        <span className="text-foreground font-medium">
                          {formatMoney(data.value, currency)}
                        </span>
                      </div>
                      <div className="font-mono text-muted-foreground">
                        Porcentaje:{' '}
                        <span className="text-foreground font-medium">{data.percentage}%</span>
                      </div>
                      <div className="font-mono text-[11px] text-muted-foreground">
                        {data.count} {data.count === 1 ? 'movimiento' : 'movimientos'} · Promedio:{' '}
                        {formatMoney(data.avg, currency)}
                      </div>
                    </div>
                  );
                }}
              />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={expanded ? 65 : 55}
                outerRadius={expanded ? 95 : 78}
                paddingAngle={2}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="var(--background)"
                    strokeWidth={2}
                    className="transition-opacity duration-150 cursor-pointer"
                    style={{
                      opacity: activeIndex === null || activeIndex === index ? 1 : 0.45,
                    }}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text inside Donut Hole (Constrained to avoid slice overlap) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span
              className="text-[10px] text-muted-foreground uppercase tracking-wider truncate max-w-[100px]"
              title={activeItem ? activeItem.name : 'Gasto Total'}
            >
              {activeItem ? activeItem.name : 'Gasto Total'}
            </span>
            <span className="text-xs font-bold font-mono text-foreground mt-0.5 truncate max-w-[105px]">
              {activeItem
                ? `${activeItem.percentage}%`
                : formatCompactMoney(totalSpent, currency)}
            </span>
            {activeItem && (
              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[105px]">
                {formatCompactMoney(activeItem.value, currency)}
              </span>
            )}
          </div>
        </div>

        {/* Breakdown List (Scrollable, never overflows card) */}
        <div
          className={`${
            expanded
              ? 'md:col-span-7 max-h-64 overflow-y-auto divide-y divide-border/20 pr-1'
              : 'max-h-48 overflow-y-auto divide-y divide-border/20 pr-1'
          }`}
        >
          {chartData.map((item, index) => {
            const isHovered = activeIndex === index;
            return (
              <div
                key={item.name}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`py-2 px-1.5 transition-colors cursor-pointer space-y-1 ${
                  isHovered ? 'bg-muted/40' : 'hover:bg-muted/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className="w-5 h-5 flex items-center justify-center border border-border/40 shrink-0"
                      style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                      <KoinIcon name={item.icon || 'Tag'} className="w-3 h-3" />
                    </div>
                    <span className="font-medium text-foreground truncate">{item.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                      ({item.count})
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 font-mono text-xs">
                    <span className="text-muted-foreground text-[11px]">{item.percentage}%</span>
                    <span className="font-semibold text-foreground text-right min-w-[75px]">
                      {formatMoney(item.value, currency)}
                    </span>
                  </div>
                </div>

                {/* Subtle percentage progress indicator */}
                <div className="w-full h-1 bg-muted/40 overflow-hidden">
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
