import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  Search,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { BudgetDTO } from '@koin/shared';
import { useBudgetStore } from '../../stores/budgetStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAnalyticsStore } from '../../stores/analyticsStore';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { formatMoney } from '../../lib/currency';
import { hapticFeedback } from '../../lib/haptics';
import { BudgetModal } from './BudgetModal';
import { ConfirmModal } from '../common/ConfirmModal';

type BudgetFilterTab = 'all' | 'exceeded' | 'warning' | 'ok' | 'unbudgeted';

export const BudgetsView: React.FC = () => {
  const { budgets, fetchBudgets, upsertBudget, deleteBudget, isLoading, error } = useBudgetStore();
  const { categories, fetchCategories } = useTransactionStore();
  const { categoryExpenses, fetchCategoryExpenses } = useAnalyticsStore();
  const { activeProfile } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [preselectedCategoryId, setPreselectedCategoryId] = useState<string | undefined>(undefined);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetDTO | null>(null);
  const [filterTab, setFilterTab] = useState<BudgetFilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const baseCurrency = activeProfile?.baseCurrency || 'USD';

  useEffect(() => {
    if (activeProfile?.id) {
      fetchBudgets(activeProfile.id, selectedMonth);
      fetchCategories(activeProfile.id);
      fetchCategoryExpenses(selectedMonth, activeProfile.id);
    }
  }, [activeProfile?.id, selectedMonth]);

  // Aggregate totals and health breakdown
  const stats = useMemo(() => {
    let totalLimit = 0;
    let totalSpent = 0;
    let exceededCount = 0;
    let warningCount = 0;
    let okCount = 0;

    budgets.forEach((b) => {
      const limit = parseFloat(b.limitAmount) || 0;
      const spent = parseFloat(b.spentAmount || '0') || 0;
      totalLimit += limit;
      totalSpent += spent;

      if (b.status === 'exceeded') exceededCount++;
      else if (b.status === 'warning') warningCount++;
      else okCount++;
    });

    const remaining = totalLimit - totalSpent;
    const percentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    return {
      totalLimit,
      totalSpent,
      remaining,
      percentage,
      exceededCount,
      warningCount,
      okCount,
    };
  }, [budgets]);

  const existingCategoryIds = useMemo(() => budgets.map((b) => b.categoryId), [budgets]);

  // Categories that have expenses in this month but NO budget assigned
  const unbudgetedCategories = useMemo(() => {
    return categoryExpenses
      .filter((ce) => !existingCategoryIds.includes(ce.categoryId))
      .map((ce) => {
        const cat = categories.find((c) => c.id === ce.categoryId);
        return {
          categoryId: ce.categoryId,
          categoryName: ce.categoryName,
          categoryIcon: ce.categoryIcon || cat?.icon || 'Tag',
          categoryColor: ce.categoryColor || cat?.color || '#3b82f6',
          spentAmount: ce.totalSpent,
          percentage: ce.percentage,
          transactionCount: ce.transactionCount,
        };
      });
  }, [categoryExpenses, existingCategoryIds, categories]);

  // Filtered budgets list according to current tab & search query
  const filteredBudgets = useMemo(() => {
    return budgets.filter((b) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (b.categoryName || '').toLowerCase().includes(query);
        if (!matchesName) return false;
      }

      // 2. Tab Filter
      if (filterTab === 'all') return true;
      if (filterTab === 'exceeded') return b.status === 'exceeded';
      if (filterTab === 'warning') return b.status === 'warning';
      if (filterTab === 'ok') return b.status === 'on_track';
      return true;
    });
  }, [budgets, filterTab, searchQuery]);

  const handleOpenCreate = (preselectId?: string) => {
    hapticFeedback.light();
    setEditingBudget(null);
    setPreselectedCategoryId(preselectId);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetDTO) => {
    hapticFeedback.light();
    setEditingBudget(b);
    setPreselectedCategoryId(undefined);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (data: {
    categoryId: string;
    limitAmount: string;
    alertThresholdPercent: number;
    period: 'monthly';
  }) => {
    await upsertBudget(data, activeProfile?.id);
    if (activeProfile?.id) {
      await fetchBudgets(activeProfile.id, selectedMonth);
      await fetchCategoryExpenses(selectedMonth, activeProfile.id);
    }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    hapticFeedback.medium();
    await deleteBudget(budgetToDelete.id, activeProfile?.id);
    setBudgetToDelete(null);
    if (activeProfile?.id) {
      await fetchBudgets(activeProfile.id, selectedMonth);
      await fetchCategoryExpenses(selectedMonth, activeProfile.id);
    }
  };

  const formatAmount = (amount: number | string) => formatMoney(amount, baseCurrency);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ----------------------------------------------------------------- */}
      {/* 1. Header with Month Selector & New Budget Button                 */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Presupuestos Mensuales</h1>
          <p className="text-xs text-muted-foreground">
            Control de gastos en tiempo real con barras de progreso y límites de alerta.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 border border-border/40 px-2.5 py-1 bg-card">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedMonth(e.target.value);
                  if (activeProfile?.id) {
                    fetchBudgets(activeProfile.id, e.target.value);
                    fetchCategoryExpenses(e.target.value, activeProfile.id);
                  }
                }
              }}
              className="bg-transparent text-xs font-mono text-foreground focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleOpenCreate()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 active:scale-95 transition-all shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Fijar Presupuesto</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. Global KPI Overview & Health Progress Bar                      */}
      {/* ----------------------------------------------------------------- */}
      <div className="bg-card border border-border/40 p-4 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Presupuestado Total
            </span>
            <span className="text-sm font-semibold font-mono text-foreground mt-0.5 block">
              {formatAmount(stats.totalLimit)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Gasto Consumido
            </span>
            <span className="text-sm font-semibold font-mono text-foreground mt-0.5 block">
              {formatAmount(stats.totalSpent)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Saldo Restante
            </span>
            <span
              className={`text-sm font-semibold font-mono mt-0.5 block ${
                stats.remaining < 0 ? 'text-rose-500' : 'text-emerald-500'
              }`}
            >
              {formatAmount(stats.remaining)}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
              Salud Global
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {stats.exceededCount > 0 ? (
                <span className="text-xs font-medium text-rose-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {stats.exceededCount} excedido{stats.exceededCount > 1 ? 's' : ''}
                </span>
              ) : stats.warningCount > 0 ? (
                <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" />
                  {stats.warningCount} en alerta
                </span>
              ) : (
                <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  En orden ({stats.percentage}%)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Global Consumption Progress Bar (6px) */}
        <div className="space-y-1.5 border-t border-border/30 pt-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-muted-foreground">
              Consumo acumulado del mes: {formatAmount(stats.totalSpent)} de {formatAmount(stats.totalLimit)}
            </span>
            <span
              className={`font-semibold ${
                stats.percentage >= 100
                  ? 'text-rose-500'
                  : stats.percentage >= 80
                  ? 'text-amber-500'
                  : 'text-emerald-500'
              }`}
            >
              {stats.percentage}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-muted/60 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                stats.percentage >= 100
                  ? 'bg-rose-500'
                  : stats.percentage >= 80
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, stats.percentage)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 3. Filter Tabs & Search Bar                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* State Filter Tabs */}
        <div className="flex items-center border border-border/40 bg-card p-0.5 text-xs overflow-x-auto">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 transition-colors shrink-0 ${
              filterTab === 'all'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Todos ({budgets.length})
          </button>
          <button
            onClick={() => setFilterTab('exceeded')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              filterTab === 'exceeded'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>Excedidos ({stats.exceededCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('warning')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              filterTab === 'warning'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
            <span>En Alerta ({stats.warningCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('ok')}
            className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 shrink-0 ${
              filterTab === 'ok'
                ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span>En Orden ({stats.okCount})</span>
          </button>
          {unbudgetedCategories.length > 0 && (
            <button
              onClick={() => setFilterTab('unbudgeted')}
              className={`px-3 py-1.5 transition-colors flex items-center gap-1.5 shrink-0 ${
                filterTab === 'unbudgeted'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
              <span>Sin Presupuesto ({unbudgetedCategories.length})</span>
            </button>
          )}
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2 border border-border/40 bg-card px-2.5 py-1 text-xs sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <input
            type="text"
            placeholder="Buscar por categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none w-full"
          />
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* 4. Active Budgets List                                            */}
      {/* ----------------------------------------------------------------- */}
      {filterTab !== 'unbudgeted' && (
        <div className="border border-border/40 divide-y divide-border/30 bg-card">
          {isLoading && budgets.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Cargando presupuestos...
            </div>
          ) : filteredBudgets.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <TrendingDown className="w-6 h-6 text-muted-foreground/60" />
              <span>
                {searchQuery
                  ? 'No se encontraron presupuestos que coincidan con la búsqueda.'
                  : filterTab !== 'all'
                  ? 'No hay presupuestos bajo este criterio de filtro.'
                  : 'Aún no tienes presupuestos configurados para este mes.'}
              </span>
              {!searchQuery && filterTab === 'all' && (
                <button
                  onClick={() => handleOpenCreate()}
                  className="mt-2 text-primary hover:underline text-xs font-medium"
                >
                  Comienza fijando un límite mensual para tus categorías clave
                </button>
              )}
            </div>
          ) : (
            filteredBudgets.map((b) => {
              const limit = parseFloat(b.limitAmount) || 0;
              const spent = parseFloat(b.spentAmount || '0') || 0;
              const remaining = limit - spent;
              const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

              let barColor = 'bg-emerald-500';
              let textColor = 'text-emerald-500';
              let statusLabel = 'En curso';

              if (percent >= 100) {
                barColor = 'bg-rose-500';
                textColor = 'text-rose-500';
                statusLabel = `Excedido (${percent}%)`;
              } else if (percent >= (b.alertThresholdPercent || 70)) {
                barColor = 'bg-amber-500';
                textColor = 'text-amber-500';
                statusLabel = `Alerta (${percent}%)`;
              }

              const clampedProgress = Math.min(100, Math.max(0, percent));

              return (
                <div key={b.id} className="p-4 hover:bg-muted/15 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 flex items-center justify-center border border-border/40 shrink-0"
                        style={{
                          backgroundColor: `${b.categoryColor || '#3b82f6'}15`,
                          color: b.categoryColor || '#3b82f6',
                        }}
                      >
                        <KoinIcon name={b.categoryIcon || 'Tag'} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {b.categoryName}
                          </span>
                          <span className={`text-[10px] font-mono font-medium ${textColor}`}>
                            {statusLabel}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          {remaining >= 0 ? (
                            <span>Restante: {formatAmount(remaining)}</span>
                          ) : (
                            <span className="text-rose-500 font-semibold">
                              Excedido por: {formatAmount(Math.abs(remaining))}
                            </span>
                          )}
                          <span className="text-muted-foreground/60"> · Umbral: {b.alertThresholdPercent || 80}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Amounts & Percentage */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-semibold font-mono text-foreground">
                          {formatAmount(spent)}{' '}
                          <span className="text-muted-foreground font-normal">/ {formatAmount(limit)}</span>
                        </div>
                        <div className="text-[11px] font-mono text-muted-foreground mt-0.5">
                          {percent}% consumido
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 border-l border-border/30 pl-2">
                        <button
                          onClick={() => handleOpenEdit(b)}
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                          title="Editar presupuesto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setBudgetToDelete(b)}
                          className="p-1 text-muted-foreground hover:text-rose-500 transition-colors"
                          title="Eliminar presupuesto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 4px Thin Progress Bar */}
                  <div className="w-full h-1 bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${barColor}`}
                      style={{ width: `${clampedProgress}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. Unbudgeted Expenses Section                                    */}
      {/* ----------------------------------------------------------------- */}
      {(filterTab === 'unbudgeted' || (filterTab === 'all' && unbudgetedCategories.length > 0)) && (
        <div className="border border-border/40 bg-card p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Gastos del Mes Sin Presupuesto Asignado ({unbudgetedCategories.length})
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Categorías con actividad en {selectedMonth} que no tienen un límite de gasto fijado.
                </span>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border/20">
            {unbudgetedCategories.map((item) => (
              <div
                key={item.categoryId}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-muted/15 px-1 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 flex items-center justify-center border border-border/40 shrink-0"
                    style={{
                      backgroundColor: `${item.categoryColor}15`,
                      color: item.categoryColor,
                    }}
                  >
                    <KoinIcon name={item.categoryIcon} className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {item.categoryName}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {item.transactionCount} mov · {item.percentage}% del total de gastos
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold font-mono text-foreground">
                    {formatAmount(item.spentAmount)}
                  </span>
                  <button
                    onClick={() => handleOpenCreate(item.categoryId)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Fijar Límite</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 6. Modals (Create / Edit & Delete Confirmation)                   */}
      {/* ----------------------------------------------------------------- */}
      <BudgetModal
        isOpen={isModalOpen}
        budget={editingBudget}
        preselectedCategoryId={preselectedCategoryId}
        categories={categories}
        existingCategoryIds={existingCategoryIds}
        currency={baseCurrency}
        onClose={() => {
          setIsModalOpen(false);
          setPreselectedCategoryId(undefined);
        }}
        onSave={handleSaveBudget}
      />

      <ConfirmModal
        isOpen={budgetToDelete !== null}
        title="Eliminar Presupuesto"
        description={`¿Deseas eliminar el presupuesto para la categoría "${budgetToDelete?.categoryName}"? Los movimientos históricos no serán eliminados.`}
        confirmText="Eliminar Presupuesto"
        variant="danger"
        onConfirm={handleDeleteBudget}
        onClose={() => setBudgetToDelete(null)}
      />
    </div>
  );
};
