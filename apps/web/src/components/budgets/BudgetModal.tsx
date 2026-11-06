import React, { useState, useEffect } from 'react';
import { X, Sliders } from 'lucide-react';
import { BudgetDTO, CategoryWithUsageDTO } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';

interface BudgetModalProps {
  isOpen: boolean;
  budget?: BudgetDTO | null;
  categories: CategoryWithUsageDTO[];
  existingCategoryIds: string[];
  currency: string;
  onClose: () => void;
  onSave: (data: {
    categoryId: string;
    limitAmount: string;
    alertThresholdPercent: number;
    period: 'monthly';
  }) => Promise<void>;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  budget,
  categories,
  existingCategoryIds,
  currency,
  onClose,
  onSave,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [limitAmount, setLimitAmount] = useState('');
  const [alertThresholdPercent, setAlertThresholdPercent] = useState<number>(80);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter categories to only expense categories
  const expenseCategories = categories.filter((c) => c.type === 'expense');

  // When creating, filter out categories that already have a budget
  const availableCategories = budget
    ? expenseCategories
    : expenseCategories.filter((c) => !existingCategoryIds.includes(c.id));

  useEffect(() => {
    if (budget) {
      setCategoryId(budget.categoryId);
      setLimitAmount(budget.limitAmount);
      setAlertThresholdPercent(budget.alertThresholdPercent || 80);
    } else {
      setCategoryId(availableCategories[0]?.id || '');
      setLimitAmount('');
      setAlertThresholdPercent(80);
    }
    setError(null);
  }, [budget, isOpen, categories]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      setError('Debes seleccionar una categoría.');
      return;
    }

    const parsedLimit = parseFloat(limitAmount);
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      setError('El límite del presupuesto debe ser mayor a 0.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        categoryId,
        limitAmount: parsedLimit.toFixed(2),
        alertThresholdPercent,
        period: 'monthly',
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar el presupuesto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm border border-border/40 shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <span className="text-sm font-semibold tracking-tight">
            {budget ? 'Editar Presupuesto' : 'Fijar Presupuesto Mensual'}
          </span>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2.5 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20">
              {error}
            </div>
          )}

          {/* Category selection */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Categoría de Gasto</label>
            {budget ? (
              <div className="flex items-center gap-2 p-2 border border-border/40 bg-muted/20">
                <div
                  className="w-6 h-6 flex items-center justify-center border border-border/40 shrink-0"
                  style={{
                    backgroundColor: `${budget.categoryColor}15`,
                    color: budget.categoryColor,
                  }}
                >
                  <KoinIcon name={budget.categoryIcon || 'Tag'} className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-medium text-foreground">{budget.categoryName}</span>
              </div>
            ) : availableCategories.length === 0 ? (
              <div className="text-xs text-muted-foreground p-3 border border-border/30 bg-muted/10 text-center">
                Todas las categorías de gasto ya tienen un presupuesto asignado.
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-background border border-border/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                {availableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Limit amount */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Límite Mensual ({currency})</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={limitAmount}
                onChange={(e) => setLimitAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-background border border-border/40 pl-14 pr-3 py-2 text-xs font-mono focus:outline-none focus:border-primary"
                autoFocus={!budget}
                required
              />
            </div>
          </div>

          {/* Alert Threshold Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5" />
                <span>Umbral de Alerta Preventiva</span>
              </span>
              <span className="font-mono font-medium text-foreground">{alertThresholdPercent}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={alertThresholdPercent}
              onChange={(e) => setAlertThresholdPercent(parseInt(e.target.value, 10))}
              className="w-full accent-primary h-1.5 bg-muted rounded-none cursor-pointer"
            />
            <p className="text-[11px] text-muted-foreground">
              Se activará advertencia preventiva cuando el gasto acumulado alcance el{' '}
              {alertThresholdPercent}% del límite fijado.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs border border-border/40 hover:bg-muted/50 transition-colors"
              disabled={isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (!budget && availableCategories.length === 0)}
              className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
            >
              {isSubmitting ? 'Guardando...' : budget ? 'Guardar Cambios' : 'Fijar Presupuesto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
