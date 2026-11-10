import React, { useEffect, useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Percent,
  Plus,
  ArrowRight,
  Calendar,
  Layers,
  PieChart,
  AlertTriangle,
  ChevronRight,
  Clock,
  Landmark,
  CreditCard,
  Banknote,
  BarChart3,
} from 'lucide-react';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useBudgetStore } from '../../stores/budgetStore';
import { CategoryDonutChart } from './CategoryDonutChart';
import { CashflowBarChart } from './CashflowBarChart';
import { formatMoney } from '../../lib/currency';
import { hapticFeedback } from '../../lib/haptics';
import { KoinIcon } from '../../lib/icons';

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
  const { accounts, fetchAccounts } = useAccountStore();
  const { transactions, fetchTransactions, exchangeRates } = useTransactionStore();
  const { budgets, fetchBudgets } = useBudgetStore();

  const [recentTxFilter, setRecentTxFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [chartViewMode, setChartViewMode] = useState<'split' | 'cashflow' | 'categories'>('split');

  const baseCurrency = activeProfile?.baseCurrency || summary?.currency || 'USD';

  // Load all required data for the active profile and month
  useEffect(() => {
    if (activeProfile?.id) {
      fetchSummary(activeProfile.id, selectedMonth);
      fetchCategoryExpenses(selectedMonth, activeProfile.id);
      fetchCashflow(6, activeProfile.id);
      fetchAccounts(activeProfile.id);
      fetchTransactions({ limit: 8 }, activeProfile.id);
      fetchBudgets(activeProfile.id, selectedMonth);
    }
  }, [activeProfile?.id, selectedMonth]);

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val) {
      setSelectedMonth(val);
      if (activeProfile?.id) {
        fetchSummary(activeProfile.id, val);
        fetchCategoryExpenses(val, activeProfile.id);
        fetchBudgets(activeProfile.id, val);
      }
    }
  };

  // Filtered recent transactions for dashboard preview
  const filteredRecentTransactions = useMemo(() => {
    if (recentTxFilter === 'all') return transactions.slice(0, 6);
    return transactions.filter((t) => t.type === recentTxFilter).slice(0, 6);
  }, [transactions, recentTxFilter]);

  // Aggregate budget stats for preview widget
  const budgetStats = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;

    budgets.forEach((b) => {
      const limit = parseFloat(b.limitAmount) || 0;
      const spent = parseFloat(b.spentAmount || '0') || 0;
      totalLimit += limit;
      totalSpent += spent;
      if (b.status === 'exceeded') exceededCount++;
      else if (b.status === 'warning') warningCount++;
    });

    const percent = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;
    const remaining = totalLimit - totalSpent;

    // Sort by most critical first: exceeded, then warning, then highest spent
    const sortedBudgets = [...budgets].sort((a, b) => {
      const pA = a.percentageUsed || 0;
      const pB = b.percentageUsed || 0;
      return pB - pA;
    });

    return {
      totalLimit,
      totalSpent,
      remaining,
      percent,
      exceededCount,
      warningCount,
      topBudgets: sortedBudgets.slice(0, 4),
    };
  }, [budgets]);

  // Aggregate category distribution for income from transactions
  const incomeCategories = useMemo(() => {
    const map = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        categoryColor: string;
        totalSpent: number;
        count: number;
      }
    >();

    transactions
      .filter((t) => t.type === 'income')
      .forEach((t) => {
        const name = t.categoryName || 'Otros Ingresos';
        const existing = map.get(name) || {
          categoryId: t.categoryId || 'income',
          categoryName: name,
          categoryIcon: t.categoryIcon || 'TrendingUp',
          categoryColor: t.categoryColor || '#10B981',
          totalSpent: 0,
          count: 0,
        };
        existing.totalSpent += parseFloat(t.baseAmount || t.amount || '0') || 0;
        existing.count += 1;
        map.set(name, existing);
      });

    const totalAll = Array.from(map.values()).reduce((acc, c) => acc + c.totalSpent, 0);

    return Array.from(map.values()).map((c) => ({
      categoryId: c.categoryId,
      categoryName: c.categoryName,
      categoryIcon: c.categoryIcon,
      categoryColor: c.categoryColor,
      monthPeriod: selectedMonth,
      transactionCount: c.count,
      totalSpent: String(c.totalSpent),
      percentage: totalAll > 0 ? Math.round((c.totalSpent / totalAll) * 100) : 0,
      averageTicket: String(c.count > 0 ? Math.round(c.totalSpent / c.count) : 0),
    }));
  }, [transactions, selectedMonth]);

  // Format date helper (Hoy, Ayer, o dd/mm)
  const formatTxDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return 'Hoy';
      if (date.toDateString() === yesterday.toDateString()) return 'Ayer';

      return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Convert account balance to base currency if different
  const getAccountBaseBalance = (acc: (typeof accounts)[0]) => {
    if (acc.currency === baseCurrency) return null;
    const directPair = `${acc.currency}_${baseCurrency}`;
    const direct = exchangeRates.find((r) => r.pair === directPair);
    if (direct && parseFloat(direct.rate) > 0) {
      const converted = parseFloat(acc.currentBalance) * parseFloat(direct.rate);
      return formatMoney(converted, baseCurrency);
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header with Month Selector & Quick Action                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Inicio y Balance Consolidado</h1>
          <p className="text-xs text-muted-foreground">
            Monitorea tu patrimonio soberano, flujo de caja y presupuestos en {baseCurrency}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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
            onClick={() => {
              hapticFeedback.light();
              onNewTransaction('expense');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Registrar Movimiento</span>
            <span className="xs:hidden">Registrar</span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 2. Top Hero & 4 KPI Metrics (Flat minimalism, zero cards)         */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Patrimonio Neto Consolidado */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Patrimonio Neto</span>
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="text-lg font-bold font-mono text-foreground">
            {isLoadingSummary ? '...' : formatMoney(summary?.netWorth, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'} en {baseCurrency}
          </p>
        </div>

        {/* Ingresos del Mes Seleccionado */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Ingresos del Mes</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold font-mono text-emerald-500">
            {isLoadingSummary ? '...' : formatMoney(summary?.monthIncome, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Percibido en el periodo {selectedMonth}
          </p>
        </div>

        {/* Gastos del Mes Seleccionado */}
        <div className="p-4 bg-card border border-border/40 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] uppercase tracking-wider font-medium">Gastos del Mes</span>
            <TrendingDown className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold font-mono text-rose-500">
            {isLoadingSummary ? '...' : formatMoney(summary?.monthExpense, baseCurrency)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Gastado en el periodo {selectedMonth}
          </p>
        </div>

        {/* Tasa de Ahorro y Retención Neta */}
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

      {/* ----------------------------------------------------------------- */}
      {/* 3. Multi-Column Workspace (Desktop-First 12-Cols / Mobile Flow)     */}
      {/* ----------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* =============================================================== */}
        {/* Columna Principal: Gráficos y Últimos Movimientos (8 cols)     */}
        {/* =============================================================== */}
        <div className="lg:col-span-8 space-y-6">
          {/* Analytics Charts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Analítica Financiera
                </span>
              </div>

              {/* View Switcher: Split / Cashflow / Categories */}
              <div className="flex items-center border border-border/40 bg-muted/20 p-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setChartViewMode('split')}
                  className={`px-2.5 py-0.5 transition-colors ${
                    chartViewMode === 'split'
                      ? 'bg-background text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ambos
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('cashflow')}
                  className={`px-2.5 py-0.5 transition-colors ${
                    chartViewMode === 'cashflow'
                      ? 'bg-background text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Flujo de Caja
                </button>
                <button
                  type="button"
                  onClick={() => setChartViewMode('categories')}
                  className={`px-2.5 py-0.5 transition-colors ${
                    chartViewMode === 'categories'
                      ? 'bg-background text-foreground font-semibold shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Categorías
                </button>
              </div>
            </div>

            {/* Dynamic Chart Container */}
            {chartViewMode === 'split' && (
              <div className="space-y-4">
                <div className="min-w-0">
                  <CashflowBarChart
                    items={cashflow}
                    currency={baseCurrency}
                    referenceMonth={selectedMonth}
                    expanded
                  />
                </div>
                <div className="min-w-0">
                  <CategoryDonutChart
                    items={categoryExpenses}
                    incomeItems={incomeCategories}
                    currency={baseCurrency}
                    monthPeriod={selectedMonth}
                    onNewTransaction={onNewTransaction}
                  />
                </div>
              </div>
            )}

            {chartViewMode === 'cashflow' && (
              <div className="min-w-0">
                <CashflowBarChart
                  items={cashflow}
                  currency={baseCurrency}
                  referenceMonth={selectedMonth}
                  expanded
                />
              </div>
            )}

            {chartViewMode === 'categories' && (
              <div className="min-w-0">
                <CategoryDonutChart
                  items={categoryExpenses}
                  incomeItems={incomeCategories}
                  currency={baseCurrency}
                  monthPeriod={selectedMonth}
                  onNewTransaction={onNewTransaction}
                  expanded
                />
              </div>
            )}
          </div>

          {/* Feed de Últimos Movimientos Recientes */}
          <div className="border border-border/40 bg-card p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/40 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Últimos Movimientos
                </span>
              </div>

              {/* Quick Filter Tabs & Link to full history */}
              <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                <div className="flex items-center border border-border/40 bg-muted/20 p-0.5 text-xs">
                  <button
                    onClick={() => setRecentTxFilter('all')}
                    className={`px-2 py-0.5 transition-colors ${
                      recentTxFilter === 'all'
                        ? 'bg-background text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setRecentTxFilter('expense')}
                    className={`px-2 py-0.5 transition-colors ${
                      recentTxFilter === 'expense'
                        ? 'bg-background text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Gastos
                  </button>
                  <button
                    onClick={() => setRecentTxFilter('income')}
                    className={`px-2 py-0.5 transition-colors ${
                      recentTxFilter === 'income'
                        ? 'bg-background text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Ingresos
                  </button>
                </div>

                <button
                  onClick={onGoToTransactions}
                  className="flex items-center gap-1 text-xs text-primary hover:underline font-medium shrink-0"
                >
                  <span>Historial</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Transaction Rows */}
            {filteredRecentTransactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <p>No se registran movimientos recientes en este filtro.</p>
                <button
                  onClick={() => onNewTransaction('expense')}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Registrar nuevo gasto o ingreso
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {filteredRecentTransactions.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <div
                      key={tx.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/15 px-1 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon */}
                        <div
                          className="w-8 h-8 border border-border/40 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${tx.categoryColor || '#3b82f6'}15`,
                            color: tx.categoryColor || '#3b82f6',
                          }}
                        >
                          <KoinIcon name={tx.categoryIcon || (isTransfer ? 'Repeat' : 'Tag')} className="w-4 h-4" />
                        </div>

                        {/* Title and metadata */}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {tx.note || tx.categoryName || (isTransfer ? 'Transferencia' : 'Movimiento')}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5 truncate">
                            <span className="font-mono text-muted-foreground/80">{formatTxDate(tx.date)}</span>
                            <span>·</span>
                            <span className="truncate">{tx.accountName || 'Cuenta'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Amount with sign and color */}
                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-semibold font-mono ${
                            isExpense
                              ? 'text-rose-500'
                              : isIncome
                              ? 'text-emerald-500'
                              : 'text-primary'
                          }`}
                        >
                          {isExpense ? '- ' : isIncome ? '+ ' : ''}
                          {formatMoney(tx.amount, tx.currency)}
                        </span>
                        {tx.currency !== baseCurrency && tx.baseAmount && (
                          <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                            ≈ {formatMoney(tx.baseAmount, baseCurrency)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* =============================================================== */}
        {/* Columna Lateral: Cuentas Financieras y Presupuestos (4 cols)   */}
        {/* =============================================================== */}
        <div className="lg:col-span-4 space-y-6">
          {/* Widget de Cuentas Financieras en Vivo */}
          <div className="border border-border/40 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Cuentas Activas ({accounts.length})
                </span>
              </div>
              <button
                onClick={onGoToAccounts}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <span>Gestionar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {accounts.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                <p>No tienes cuentas configuradas en este perfil.</p>
                <button
                  onClick={onGoToAccounts}
                  className="text-primary hover:underline font-medium"
                >
                  Crear tu primera cuenta
                </button>
              </div>
            ) : (
              <div className="divide-y divide-border/20">
                {accounts.slice(0, 5).map((acc) => {
                  const baseEq = getAccountBaseBalance(acc);
                  const isNegative = parseFloat(acc.currentBalance) < 0;

                  return (
                    <div
                      key={acc.id}
                      className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/15 px-1 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-7 h-7 border border-border/40 flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${acc.color || '#3b82f6'}15`,
                            color: acc.color || '#3b82f6',
                          }}
                        >
                          <KoinIcon name={acc.icon || 'Wallet'} className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {acc.name}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
                            {acc.type} {acc.isShared && '· Compartida'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`text-xs font-semibold font-mono ${
                            isNegative ? 'text-rose-500' : 'text-foreground'
                          }`}
                        >
                          {formatMoney(acc.currentBalance, acc.currency)}
                        </span>
                        {baseEq && (
                          <span className="block text-[10px] text-muted-foreground font-mono">
                            ≈ {baseEq}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {accounts.length > 5 && (
                  <button
                    onClick={onGoToAccounts}
                    className="w-full text-center py-2 text-[11px] text-muted-foreground hover:text-primary transition-colors font-medium block"
                  >
                    + {accounts.length - 5} cuentas adicionales
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Widget de Presupuestos de Mes en Curso */}
          <div className="border border-border/40 bg-card p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Presupuestos ({selectedMonth})
                </span>
              </div>
              <button
                onClick={onGoToBudgets}
                className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
              >
                <span>Ver Todos</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {budgets.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                <p>Aún no has fijado presupuestos para este mes.</p>
                <button
                  onClick={onGoToBudgets}
                  className="text-primary hover:underline font-medium"
                >
                  Fijar límites mensuales
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Global Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">
                      Consumo Global: {formatMoney(budgetStats.totalSpent, baseCurrency)}
                    </span>
                    <span
                      className={`font-semibold font-mono ${
                        budgetStats.percent >= 100
                          ? 'text-rose-500'
                          : budgetStats.percent >= 80
                          ? 'text-amber-500'
                          : 'text-emerald-500'
                      }`}
                    >
                      {budgetStats.percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        budgetStats.percent >= 100
                          ? 'bg-rose-500'
                          : budgetStats.percent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, budgetStats.percent)}%` }}
                    />
                  </div>
                </div>

                {/* Exceeded/Warning Alert Badge if any */}
                {(budgetStats.exceededCount > 0 || budgetStats.warningCount > 0) && (
                  <div className="p-2 border border-rose-500/20 bg-rose-500/10 text-rose-500 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {budgetStats.exceededCount > 0 && `${budgetStats.exceededCount} presupuesto(s) excedido(s). `}
                      {budgetStats.warningCount > 0 && `${budgetStats.warningCount} presupuesto(s) en alerta.`}
                    </span>
                  </div>
                )}

                {/* Top Critical Budgets List */}
                <div className="divide-y divide-border/20 pt-1">
                  {budgetStats.topBudgets.map((b) => {
                    const limit = parseFloat(b.limitAmount) || 0;
                    const spent = parseFloat(b.spentAmount || '0') || 0;
                    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
                    const remaining = limit - spent;

                    let barColor = 'bg-emerald-500';
                    let textColor = 'text-emerald-500';

                    if (percent >= 100) {
                      barColor = 'bg-rose-500';
                      textColor = 'text-rose-500';
                    } else if (percent >= (b.alertThresholdPercent || 70)) {
                      barColor = 'bg-amber-500';
                      textColor = 'text-amber-500';
                    }

                    return (
                      <div key={b.id} className="py-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: b.categoryColor || '#3b82f6' }}
                            />
                            <span className="font-medium text-foreground truncate max-w-[120px]">
                              {b.categoryName}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-right">
                            <span className={`font-semibold ${textColor}`}>{percent}%</span>
                            <span className="text-muted-foreground"> ({formatMoney(remaining, baseCurrency)} rest.)</span>
                          </div>
                        </div>

                        {/* Thin 4px Progress Bar */}
                        <div className="w-full h-1 bg-muted/60 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${barColor}`}
                            style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
