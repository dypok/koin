import React, { useEffect, useState } from 'react';
import { RotateCcw, X, Check } from 'lucide-react';
import { useTransactionStore } from '../../stores/transactionStore';

export const UndoToast: React.FC = () => {
  const { recentToast, undoLastTransaction, dismissToast } = useTransactionStore();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!recentToast) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [recentToast]);

  if (!recentToast) return null;

  const isExpense = recentToast.type === 'expense';
  const isIncome = recentToast.type === 'income';
  const isTransfer = recentToast.type === 'transfer';

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-background/95 backdrop-blur-md border border-border/80 px-4 py-3 flex items-center justify-between gap-4 text-xs">
        {/* Left: Status icon & description */}
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 stroke-[2.5]" />
          </div>
          <div className="truncate">
            <p className="font-medium text-foreground truncate">
              {isExpense && (
                <>
                  Gasto de <span className="font-semibold font-mono">{recentToast.currency} {recentToast.amount}</span> en <span className="font-semibold">{recentToast.categoryName}</span>
                </>
              )}
              {isIncome && (
                <>
                  Ingreso de <span className="font-semibold font-mono">{recentToast.currency} {recentToast.amount}</span> en <span className="font-semibold">{recentToast.categoryName}</span>
                </>
              )}
              {isTransfer && (
                <>
                  Transferencia de <span className="font-semibold font-mono">{recentToast.currency} {recentToast.amount}</span> realizada
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={undoLastTransaction}
            className="flex items-center gap-1.5 px-2.5 py-1 font-semibold text-primary hover:bg-primary/10 transition-colors uppercase tracking-wider text-[11px]"
            title="Revertir movimiento inmediatamente"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Deshacer</span>
          </button>

          <button
            onClick={dismissToast}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            title="Cerrar notificación"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 5-second progress indicator bar */}
      <div className="h-[2px] w-full bg-border/40 overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
