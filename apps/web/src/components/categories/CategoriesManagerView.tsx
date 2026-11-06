import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Tag, AlertCircle } from 'lucide-react';
import { CategoryWithUsageDTO } from '@koin/shared';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { CategoryModal } from './CategoryModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const CategoriesManagerView: React.FC = () => {
  const { categories, createCategory, updateCategory, deleteCategory } = useTransactionStore();
  const { activeProfile } = useAuthStore();

  const [activeTypeFilter, setActiveTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [editingCategory, setEditingCategory] = useState<CategoryWithUsageDTO | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<CategoryWithUsageDTO | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredCategories = categories.filter((cat) => {
    if (activeTypeFilter === 'all') return true;
    return cat.type === activeTypeFilter;
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const handleOpenEdit = (cat: CategoryWithUsageDTO) => {
    setEditingCategory(cat);
    setIsModalOpen(true);
    setErrorMessage(null);
  };

  const handleSave = async (data: {
    name: string;
    type: 'expense' | 'income';
    icon: string;
    color: string;
  }) => {
    if (editingCategory) {
      await updateCategory(editingCategory.id, data, activeProfile?.id);
    } else {
      await createCategory({ ...data, sortOrder: 0 }, activeProfile?.id);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;
    try {
      setErrorMessage(null);
      await deleteCategory(categoryToDelete.id, activeProfile?.id);
      setCategoryToDelete(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al eliminar la categoría.');
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Gestión de Categorías</h2>
          <p className="text-xs text-muted-foreground">
            Clasifica tus gastos e ingresos con iconos SVG de Lucide y colores sobrios.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nueva Categoría</span>
        </button>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTypeFilter('all')}
          className={`px-3 py-1 text-xs transition-colors font-medium ${
            activeTypeFilter === 'all'
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Todas ({categories.length})
        </button>
        <button
          onClick={() => setActiveTypeFilter('expense')}
          className={`px-3 py-1 text-xs transition-colors font-medium ${
            activeTypeFilter === 'expense'
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Gastos ({categories.filter((c) => c.type === 'expense').length})
        </button>
        <button
          onClick={() => setActiveTypeFilter('income')}
          className={`px-3 py-1 text-xs transition-colors font-medium ${
            activeTypeFilter === 'income'
              ? 'text-primary border-b-2 border-primary font-semibold'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Ingresos ({categories.filter((c) => c.type === 'income').length})
        </button>
      </div>

      {/* Categories Flat List */}
      <div className="border border-border/40 divide-y divide-border/30 bg-card">
        {filteredCategories.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
            <Tag className="w-6 h-6 text-muted-foreground/60" />
            <span>No hay categorías registradas para este filtro.</span>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between p-3.5 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 flex items-center justify-center border border-border/40 shrink-0"
                  style={{ backgroundColor: `${cat.color}15`, color: cat.color }}
                >
                  <KoinIcon name={cat.icon || 'Tag'} className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground truncate">{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 border ${
                        cat.type === 'expense'
                          ? 'border-rose-500/30 text-rose-500'
                          : 'border-emerald-500/30 text-emerald-500'
                      }`}
                    >
                      {cat.type === 'expense' ? 'Gasto' : 'Ingreso'}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                    {cat.usageCount} {cat.usageCount === 1 ? 'movimiento' : 'movimientos'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => handleOpenEdit(cat)}
                  className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar categoría"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCategoryToDelete(cat)}
                  className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                  title="Eliminar categoría"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit/Create Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        category={editingCategory}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={categoryToDelete !== null}
        title="Eliminar Categoría"
        description={
          categoryToDelete?.usageCount && categoryToDelete.usageCount > 0
            ? `La categoría "${categoryToDelete.name}" tiene ${categoryToDelete.usageCount} movimientos registrados. El sistema protegerá la integridad histórica bloqueando la eliminación.`
            : `¿Estás seguro de que deseas eliminar permanentemente la categoría "${categoryToDelete?.name}"?`
        }
        confirmText={
          categoryToDelete?.usageCount && categoryToDelete.usageCount > 0
            ? 'Intentar Eliminar'
            : 'Eliminar'
        }
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onClose={() => setCategoryToDelete(null)}
      />
    </div>
  );
};
