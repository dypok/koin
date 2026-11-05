import React from 'react';

interface UnimplementedViewProps {
  moduleName: string;
  onGoToSettings: () => void;
}

export const UnimplementedView: React.FC<UnimplementedViewProps> = ({
  moduleName,
  onGoToSettings,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] space-y-5 animate-in fade-in duration-200">
      <div className="space-y-2">
        <span className="text-8xl font-black font-mono tracking-widest text-muted-foreground/20 select-none block">
          404
        </span>
        <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
          {moduleName}: Próximamente
        </h2>
        <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
          Esta sección se encuentra en desarrollo y estará disponible muy pronto.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onGoToSettings}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          Ir a Configuración
        </button>
      </div>
    </div>
  );
};
