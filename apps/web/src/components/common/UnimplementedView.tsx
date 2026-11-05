import React from 'react';
import { ArrowRight } from 'lucide-react';

interface UnimplementedViewProps {
  moduleName: string;
  onGoToSettings?: () => void;
  onGoToAccounts?: () => void;
}

export const UnimplementedView: React.FC<UnimplementedViewProps> = ({
  moduleName,
  onGoToSettings,
  onGoToAccounts,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] space-y-6 animate-in fade-in duration-200">
      <div className="space-y-2 max-w-md mx-auto">
        <span className="text-[11px] font-mono font-bold tracking-widest text-primary uppercase block">
          Próximamente
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {moduleName}
        </h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Esta sección se encuentra en desarrollo activo y estará disponible en una próxima versión de Koin.
        </p>
      </div>

      <div className="flex items-center gap-3 pt-2">
        {onGoToAccounts && (
          <button
            type="button"
            onClick={onGoToAccounts}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95 shadow-sm flex items-center gap-1.5"
          >
            <span>Ver Cuentas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}

        {onGoToSettings && (
          <button
            type="button"
            onClick={onGoToSettings}
            className="px-4 py-2 border border-border/80 bg-muted/10 hover:bg-muted/20 text-foreground text-xs font-semibold transition-colors active:scale-95"
          >
            Ir a Configuración
          </button>
        )}
      </div>
    </div>
  );
};
