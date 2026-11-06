import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { MonthlyCashflowItemDTO } from '@koin/shared';

interface CashflowBarChartProps {
  items: MonthlyCashflowItemDTO[];
  currency: string;
}

export const CashflowBarChart: React.FC<CashflowBarChartProps> = ({ items, currency }) => {
  const formatMoney = (val: number | string) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(isNaN(num) ? 0 : num);
  };

  const chartData = items.map((item) => ({
    period: item.monthPeriod,
    income: parseFloat(item.totalIncome) || 0,
    expense: parseFloat(item.totalExpense) || 0,
    netSavings: parseFloat(item.netSavings) || 0,
    savingsRate: item.savingsRatePercent,
  }));

  if (items.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground border border-border/40 bg-card">
        No se registran datos suficientes de flujo de caja para los últimos 6 meses.
      </div>
    );
  }

  return (
    <div className="border border-border/40 bg-card p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div>
          <span className="text-xs font-semibold tracking-tight uppercase text-muted-foreground block">
            Flujo de Caja Consolidado (6 Meses)
          </span>
          <span className="text-[11px] text-muted-foreground">
            Comparativa mensual de ingresos vs gastos en moneda base ({currency})
          </span>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="period"
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 11, fontFamily: 'monospace' }}
            />
            <YAxis
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10, fontFamily: 'monospace' }}
              tickFormatter={(val) => formatMoney(val)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="bg-popover border border-border/40 p-2.5 shadow-md text-xs space-y-1">
                    <div className="font-semibold text-foreground font-mono">{label}</div>
                    <div className="text-emerald-500 font-mono">
                      Ingresos: {formatMoney(d.income)}
                    </div>
                    <div className="text-rose-500 font-mono">
                      Gastos: {formatMoney(d.expense)}
                    </div>
                    <div className="border-t border-border/40 pt-1 text-muted-foreground font-mono">
                      Ahorro Neto:{' '}
                      <span className={d.netSavings >= 0 ? 'text-emerald-500 font-medium' : 'text-rose-500 font-medium'}>
                        {formatMoney(d.netSavings)}
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
              wrapperStyle={{ paddingBottom: '8px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-xs text-muted-foreground capitalize">
                  {value === 'income' ? 'Ingresos' : 'Gastos'}
                </span>
              )}
            />
            <Bar dataKey="income" name="income" fill="#10B981" radius={[2, 2, 0, 0]} maxBarSize={32} />
            <Bar dataKey="expense" name="expense" fill="#F43F5E" radius={[2, 2, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
