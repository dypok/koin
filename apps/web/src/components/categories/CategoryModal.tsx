import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { CategoryDTO, AllowedCategoryIcon } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { IconPickerModal } from '../common/IconPickerModal';

interface CategoryModalProps {
  isOpen: boolean;
  category?: CategoryDTO | null;
  onClose: () => void;
  onSave: (data: {
    name: string;
    type: 'expense' | 'income';
    icon: string;
    color: string;
  }) => Promise<void>;
}

const PRESET_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#14B8A6', // Teal
  '#84CC16', // Lime
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  category,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [icon, setIcon] = useState<string>('Tag');
  const [color, setColor] = useState<string>('#3B82F6');
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setType(category.type);
      setIcon(category.icon || 'Tag');
      setColor(category.color || '#3B82F6');
    } else {
      setName('');
      setType('expense');
      setIcon('Tag');
      setColor('#3B82F6');
    }
    setError(null);
  }, [category, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la categoría es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSave({
        name: name.trim(),
        type,
        icon,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al guardar la categoría.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-card w-full max-w-sm border border-border/40 shadow-xl flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <span className="text-sm font-semibold tracking-tight">
              {category ? 'Editar Categoría' : 'Nueva Categoría'}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {error && (
              <div className="p-2.5 text-xs text-rose-500 bg-rose-500/10 border border-rose-500/20">
                {error}
              </div>
            )}

            {/* Type selector */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Tipo de Movimiento</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-xs font-medium border transition-colors ${
                    type === 'expense'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border/40 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  Gasto
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-xs font-medium border transition-colors ${
                    type === 'income'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border/40 hover:bg-muted/50 text-muted-foreground'
                  }`}
                >
                  Ingreso
                </button>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Nombre de la Categoría</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Gimnasio, Restaurantes, Sueldo..."
                className="w-full bg-background border border-border/40 px-3 py-2 text-xs focus:outline-none focus:border-primary"
                maxLength={100}
                autoFocus
              />
            </div>

            {/* Icon Picker preview button */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Icono SVG Lucide</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 border border-border/40 flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  <KoinIcon name={icon} className="w-5 h-5" />
                </div>
                <button
                  type="button"
                  onClick={() => setIsIconPickerOpen(true)}
                  className="flex-1 py-2 px-3 text-xs border border-border/40 hover:bg-muted/50 text-left transition-colors flex items-center justify-between"
                >
                  <span className="font-mono text-muted-foreground">{icon}</span>
                  <span className="text-[11px] text-primary font-medium">Cambiar</span>
                </button>
              </div>
            </div>

            {/* Color Palette */}
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Color Identificador</label>
              <div className="grid grid-cols-6 gap-2 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className="w-full h-7 border transition-transform flex items-center justify-center"
                    style={{
                      backgroundColor: c,
                      borderColor: color === c ? 'var(--foreground)' : 'transparent',
                      transform: color === c ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs border border-border/40 hover:bg-muted/50 transition-colors"
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity flex items-center gap-1.5"
              >
                {isSubmitting ? 'Guardando...' : category ? 'Guardar Cambios' : 'Crear Categoría'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Visual Lucide Icon Picker Modal */}
      <IconPickerModal
        isOpen={isIconPickerOpen}
        selectedIcon={icon}
        onSelect={(selected) => setIcon(selected)}
        onClose={() => setIsIconPickerOpen(false)}
        title="Catálogo de Iconos Lucide"
      />
    </>
  );
};
