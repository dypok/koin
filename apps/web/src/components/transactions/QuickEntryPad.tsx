import React, { useCallback } from 'react';
import { Delete, RotateCcw } from 'lucide-react';
import { hapticFeedback } from '../../lib/haptics';

interface QuickEntryPadProps {
  amount: string;
  onAmountChange: (newAmount: string) => void;
  currency: string;
  className?: string;
  disabled?: boolean;
}

const STANDARD_CHIPS = [5, 10, 20, 50, 100];
const PESO_CHIPS = [10000, 20000, 50000, 100000, 200000];

export const QuickEntryPad: React.FC<QuickEntryPadProps> = ({
  amount,
  onAmountChange,
  currency,
  className = '',
  disabled = false,
}) => {
  const isZeroDec = currency === 'COP' || currency === 'CLP';
  const quickChips = isZeroDec ? PESO_CHIPS : STANDARD_CHIPS;
  // Handle digit press (0-9)
  const handleDigit = useCallback(
    (digit: string) => {
      if (disabled) return;
      hapticFeedback.light();

      // If empty or "0", replace with digit unless digit is "0"
      if (!amount || amount === '0') {
        onAmountChange(digit);
        return;
      }

      // Check decimal places constraint: maximum 2 decimals
      if (amount.includes('.')) {
        const [, decimals] = amount.split('.');
        if (decimals && decimals.length >= 2) {
          return; // Max 2 decimal precision reached
        }
      }

      // Prevent unrealistically long strings (max 11 chars)
      if (amount.length >= 11) return;

      onAmountChange(amount + digit);
    },
    [amount, onAmountChange, disabled]
  );

  // Handle decimal dot (.)
  const handleDot = useCallback(() => {
    if (disabled || isZeroDec) return;
    hapticFeedback.light();

    if (!amount) {
      onAmountChange('0.');
      return;
    }
    if (!amount.includes('.')) {
      onAmountChange(amount + '.');
    }
  }, [amount, onAmountChange, disabled, isZeroDec]);

  // Handle backspace (⌫)
  const handleBackspace = useCallback(() => {
    if (disabled) return;
    hapticFeedback.medium();

    if (!amount) return;
    if (amount.length <= 1) {
      onAmountChange('');
    } else {
      onAmountChange(amount.slice(0, -1));
    }
  }, [amount, onAmountChange, disabled]);

  // Handle clear (C)
  const handleClear = useCallback(() => {
    if (disabled) return;
    hapticFeedback.medium();
    onAmountChange('');
  }, [onAmountChange, disabled]);

  // Handle quick amount increment chips (+5, +10, +20, etc.)
  const handleAddChip = useCallback(
    (value: number) => {
      if (disabled) return;
      hapticFeedback.light();

      const current = parseFloat(amount) || 0;
      const next = current + value;
      // If integer, display without trailing decimals for cleaner view
      if (Number.isInteger(next)) {
        onAmountChange(next.toString());
      } else {
        onAmountChange(next.toFixed(2));
      }
    },
    [amount, onAmountChange, disabled]
  );

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Quick Amount Increment Chips */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {quickChips.map((val) => (
          <button
            key={val}
            type="button"
            disabled={disabled}
            onClick={() => handleAddChip(val)}
            className="px-2.5 py-1 text-xs font-mono font-bold border border-border/80 bg-muted/15 hover:border-primary hover:bg-primary/10 hover:text-primary text-foreground transition-all active:scale-95 disabled:opacity-50"
            title={`Sumar ${val} ${currency}`}
          >
            +{val >= 1000 ? `${val / 1000}k` : val}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || !amount}
          onClick={handleClear}
          className="px-2.5 py-1 text-xs font-mono font-semibold border border-destructive/40 bg-destructive/5 hover:border-destructive hover:bg-destructive/15 text-destructive transition-all active:scale-95 disabled:opacity-30 flex items-center gap-1"
          title="Limpiar importe"
        >
          <RotateCcw className="w-3 h-3" />
          <span>C</span>
        </button>
      </div>

      {/* Tactile Keypad Grid (3 columns x 4 rows) */}
      <div className="grid grid-cols-3 gap-1.5 max-w-xs mx-auto">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleDigit(digit)}
            className="h-11 sm:h-12 border border-border/70 bg-card hover:border-primary hover:bg-primary/5 active:bg-primary/20 text-foreground font-mono font-bold text-lg rounded-none transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center select-none shadow-2xs"
          >
            {digit}
          </button>
        ))}

        {/* Decimal Dot */}
        <button
          type="button"
          disabled={disabled || isZeroDec}
          onClick={handleDot}
          className={`h-11 sm:h-12 border border-border/70 bg-card text-foreground font-mono font-bold text-xl rounded-none transition-all flex items-center justify-center select-none shadow-2xs ${
            isZeroDec
              ? 'opacity-20 cursor-not-allowed'
              : 'hover:border-primary hover:bg-primary/5 active:bg-primary/20 active:scale-98 disabled:opacity-50'
          }`}
          title={isZeroDec ? 'Moneda sin centavos' : 'Punto decimal'}
        >
          {isZeroDec ? '-' : '.'}
        </button>

        {/* Zero */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleDigit('0')}
          className="h-11 sm:h-12 border border-border/70 bg-card hover:border-primary hover:bg-primary/5 active:bg-primary/20 text-foreground font-mono font-bold text-lg rounded-none transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center select-none shadow-2xs"
        >
          0
        </button>

        {/* Backspace */}
        <button
          type="button"
          disabled={disabled || !amount}
          onClick={handleBackspace}
          className="h-11 sm:h-12 border border-border/70 bg-muted/20 hover:border-destructive/60 hover:bg-destructive/10 active:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-none transition-all active:scale-98 disabled:opacity-30 flex items-center justify-center select-none shadow-2xs"
          title="Borrar último dígito"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
