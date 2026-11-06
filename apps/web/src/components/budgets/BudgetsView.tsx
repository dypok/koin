import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Edit2, Trash2, Sliders, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';
import { BudgetDTO } from '@koin/shared';
import { useBudgetStore } from '../../stores/budgetStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { BudgetModal } from './BudgetModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const BudgetsView: React.FC = () => {
  const { budgets, fetchBudgets, upsertBudget, deleteBudget, isLoading, error } = useBudgetStore();
  const { categories, fetchCategories } = useTransactionStore();
  const { activeProfile } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetDTO | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<BudgetDTO | null>(null);

  const baseCurrency = activeProfile?.baseCurrency || 'USD';

  useEffect(() => {
    if (activeProfile?.id) {
      fetchBudgets(activeProfile.id);
      fetchCategories(activeProfile.id);
    }
  }, [activeProfile?.id]);

  // Aggregate totals
  const totals = useMemo(() => {
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

    const remaining = totalLimit - totalSpent;
    const percentage = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0;

    return {
      totalLimit,
      totalSpent,
      remaining,
      percentage,
      exceededCount,
      warningCount,
    };
  }, [budgets]);

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BudgetDTO) => {
    setEditingBudget(b);
    setIsModalOpen(true);
  };

  const handleSaveBudget = async (data: {
    categoryId: string;
    limitAmount: string;
    alertThresholdPercent: number;
    period: 'monthly';
  }) => {
    await upsertBudget(data, activeProfile?.id);
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    await deleteBudget(budgetToDelete.id, activeProfile?.id);
    setBudgetToDelete(null);
  };

  const formatMoney = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: baseCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(isNaN(num) ? 0 : num);
  };

  const existingCategoryIds = useMemo(() => budgets.map((b) => b.categoryId), [budgets]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h1 className="text-base font-semibold tracking-tight">Presupuestos Mensuales</h1>
          <p className="text-xs text-muted-foreground">
            Control de gastos en tiempo real con barras de progreso y límites de alerta.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Fijar Presupuesto</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
          {error}
        </div>
      )}

      {/* Overview KPI Header (Flat typography, zero cards) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-card border border-border/40">
        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
            Presupuestado Total
          </span>
          <span className="text-sm font-semibold font-mono text-foreground mt-0.5 block">
            {formatMoney(totals.totalLimit)}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
            Gasto Consumido
          </span>
          <span className="text-sm font-semibold font-mono text-foreground mt-0.5 block">
            {formatMoney(totals.totalSpent)}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
            Saldo Restante
          </span>
          <span
            className={`text-sm font-semibold font-mono mt-0.5 block ${
              totals.remaining < 0 ? 'text-rose-500' : 'text-emerald-500'
            }`}
          >
            {formatMoney(totals.remaining)}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-muted-foreground uppercase tracking-wider block">
            Salud Global
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {totals.exceededCount > 0 ? (
              <span className="text-xs font-medium text-rose-500 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {totals.exceededCount} excedido{totals.exceededCount > 1 ? 's' : ''}
              </span>
            ) : totals.warningCount > 0 ? (
              <span className="text-xs font-medium text-amber-500 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" />
                {totals.warningCount} en alerta
              </span>
            ) : (
              <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                En orden ({totals.percentage}%)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Budgets List */}
      <div className="border border-border/40 divide-y divide-border/30 bg-card">
        {isLoading && budgets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            Cargando presupuestos...
          </div>
        ) : budgets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <TrendingDown className="w-6 h-6 text-muted-foreground/60" />
            <span>Aún no tienes presupuestos configurados para este mes.</span>
            <button
              onClick={handleOpenCreate}
              className="mt-2 text-primary hover:underline text-xs font-medium"
            >
              Comienza fijando un límite mensual para tus categorías clave
            </button>
          </div>
        ) : (
          budgets.map((b) => {
            const limit = parseFloat(b.limitAmount) || 0;
            const spent = parseFloat(b.spentAmount || '0') || 0;
            const remaining = limit - spent;
            const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;

            // Semaphoric color coding:
            // Verde (<70%), Amarillo Ámbar (70%-99%), Rojo (>=100% excedido)
            let barColor = 'bg-emerald-500';
            let textColor = 'text-emerald-500';
            let statusLabel = 'En curso';

            if (percent >= 100) {
              barColor = 'bg-rose-500';
              textColor = 'text-rose-500';
              statusLabel = 'Excedido';
            } else if (percent >= (b.alertThresholdPercent || 70)) {
              barColor = 'bg-amber-500';
              textColor = 'text-amber-500';
              statusLabel = `Alerta (${percent}%)`;
            }

            const clampedProgress = Math.min(100, Math.max(0, percent));

            return (
              <div key={b.id} className="p-4 hover:bg-muted/20 transition-colors">
                {/* Row Content */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 flex items-center justify-center border border-border/40 shrink-0"
                      style={{
                        backgroundColor: `${b.categoryColor}15`,
                        color: b.categoryColor,
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
                        Restante: {formatMoney(remaining)}
                      </div>
                    </div>
                  </div>

                  {/* Amounts & Percentage */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-semibold font-mono text-foreground">
                        {formatMoney(spent)}{' '}
                        <span className="text-muted-foreground font-normal">/ {formatMoney(limit)}</span>
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

                {/* 4px Thin Progress Bar (Strictly 4px, without bloated cards) */}
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

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isModalOpen}
        budget={editingBudget}
        categories={categories}
        existingCategoryIds={existingCategoryIds}
        currency={baseCurrency}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBudget}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={budgetToDelete !== null}
        title="Eliminar Presupuesto"
        description={`¿Deseas eliminar el presupuesto para la categoría "${budgetToDelete?.categoryName}"? Los movimientos registrados no serán eliminados.`}
        confirmText="Eliminar Presupuesto"
        variant="danger"
        onConfirm={handleDeleteBudget}
        onClose={() => setBudgetToDelete(null)}
      />
    </div>
  );
};
