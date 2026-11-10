import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
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
        savingsRate: found ? parseFloat(String(found.savingsRatePercent)) || 0 : 0,
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

  // Format month tick for X Axis (e.g. "Jun", "Jul", "Sep", "Nov" - strictly 3 chars)
  const formatMonthTick = (period: string) => {
    try {
      const [yearStr, monthStr] = period.split('-');
      const y = parseInt(yearStr, 10);
      const m = parseInt(monthStr, 10);
      const date = new Date(y, m - 1, 1);
      let monthShort = date.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
      if (monthShort.toLowerCase().startsWith('sep')) {
        monthShort = 'Sep';
      }
      return monthShort.charAt(0).toUpperCase() + monthShort.slice(1, 3);
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

  return (
    <div className="border border-border/40 bg-card p-4 space-y-4">
      {/* Header with Title and 6M Totals */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground block">
            Flujo de Caja (6 Meses)
          </span>
          <span className="text-[11px] text-muted-foreground">
            Comparativa mensual de ingresos vs gastos en {currency}
          </span>
        </div>

        {/* 6M Aggregates */}
        <div className="flex flex-wrap items-center gap-3 font-mono text-xs self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-muted-foreground text-[11px]">Ingresos:</span>
            <span className="font-semibold text-emerald-500">
              {formatCompactMoney(totals.totalIncome, currency)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span className="text-muted-foreground text-[11px]">Gastos:</span>
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
            margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#27272a"
              opacity={0.6}
            />
            <ReferenceLine y={0} stroke="#27272a" />
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={formatMonthTick}
              dy={6}
            />
            <YAxis
              width={54}
              tickLine={false}
              axisLine={{ stroke: '#27272a' }}
              tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'monospace' }}
              tickFormatter={(val) => formatCompactMoney(val, currency)}
              dx={-2}
            />
            <Tooltip
              cursor={{ fill: '#27272a', opacity: 0.2 }}
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/40 p-3 shadow-lg text-xs space-y-1.5 min-w-[180px]">
                    <div className="font-semibold text-foreground font-mono border-b border-border/30 pb-1">
                      {formatFullMonthLabel(d.period)}
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-emerald-500">Ingresos:</span>
                      <span className="font-semibold text-emerald-500">
                        {formatMoney(d.income, currency)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-rose-500">Gastos:</span>
                      <span className="font-semibold text-rose-500">
                        {formatMoney(d.expense, currency)}
                      </span>
                    </div>
                    <div className="border-t border-border/40 pt-1 flex items-center justify-between font-mono">
                      <span className="text-muted-foreground">Ahorro Neto:</span>
                      <span
                        className={
                          d.netSavings >= 0
                            ? 'text-emerald-500 font-semibold'
                            : 'text-rose-500 font-semibold'
                        }
                      >
                        {formatMoney(d.netSavings, currency)}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground font-mono flex items-center justify-between">
                      <span>Tasa de Ahorro:</span>
                      <span className="font-medium text-foreground">{d.savingsRate}%</span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#10B981"
              radius={[3, 3, 0, 0]}
              maxBarSize={expanded ? 40 : 28}
              minPointSize={2}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#F43F5E"
              radius={[3, 3, 0, 0]}
              maxBarSize={expanded ? 40 : 28}
              minPointSize={2}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
