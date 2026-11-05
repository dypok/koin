import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  FileText,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Tag as TagIcon,
  Check,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { KoinIcon } from '../../lib/icons';
import { CategoryWithUsageDTO } from '@koin/shared';

interface QuickTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAccountId?: string;
  defaultType?: 'expense' | 'income' | 'transfer';
}

export const QuickTransactionModal: React.FC<QuickTransactionModalProps> = ({
  isOpen,
  onClose,
  defaultAccountId,
  defaultType = 'expense',
}) => {
  const { activeProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const {
    categories,
    exchangeRates,
    fetchCategories,
    fetchExchangeRates,
    createTransaction,
    createTransfer,
    error,
    clearError,
  } = useTransactionStore();

  const { rules, fetchRules, applyRuleNow, createRule } = useRecurringStore();

  const [mode, setMode] = useState<'expense' | 'income' | 'transfer'>(defaultType);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showExtraDetails, setShowExtraDetails] = useState(false);
  const [customRate, setCustomRate] = useState<string>('');
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Recurring selector state
  const [showRecurringSelector, setShowRecurringSelector] = useState(false);
  const [selectedRecurringRuleId, setSelectedRecurringRuleId] = useState<string | null>(null);
  const [createAsRecurring, setCreateAsRecurring] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Initialize data on open
  useEffect(() => {
    if (isOpen) {
      clearError();
      fetchCategories();
      fetchExchangeRates();

      setMode(defaultType);
      setAmount('');
      setNote('');
      setSelectedCategoryId('');
      setShowAllCategories(false);
      setShowExtraDetails(false);
      setIsEditingRate(false);
      setCustomRate('');
      setAmountError(false);
      setSubmitError(null);
      setShowRecurringSelector(false);
      setSelectedRecurringRuleId(null);
      setCreateAsRecurring(false);

      if (activeProfile?.id) {
        fetchRules(activeProfile.id);
      }

      // Select initial account
      if (defaultAccountId && accounts.some((a) => a.id === defaultAccountId)) {
        setSelectedAccountId(defaultAccountId);
      } else if (accounts.length > 0) {
        setSelectedAccountId(accounts[0].id);
      }

      // Select initial toAccount for transfers
      if (accounts.length > 1) {
        const other = accounts.find((a) => a.id !== (defaultAccountId || accounts[0]?.id));
        if (other) setToAccountId(other.id);
      }

      // Auto-focus amount input
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, defaultType, defaultAccountId, accounts, activeProfile?.id, fetchRules]);

  // Active recurring expenses and debts for quick selection
  const recurringExpenses = useMemo(() => {
    return rules.filter(
      (r) => (r.type === 'expense' || r.isInstallment) && r.status === 'active'
    );
  }, [rules]);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || accounts[0],
    [accounts, selectedAccountId]
  );

  const selectedToAccount = useMemo(
    () => accounts.find((a) => a.id === toAccountId) || accounts.find((a) => a.id !== selectedAccountId),
    [accounts, toAccountId, selectedAccountId]
  );

  const profileBaseCurrency = activeProfile?.baseCurrency || 'USD';
  const isMulticurrency = selectedAccount && selectedAccount.currency !== profileBaseCurrency;

  // Resolve standard exchange rate between account currency and profile base currency
  const autoRateToBase = useMemo(() => {
    if (!selectedAccount) return '1';
    if (selectedAccount.currency === profileBaseCurrency) return '1';

    const directPair = `${selectedAccount.currency}_${profileBaseCurrency}`;
    const direct = exchangeRates.find((r) => r.pair === directPair);
    if (direct) return direct.rate;

    const inversePair = `${profileBaseCurrency}_${selectedAccount.currency}`;
    const inverse = exchangeRates.find((r) => r.pair === inversePair);
    if (inverse && parseFloat(inverse.rate) > 0) {
      return (1 / parseFloat(inverse.rate)).toFixed(6);
    }

    return '1';
  }, [selectedAccount, profileBaseCurrency, exchangeRates]);

  const effectiveRate = customRate ? customRate : autoRateToBase;

  // Real-time base equivalent calculation
  const calculatedBaseAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    const numRate = parseFloat(effectiveRate);
    if (isNaN(numAmount) || numAmount <= 0 || isNaN(numRate) || numRate <= 0) return null;
    return (numAmount * numRate).toFixed(2);
  }, [amount, effectiveRate]);

  // For Transfers: resolve conversion rate between source and destination currencies
  const transferConversionRate = useMemo(() => {
    if (!selectedAccount || !selectedToAccount) return '1';
    if (selectedAccount.currency === selectedToAccount.currency) return '1';

    const directPair = `${selectedAccount.currency}_${selectedToAccount.currency}`;
    const direct = exchangeRates.find((r) => r.pair === directPair);
    if (direct) return direct.rate;

    const inversePair = `${selectedToAccount.currency}_${selectedAccount.currency}`;
    const inverse = exchangeRates.find((r) => r.pair === inversePair);
    if (inverse && parseFloat(inverse.rate) > 0) {
      return (1 / parseFloat(inverse.rate)).toFixed(6);
    }

    return '1';
  }, [selectedAccount, selectedToAccount, exchangeRates]);

  const calculatedToAmount = useMemo(() => {
    const numAmount = parseFloat(amount);
    const numRate = parseFloat(transferConversionRate);
    if (isNaN(numAmount) || numAmount <= 0 || isNaN(numRate) || numRate <= 0) return null;
    return (numAmount * numRate).toFixed(2);
  }, [amount, transferConversionRate]);

  // Filter categories by type and separate top 6 frequent vs remaining
  const { topFrequentCategories, otherCategories } = useMemo(() => {
    if (mode === 'transfer') {
      return { topFrequentCategories: [], otherCategories: [] };
    }
    const filtered = categories.filter((c) => c.type === mode);
    // Categories from backend are already sorted by usageCount DESC
    const top = filtered.slice(0, 6);
    const others = filtered.slice(6);
    return { topFrequentCategories: top, otherCategories: others };
  }, [categories, mode]);

  // ---------------------------------------------------------
  // 2-TOUCH QUICK SAVE HANDLER
  // ---------------------------------------------------------
  const handleQuickCategorySave = async (category: CategoryWithUsageDTO) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError(true);
      amountInputRef.current?.focus();
      return;
    }

    // Android / Web Haptic Feedback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch (_) {}
    }

    // Immediate optimistic closure (<100ms)
    onClose();

    try {
      await createTransaction({
        accountId: selectedAccount.id,
        categoryId: category.id,
        type: mode,
        amount: numAmount.toFixed(2),
        currency: selectedAccount.currency,
        exchangeRateToBase: isMulticurrency && customRate ? customRate : undefined,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        note: note.trim() || undefined,
        isRecurring: false,
      });
    } catch (err) {
      console.error('Error during quick transaction save:', err);
    }
  };

  // Explicit form submit handler (with extra details or for transfers)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setAmountError(true);
      amountInputRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'transfer') {
        if (!selectedToAccount || selectedToAccount.id === selectedAccount.id) {
          setSubmitError('Debes seleccionar una cuenta de destino diferente a la de origen');
          setIsSubmitting(false);
          return;
        }

        onClose();

        await createTransfer({
          fromAccountId: selectedAccount.id,
          toAccountId: selectedToAccount.id,
          amount: numAmount.toFixed(2),
          toAmount: calculatedToAmount || undefined,
          date: date ? new Date(date).toISOString() : new Date().toISOString(),
          note: note.trim() || undefined,
        });
      } else {
        if (!selectedCategoryId) {
          setSubmitError('Por favor selecciona una categoría para clasificar el movimiento');
          setIsSubmitting(false);
          return;
        }

        onClose();

        if (selectedRecurringRuleId) {
          // User selected an existing recurring expense/debt -> Apply payment directly
          await applyRuleNow(selectedRecurringRuleId);
          if (activeProfile?.id) {
            fetchAccounts(activeProfile.id);
          }
        } else {
          // Standard transaction creation
          await createTransaction({
            accountId: selectedAccount.id,
            categoryId: selectedCategoryId,
            type: mode,
            amount: numAmount.toFixed(2),
            currency: selectedAccount.currency,
            exchangeRateToBase: isMulticurrency && customRate ? customRate : undefined,
            date: date ? new Date(date).toISOString() : new Date().toISOString(),
            note: note.trim() || undefined,
            isRecurring: false,
          });

          // If user checked "Guardar como compromiso recurrente mensual"
          if (createAsRecurring && activeProfile?.id) {
            await createRule(
              {
                name: note.trim() || (mode === 'income' ? 'Ingreso Recurrente' : 'Gasto Fijo Recurrente'),
                accountId: selectedAccount.id,
                categoryId: selectedCategoryId,
                type: mode,
                amount: numAmount.toFixed(2),
                currency: selectedAccount.currency,
                frequency: 'monthly',
                dayOfMonth: date ? new Date(date).getDate() : 1,
                nextRunDate: date ? new Date(date).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
                autoApply: true,
                isInstallment: false,
              },
              activeProfile.id
            );
          }
        }
      }
    } catch (err: any) {
      console.error('Submit transaction error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-background border border-border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header & Mode Switcher */}
        <div className="p-4 border-b border-border/50 flex items-center justify-between gap-3 shrink-0">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-muted/40 p-1 border border-border/60">
            <button
              type="button"
              onClick={() => {
                setMode('expense');
                setSelectedCategoryId('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === 'expense'
                  ? 'bg-background text-destructive shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Gasto</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('income');
                setSelectedCategoryId('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === 'income'
                  ? 'bg-background text-primary shadow-sm border border-border/80'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('transfer');
                setSelectedCategoryId('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                mode === 'transfer'
                  ? 'bg-background text-foreground shadow-sm border border-border/80 font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transferencia</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {(error || submitError) && (
            <div className="p-3 text-xs bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-between animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{submitError || error}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSubmitError(null);
                  clearError();
                }}
                className="text-destructive/70 hover:text-destructive p-0.5"
                aria-label="Cerrar advertencia"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Account Selector(s) */}
          {mode === 'transfer' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* From Account */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cuenta Origen
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => {
                    setSelectedAccountId(e.target.value);
                    if (e.target.value === toAccountId) {
                      const other = accounts.find((a) => a.id !== e.target.value);
                      if (other) setToAccountId(other.id);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.currency} {acc.currentBalance})
                    </option>
                  ))}
                </select>
              </div>

              {/* To Account */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cuenta Destino
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                >
                  {accounts
                    .filter((a) => a.id !== selectedAccountId)
                    .map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.currency} {acc.currentBalance})
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Cuenta
                </label>
                {selectedAccount && (
                  <span className="text-[11px] font-mono text-muted-foreground">
                    Saldo disponible: <strong className="text-foreground">{selectedAccount.currency} {selectedAccount.currentBalance}</strong>
                  </span>
                )}
              </div>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:border-primary font-medium"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency} {acc.currentBalance}) {acc.isShared ? '· Compartida' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Recurring Expense Quick Selector (Only in Expense mode) */}
          {mode === 'expense' && recurringExpenses.length > 0 && (
            <div className="p-3 border border-purple-500/30 bg-purple-500/5 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground flex items-center gap-1.5 text-[11px]">
                  <Calendar className="w-3.5 h-3.5 text-purple-400" />
                  ¿Es un gasto fijo programado?
                </span>
                <button
                  type="button"
                  onClick={() => setShowRecurringSelector(!showRecurringSelector)}
                  className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline font-semibold"
                >
                  {showRecurringSelector ? 'Ocultar fijos' : 'Cargar desde compromiso'}
                </button>
              </div>

              {selectedRecurringRuleId && (
                <div className="flex items-center justify-between text-[11px] text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2.5 py-1 font-mono">
                  <span>
                    Compromiso seleccionado:{' '}
                    <strong>{rules.find((r) => r.id === selectedRecurringRuleId)?.name}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRecurringRuleId(null);
                      setAmount('');
                      setNote('');
                    }}
                    className="text-muted-foreground hover:text-foreground ml-2"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {showRecurringSelector && (
                <div className="pt-2 border-t border-purple-500/20 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {recurringExpenses.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => {
                        setAmount(r.amount);
                        if (r.accountId && accounts.some((a) => a.id === r.accountId)) {
                          setSelectedAccountId(r.accountId);
                        }
                        if (r.categoryId) {
                          setSelectedCategoryId(r.categoryId);
                        }
                        setNote(r.name);
                        setSelectedRecurringRuleId(r.id);
                        setShowRecurringSelector(false);
                      }}
                      className="p-2 text-left border border-border/60 bg-background hover:border-purple-500/50 hover:bg-muted/10 transition-colors flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-[11px] font-bold text-foreground truncate">{r.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {r.isInstallment
                            ? `Cuota ${r.currentInstallment + 1}/${r.totalInstallments}`
                            : 'Gasto Fijo'}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-purple-400 shrink-0">
                        ${parseFloat(r.amount).toFixed(2)}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Amount Input */}
          <div className="space-y-2 text-center py-2">
            <div className="inline-flex items-center justify-center gap-2 border-b-2 pb-1 px-4 transition-colors border-primary">
              <span className="text-2xl font-bold font-mono text-muted-foreground">
                {selectedAccount?.currency || profileBaseCurrency}
              </span>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (amountError) setAmountError(false);
                }}
                className="w-48 text-4xl sm:text-5xl font-extrabold font-mono tracking-tight bg-transparent text-foreground placeholder:text-muted-foreground/30 focus:outline-none text-center"
              />
            </div>
            {amountError && (
              <p className="text-xs text-destructive font-medium">
                Digita un importe mayor a cero antes de seleccionar la categoría
              </p>
            )}

            {/* Multicurrency Indicators (TXN-03 & TXN-04) */}
            {mode === 'transfer' && selectedAccount && selectedToAccount && selectedAccount.currency !== selectedToAccount.currency && (
              <div className="pt-2 text-xs text-muted-foreground flex items-center justify-center gap-2 font-mono">
                <span>
                  1 {selectedAccount.currency} ≈ {transferConversionRate} {selectedToAccount.currency}
                </span>
                {calculatedToAmount && (
                  <span className="text-foreground font-semibold">
                    (Destino recibe: ~{selectedToAccount.currency} {calculatedToAmount})
                  </span>
                )}
              </div>
            )}

            {mode !== 'transfer' && isMulticurrency && (
              <div className="pt-2 space-y-1">
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground font-mono">
                  <span>
                    1 {selectedAccount.currency} = {effectiveRate} {profileBaseCurrency}
                  </span>
                  {calculatedBaseAmount && (
                    <span className="text-foreground font-semibold">
                      (~{profileBaseCurrency} {calculatedBaseAmount})
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsEditingRate(!isEditingRate)}
                    className="p-1 text-primary hover:underline flex items-center gap-0.5 text-[10px]"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>{isEditingRate ? 'Cerrar' : 'Ajustar'}</span>
                  </button>
                </div>

                {isEditingRate && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">Tasa personalizada:</span>
                    <input
                      type="number"
                      step="0.000001"
                      placeholder={autoRateToBase}
                      value={customRate}
                      onChange={(e) => setCustomRate(e.target.value)}
                      className="w-28 px-2 py-1 text-xs bg-background border border-border text-foreground font-mono focus:outline-none focus:border-primary text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomRate('')}
                      className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      <span>Auto</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ----------------------------------------------------- */}
          {/* 2-TOUCH CATEGORIES GRID (EXPENSE & INCOME)            */}
          {/* ----------------------------------------------------- */}
          {mode !== 'transfer' && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span>Categorías Frecuentes</span>
                  <span className="text-[10px] font-normal text-muted-foreground/70">(Toca para guardar en 2 toques)</span>
                </span>
                {otherCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories(!showAllCategories)}
                    className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>{showAllCategories ? 'Menos' : `Ver todas (${categories.filter((c) => c.type === mode).length})`}</span>
                    {showAllCategories ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>

              {/* 6 Frequent Categories Quick Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {topFrequentCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(cat.id);
                      handleQuickCategorySave(cat);
                    }}
                    className={`p-3 border flex flex-col items-center justify-center gap-2 text-center transition-all group ${
                      selectedCategoryId === cat.id
                        ? 'border-primary bg-primary/10 shadow-sm'
                        : 'border-border/70 hover:border-primary/60 hover:bg-muted/30 bg-muted/10'
                    }`}
                  >
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        color: cat.color,
                        borderColor: `${cat.color}30`,
                      }}
                    >
                      <KoinIcon name={cat.icon || 'Tag'} className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-semibold text-foreground line-clamp-1">
                      {cat.name}
                    </span>
                    {cat.usageCount > 0 && (
                      <span className="text-[9px] text-muted-foreground font-mono">
                        {cat.usageCount} {cat.usageCount === 1 ? 'uso' : 'usos'}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Expanded Category Grid */}
              {showAllCategories && otherCategories.length > 0 && (
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    Otras Categorías
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
                    {otherCategories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategoryId(cat.id);
                          handleQuickCategorySave(cat);
                        }}
                        className={`p-2 border flex items-center gap-2 text-left transition-colors ${
                          selectedCategoryId === cat.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border/60 hover:border-primary/50 bg-background'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${cat.color}15`,
                            color: cat.color,
                          }}
                        >
                          <KoinIcon name={cat.icon || 'Tag'} className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-medium text-foreground truncate">
                          {cat.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Toggle Optional Extra Details (Note, Date, Tags) */}
          <div className="pt-2 border-t border-border/40">
            <button
              type="button"
              onClick={() => setShowExtraDetails(!showExtraDetails)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors font-medium"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{showExtraDetails ? 'Ocultar detalles adicionales' : 'Agregar nota o fecha diferente'}</span>
              {showExtraDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {showExtraDetails && (
              <div className="mt-3 space-y-3 p-3 bg-muted/20 border border-border/50">
                {/* Note */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Nota o Descripción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Cena con amigos, supermercado semanal..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Fecha del movimiento</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-background border border-border text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Save as recurring rule checkbox (only for expense/income and if not loaded from rule) */}
                {mode !== 'transfer' && !selectedRecurringRuleId && (
                  <div className="pt-2 border-t border-border/30">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={createAsRecurring}
                        onChange={(e) => setCreateAsRecurring(e.target.checked)}
                        className="rounded border-border text-primary focus:ring-primary/20"
                      />
                      <span className="text-xs font-semibold text-foreground">
                        Guardar como compromiso recurrente mensual
                      </span>
                    </label>
                    <p className="text-[10px] text-muted-foreground ml-5 mt-0.5">
                      Se programará una regla automática para registrar este movimiento cada mes.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions (Mandatory for transfers or manual save with extra details) */}
        {(mode === 'transfer' || showExtraDetails || selectedCategoryId) && (
          <div className="p-4 border-t border-border/50 bg-muted/10 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {mode === 'transfer' ? 'Completar Transferencia' : 'Guardar Movimiento'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
