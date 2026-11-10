import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { BarChart2 } from 'lucide-react';
import { MonthlyCashflowItemDTO } from '@koin/shared';
import { formatMoney, formatCompactMoney } from '../../lib/currency';

interface CashflowBarChartProps {
  items: MonthlyCashflowItemDTO[];
  currency: string;
  referenceMonth?: string;
  expanded?: boolean;
}

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({
  items,
  currency,
  referenceMonth,
  expanded = false,
}) => {
  // Generate a strictly continuous 6-month array ending at referenceMonth (or current month)
  const chartData = useMemo(() => {
    let year: number;
    let month: number;

    if (referenceMonth && /^\d{4}-\d{2}$/.test(referenceMonth)) {
      const [y, m] = referenceMonth.split('-').map(Number);
      year = y;
      month = m;
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth() + 1;
    }

    // Build the 6 periods chronologically from 5 months ago to reference month
    const periods: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const yStr = d.getFullYear();
      const mStr = String(d.getMonth() + 1).padStart(2, '0');
      periods.push(`${yStr}-${mStr}`);
    }

    return periods.map((period) => {
      const found = items.find((it) => it.monthPeriod === period);
      return {
        period,
        income: found ? parseFloat(found.totalIncome) || 0 : 0,
        expense: found ? parseFloat(found.totalExpense) || 0 : 0,
        netSavings: found ? parseFloat(found.netSavings) || 0 : 0,
        savingsRate: found ? found.savingsRatePercent : 0,
      };
    });
  }, [items, referenceMonth]);

  // Aggregate totals for the 6-month window
  const totals = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;

    chartData.forEach((d) => {
      totalIncome += d.income;
      totalExpense += d.expense;
    });

    const netSavings = totalIncome - totalExpense;
    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      totalIncome,
      totalExpense,
      netSavings,
      savingsRate,
      hasActivity: totalIncome > 0 || totalExpense > 0,
    };
  }, [chartData]);

  // Format month tick for X Axis (e.g. "Jun", "Jul", "Nov")
  const formatMonthTick = (period: string) => {
    try {
      const [yearStr, monthStr] = period.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const date = new Date(y, m - 1, 1);
      const monthShort = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
      return monthShort.charAt(0).toUpperCase() + monthShort.slice(1);
    } catch {
      return period;
    }
  };

  // Format full month label for Tooltip (e.g. "Noviembre 2026")
  const formatFullMonthLabel = (period: string) => {
    try {
      const [yearStr, monthStr] = period.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const date = new Date(y, m - 1, 1);
      const monthLong = date.toLocaleDateString('es-ES', { month: 'long' });
      return `${monthLong.charAt(0).toUpperCase() + monthLong.slice(1)} ${y}`;
    } catch {
      return period;
    }
  };

  if (!totals.hasActivity) {
    return (
      <div className="border border-border/40 bg-card p-6 flex flex-col items-center justify-center text-center space-y-2.5 h-[340px]">
        <div className="w-10 h-10 border border-border/40 flex items-center justify-center text-muted-foreground bg-muted/20">
          <BarChart2 className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="space-y-1">
          <p className="text-xs font-semibold text-foreground">Sin flujo de caja registrado</p>
          <p className="text-[11px] text-muted-foreground max-w-xs">
            A medida que registres ingresos y gastos, se graficará automáticamente la comparativa
            continua de los últimos 6 meses en {currency}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border/40 bg-card p-4 space-y-3 flex flex-col justify-between">
      {/* Header with Title and 6M Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-2.5">
        <div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground block">
            Flujo de Caja (6 Meses)
          </span>
          <span className="text-[11px] text-muted-foreground">
            Comparativa mensual de ingresos vs gastos en {currency}
          </span>
        </div>

        {/* 6M Aggregates */}
        <div className="flex items-center gap-3 font-mono text-[11px] self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-2xs bg-emerald-500 shrink-0" />
            <span className="text-muted-foreground">Ing:</span>
            <span className="font-semibold text-emerald-500">
              {formatCompactMoney(totals.totalIncome, currency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-2xs bg-rose-500 shrink-0" />
            <span className="text-muted-foreground">Gas:</span>
            <span className="font-semibold text-rose-500">
              {formatCompactMoney(totals.totalExpense, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Bar Chart Vectorial Responsive */}
      <div className={expanded ? 'h-72 w-full' : 'h-60 w-full'}>
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 4, bottom: 4 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--border)"
              opacity={0.35}
            />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={formatMonthTick}
            />
            <YAxis
              width={52}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => formatCompactMoney(val, currency)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/40 p-2.5 shadow-md text-xs space-y-1">
                    <div className="font-semibold text-foreground font-mono">
                      {formatFullMonthLabel(d.period)}
                    </div>
                    <div className="text-emerald-500 font-mono">
                      Ingresos: {formatMoney(d.income, currency)}
                    </div>
                    <div className="text-rose-500 font-mono">
                      Gastos: {formatMoney(d.expense, currency)}
                    </div>
                    <div className="border-t border-border/40 pt-1 text-muted-foreground font-mono">
                      Ahorro Neto:{' '}
                      <span
                        className={
                          d.netSavings >= 0
                            ? 'text-emerald-500 font-medium'
                            : 'text-rose-500 font-medium'
                        }
                      >
                        {formatMoney(d.netSavings, currency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono">
                      Tasa de Ahorro: {d.savingsRate}%
                    </div>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="square"
              wrapperStyle={{ paddingBottom: '6px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {value === 'income' ? 'Ingresos' : 'Gastos'}
                </span>
              )}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#10B981"
              radius={[3, 3, 0, 0]}
              maxBarSize={expanded ? 36 : 24}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#F43F5E"
              radius={[3, 3, 0, 0]}
              maxBarSize={expanded ? 36 : 24}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
