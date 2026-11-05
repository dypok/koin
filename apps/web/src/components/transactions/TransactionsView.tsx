import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Trash2,
  Calendar,
  Layers,
  Tag as TagIcon,
  X,
  History,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useAccountStore } from '../../stores/accountStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { KoinIcon } from '../../lib/icons';
import { TransactionDTO } from '@koin/shared';

interface TransactionsViewProps {
  onNewTransaction: (type?: 'expense' | 'income' | 'transfer', accountId?: string) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ onNewTransaction }) => {
  const { activeProfile } = useAuthStore();
  const { accounts, fetchAccounts } = useAccountStore();
  const {
    transactions,
    categories,
    totalCount,
    isLoading,
    fetchTransactions,
    fetchCategories,
    deleteTransaction,
  } = useTransactionStore();

  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income' | 'transfer'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Debounce search query 250ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Initial load
  useEffect(() => {
    fetchAccounts();
    fetchCategories();
  }, [fetchAccounts, fetchCategories]);

  // Fetch transactions whenever filters change
  useEffect(() => {
    fetchTransactions({
      type: typeFilter === 'all' ? undefined : typeFilter,
      accountId: accountFilter === 'all' ? undefined : accountFilter,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      search: debouncedSearch || undefined,
    });
  }, [typeFilter, accountFilter, categoryFilter, debouncedSearch, fetchTransactions]);

  const profileBaseCurrency = activeProfile?.baseCurrency || 'USD';

  // Group transactions by formatted date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateKey: string]: { label: string; items: TransactionDTO[] } } = {};

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      const dateKey = txDate.toISOString().split('T')[0];

      if (!groups[dateKey]) {
        let label = '';
        if (dateKey === todayStr) {
          label = 'Hoy';
        } else if (dateKey === yesterdayStr) {
          label = 'Ayer';
        } else {
          label = txDate.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: txDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
          });
          // Capitalize first letter
          label = label.charAt(0).toUpperCase() + label.slice(1);
        }

        groups[dateKey] = { label, items: [] };
      }

      groups[dateKey].items.push(tx);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map((key) => groups[key]);
  }, [transactions]);

  const hasActiveFilters =
    typeFilter !== 'all' || accountFilter !== 'all' || categoryFilter !== 'all' || debouncedSearch !== '';

  const clearFilters = () => {
    setTypeFilter('all');
    setAccountFilter('all');
    setCategoryFilter('all');
    setSearchQuery('');
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este movimiento? Su saldo se revertirá automáticamente.')) {
      setDeletingId(id);
      try {
        await deleteTransaction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">Movimientos</h1>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded">
              {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Historial cronológico de gastos, ingresos y transferencias en tiempo real
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewTransaction('expense')}
            className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Movimiento</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        {/* Search & Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nota, concepto o etiqueta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border/80 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-border/80 text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">Todas las Cuentas</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-background border border-border/80 text-foreground focus:outline-none focus:border-primary transition-colors"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.type === 'expense' ? 'Gasto' : 'Ingreso'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Type Filter Buttons */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                typeFilter === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              Todos
            </button>

            <button
              onClick={() => setTypeFilter('expense')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                typeFilter === 'expense'
                  ? 'bg-destructive/15 text-destructive border border-destructive/40'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <ArrowDownLeft className="w-3 h-3" />
              <span>Gastos</span>
            </button>

            <button
              onClick={() => setTypeFilter('income')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                typeFilter === 'income'
                  ? 'bg-primary/15 text-primary border border-primary/40'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              <span>Ingresos</span>
            </button>

            <button
              onClick={() => setTypeFilter('transfer')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
                typeFilter === 'transfer'
                  ? 'bg-foreground/10 text-foreground border border-foreground/30 font-bold'
                  : 'bg-muted/40 text-muted-foreground hover:text-foreground border border-border/40'
              }`}
            >
              <ArrowLeftRight className="w-3 h-3" />
              <span>Transferencias</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0"
            >
              <X className="w-3 h-3" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------- */}
      {/* TRANSACTIONS LIST                                     */}
      {/* ----------------------------------------------------- */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground font-mono">Cargando movimientos...</p>
        </div>
      ) : groupedTransactions.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-border/60 p-8 space-y-4">
          <div className="w-12 h-12 rounded-full bg-muted/40 flex items-center justify-center mx-auto text-muted-foreground">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {hasActiveFilters ? 'No se encontraron movimientos con los filtros aplicados' : 'No hay movimientos registrados'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {hasActiveFilters
                ? 'Prueba modificando la búsqueda o seleccionando otros filtros.'
                : 'Registra tu primer gasto, ingreso o transferencia para comenzar a auditar tus finanzas.'}
            </p>
          </div>
          {!hasActiveFilters ? (
            <button
              onClick={() => onNewTransaction('expense')}
              className="px-4 py-2 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Registrar primer movimiento
            </button>
          ) : (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-xs font-semibold border border-border hover:bg-muted/30 transition-colors"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {groupedTransactions.map((group) => (
            <div key={group.label} className="space-y-2">
              {/* Date Header */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </span>
                <div className="h-[1px] bg-border/40 flex-1" />
              </div>

              {/* Transactions in Date Group */}
              <div className="border border-border/50 divide-y divide-border/40 bg-background">
                {group.items.map((tx) => {
                  const isExpense = tx.type === 'expense';
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';

                  const isCrossCurrency = tx.currency !== profileBaseCurrency;

                  return (
                    <div
                      key={tx.id}
                      className="p-3 sm:p-4 flex items-center justify-between gap-3 hover:bg-muted/15 transition-colors group"
                    >
                      {/* Left: Icon & Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Icon */}
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isTransfer
                              ? 'rgba(156, 163, 175, 0.15)'
                              : `${tx.categoryColor || '#6B7280'}18`,
                            color: isTransfer ? '#9CA3AF' : tx.categoryColor || '#6B7280',
                          }}
                        >
                          {isTransfer ? (
                            <ArrowLeftRight className="w-5 h-5 text-foreground" />
                          ) : (
                            <KoinIcon name={tx.categoryIcon || 'Tag'} className="w-5 h-5" />
                          )}
                        </div>

                        {/* Title & Metadata */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {isTransfer
                                ? `Transferencia: ${tx.accountName || 'Origen'} → ${tx.toAccountName || 'Destino'}`
                                : tx.categoryName || 'General'}
                            </p>
                          </div>

                          {/* Note */}
                          {tx.note && (
                            <p className="text-xs text-muted-foreground truncate font-sans">
                              {tx.note}
                            </p>
                          )}

                          {/* Account & Tags Badge */}
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground font-mono">
                            {!isTransfer && (
                              <span>
                                {tx.accountName} ({tx.currency})
                              </span>
                            )}
                            {tx.tags && tx.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                <span>·</span>
                                {tx.tags.map((tag) => (
                                  <span key={tag} className="text-muted-foreground/80">
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex items-center gap-3 shrink-0 text-right">
                        <div>
                          <p
                            className={`text-sm font-bold font-mono ${
                              isExpense
                                ? 'text-destructive'
                                : isIncome
                                ? 'text-primary'
                                : 'text-foreground'
                            }`}
                          >
                            {isExpense && '-'}
                            {isIncome && '+'}
                            {tx.currency} {tx.amount}
                          </p>

                          {/* Base Currency Equivalent (TXN-03) */}
                          {isCrossCurrency && tx.baseAmount && (
                            <p className="text-[10px] text-muted-foreground font-mono">
                              ≈ {profileBaseCurrency} {tx.baseAmount}
                            </p>
                          )}
                        </div>

                        {/* Delete Button */}
                        <button
                          disabled={deletingId === tx.id}
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                          title="Eliminar movimiento (revierte saldo)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
