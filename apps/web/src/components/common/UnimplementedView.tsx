import React from 'react';

interface UnimplementedViewProps {
  moduleName: string;
  epicNumber: number;
  epicTitle: string;
  onGoToProfiles: () => void;
}

export const UnimplementedView: React.FC<UnimplementedViewProps> = ({
  moduleName,
  epicNumber,
  epicTitle,
  onGoToProfiles,
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh] space-y-5 animate-in fade-in duration-200">
      <div className="space-y-2">
        <span className="text-8xl font-black font-mono tracking-widest text-muted-foreground/20 select-none block">
          404
        </span>
        <h2 className="text-base font-bold tracking-tight text-foreground uppercase">
          {moduleName}: Módulo No Disponible
        </h2>
        <p className="text-xs text-muted-foreground max-w-md font-mono mx-auto leading-relaxed">
          Esta funcionalidad pertenece a la Épica {epicNumber} ({epicTitle}) y aún no ha sido implementada.
          No se presentan datos simulados (<em>mock</em>) en esta pantalla.
        </p>
      </div>

      <div className="pt-2">
        <button
          onClick={onGoToProfiles}
          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity active:scale-95"
        >
          Ir a Perfiles Soberanos (Épica 3)
        </button>
      </div>
    </div>
  );
};
