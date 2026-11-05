import React, { useState } from 'react';
import {
  X,
  Calendar,
  Edit2,
  Trash2,
  Play,
  Pause,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  CheckCircle2,
  Clock,
  Wallet,
  Sparkles,
  PieChart,
} from 'lucide-react';
import { RecurringRuleDTO } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';

interface RecurringRuleDetailModalProps {
  isOpen: boolean;
  rule: RecurringRuleDTO | null;
  onClose: () => void;
  onEdit: (rule: RecurringRuleDTO) => void;
  onApplyNow: (ruleId: string) => Promise<void>;
  onToggleStatus: (ruleId: string, currentStatus: string) => Promise<void>;
  onDeleteRequest: (rule: RecurringRuleDTO) => void;
}

export const RecurringRuleDetailModal: React.FC<RecurringRuleDetailModalProps> = ({
  isOpen,
  rule,
  onClose,
  onEdit,
  onApplyNow,
  onToggleStatus,
  onDeleteRequest,
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  if (!isOpen || !rule) return null;

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
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'N/A';

  const handleApply = async () => {
    if (isApplying || isCompleted) return;
    setIsApplying(true);
    try {
      await onApplyNow(rule.id);
      onClose();
    } finally {
      setIsApplying(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling || isCompleted) return;
    setIsToggling(true);
    try {
      await onToggleStatus(rule.id, rule.status);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg border border-border/80 bg-background shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-border/40 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border"
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
                <CreditCard className="w-5 h-5" />
              ) : isIncome ? (
                <ArrowDownLeft className="w-5 h-5" />
              ) : (
                <ArrowUpRight className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-foreground tracking-tight">
                  {rule.name}
                </h3>
                {isDebt ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-500/40 bg-purple-500/10 text-purple-400 font-semibold">
                    Deuda a Cuotas
                  </span>
                ) : isIncome ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-semibold">
                    Salario / Ingreso Fijo
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-blue-500/40 bg-blue-500/10 text-blue-400 font-semibold">
                    Gasto Fijo Periódico
                  </span>
                )}

                {isCompleted ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-emerald-500/40 bg-emerald-500/15 text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Liquidada
                  </span>
                ) : isPaused ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 border border-amber-500/40 bg-amber-500/15 text-amber-400 font-bold flex items-center gap-1">
                    <Pause className="w-3 h-3" /> Pausada
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {rule.accountName} {rule.categoryName ? `· ${rule.categoryName}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Main Financial KPI Card */}
          <div className="p-4 border border-border/60 bg-muted/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                Monto del Compromiso
              </span>
              <p
                className={`text-2xl font-bold font-mono mt-0.5 ${
                  isIncome ? 'text-emerald-400' : 'text-foreground'
                }`}
              >
                {isIncome ? '+' : '-'}${parseFloat(rule.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                {rule.currency} / {rule.frequency === 'monthly' ? 'Mensual' : rule.frequency}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wider">
                Próximo Cobro / Pago
              </span>
              <p className="text-xs font-mono font-bold text-foreground mt-1 flex items-center justify-end gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{nextRunFormatted}</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                Día {rule.dayOfMonth} del mes
              </p>
            </div>
          </div>

          {/* Debt Amortization Details if Debt */}
          {isDebt && (
            <div className="space-y-3 p-4 border border-purple-500/30 bg-purple-500/5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <PieChart className="w-3.5 h-3.5 text-purple-400" />
                  Progreso de Amortización
                </span>
                <span className="text-purple-400 font-bold">
                  Cuota {currInst} de {totalInst} ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-muted/40 border border-border/40 overflow-hidden">
                <div
                  className="h-full bg-purple-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Amortization Financial Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
                {rule.principalAmount && (
                  <div className="p-2 border border-border/30 bg-background/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Capital Solicitado</p>
                    <p className="font-bold text-foreground mt-0.5">${rule.principalAmount}</p>
                  </div>
                )}
                {rule.installmentPrincipal && (
                  <div className="p-2 border border-border/30 bg-background/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Abono Capital / Mes</p>
                    <p className="font-bold text-emerald-400 mt-0.5">${rule.installmentPrincipal}</p>
                  </div>
                )}
                {rule.installmentInterest && (
                  <div className="p-2 border border-border/30 bg-background/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Interés / Mes</p>
                    <p className="font-bold text-purple-400 mt-0.5">${rule.installmentInterest}</p>
                  </div>
                )}
                {rule.totalInterestAmount && (
                  <div className="p-2 border border-border/30 bg-background/50">
                    <p className="text-[10px] text-muted-foreground uppercase">Interés Total Costo</p>
                    <p className="font-bold text-purple-400 mt-0.5">${rule.totalInterestAmount}</p>
                  </div>
                )}
                <div className="p-2 border border-border/30 bg-background/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Cuotas Restantes</p>
                  <p className="font-bold text-foreground mt-0.5">{remainingInstallments} cuotas</p>
                </div>
                <div className="p-2 border border-border/30 bg-background/50">
                  <p className="text-[10px] text-muted-foreground uppercase">Saldo Pendiente</p>
                  <p className="font-bold text-foreground mt-0.5">${remainingBalance} {rule.currency}</p>
                </div>
              </div>
            </div>
          )}

          {/* Operational Details List */}
          <div className="divide-y divide-border/30 border border-border/40 text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Cuenta de cargo / abono:</span>
              <span className="font-semibold text-foreground flex items-center gap-1.5 font-mono">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: rule.accountColor || '#10B981' }}
                />
                {rule.accountName}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Categoría contable:</span>
              <span className="font-semibold text-foreground font-mono">
                {rule.categoryName || 'Sin categoría asignada'}
              </span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-muted-foreground">Modo de registro:</span>
              <span className="font-mono text-foreground font-medium">
                {rule.autoApply
                  ? 'Automático (se aplica el día programado)'
                  : 'Manual (requiere tu confirmación cada mes)'}
              </span>
            </div>

            {rule.note && (
              <div className="p-3 flex items-start justify-between gap-4">
                <span className="text-muted-foreground shrink-0">Nota / Detalle:</span>
                <span className="text-foreground text-right">{rule.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-border/40 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Delete button */}
            <button
              type="button"
              onClick={() => onDeleteRequest(rule)}
              className="px-3 py-2 text-xs font-semibold border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Eliminar</span>
            </button>

            {/* Pause / Resume button */}
            {!isCompleted && (
              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                className="px-3 py-2 text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center gap-1.5"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5 text-amber-400" />
                    <span>Reanudar</span>
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pausar</span>
                  </>
                )}
              </button>
            )}

            {/* Edit button */}
            <button
              type="button"
              onClick={() => onEdit(rule)}
              className="px-3 py-2 text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors flex items-center gap-1.5"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Editar</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cerrar
            </button>

            {/* Primary Action: Pagar Cuota Ahora o Aplicar */}
            {!isCompleted && (
              <button
                type="button"
                onClick={handleApply}
                disabled={isApplying || isPaused}
                className={`px-4 py-2 text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                  isDebt
                    ? 'bg-purple-600 text-white hover:bg-purple-700'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                {isApplying && (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                <span>
                  {isDebt
                    ? `Pagar Cuota ${currInst + 1}/${totalInst}`
                    : isIncome
                    ? 'Cobrar Salario Ahora'
                    : 'Pagar Gasto Ahora'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
