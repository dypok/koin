import React, { useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { CategoryExpenseItemDTO } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { formatMoney } from '../../lib/currency';

interface CategoryDonutChartProps {
  items: CategoryExpenseItemDTO[];
  currency: string;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({ items, currency }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const formatAmount = (val: number | string) => formatMoney(val, currency);

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

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-border/40 bg-card">
        No se registran gastos para el mes seleccionado.
      </div>
    );
  }

  return (
    <div className="border border-border/40 bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground">
          Gastos por Categoría
        </span>
        <span className="text-xs font-mono font-medium text-foreground">
          Total: {formatAmount(totalSpent)}
        </span>
      </div>

      {/* Donut Chart Vectorial Responsive */}
      <div className="h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
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
                      Monto: <span className="text-foreground font-medium">{formatAmount(data.value)}</span>
                    </div>
                    <div className="font-mono text-muted-foreground">
                      Porcentaje: <span className="text-foreground font-medium">{data.percentage}%</span>
                    </div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {data.count} mov · Promedio: {formatAmount(data.avg)}
                    </div>
                  </div>
                );
              }}
            />
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
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
                    opacity: activeIndex === null || activeIndex === index ? 1 : 0.4,
                  }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Text inside Donut */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {activeIndex !== null ? chartData[activeIndex]?.name : 'Gasto Total'}
          </span>
          <span className="text-xs font-bold font-mono text-foreground mt-0.5">
            {activeIndex !== null
              ? `${chartData[activeIndex]?.percentage}%`
              : formatAmount(totalSpent)}
          </span>
        </div>
      </div>

      {/* Flat Breakdown List below (Zero badges, subtle dividers) */}
      <div className="border-t border-border/40 divide-y divide-border/20 pt-2">
        {chartData.map((item, index) => {
          const isHovered = activeIndex === index;
          return (
            <div
              key={item.name}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className={`flex items-center justify-between py-2 px-1 transition-colors ${
                isHovered ? 'bg-muted/30' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-6 h-6 flex items-center justify-center border border-border/40 shrink-0"
                  style={{ backgroundColor: `${item.color}15`, color: item.color }}
                >
                  <KoinIcon name={item.icon || 'Tag'} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                <span className="text-muted-foreground">{item.percentage}%</span>
                <span className="font-semibold text-foreground text-right min-w-[70px]">
                  {formatAmount(item.value)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
