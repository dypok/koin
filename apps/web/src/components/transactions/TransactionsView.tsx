import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
  Calendar,
  History,
  X,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { KoinIcon } from '../../lib/icons';
import { TransactionDTO, RecurringRuleDTO } from '@koin/shared';
import { InstallmentCard } from '../recurring/InstallmentCard';
import { RecurringRuleModal } from '../recurring/RecurringRuleModal';

interface TransactionsViewProps {
  onNewTransaction: (type?: 'expense' | 'income' | 'transfer', accountId?: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onNewTransaction }) => {
  const { activeProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const {
    transactions,
    categories,
    totalCount,
    isLoading,
    fetchTransactions,
    fetchCategories,
    deleteTransaction,
  } = useTransactionStore();

  const {
    rules,
    isLoading: isLoadingRules,
    fetchRules,
    applyRuleNow,
    updateRule,
    deleteRule,
  } = useRecurringStore();

  // Main View Tabs: History vs Recurring/Debts
  const [activeMainTab, setActiveMainTab] = useState<'history' | 'recurring'>('history');

  // History Tab Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Recurring Tab State & Filters
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'income' | 'expense' | 'debt'>('all');
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringRuleDTO | null>(null);

  // Debounce search query 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    if (activeProfile?.id) {
      fetchAccounts(activeProfile.id);
      fetchCategories(activeProfile.id);
      fetchRules(activeProfile.id);
    }
  }, [activeProfile?.id, fetchAccounts, fetchCategories, fetchRules]);

  // Fetch transactions whenever filters change
  useEffect(() => {
    fetchTransactions({
      type: typeFilter === 'all' ? undefined : typeFilter,
      accountId: accountFilter === 'all' ? undefined : accountFilter,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      search: debouncedSearch || undefined,
    });
  }, [typeFilter, accountFilter, categoryFilter, debouncedSearch, fetchTransactions]);

  const profileBaseCurrency = activeProfile?.baseCurrency || 'USD';

  // Group transactions by formatted date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateKey: string]: { label: string; items: TransactionDTO[] } } = {};

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const dateKey = txDate.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        let label = '';
        if (dateKey === todayStr) {
          label = 'Hoy';
        } else if (dateKey === yesterdayStr) {
          label = 'Ayer';
        } else {
          label = txDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: txDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          });
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }
        groups[dateKey] = { label, items: [] };
      }
      groups[dateKey].items.push(tx);
    });

    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
  }, [transactions]);

  const resetFilters = () => {
    setTypeFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este movimiento? Su saldo se revertirá automáticamente.')) {
      setDeletingId(id);
      try {
        await deleteTransaction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  // Recurring Handlers
  const handleApplyRecurringNow = async (ruleId: string) => {
    try {
      await applyRuleNow(ruleId);
      if (activeProfile?.id) {
        fetchAccounts(activeProfile.id);
      }
      fetchTransactions();
    } catch (err: any) {
      alert(err.message || 'Error al aplicar movimiento');
    }
  };

  const handleToggleRecurringStatus = async (ruleId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await updateRule(ruleId, { status: newStatus as any });
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDeleteRecurringRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar compromiso');
    }
  };

  // Filtered recurring rules
  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (recurringFilter === 'income') return r.type === 'income';
      if (recurringFilter === 'expense') return r.type === 'expense' && !r.isInstallment;
      if (recurringFilter === 'debt') return r.isInstallment;
      return true;
    });
  }, [rules, recurringFilter]);

  // Aggregate metrics for recurring tab
  const totalSalaryMonthly = rules
    .filter((r) => r.type === 'income' && r.status === 'active')
    .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);

  const totalFixedExpensesMonthly = rules
    .filter((r) => r.type === 'expense' && !r.isInstallment && r.status === 'active')
    .reduce((sum, r) => sum + parseFloat(r.amount || '0'), 0);

  const totalDebtRemaining = rules
    .filter((r) => r.isInstallment && r.status === 'active')
    .reduce((sum, r) => {
      const remainingInst = Math.max(0, (r.totalInstallments || 1) - r.currentInstallment);
      return sum + parseFloat(r.amount || '0') * remainingInst;
    }, 0);

  const activeRulesCount = rules.filter((r) => r.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* 1. Main Navigation Header with Dual Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Movimientos</h1>
            <div className="flex items-center border border-border/60 bg-muted/10 p-0.5 text-xs font-semibold">
              <button
                onClick={() => setActiveMainTab('history')}
                className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                  activeMainTab === 'history'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historial</span>
                <span className="text-[10px] font-mono text-muted-foreground ml-0.5">({totalCount})</span>
              </button>

              <button
                onClick={() => setActiveMainTab('recurring')}
                className={`px-3 py-1 flex items-center gap-1.5 transition-colors ${
                  activeMainTab === 'recurring'
                    ? 'bg-background text-foreground shadow-xs font-bold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Fijos y Deudas</span>
                {activeRulesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-mono font-bold">
                    {activeRulesCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {activeMainTab === 'history'
              ? 'Historial cronológico de gastos, ingresos y transferencias'
              : 'Salario fijo mensual, gastos periódicos y amortización de deudas a cuotas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMainTab === 'history' ? (
            <button
              onClick={() => onNewTransaction('expense')}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Movimiento</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setRuleToEdit(null);
                setIsRecurringModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Programar Compromiso</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT A: HISTORIAL DE MOVIMIENTOS                                  */}
      {/* ========================================================================= */}
      {activeMainTab === 'history' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Filter and Search Bar */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search Input */}
              <div className="sm:col-span-6 relative">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nota, concepto o etiqueta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Account Filter Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={accountFilter}
                  onChange={(e) => setAccountFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border/80 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="all">Todas las cuentas</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency})
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter Dropdown */}
              <div className="sm:col-span-3">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border/80 text-foreground focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} ({cat.type === 'income' ? 'Ingreso' : 'Gasto'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Horizontal Filter Tabs (Type) */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
              <div className="flex items-center gap-1.5">
                {[
                  { key: 'all', label: 'Todos' },
                  { key: 'expense', label: 'Gastos' },
                  { key: 'income', label: 'Ingresos' },
                  { key: 'transfer', label: 'Transferencias' },
                ].map((t) => {
                  const isSelected = typeFilter === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setTypeFilter(t.key as any)}
                      className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground bg-muted/5'
                      }`}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>

              {(typeFilter !== 'all' || accountFilter !== 'all' || categoryFilter !== 'all' || searchQuery) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline flex items-center gap-1 shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span>Restablecer filtros</span>
                </button>
              )}
            </div>
          </div>

          {/* Transactions List */}
          {isLoading ? (
            <div className="p-12 text-center text-xs text-muted-foreground border border-border/40 font-mono">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Consultando libro de transacciones...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center border border-border/40 bg-muted/5 space-y-3">
              <div className="w-10 h-10 rounded-full border border-border/60 bg-muted/10 flex items-center justify-center mx-auto text-muted-foreground">
                <Filter className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">No hay movimientos que coincidan</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Ajusta los filtros o registra un nuevo movimiento financiero.
                </p>
              </div>
              <button
                onClick={() => onNewTransaction('expense')}
                className="px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors"
              >
                Registrar Movimiento
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {groupedTransactions.map(([dateKey, group]) => (
                <div key={dateKey} className="space-y-2">
                  <div className="flex items-center gap-2 px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                      {group.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono">
                      ({group.items.length})
                    </span>
                    <div className="h-px bg-border/40 flex-1 ml-2" />
                  </div>

                  <div className="border border-border/40 divide-y divide-border/30 bg-background">
                    {group.items.map((tx) => {
                      const isExpense = tx.type === 'expense';
                      const isIncome = tx.type === 'income';
                      const isTransfer = tx.type === 'transfer';
                      const isCrossCurrency = tx.currency !== profileBaseCurrency;

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/5 transition-colors group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border"
                              style={{
                                backgroundColor: isTransfer
                                  ? 'rgba(59, 130, 246, 0.12)'
                                  : isIncome
                                  ? 'rgba(16, 185, 129, 0.12)'
                                  : 'rgba(239, 68, 68, 0.12)',
                                borderColor: isTransfer
                                  ? 'rgba(59, 130, 246, 0.3)'
                                  : isIncome
                                  ? 'rgba(16, 185, 129, 0.3)'
                                  : 'rgba(239, 68, 68, 0.3)',
                                color: isTransfer
                                  ? '#3B82F6'
                                  : isIncome
                                  ? '#10B981'
                                  : '#EF4444',
                              }}
                            >
                              {isTransfer ? (
                                <ArrowLeftRight className="w-4 h-4" />
                              ) : tx.categoryIcon ? (
                                <KoinIcon name={tx.categoryIcon} className="w-4 h-4" />
                              ) : isIncome ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-foreground truncate">
                                  {isTransfer
                                    ? `Transferencia: ${tx.accountName} → ${tx.toAccountName}`
                                    : tx.categoryName || 'Sin categoría'}
                                </span>
                                {tx.isRecurring && (
                                  <span className="text-[9px] font-mono uppercase px-1 py-0.2 border border-purple-500/40 bg-purple-500/10 text-purple-400 font-bold shrink-0">
                                    {tx.installmentNumber ? `Cuota ${tx.installmentNumber}` : 'Recurrente'}
                                  </span>
                                )}
                              </div>

                              {tx.note && (
                                <p className="text-[11px] text-muted-foreground truncate max-w-md">
                                  {tx.note}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                                {!isTransfer && (
                                  <span>
                                    {tx.accountName} ({tx.currency})
                                  </span>
                                )}
                                {tx.tags && tx.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span>·</span>
                                    {tx.tags.map((tag) => (
                                      <span key={tag} className="text-muted-foreground/80">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0 text-right">
                            <div>
                              <p
                                className={`text-sm font-bold font-mono ${
                                  isExpense
                                    ? 'text-destructive'
                                    : isIncome
                                    ? 'text-primary'
                                    : 'text-foreground'
                                }`}
                              >
                                {isExpense && '-'}
                                {isIncome && '+'}
                                {tx.currency} {tx.amount}
                              </p>

                              {isCrossCurrency && tx.baseAmount && (
                                <p className="text-[10px] text-muted-foreground font-mono">
                                  ≈ {profileBaseCurrency} {tx.baseAmount}
                                </p>
                              )}
                            </div>

                            <button
                              disabled={deletingId === tx.id}
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Eliminar movimiento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT B: COMPROMISOS FIJOS Y DEUDAS A CUOTAS                       */}
      {/* ========================================================================= */}
      {activeMainTab === 'recurring' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Summary KPIs Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 border border-emerald-500/30 bg-emerald-500/5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                  Salarios e Ingresos Fijos
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <p className="text-xl font-bold font-mono text-emerald-400 mt-1">
                +${totalSalaryMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Programado por mes</p>
            </div>

            <div className="p-4 border border-blue-500/30 bg-blue-500/5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                  Gastos Fijos Mensuales
                </span>
                <TrendingDown className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <p className="text-xl font-bold font-mono text-foreground mt-1">
                -${totalFixedExpensesMonthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Arriendos, servicios, suscripciones</p>
            </div>

            <div className="p-4 border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider">
                  Deudas en Amortización
                </span>
                <CreditCard className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <p className="text-xl font-bold font-mono text-purple-400 mt-1">
                ${totalDebtRemaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">Saldo pendiente total por pagar</p>
            </div>
          </div>

          {/* Sub-filters for Recurring Rules */}
          <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
            <div className="flex items-center gap-1.5">
              {[
                { key: 'all', label: 'Todos los Compromisos' },
                { key: 'income', label: 'Salarios e Ingresos' },
                { key: 'expense', label: 'Gastos Fijos' },
                { key: 'debt', label: 'Deudas a Cuotas' },
              ].map((f) => {
                const isSelected = recurringFilter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setRecurringFilter(f.key as any)}
                    className={`px-3 py-1.5 text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground bg-muted/5'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rules List / Grid */}
          {isLoadingRules ? (
            <div className="p-12 text-center text-xs text-muted-foreground border border-border/40 font-mono">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p>Consultando compromisos programados...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="p-12 text-center border border-border/40 bg-muted/5 space-y-3">
              <div className="w-10 h-10 rounded-full border border-border/60 bg-muted/10 flex items-center justify-center mx-auto text-muted-foreground">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-foreground">No tienes compromisos en esta sección</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Programa tu salario mensual, gastos fijos periódicos o deudas a cuotas con intereses.
                </p>
              </div>
              <button
                onClick={() => {
                  setRuleToEdit(null);
                  setIsRecurringModalOpen(true);
                }}
                className="px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors"
              >
                Programar Compromiso
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRules.map((rule) => (
                <InstallmentCard
                  key={rule.id}
                  rule={rule}
                  onApplyNow={handleApplyRecurringNow}
                  onToggleStatus={handleToggleRecurringStatus}
                  onDelete={handleDeleteRecurringRule}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recurring Rule Modal */}
      <RecurringRuleModal
        isOpen={isRecurringModalOpen}
        onClose={() => {
          setIsRecurringModalOpen(false);
          setRuleToEdit(null);
        }}
        ruleToEdit={ruleToEdit}
        onSuccess={() => {
          if (activeProfile?.id) {
            fetchRules(activeProfile.id);
          }
        }}
      />
    </div>
  );
};
