import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, TrendingUp, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import {
  RecurringRuleDTO,
  TransactionType,
  RecurrenceFrequency,
} from '@koin/shared';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { useAuthStore } from '../../stores/authStore';
import { ModalPortal } from '../common/ModalPortal';
import { formatMoney } from '../../lib/currency';
import { CurrencyInput } from '../common/CurrencyInput';

interface RecurringRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleToEdit?: RecurringRuleDTO | null;
  onSuccess?: (rule: RecurringRuleDTO) => void;
}

type ModalMode = 'salary' | 'expense' | 'debt';

const FREQUENCY_LABELS: Record<RecurrenceFrequency, string> = {
  monthly: 'Mensual',
  biweekly: 'Quincenal (cada 15 días)',
  weekly: 'Semanal',
  yearly: 'Anual',
};

export const RecurringRuleModal: React.FC<RecurringRuleModalProps> = ({
  isOpen,
  onClose,
  ruleToEdit,
  onSuccess,
}) => {
  const isEditing = !!ruleToEdit;
  const { activeProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useTransactionStore();
  const { createRule, updateRule } = useRecurringStore();

  const [mode, setMode] = useState<ModalMode>('salary');
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<RecurrenceFrequency>('monthly');
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [autoApply, setAutoApply] = useState(true);
  const [nextRunDate, setNextRunDate] = useState('');
  const [note, setNote] = useState('');

  // Debt-specific state
  const [totalInstallments, setTotalInstallments] = useState('12');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestCalcMode, setInterestCalcMode] = useState<'cuota' | 'rate'>('cuota');
  const [interestRate, setInterestRate] = useState('2.0');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      fetchAccounts(activeProfile.id);
      fetchCategories(activeProfile.id);
    }
  }, [activeProfile?.id]);

  useEffect(() => {
    if (ruleToEdit) {
      setName(ruleToEdit.name);
      setAccountId(ruleToEdit.accountId);
      setCategoryId(ruleToEdit.categoryId || '');
      setAmount(ruleToEdit.amount);
      setFrequency(ruleToEdit.frequency);
      setDayOfMonth(ruleToEdit.dayOfMonth);
      setAutoApply(ruleToEdit.autoApply);
      setNextRunDate(ruleToEdit.nextRunDate.substring(0, 10));
      setNote(ruleToEdit.note || '');

      if (ruleToEdit.isInstallment) {
        setMode('debt');
        setTotalInstallments(ruleToEdit.totalInstallments ? String(ruleToEdit.totalInstallments) : '12');
        setPrincipalAmount(ruleToEdit.principalAmount || '');
        if (ruleToEdit.interestRate) {
          setInterestCalcMode('rate');
          setInterestRate(ruleToEdit.interestRate);
        } else {
          setInterestCalcMode('cuota');
        }
      } else if (ruleToEdit.type === 'income') {
        setMode('salary');
      } else {
        setMode('expense');
      }
    } else {
      // Default creation state
      setMode('salary');
      setName('Salario Mensual Nómina');
      setAmount('');
      setFrequency('monthly');
      setDayOfMonth(1);
      setAutoApply(true);
      setNote('');

      // Default date to today or next 1st
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      setNextRunDate(`${yyyy}-${mm}-${dd}`);

      setTotalInstallments('12');
      setPrincipalAmount('');
      setInterestCalcMode('cuota');
      setInterestRate('2.0');
    }

    setErrorMsg(null);
  }, [ruleToEdit, isOpen]);

  // Set default account when accounts load
  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      const bankAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
      setAccountId(bankAcc.id);
    }
  }, [accounts, accountId]);

  // Set default category according to mode
  useEffect(() => {
    if (categories.length > 0) {
      if (mode === 'salary') {
        const salCat = categories.find((c) => c.type === 'income' && c.name.toLowerCase().includes('salario'));
        if (salCat) setCategoryId(salCat.id);
      } else if (mode === 'debt') {
        const debtCat = categories.find((c) => c.type === 'expense' && (c.name.toLowerCase().includes('compras') || c.name.toLowerCase().includes('otros')));
        if (debtCat) setCategoryId(debtCat.id);
      }
    }
  }, [mode, categories]);

  if (!isOpen) return null;

  // Selected account
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency || activeProfile?.baseCurrency || 'USD';

  // Live calculations for debts
  const numPrincipal = parseFloat(principalAmount) || 0;
  const numMonths = parseInt(totalInstallments, 10) || 1;
  const numCuota = parseFloat(amount) || 0;

  let calculatedCuota = numCuota;
  let calculatedTotalDebt = numCuota * numMonths;
  let calculatedInterestTotal = 0;
  let principalPerMonth = 0;
  let interestPerMonth = 0;

  if (mode === 'debt') {
    if (interestCalcMode === 'rate') {
      // Annuity formula (French amortization)
      const r = (parseFloat(interestRate) || 0) / 100;
      if (r > 0 && numPrincipal > 0 && numMonths > 0) {
        calculatedCuota = (numPrincipal * (r * Math.pow(1 + r, numMonths))) / (Math.pow(1 + r, numMonths) - 1);
        calculatedTotalDebt = calculatedCuota * numMonths;
        calculatedInterestTotal = Math.max(0, calculatedTotalDebt - numPrincipal);
        principalPerMonth = numPrincipal / numMonths;
        interestPerMonth = calculatedInterestTotal / numMonths;
      }
    } else {
      // Direct cuota mode
      if (numPrincipal > 0 && numMonths > 0) {
        calculatedTotalDebt = numCuota * numMonths;
        calculatedInterestTotal = Math.max(0, calculatedTotalDebt - numPrincipal);
        principalPerMonth = numPrincipal / numMonths;
        interestPerMonth = calculatedInterestTotal / numMonths;
      }
    }
  }

  const handleModeChange = (newMode: ModalMode) => {
    setMode(newMode);
    if (!ruleToEdit) {
      if (newMode === 'salary') {
        setName('Salario Mensual Nómina');
        setFrequency('monthly');
        setDayOfMonth(1);
      } else if (newMode === 'expense') {
        setName('Arriendo / Vivienda');
        setFrequency('monthly');
        setDayOfMonth(5);
      } else if (newMode === 'debt') {
        setName('Crédito / Préstamo a Cuotas');
        setFrequency('monthly');
        setDayOfMonth(15);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor ingresa un nombre para el compromiso.');
      return;
    }

    if (!accountId) {
      setErrorMsg('Por favor selecciona una cuenta financiera.');
      return;
    }

    const finalAmount = mode === 'debt' && interestCalcMode === 'rate'
      ? calculatedCuota.toFixed(2)
      : parseFloat(amount).toFixed(2);

    if (isNaN(parseFloat(finalAmount)) || parseFloat(finalAmount) <= 0) {
      setErrorMsg('Por favor ingresa un importe mayor a cero.');
      return;
    }

    setLoading(true);

    try {
      const isInstallment = mode === 'debt';
      const type: TransactionType = mode === 'salary' ? 'income' : 'expense';

      if (isEditing && ruleToEdit) {
        const updated = await updateRule(ruleToEdit.id, {
          name: trimmedName,
          accountId,
          categoryId: categoryId || undefined,
          amount: finalAmount,
          dayOfMonth,
          autoApply,
          nextRunDate,
          note: note.trim() || undefined,
        });
        onSuccess?.(updated);
        onClose();
      } else {
        const created = await createRule(
          {
            name: trimmedName,
            accountId,
            categoryId: categoryId || undefined,
            type,
            amount: finalAmount,
            currency,
            frequency,
            dayOfMonth,
            isInstallment,
            totalInstallments: isInstallment ? numMonths : undefined,
            principalAmount: isInstallment && numPrincipal > 0 ? numPrincipal.toFixed(2) : undefined,
            totalInterestAmount: isInstallment && calculatedInterestTotal > 0 ? calculatedInterestTotal.toFixed(2) : undefined,
            installmentPrincipal: isInstallment && principalPerMonth > 0 ? principalPerMonth.toFixed(2) : undefined,
            installmentInterest: isInstallment && interestPerMonth > 0 ? interestPerMonth.toFixed(2) : undefined,
            interestRate: isInstallment && interestCalcMode === 'rate' ? parseFloat(interestRate).toFixed(3) : undefined,
            autoApply,
            nextRunDate,
            note: note.trim() || undefined,
          },
          activeProfile?.id
        );
        onSuccess?.(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al programar el compromiso financiero.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 w-screen h-screen z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-background border border-border/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-primary/40 bg-primary/10 flex items-center justify-center text-primary">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEditing ? 'Editar Compromiso Periódico' : 'Nuevo Compromiso Financiero'}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                Salarios fijos, pagos recurrentes o deudas a plazo con intereses
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. Modal Mode Selector (Solo en creación) */}
          {!isEditing && (
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange('salary')}
                className={`p-3 border text-center transition-all flex flex-col items-center gap-1.5 ${
                  mode === 'salary'
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 font-semibold'
                    : 'border-border/50 hover:border-border text-foreground/80 bg-muted/5'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span className="text-[11px]">Salario / Ingreso Fijo</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('expense')}
                className={`p-3 border text-center transition-all flex flex-col items-center gap-1.5 ${
                  mode === 'expense'
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-semibold'
                    : 'border-border/50 hover:border-border text-foreground/80 bg-muted/5'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                <span className="text-[11px]">Gasto Fijo Mensual</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('debt')}
                className={`p-3 border text-center transition-all flex flex-col items-center gap-1.5 ${
                  mode === 'debt'
                    ? 'border-purple-500 bg-purple-500/10 text-purple-500 font-semibold'
                    : 'border-border/50 hover:border-border text-foreground/80 bg-muted/5'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span className="text-[11px]">Deuda a Cuotas</span>
              </button>
            </div>
          )}

          {/* 2. Nombre del Compromiso */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre del Compromiso
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Salario Empresa, Arriendo Apartamento, Crédito Computador..."
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors font-medium"
            />
          </div>

          {/* 3. Cuenta y Categoría */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mode === 'salary' ? 'Cuenta Receptora' : 'Cuenta de Pago'}
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id} className="bg-background text-foreground">
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Categoría
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">(Sin categoría específica)</option>
                {categories
                  .filter((c) => (mode === 'salary' ? c.type === 'income' : c.type === 'expense'))
                  .map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-background text-foreground">
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* 4. Especificaciones de Deuda con Intereses (Modo Deuda) */}
          {mode === 'debt' ? (
            <div className="p-4 border border-purple-500/30 bg-purple-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider">
                  Condiciones del Crédito / Deuda
                </span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setInterestCalcMode('cuota')}
                    className={`px-2 py-0.5 border ${
                      interestCalcMode === 'cuota'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold'
                        : 'border-border/40 text-muted-foreground'
                    }`}
                  >
                    Cuota Fija
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestCalcMode('rate')}
                    className={`px-2 py-0.5 border ${
                      interestCalcMode === 'rate'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300 font-bold'
                        : 'border-border/40 text-muted-foreground'
                    }`}
                  >
                    Tasa %
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">
                    Capital Prestado / Valor Compra
                  </label>
                  <CurrencyInput
                    value={principalAmount}
                    onChange={(cleanVal) => setPrincipalAmount(cleanVal)}
                    currency={currency}
                    placeholder={currency === 'COP' || currency === 'CLP' ? '0' : '0.00'}
                    required
                    className="w-full px-2.5 py-1.5 bg-background border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">
                    Número de Cuotas (Meses)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="360"
                    required
                    placeholder="12"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {interestCalcMode === 'cuota' ? (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">
                    Cuota Mensual Pactada con el Banco ({currency})
                  </label>
                  <CurrencyInput
                    value={amount}
                    onChange={(cleanVal) => setAmount(cleanVal)}
                    currency={currency}
                    placeholder={currency === 'COP' || currency === 'CLP' ? '0' : '0.00'}
                    required
                    className="w-full px-2.5 py-1.5 bg-background border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[10px] text-muted-foreground font-semibold">
                    Tasa de Interés Mensual (% M.V.)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="2.0"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-background border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Resumen Financiero en Vivo de Intereses */}
              {numPrincipal > 0 && (
                <div className="p-3 border border-purple-500/20 bg-background/50 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cuota mensual:</span>
                    <strong className="text-foreground">
                      {formatMoney(calculatedCuota, currency)}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total a pagar ({numMonths} meses):</span>
                    <span className="text-foreground">{formatMoney(calculatedTotalDebt, currency)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border/30 pt-1 text-purple-400">
                    <span>Intereses totales del crédito:</span>
                    <strong>+{formatMoney(calculatedInterestTotal, currency)}</strong>
                  </div>
                  <div className="text-[10px] text-muted-foreground pt-0.5">
                    Desglose aproximado por cuota: {formatMoney(principalPerMonth, currency)} capital + {formatMoney(interestPerMonth, currency)} intereses.
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* 4. Importe y Frecuencia para Salario o Gasto Fijo */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Importe por Período ({currency})
                </label>
                <CurrencyInput
                  value={amount}
                  onChange={(cleanVal) => setAmount(cleanVal)}
                  currency={currency}
                  placeholder={currency === 'COP' || currency === 'CLP' ? '0' : '0.00'}
                  required
                  className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-primary transition-colors font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Frecuencia
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as RecurrenceFrequency)}
                  className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors"
                >
                  {(Object.keys(FREQUENCY_LABELS) as RecurrenceFrequency[]).map((f) => (
                    <option key={f} value={f} className="bg-background text-foreground">
                      {FREQUENCY_LABELS[f]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* 5. Calendario y Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Día de Cobro/Pago del Mes
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-primary transition-colors"
              />
              <span className="text-[10px] text-muted-foreground font-mono">Día 1 al 31 de cada mes</span>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Fecha de Inicio / Primera Cuota
              </label>
              <input
                type="date"
                required
                value={nextRunDate}
                onChange={(e) => setNextRunDate(e.target.value)}
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors font-mono"
              />
            </div>
          </div>

          {/* 6. Modo de Aplicación */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Modo de Aplicación
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={autoApply}
                  onChange={(e) => setAutoApply(e.target.checked)}
                  className="rounded border-border/60 text-primary focus:ring-primary w-4 h-4"
                />
                <span className="text-foreground">Aplicar automáticamente al inicio del día</span>
              </label>
            </div>
            <p className="text-[10px] text-muted-foreground">
              {autoApply
                ? 'El sistema generará la transacción y actualizará el saldo de tu cuenta sin intervención.'
                : 'Koin te mostrará una alerta para confirmar o registrar el movimiento con 1 solo toque.'}
            </p>
          </div>

          {/* 7. Notas opcionales */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nota o Detalle Adicional
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Opcional: Número de contrato, banco emisor o referencia"
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border/50 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Guardar Cambios' : 'Programar Compromiso'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
