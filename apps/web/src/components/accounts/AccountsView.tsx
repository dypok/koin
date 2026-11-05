import React, { useState, useEffect } from 'react';
import { Plus, Users, Edit2, Trash2, LogOut, Wallet, ShieldCheck, Share2 } from 'lucide-react';
import { AccountDTO, AccountType } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { useAccountStore } from '../../stores/accountStore';
import { useAuthStore } from '../../stores/authStore';
import { AccountModal } from './AccountModal';
import { AccountShareModal } from './AccountShareModal';

interface AccountsViewProps {
  onGoToSettings?: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  cash: 'Efectivo',
  bank: 'Banco',
  credit: 'Tarjeta de Crédito',
  savings: 'Ahorros',
  investment: 'Inversión',
};

export const AccountsView: React.FC<AccountsViewProps> = () => {
  const { activeProfile } = useAuthStore();
  const { accounts, isLoading, error, fetchAccounts, deleteAccount } = useAccountStore();

  const [filterType, setFilterType] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<AccountDTO | null>(null);

  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [accountToShare, setAccountToShare] = useState<AccountDTO | null>(null);

  useEffect(() => {
    if (activeProfile?.id) {
      fetchAccounts(activeProfile.id);
    }
  }, [activeProfile?.id]);

  const handleOpenCreate = () => {
    setAccountToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (acc: AccountDTO) => {
    setAccountToEdit(acc);
    setModalOpen(true);
  };

  const handleOpenShare = (acc: AccountDTO) => {
    setAccountToShare(acc);
    setShareModalOpen(true);
  };

  const handleDelete = async (acc: AccountDTO) => {
    const ok = window.confirm(`¿Estás seguro de eliminar la cuenta "${acc.name}"?`);
    if (!ok) return;

    try {
      await deleteAccount(acc.id);
    } catch (err: any) {
      alert(err.message || 'Error al eliminar la cuenta');
    }
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((acc) => {
    if (filterType === 'all') return true;
    if (filterType === 'shared') return acc.isShared;
    return acc.type === filterType;
  });

  // Calculate Net Total Balance in Base Currency
  const totalBalance = accounts
    .filter((a) => a.currency === (activeProfile?.baseCurrency || 'USD'))
    .reduce((sum, a) => sum + parseFloat(a.currentBalance || '0'), 0);

  const formatBalance = (amountStr: string) => {
    const num = parseFloat(amountStr || '0');
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header with Actions & Balance */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Cuentas Financieras
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Billeteras de efectivo, cuentas bancarias y fondos colaborativos vinculados a {activeProfile?.name}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenCreate}
            className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Cuenta</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

      {/* 2. Total Net Balance Banner (Cardless, Minimalist 1px Border) */}
      <div className="p-5 border border-border/40 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
            Balance Consolidado en {activeProfile?.baseCurrency || 'USD'}
          </span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-foreground">
              ${formatBalance(totalBalance.toString())}
            </span>
            <span className="text-xs text-muted-foreground font-mono uppercase">
              {activeProfile?.baseCurrency || 'USD'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
          <span>{accounts.length} {accounts.length === 1 ? 'cuenta activa' : 'cuentas activas'}</span>
          <span>·</span>
          <span>{accounts.filter((a) => a.isShared).length} compartidas</span>
        </div>
      </div>

      {/* 3. Filter Bar (Horizontal Flat Tabs) */}
      <div className="flex items-center gap-1 border-b border-border/30 pb-2 overflow-x-auto text-xs font-medium">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'cash', label: 'Efectivo' },
          { key: 'bank', label: 'Bancos' },
          { key: 'savings', label: 'Ahorros' },
          { key: 'credit', label: 'Tarjetas' },
          { key: 'investment', label: 'Inversiones' },
          { key: 'shared', label: 'Compartidas' },
        ].map((tab) => {
          const isSelected = filterType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`px-3 py-1.5 border transition-colors shrink-0 ${
                isSelected
                  ? 'border-primary bg-primary/10 text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Accounts Flat List (Zero Cards, 1px Hairlines) */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-muted-foreground font-mono space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Cargando libros de cuentas...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="border border-border/40 p-8 text-center bg-background space-y-3">
          <div className="w-10 h-10 rounded-full border border-border/60 bg-muted/10 flex items-center justify-center mx-auto text-muted-foreground">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">No hay cuentas en esta categoría</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Crea tu primera cuenta para comenzar a registrar movimientos financieros.
            </p>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 border border-primary/50 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors"
          >
            Crear Cuenta
          </button>
        </div>
      ) : (
        <div className="border border-border/40 divide-y divide-border/30 bg-background">
          {filteredAccounts.map((acc) => {
            const isOwner = acc.role === 'owner' || !acc.isShared;
            const balanceNum = parseFloat(acc.currentBalance || '0');
            const isNegative = balanceNum < 0;

            return (
              <div
                key={acc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/5 transition-colors"
              >
                {/* Left: Icon & Meta */}
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: `${acc.color}20`,
                      borderColor: `${acc.color}50`,
                      color: acc.color,
                    }}
                  >
                    <KoinIcon name={acc.icon} className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{acc.name}</span>
                      {acc.isShared && (
                        <span
                          className="flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.2 border border-primary/30 text-primary font-bold"
                          title="Cuenta con acceso compartido"
                        >
                          <Users className="w-2.5 h-2.5" />
                          <span>{acc.role === 'owner' ? 'Propietario' : acc.role === 'editor' ? 'Editor' : 'Observador'}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                      <span>{TYPE_LABELS[acc.type] || acc.type}</span>
                      <span>·</span>
                      <span>Divisa: {acc.currency}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Real-time Balance & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-6">
                  {/* Balance Display */}
                  <div className="text-right">
                    <p
                      className={`text-base font-mono font-bold tracking-tight ${
                        isNegative ? 'text-destructive' : 'text-foreground'
                      }`}
                    >
                      ${formatBalance(acc.currentBalance)}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Saldo en {acc.currency}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Share / Members Button */}
                    <button
                      onClick={() => handleOpenShare(acc)}
                      className="p-2 border border-border/40 hover:border-primary/50 text-muted-foreground hover:text-primary transition-colors"
                      title={isOwner ? 'Gestionar colaboradores' : 'Ver miembros de la cuenta'}
                    >
                      {acc.isShared ? <Users className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    </button>

                    {/* Edit Button (Owners only) */}
                    {isOwner && (
                      <button
                        onClick={() => handleOpenEdit(acc)}
                        className="p-2 border border-border/40 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                        title="Editar cuenta"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button (Owners only) */}
                    {isOwner && (
                      <button
                        onClick={() => handleDelete(acc)}
                        className="p-2 border border-border/40 hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-colors"
                        title="Eliminar cuenta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Create / Edit Modal */}
      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        accountToEdit={accountToEdit}
        onSuccess={() => {
          if (activeProfile?.id) {
            fetchAccounts(activeProfile.id);
          }
        }}
      />

      {/* Account Share & Members RBAC Modal */}
      <AccountShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        account={accountToShare}
        onUpdateAccount={() => {
          if (activeProfile?.id) {
            fetchAccounts(activeProfile.id);
          }
        }}
      />
    </div>
  );
};
