import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import {
  AccountDTO,
  AccountType,
  ALLOWED_ACCOUNT_ICONS,
  SUPPORTED_CURRENCIES,
  POPULAR_FINANCIAL_INSTITUTIONS,
  FinancialInstitution,
} from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { useAccountStore } from '../../stores/accountStore';
import { useAuthStore } from '../../stores/authStore';
import { ModalPortal } from '../common/ModalPortal';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountToEdit?: AccountDTO | null;
  onSuccess?: (account: AccountDTO) => void;
}

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Efectivo',
  bank: 'Cuenta Bancaria',
  credit: 'Tarjeta de Crédito',
  savings: 'Cuenta de Ahorros',
  investment: 'Inversiones',
};

const COLOR_PRESETS = [
  '#10B981', // Emerald
  '#F59E0B', // Gold
  '#6366F1', // Indigo
  '#EC4899', // Pink
  '#8B5CF6', // Purple
  '#3B82F6', // Blue
  '#14B8A6', // Teal
  '#F97316', // Orange
];

const buildAccountName = (accType: AccountType, institution: string) => {
  const typeLabel = ACCOUNT_TYPE_LABELS[accType];
  const trimmedInst = institution.trim();
  if (!trimmedInst) return typeLabel;
  return `${typeLabel} · ${trimmedInst}`;
};

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  accountToEdit,
  onSuccess,
}) => {
  const isEditing = !!accountToEdit;
  const { activeProfile } = useAuthStore();
  const { createAccount, updateAccount } = useAccountStore();

  const [name, setName] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState('USD');
  const [initialBalance, setInitialBalance] = useState('0.00');
  const [color, setColor] = useState('#10B981');
  const [icon, setIcon] = useState<string>('Building2');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCustomName, setIsCustomName] = useState(false);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name);
      setInstitutionName(accountToEdit.institutionName || '');
      setType(accountToEdit.type);
      setCurrency(accountToEdit.currency);
      setInitialBalance(accountToEdit.initialBalance);
      setColor(accountToEdit.color);
      setIcon(accountToEdit.icon);
      setIsCustomName(true);
    } else {
      const defaultType: AccountType = 'bank';
      setType(defaultType);
      setInstitutionName('');
      setName(ACCOUNT_TYPE_LABELS[defaultType]);
      setCurrency(activeProfile?.baseCurrency || 'USD');
      setInitialBalance('0.00');
      setColor('#10B981');
      setIcon('Building2');
      setIsCustomName(false);
    }
    setErrorMsg(null);
  }, [accountToEdit, isOpen, activeProfile?.baseCurrency]);

  if (!isOpen) return null;

  const handleTypeChange = (newType: AccountType) => {
    setType(newType);
    if (!isCustomName) {
      setName(buildAccountName(newType, institutionName));
    }
    // Contextual icon adaptation
    if (newType === 'bank' && icon === 'Wallet') setIcon('Building2');
    if (newType === 'credit') setIcon('CreditCard');
    if (newType === 'savings' && icon === 'CreditCard') setIcon('PiggyBank');
    if (newType === 'cash') setIcon('Wallet');
  };

  const handleInstitutionChange = (val: string) => {
    setInstitutionName(val);
    if (!isCustomName) {
      setName(buildAccountName(type, val));
    }
  };

  const handleSelectInstitution = (inst: FinancialInstitution) => {
    setInstitutionName(inst.name);

    let currentType = type;
    if (inst.defaultAccountType && (type === 'cash' || !isCustomName)) {
      currentType = inst.defaultAccountType;
      setType(currentType);
      if (currentType === 'bank') setIcon('Building2');
      if (currentType === 'savings') setIcon('PiggyBank');
      if (currentType === 'credit') setIcon('CreditCard');
    }

    if (!isCustomName) {
      setName(buildAccountName(currentType, inst.name));
    }

    // Set brand corporate color
    setColor(inst.color);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setIsCustomName(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor ingresa un nombre para la cuenta.');
      return;
    }

    setLoading(true);

    try {
      const instNameClean = institutionName.trim() || undefined;

      if (isEditing && accountToEdit) {
        const updated = await updateAccount(accountToEdit.id, {
          name: trimmedName,
          institutionName: instNameClean || null,
          type,
          color,
          icon,
        });
        onSuccess?.(updated);
        onClose();
      } else {
        const created = await createAccount(
          {
            name: trimmedName,
            institutionName: instNameClean,
            type,
            currency,
            initialBalance: initialBalance || '0.00',
            color,
            icon,
            isShared: false,
          },
          activeProfile?.id
        );
        onSuccess?.(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar la cuenta financiera.');
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
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${color}20`,
                borderColor: `${color}50`,
                color: color,
              }}
            >
              <KoinIcon name={icon} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEditing ? 'Editar Cuenta Financiera' : 'Crear Nueva Cuenta'}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {isEditing ? 'Ajusta entidad, nombre, icono y color' : 'Bancos, tarjetas de crédito, billeteras o ahorros'}
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. Tipo de Fondo */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Tipo de Fondo
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((tKey) => {
                const isSelected = type === tKey;
                return (
                  <button
                    type="button"
                    key={tKey}
                    onClick={() => handleTypeChange(tKey)}
                    className={`px-3 py-2 border text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border/40 hover:border-border text-foreground bg-muted/5'
                    }`}
                  >
                    {ACCOUNT_TYPE_LABELS[tKey]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Entidad o Banco (Chips rápidos + Campo de texto) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Entidad o Banco (Opcional)
              </label>
              {institutionName && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  Banco: <strong className="text-foreground">{institutionName}</strong>
                </span>
              )}
            </div>

            {/* Chips rápidos de bancos y billeteras */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POPULAR_FINANCIAL_INSTITUTIONS.map((inst) => {
                const isSelected = institutionName.toLowerCase() === inst.name.toLowerCase();
                return (
                  <button
                    type="button"
                    key={inst.name}
                    onClick={() => handleSelectInstitution(inst)}
                    className={`shrink-0 px-2.5 py-1 text-xs border flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary font-semibold shadow-xs'
                        : 'border-border/50 hover:border-border text-foreground/80 hover:text-foreground bg-muted/10'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: inst.color }}
                    />
                    <span>{inst.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Input de texto para banco libre */}
            <div className="relative">
              <input
                type="text"
                value={institutionName}
                onChange={(e) => handleInstitutionChange(e.target.value)}
                placeholder="Escribe o selecciona entidad (ej. Nu, Bancolombia, BBVA, Chase...)"
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors"
              />
              {institutionName && (
                <button
                  type="button"
                  onClick={() => handleInstitutionChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  title="Limpiar banco"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 3. Nombre de la Cuenta (editable y autocompletado) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nombre de la Cuenta
              </label>
              {!isCustomName && institutionName && (
                <span className="text-[10px] text-primary font-mono font-medium">
                  Autocompletado
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ej. Cuenta bancaria · Nu, Tarjeta de crédito · Bancolombia..."
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors font-medium"
            />
            <p className="text-[10px] text-muted-foreground">
              Puedes agregar especificaciones como "Black", "Nómina", "Digital", etc.
            </p>
          </div>

          {/* 4. Saldo Inicial & Divisa (solo al crear) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Saldo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                disabled={isEditing}
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              />
              {isEditing && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  El saldo se calcula en tiempo real por transacciones.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Moneda de la Cuenta
              </label>
              <select
                disabled={isEditing}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
              >
                {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                  <option key={c.code} value={c.code} className="bg-background text-foreground">
                    {c.code} - {c.name} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Selector de Icono Vectorial */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Icono de Identificación
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ALLOWED_ACCOUNT_ICONS.map((iconName) => {
                const isSelected = icon === iconName;
                return (
                  <button
                    type="button"
                    key={iconName}
                    onClick={() => setIcon(iconName)}
                    className={`p-2.5 flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary scale-105 shadow-sm'
                        : 'border-border/60 hover:border-border text-foreground/75 hover:text-foreground bg-muted/10'
                    }`}
                    title={iconName}
                  >
                    <KoinIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 6. Selector de Color */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Color Distintivo
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PRESETS.map((hex) => {
                const isSelected = color === hex;
                return (
                  <button
                    type="button"
                    key={hex}
                    onClick={() => setColor(hex)}
                    className={`w-7 h-7 rounded-full border transition-transform ${
                      isSelected ? 'ring-2 ring-primary ring-offset-2 scale-110' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                  />
                );
              })}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-7 h-7 rounded-full border border-border/60 cursor-pointer bg-transparent p-0"
                title="Color personalizado"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
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
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Cuenta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </ModalPortal>
  );
};
