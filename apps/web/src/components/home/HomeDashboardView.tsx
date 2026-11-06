import React, { useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useAuthStore } from '../../stores/authStore';
import { CategoryDonutChart } from './CategoryDonutChart';
import { CashflowBarChart } from './CashflowBarChart';
import { formatMoney } from '../../lib/currency';

interface HomeDashboardViewProps {
  onGoToAccounts: () => void;
  onGoToBudgets: () => void;
  onGoToTransactions: () => void;
  onNewTransaction: (type?: 'expense' | 'income') => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({
  onGoToAccounts,
  onGoToBudgets,
  onGoToTransactions,
  onNewTransaction,
}) => {
  const {
    summary,
    categoryExpenses,
    cashflow,
    selectedMonth,
    setSelectedMonth,
    fetchSummary,
    fetchCategoryExpenses,
    fetchCashflow,
    isLoadingSummary,
  } = useAnalyticsStore();

  const { activeProfile } = useAuthStore();
  const baseCurrency = activeProfile?.baseCurrency || summary?.currency || 'USD';

  useEffect(() => {
    if (activeProfile?.id) {
      fetchSummary(activeProfile.id);
      fetchCategoryExpenses(selectedMonth, activeProfile.id);
      fetchCashflow(6, activeProfile.id);
    }
  }, [activeProfile?.id, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedMonth(val);
      if (activeProfile?.id) {
        fetchCategoryExpenses(val, activeProfile.id);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header with Quick Shortcuts & Month Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Inicio y Balance Consolidado</h1>
          <p className="text-xs text-muted-foreground">
            Monitorea tu patrimonio soberano, flujo de caja y distribución de gastos en {baseCurrency}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 border border-border/40 px-2.5 py-1 bg-card">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="month"
              value={selectedMonth}
              onChange={handleMonthChange}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => onNewTransaction('expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Registrar Movimiento</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metrics (Flat minimalism, zero cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Patrimonio Neto */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Patrimonio Neto</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold font-mono text-foreground">
            {isLoadingSummary ? '...' : formatMoney(summary?.netWorth, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Suma total de cuentas activas en {baseCurrency}
          </p>
        </div>

        {/* Ingresos del Mes */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Ingresos del Mes</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-500">
            {isLoadingSummary ? '...' : formatMoney(summary?.monthIncome, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Total percibido en el periodo {selectedMonth}
          </p>
        </div>

        {/* Gastos del Mes */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Gastos del Mes</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-500">
            {isLoadingSummary ? '...' : formatMoney(summary?.monthExpense, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Total gastado en el periodo {selectedMonth}
          </p>
        </div>

        {/* Tasa de Ahorro */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Tasa de Ahorro</span>
            <Percent className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold font-mono text-foreground">
            {isLoadingSummary ? '...' : `${summary?.savingsRatePercent ?? 0}%`}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Retención neta: {formatMoney(summary?.netSavings, baseCurrency)}
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 6-Month Cashflow Chart (ANL-02) */}
        <div>
          <CashflowBarChart items={cashflow} currency={baseCurrency} />
        </div>

        {/* Category Expenses Donut Chart (ANL-01) */}
        <div>
          <CategoryDonutChart items={categoryExpenses} currency={baseCurrency} />
        </div>
      </div>

      {/* Navigation Quick Links Footer */}
      <div className="border border-border/40 bg-card p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground">
          ¿Deseas profundizar en tus partidas financieras o modificar tus límites?
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToBudgets}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <span>Ver Presupuestos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-border">|</span>
          <button
            onClick={onGoToTransactions}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <span>Historial Completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <span className="text-border">|</span>
          <button
            onClick={onGoToAccounts}
            className="flex items-center gap-1 text-primary hover:underline font-medium"
          >
            <span>Cuentas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
