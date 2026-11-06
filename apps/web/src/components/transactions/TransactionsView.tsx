import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { KoinIcon } from '../../lib/icons';
import { TransactionDTO, RecurringRuleDTO } from '@koin/shared';
import { InstallmentCard } from '../recurring/InstallmentCard';
import { RecurringRuleModal } from '../recurring/RecurringRuleModal';
import { RecurringRuleDetailModal } from '../recurring/RecurringRuleDetailModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { formatMoney } from '../../lib/currency';

interface TransactionsViewProps {
  onNewTransaction: (type?: 'expense' | 'income' | 'transfer', accountId?: string) => void;
  activeMainTab?: 'history' | 'recurring';
  onTabChange?: (tab: 'history' | 'recurring') => void;
  openRecurringModalTrigger?: number;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onNewTransaction,
  activeMainTab: activeMainTabProp,
  onTabChange,
  openRecurringModalTrigger,
}) => {
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
  const [internalTab, setInternalTab] = useState<'history' | 'recurring'>('history');
  const activeMainTab = activeMainTabProp !== undefined ? activeMainTabProp : internalTab;

  const handleTabChange = (tab: 'history' | 'recurring') => {
    setInternalTab(tab);
    onTabChange?.(tab);
  };

  // History Tab Filters
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Dialog & Selection Modals State
  const [txToDelete, setTxToDelete] = useState<TransactionDTO | null>(null);
  const [isDeletingTx, setIsDeletingTx] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<RecurringRuleDTO | null>(null);
  const [isDeletingRule, setIsDeletingRule] = useState(false);
  const [selectedRuleForDetail, setSelectedRuleForDetail] = useState<RecurringRuleDTO | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Recurring Tab State & Filters
  const [recurringFilter, setRecurringFilter] = useState<'all' | 'income' | 'expense' | 'debt'>('all');
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<RecurringRuleDTO | null>(null);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Open recurring rule creation modal triggered from navbar or quick actions
  useEffect(() => {
    if (openRecurringModalTrigger && openRecurringModalTrigger > 0) {
      setRuleToEdit(null);
      setIsRecurringModalOpen(true);
    }
  }, [openRecurringModalTrigger]);

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

  // Flattened virtual rows for TanStack Virtual (headers and transactions) (TXN-05)
  interface FlatHeaderItem {
    type: 'header';
    key: string;
    label: string;
    count: number;
  }
  interface FlatTxItem {
    type: 'transaction';
    key: string;
    tx: TransactionDTO;
  }
  type FlatItem = FlatHeaderItem | FlatTxItem;

  const flatItems = useMemo<FlatItem[]>(() => {
    const list: FlatItem[] = [];
    groupedTransactions.forEach(([dateKey, group]) => {
      list.push({
        type: 'header',
        key: `header-${dateKey}`,
        label: group.label,
        count: group.items.length,
      });
      group.items.forEach((tx) => {
        list.push({
          type: 'transaction',
          key: `tx-${tx.id}`,
          tx,
        });
      });
    });
    return list;
  }, [groupedTransactions]);

  const virtualScrollRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => virtualScrollRef.current,
    estimateSize: (index) => (flatItems[index]?.type === 'header' ? 36 : 72),
    overscan: 10,
  });

  const resetFilters = () => {
    setTypeFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  // Execute Transaction Deletion from ConfirmModal
  const confirmDeleteTransaction = async () => {
    if (!txToDelete) return;
    setIsDeletingTx(true);
    try {
      await deleteTransaction(txToDelete.id);
      setToastMessage({ text: 'Movimiento eliminado y saldo revertido correctamente' });
      setTxToDelete(null);
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Error al eliminar movimiento', isError: true });
    } finally {
      setIsDeletingTx(false);
    }
  };

  // Recurring Handlers (No alerts, uses toasts & modals)
  const handleApplyRecurringNow = async (ruleId: string) => {
    try {
      const result = await applyRuleNow(ruleId);
      if (activeProfile?.id) {
        fetchAccounts(activeProfile.id);
      }
      fetchTransactions();
      setToastMessage({
        text: `Compromiso "${result.recurringRule.name}" aplicado correctamente`,
      });
      // Update selected rule details if currently open
      if (selectedRuleForDetail && selectedRuleForDetail.id === ruleId) {
        setSelectedRuleForDetail(result.recurringRule);
      }
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Error al aplicar movimiento recurrente',
        isError: true,
      });
    }
  };

  const handleToggleRecurringStatus = async (ruleId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      const updated = await updateRule(ruleId, { status: newStatus as any });
      setToastMessage({
        text: `Compromiso "${updated.name}" ${newStatus === 'paused' ? 'pausado' : 'reanudado'}`,
      });
      if (selectedRuleForDetail && selectedRuleForDetail.id === ruleId) {
        setSelectedRuleForDetail(updated);
      }
    } catch (err: any) {
      setToastMessage({
        text: err.message || 'Error al cambiar estado del compromiso',
        isError: true,
      });
    }
  };

  // Execute Recurring Rule Deletion from ConfirmModal
  const confirmDeleteRecurringRule = async () => {
    if (!ruleToDelete) return;
    setIsDeletingRule(true);
    try {
      await deleteRule(ruleToDelete.id);
      setToastMessage({ text: `Compromiso "${ruleToDelete.name}" eliminado correctamente` });
      setRuleToDelete(null);
      if (selectedRuleForDetail?.id === ruleToDelete.id) {
        setSelectedRuleForDetail(null);
      }
    } catch (err: any) {
      setToastMessage({ text: err.message || 'Error al eliminar compromiso', isError: true });
    } finally {
      setIsDeletingRule(false);
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
      {/* 1. Main Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {activeMainTab === 'history' ? 'Historial de Movimientos' : 'Compromisos, Fijos y Deudas'}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {activeMainTab === 'history'
              ? 'Historial cronológico de gastos, ingresos y transferencias'
              : 'Salario fijo mensual, gastos periódicos y amortización de deudas a cuotas'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeMainTab === 'history' ? (
            <button
              type="button"
              onClick={() => onNewTransaction('expense')}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
              title="Registrar gasto, ingreso o transferencia puntual"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Movimiento</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setRuleToEdit(null);
                setIsRecurringModalOpen(true);
              }}
              className="px-4 py-2 text-xs font-semibold border border-purple-500/50 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-colors flex items-center gap-1.5 shadow-2xs"
              title="Programar salario fijo nómina, suscripción recurrente o deuda a cuotas con amortización"
            >
              <Calendar className="w-3.5 h-3.5" />
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
            <div
              ref={virtualScrollRef}
              className="max-h-[68vh] overflow-y-auto border border-border/40 bg-background shadow-2xs divide-y divide-border/20 pr-0.5"
            >
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  width: '100%',
                  position: 'relative',
                }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const item = flatItems[virtualRow.index];
                  if (!item) return null;

                  if (item.type === 'header') {
                    return (
                      <div
                        key={item.key}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          transform: `translateY(${virtualRow.start}px)`,
                        }}
                        className="h-9 px-3 flex items-center gap-2 bg-muted/30 border-b border-border/40 z-10 select-none"
                      >
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60 font-mono">
                          ({item.count})
                        </span>
                        <div className="h-px bg-border/40 flex-1 ml-2" />
                      </div>
                    );
                  }

                  const tx = item.tx;
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const isCrossCurrency = tx.currency !== profileBaseCurrency;

                  return (
                    <div
                      key={item.key}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                      className="p-3.5 flex items-center justify-between gap-4 hover:bg-muted/5 transition-colors group border-b border-border/20 bg-background"
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
                            {formatMoney(tx.amount, tx.currency)}
                          </p>

                          {isCrossCurrency && tx.baseAmount && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              ≈ {formatMoney(tx.baseAmount, profileBaseCurrency)}
                            </p>
                          )}
                        </div>

                        <button
                          disabled={isDeletingTx && txToDelete?.id === tx.id}
                          onClick={() => setTxToDelete(tx)}
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
                +{formatMoney(totalSalaryMonthly, profileBaseCurrency)}
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
                -{formatMoney(totalFixedExpensesMonthly, profileBaseCurrency)}
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
                {formatMoney(totalDebtRemaining, profileBaseCurrency)}
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
                  onSelect={(r) => setSelectedRuleForDetail(r)}
                  onEdit={(r) => {
                    setRuleToEdit(r);
                    setIsRecurringModalOpen(true);
                  }}
                  onApplyNow={handleApplyRecurringNow}
                  onToggleStatus={handleToggleRecurringStatus}
                  onDeleteRequest={(r) => setRuleToDelete(r)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Recurring Rule Modal (Create / Edit) */}
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

      {/* Recurring Rule Detail & Action Modal (Selected Rule) */}
      <RecurringRuleDetailModal
        isOpen={!!selectedRuleForDetail}
        rule={selectedRuleForDetail}
        onClose={() => setSelectedRuleForDetail(null)}
        onEdit={(rule) => {
          setSelectedRuleForDetail(null);
          setRuleToEdit(rule);
          setIsRecurringModalOpen(true);
        }}
        onApplyNow={handleApplyRecurringNow}
        onToggleStatus={handleToggleRecurringStatus}
        onDeleteRequest={(rule) => {
          setSelectedRuleForDetail(null);
          setRuleToDelete(rule);
        }}
      />

      {/* Confirm Modal: Delete Transaction */}
      <ConfirmModal
        isOpen={!!txToDelete}
        onClose={() => setTxToDelete(null)}
        onConfirm={confirmDeleteTransaction}
        title="¿Eliminar movimiento financiero?"
        description={
          txToDelete ? (
            <div className="space-y-1.5">
              <p>
                Estás a punto de eliminar el registro de{' '}
                <strong className="text-foreground">
                  {formatMoney(txToDelete.amount, txToDelete.currency)}
                </strong>{' '}
                ({txToDelete.categoryName || (txToDelete.type === 'income' ? 'Ingreso' : 'Gasto')}).
              </p>
              <p className="text-muted-foreground/80">
                El saldo de la cuenta <strong>{txToDelete.accountName}</strong> se revertirá automáticamente.
              </p>
            </div>
          ) : null
        }
        confirmText="Eliminar Movimiento"
        cancelText="Conservar"
        variant="danger"
        isLoading={isDeletingTx}
      />

      {/* Confirm Modal: Delete Recurring Rule */}
      <ConfirmModal
        isOpen={!!ruleToDelete}
        onClose={() => setRuleToDelete(null)}
        onConfirm={confirmDeleteRecurringRule}
        title="¿Eliminar compromiso programado?"
        description={
          ruleToDelete ? (
            <div className="space-y-1.5">
              <p>
                Estás a punto de eliminar la regla{' '}
                <strong className="text-foreground">"{ruleToDelete.name}"</strong> por un importe de{' '}
                <strong className="text-foreground">
                  {formatMoney(ruleToDelete.amount, ruleToDelete.currency)}
                </strong>.
              </p>
              {ruleToDelete.isInstallment ? (
                <p className="text-purple-400 font-mono text-[11px]">
                  Esta deuda tiene{' '}
                  {Math.max(0, (ruleToDelete.totalInstallments || 1) - ruleToDelete.currentInstallment)} cuotas
                  pendientes. Las transacciones ya abonadas permanecerán en tu historial contable.
                </p>
              ) : (
                <p className="text-muted-foreground/80">
                  Ya no se generarán cobros ni notificaciones automáticas para este compromiso.
                </p>
              )}
            </div>
          ) : null
        }
        confirmText="Eliminar Regla"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingRule}
      />

      {/* Non-blocking Floating Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 border shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom duration-200 ${
            toastMessage.isError
              ? 'border-destructive/50 bg-background text-destructive'
              : 'border-emerald-500/50 bg-background text-foreground'
          }`}
        >
          {toastMessage.isError ? (
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs font-medium">{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-muted-foreground hover:text-foreground ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
