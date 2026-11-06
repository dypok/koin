import React, { useState } from 'react';
import { RecurringRuleDTO } from '@koin/shared';
import {
  Calendar,
  CheckCircle2,
  Pause,
  Play,
  Trash2,
  Edit2,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  ChevronRight,
} from 'lucide-react';
import { formatMoney } from '../../lib/currency';

interface InstallmentCardProps {
  rule: RecurringRuleDTO;
  onSelect: (rule: RecurringRuleDTO) => void;
  onEdit: (rule: RecurringRuleDTO) => void;
  onApplyNow: (ruleId: string) => Promise<void>;
  onToggleStatus: (ruleId: string, currentStatus: string) => Promise<void>;
  onDeleteRequest: (rule: RecurringRuleDTO) => void;
}

export const InstallmentCard: React.FC<InstallmentCardProps> = ({
  rule,
  onSelect,
  onEdit,
  onApplyNow,
  onToggleStatus,
  onDeleteRequest,
}) => {
  const [loading, setLoading] = useState(false);

  const isIncome = rule.type === 'income';
  const isDebt = rule.isInstallment;
  const isCompleted = rule.status === 'completed';
  const isPaused = rule.status === 'paused';

  const totalInst = rule.totalInstallments || 1;
  const currInst = rule.currentInstallment;
  const progressPercent = Math.min(100, Math.round((currInst / totalInst) * 100));

  const remainingInstallments = Math.max(0, totalInst - currInst);
  const numAmount = parseFloat(rule.amount || '0');
  const remainingBalance = (numAmount * remainingInstallments).toFixed(2);

  const nextRunFormatted = rule.nextRunDate
    ? new Date(rule.nextRunDate.substring(0, 10) + 'T00:00:00').toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  const handleApply = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || isCompleted) return;
    setLoading(true);
    try {
      await onApplyNow(rule.id);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (loading || isCompleted) return;
    setLoading(true);
    try {
      await onToggleStatus(rule.id, rule.status);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(rule);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteRequest(rule);
  };

  return (
    <div
      onClick={() => onSelect(rule)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(rule);
        }
      }}
      className={`p-5 border transition-all text-left cursor-pointer group relative ${
        isCompleted
          ? 'border-border/30 bg-muted/5 opacity-75'
          : isPaused
          ? 'border-amber-500/30 bg-amber-500/5'
          : isDebt
          ? 'border-purple-500/40 bg-purple-500/5 hover:border-purple-500/70 hover:shadow-sm'
          : isIncome
          ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/70 hover:shadow-sm'
          : 'border-border/60 bg-background hover:border-border hover:shadow-sm'
      }`}
    >
      {/* Top Header: Badge, Title, Status & Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105"
            style={{
              backgroundColor: isDebt
                ? 'rgba(168, 85, 247, 0.15)'
                : isIncome
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(59, 130, 246, 0.15)',
              borderColor: isDebt
                ? 'rgba(168, 85, 247, 0.4)'
                : isIncome
                ? 'rgba(16, 185, 129, 0.4)'
                : 'rgba(59, 130, 246, 0.4)',
              color: isDebt ? '#A855F7' : isIncome ? '#10B981' : '#3B82F6',
            }}
          >
            {isDebt ? (
              <CreditCard className="w-4 h-4" />
            ) : isIncome ? (
              <ArrowDownLeft className="w-4 h-4" />
            ) : (
              <ArrowUpRight className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {rule.name}
              </span>
              {isDebt ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-purple-500/40 bg-purple-500/10 text-purple-400 font-semibold">
                  Deuda / Cuotas
                </span>
              ) : isIncome ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold">
                  Ingreso Fijo
                </span>
              ) : (
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-blue-500/40 bg-blue-500/10 text-blue-400 font-semibold">
                  Gasto Fijo
                </span>
              )}

              {isCompleted ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Liquidada
                </span>
              ) : isPaused ? (
                <span className="text-[10px] font-mono px-1.5 py-0.5 border border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold flex items-center gap-1">
                  <Pause className="w-3 h-3" /> Pausada
                </span>
              ) : null}
            </div>

            {/* Account & Category meta */}
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 font-mono">
              <span className="flex items-center gap-1 text-foreground/80">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: rule.accountColor || '#10B981' }}
                />
                {rule.accountName || 'Cuenta'}
              </span>
              {rule.categoryName && (
                <>
                  <span>·</span>
                  <span>{rule.categoryName}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Amount Display */}
        <div className="text-right shrink-0">
          <p
            className={`text-base font-mono font-bold ${
              isIncome ? 'text-emerald-400' : 'text-foreground'
            }`}
          >
            {isIncome ? '+' : '-'}{formatMoney(rule.amount, rule.currency)}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">
            {rule.currency} / {rule.frequency === 'monthly' ? 'mes' : rule.frequency}
          </p>
        </div>
      </div>

      {/* Debt Amortization Progress Bar (Only for Debts) */}
      {isDebt && (
        <div className="mt-4 pt-3 border-t border-border/30 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-muted-foreground">
              Progreso: <strong className="text-foreground">Cuota {currInst} de {totalInst}</strong>
            </span>
            <span className="text-purple-400 font-bold">{progressPercent}% amortizado</span>
          </div>

          <div className="w-full h-2 bg-muted/30 border border-border/40 overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-[10px] font-mono text-muted-foreground">
            {rule.principalAmount && (
              <div>
                Capital: <strong className="text-foreground">{formatMoney(rule.principalAmount, rule.currency)}</strong>
              </div>
            )}
            {rule.totalInterestAmount && parseFloat(rule.totalInterestAmount) > 0 && (
              <div>
                Intereses: <strong className="text-purple-400">+{formatMoney(rule.totalInterestAmount, rule.currency)}</strong>
              </div>
            )}
            <div>
              Saldo: <strong className="text-foreground">{formatMoney(remainingBalance, rule.currency)}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Card Footer: Dates & Quick Action Buttons */}
      <div className="mt-4 pt-3 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
          <span>
            {isCompleted
              ? 'Todas las cuotas completadas'
              : `Próximo cobro: ${nextRunFormatted} (Día ${rule.dayOfMonth})`}
          </span>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Edit Button */}
          <button
            type="button"
            onClick={handleEdit}
            disabled={loading}
            title="Editar compromiso"
            className="p-1.5 border border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>

          {/* Pause / Resume Button */}
          {!isCompleted && (
            <button
              type="button"
              onClick={handleToggle}
              disabled={loading}
              title={isPaused ? 'Reanudar compromiso' : 'Pausar compromiso'}
              className="p-1.5 border border-border/50 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Delete Button */}
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            title="Eliminar regla"
            className="p-1.5 border border-border/50 hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Apply Now Primary Action */}
          {!isCompleted && (
            <button
              type="button"
              onClick={handleApply}
              disabled={loading || isPaused}
              className={`px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 disabled:opacity-50 ${
                isDebt
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              <span>{isDebt ? `Pagar Cuota ${currInst + 1}/${totalInst}` : 'Aplicar Ahora'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
