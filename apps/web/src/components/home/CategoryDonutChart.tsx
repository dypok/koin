import React, { useState, useMemo, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, Plus } from 'lucide-react';
import { CategoryExpenseItemDTO } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { formatMoney, formatCompactMoney } from '../../lib/currency';

interface CategoryDonutChartProps {
  items: CategoryExpenseItemDTO[];
  incomeItems?: CategoryExpenseItemDTO[];
  currency: string;
  monthPeriod?: string;
  expanded?: boolean;
  onNewTransaction?: (type?: 'expense' | 'income') => void;
}

export const CategoryDonutChart: React.FC<CategoryDonutChartProps> = ({
  items,
  incomeItems = [],
  currency,
  monthPeriod,
  expanded = false,
  onNewTransaction,
}) => {
  // Determine initial tab: if expense items exist, use 'expense', otherwise if income items exist, use 'income'
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  useEffect(() => {
    if (items.length === 0 && incomeItems.length > 0) {
      setActiveTab('income');
    }
  }, [items.length, incomeItems.length]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const currentList = activeTab === 'expense' ? items : incomeItems;

  const chartData = useMemo(() => {
    return currentList.map((item) => ({
      name: item.categoryName,
      value: parseFloat(item.totalSpent) || 0,
      percentage: item.percentage,
      color: item.categoryColor || (activeTab === 'income' ? '#10B981' : '#3B82F6'),
      icon: item.categoryIcon,
      count: item.transactionCount,
      avg: item.averageTicket,
    }));
  }, [currentList, activeTab]);

  const totalAmount = useMemo(
    () => chartData.reduce((acc, curr) => acc + curr.value, 0),
    [chartData]
  );

  const activeItem = activeIndex !== null ? chartData[activeIndex] : null;

  return (
    <div className="border border-border/40 bg-card p-4 space-y-4">
      {/* Header with Title and Type Switcher (Gastos / Ingresos) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground block">
            Distribución por Categorías
          </span>
          <span className="text-[11px] text-muted-foreground">
            {chartData.length} {chartData.length === 1 ? 'categoría' : 'categorías'} en{' '}
            {monthPeriod || 'el periodo'} · Total:{' '}
            <span className="font-mono font-semibold text-foreground">
              {formatMoney(totalAmount, currency)}
            </span>
          </span>
        </div>

        {/* Tab Toggle: Gastos vs Ingresos */}
        <div className="flex items-center border border-border/40 bg-muted/20 p-0.5 text-xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab('expense');
              setActiveIndex(null);
            }}
            className={`px-2.5 py-0.5 transition-colors ${
              activeTab === 'expense'
                ? 'bg-background text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Gastos {items.length > 0 && `(${items.length})`}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('income');
              setActiveIndex(null);
            }}
            className={`px-2.5 py-0.5 transition-colors ${
              activeTab === 'income'
                ? 'bg-background text-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ingresos {incomeItems.length > 0 && `(${incomeItems.length})`}
          </button>
        </div>
      </div>

      {/* Main Body: If 0 items, show sleek empty state; otherwise show Donut + Breakdown */}
      {chartData.length === 0 || totalAmount === 0 ? (
        <div className="flex flex-col items-center justify-center text-center space-y-2.5 py-10 min-h-[220px]">
          <div className="w-10 h-10 border border-border/40 flex items-center justify-center text-muted-foreground bg-muted/20">
            <PieChartIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-foreground">
              Sin {activeTab === 'expense' ? 'gastos' : 'ingresos'} en este periodo
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs">
              No se registran movimientos de {activeTab === 'expense' ? 'gasto' : 'ingreso'}{' '}
              categorizados en {monthPeriod || 'este mes'}.
            </p>
          </div>
          {onNewTransaction && (
            <button
              type="button"
              onClick={() => onNewTransaction(activeTab)}
              className="mt-2 flex items-center gap-1.5 px-3 py-1 bg-muted/40 hover:bg-muted text-xs text-foreground font-medium border border-border/40 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar {activeTab === 'expense' ? 'gasto' : 'ingreso'}</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart Vectorial Responsive */}
          <div className="md:col-span-5 h-56 relative flex items-center justify-center">
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
                  innerRadius={58}
                  outerRadius={84}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="#09090b"
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

            {/* Center Text inside Donut Hole */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
              <span
                className="text-[10px] text-muted-foreground uppercase tracking-wider truncate max-w-[100px]"
                title={activeItem ? activeItem.name : 'Total'}
              >
                {activeItem ? activeItem.name : 'Total'}
              </span>
              <span className="text-xs font-bold font-mono text-foreground mt-0.5 truncate max-w-[105px]">
                {activeItem
                  ? `${activeItem.percentage}%`
                  : formatCompactMoney(totalAmount, currency)}
              </span>
              {activeItem && (
                <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[105px]">
                  {formatCompactMoney(activeItem.value, currency)}
                </span>
              )}
            </div>
          </div>

          {/* Breakdown List (Scrollable, 7 cols) */}
          <div className="md:col-span-7 max-h-56 overflow-y-auto divide-y divide-border/20 pr-1">
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
      )}
    </div>
  );
};
