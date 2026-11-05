import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  // Handle keyboard Escape and Enter
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: <Trash2 className="w-5 h-5 text-destructive" />,
          iconBg: 'bg-destructive/10 border-destructive/30 text-destructive',
          confirmBtn:
            'bg-destructive text-destructive-foreground hover:bg-destructive/90 focus:ring-destructive/30',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
          iconBg: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
          confirmBtn:
            'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500/30',
        };
      case 'primary':
      default:
        return {
          icon: <Info className="w-5 h-5 text-primary" />,
          iconBg: 'bg-primary/10 border-primary/30 text-primary',
          confirmBtn:
            'bg-primary text-primary-foreground hover:opacity-90 focus:ring-primary/30',
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md border border-border/80 bg-background p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${styles.iconBg}`}
          >
            {styles.icon}
          </div>

          <div className="flex-1 pr-4">
            <h3
              id="confirm-modal-title"
              className="text-base font-bold text-foreground tracking-tight leading-snug"
            >
              {title}
            </h3>

            <div className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {description}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold border border-border/70 text-muted-foreground hover:text-foreground hover:border-border transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 ${styles.confirmBtn}`}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
