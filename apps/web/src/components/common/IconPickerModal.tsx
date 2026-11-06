import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { ALLOWED_CATEGORY_ICONS, AllowedCategoryIcon } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';

interface IconPickerModalProps {
  isOpen: boolean;
  selectedIcon: string;
  onSelect: (icon: AllowedCategoryIcon) => void;
  onClose: () => void;
  title?: string;
}

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  selectedIcon,
  onSelect,
  onClose,
  title = 'Seleccionar Icono',
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIcons = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return ALLOWED_CATEGORY_ICONS;
    return ALLOWED_CATEGORY_ICONS.filter((icon) => icon.toLowerCase().includes(term));
  }, [searchTerm]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-md border border-border/40 shadow-xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tracking-tight">{title}</span>
            <span className="text-xs text-muted-foreground font-mono">({filteredIcons.length})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Cerrar selector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/40 bg-muted/20">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar icono por nombre (ej: Dumbbell, Car, Coffee)..."
              className="w-full bg-background border border-border/40 pl-9 pr-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="p-4 overflow-y-auto flex-1">
          {filteredIcons.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No se encontraron iconos que coincidan con "{searchTerm}"
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {filteredIcons.map((iconName) => {
                const isSelected = selectedIcon === iconName;
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => {
                      onSelect(iconName);
                      onClose();
                    }}
                    title={iconName}
                    className={`flex flex-col items-center justify-center gap-1.5 p-2.5 transition-all text-center group border ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-border/20 hover:border-border/60 hover:bg-muted/40 text-foreground'
                    }`}
                  >
                    <KoinIcon
                      name={iconName}
                      className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                    <span className="text-[10px] font-mono truncate w-full px-0.5 leading-tight">
                      {iconName}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-border/40 bg-muted/10 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Estándar Lucide SVG · Cero Emojis</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 text-xs border border-border/40 hover:bg-muted/50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
