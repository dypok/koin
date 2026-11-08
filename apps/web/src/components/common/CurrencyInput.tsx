import React, { useRef } from 'react';
import {
  formatAmountForDisplay,
  parseDisplayToRaw,
  getCurrencySeparators,
} from '../../lib/currency';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
}

/**
 * CurrencyInput
 * Accessible text input tailored for monetary entry with live thousand separators.
 * Preserves a clean numeric string for parent state (e.g. "1500000" or "1500000.50")
 * while rendering formatted numbers in real time (e.g. "1.500.000" or "1,500,000.50").
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      currency = 'USD',
      className = '',
      placeholder = '0.00',
      ...rest
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLInputElement | null>(null);

    const setRef = (node: HTMLInputElement | null) => {
      internalRef.current = node;
      if (typeof forwardedRef === 'function') {
        forwardedRef(node);
      } else if (forwardedRef) {
        (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
      }
    };

    const displayValue = formatAmountForDisplay(value, currency);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const rawInput = input.value;
      const prevCursor = input.selectionStart || 0;

      const { group } = getCurrencySeparators(currency);
      const charsBeforeCursor = rawInput.slice(0, prevCursor).split(group).join('').length;

      const cleanRaw = parseDisplayToRaw(rawInput, currency);
      onChange(cleanRaw);

      // Restore cursor position seamlessly on the next animation frame
      requestAnimationFrame(() => {
        if (!internalRef.current) return;
        const newFormatted = formatAmountForDisplay(cleanRaw, currency);
        let count = 0;
        let targetPos = newFormatted.length;
        for (let i = 0; i < newFormatted.length; i++) {
          if (newFormatted[i] !== group) {
            count++;
          }
          if (count === charsBeforeCursor) {
            targetPos = i + 1;
            break;
          }
        }
        if (targetPos <= newFormatted.length) {
          internalRef.current.setSelectionRange(targetPos, targetPos);
        }
      });
    };

    return (
      <input
        ref={setRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck="false"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
        {...rest}
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
