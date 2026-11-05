import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Users, Shield, Trash2, LogOut, Link2 } from 'lucide-react';
import { AccountDTO, AccountMemberDTO, AccountRole } from '@koin/shared';
import { KoinIcon } from '../../lib/icons';
import { useAccountStore } from '../../stores/accountStore';

interface AccountShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: AccountDTO | null;
  onUpdateAccount?: () => void;
}

export const AccountShareModal: React.FC<AccountShareModalProps> = ({
  isOpen,
  onClose,
  account,
  onUpdateAccount,
}) => {
  const {
    createInvitation,
    fetchMembers,
    updateMemberRole,
    removeMember,
    leaveAccount,
  } = useAccountStore();

  const [activeTab, setActiveTab] = useState<'invite' | 'members'>('invite');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('editor');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [members, setMembers] = useState<AccountMemberDTO[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isOwner = account?.role === 'owner' || !account?.isShared;

  useEffect(() => {
    if (isOpen && account) {
      setGeneratedLink(null);
      setIsCopied(false);
      setErrorMsg(null);
      setActiveTab(isOwner ? 'invite' : 'members');
      loadMembers();
    }
  }, [isOpen, account?.id]);

  const loadMembers = async () => {
    if (!account) return;
    setIsLoadingMembers(true);
    try {
      const data = await fetchMembers(account.id);
      setMembers(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al cargar miembros');
    } finally {
      setIsLoadingMembers(false);
    }
  };

  if (!isOpen || !account) return null;

  const handleGenerateLink = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const inv = await createInvitation(account.id, inviteRole);
      setGeneratedLink(inv.inviteLink);
      setIsCopied(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar enlace de invitación');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleRoleChange = async (memberId: string, newRole: 'editor' | 'viewer') => {
    try {
      await updateMemberRole(account.id, memberId, newRole);
      await loadMembers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al actualizar el rol');
    }
  };

  const handleRemove = async (memberId: string, memberName?: string) => {
    const ok = window.confirm(`¿Expulsar a "${memberName || 'este colaborador'}" de la cuenta compartida?`);
    if (!ok) return;

    try {
      await removeMember(account.id, memberId);
      await loadMembers();
      onUpdateAccount?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al remover miembro');
    }
  };

  const handleLeave = async () => {
    const ok = window.confirm('¿Seguro que deseas abandonar esta cuenta compartida? Dejarás de tener acceso a su información contable.');
    if (!ok) return;

    try {
      await leaveAccount(account.id);
      onUpdateAccount?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al abandonar la cuenta');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background border border-border/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: `${account.color}20`,
                borderColor: `${account.color}50`,
                color: account.color,
              }}
            >
              <KoinIcon name={account.icon} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isOwner ? 'Colaboración y Cuentas Compartidas' : 'Detalles de Cuenta Compartida'}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {account.name} · {account.currency}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtabs for Owner */}
        {isOwner && (
          <div className="flex items-center border-b border-border/40 px-6 pt-2 bg-muted/5 gap-2 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('invite')}
              className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'invite'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>Invitar por Enlace</span>
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`pb-2.5 px-3 flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === 'members'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Miembros Activos ({members.length})</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* TAB 1: Invitar Colaborador */}
          {activeTab === 'invite' && isOwner && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Nivel de Permisos para el Invitado
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInviteRole('editor')}
                    className={`p-3 border text-left transition-colors ${
                      inviteRole === 'editor'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 hover:border-border bg-muted/5 text-foreground'
                    }`}
                  >
                    <p className="font-semibold text-xs">Editor</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Puede registrar y editar movimientos en la cuenta.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setInviteRole('viewer')}
                    className={`p-3 border text-left transition-colors ${
                      inviteRole === 'viewer'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border/40 hover:border-border bg-muted/5 text-foreground'
                    }`}
                  >
                    <p className="font-semibold text-xs">Observador</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Solo lectura. Puede consultar balances y transacciones.
                    </p>
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <div>
                <button
                  type="button"
                  onClick={handleGenerateLink}
                  disabled={isGenerating}
                  className="w-full py-2.5 bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>{isGenerating ? 'Generando Enlace Criptográfico...' : 'Generar Enlace de Invitación'}</span>
                </button>
              </div>

              {/* Generated Link Box */}
              {generatedLink && (
                <div className="p-4 border border-primary/40 bg-primary/5 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                      Enlace Criptográfico Seguro (Válido por 7 días)
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      Rol: {inviteRole === 'editor' ? 'Editor' : 'Observador'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 px-3 py-2 bg-background border border-border/60 text-foreground font-mono text-[11px] focus:outline-none select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95 shrink-0"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <p className="text-[10px] text-muted-foreground font-mono">
                    Cualquier persona con este enlace podrá vincular esta cuenta a uno de sus perfiles personales.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Miembros Activos */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Participantes de la Cuenta
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {members.length} {members.length === 1 ? 'miembro' : 'miembros'}
                </span>
              </div>

              {isLoadingMembers ? (
                <div className="py-8 text-center text-muted-foreground text-xs font-mono">
                  Cargando miembros...
                </div>
              ) : (
                <div className="border border-border/40 divide-y divide-border/30 bg-background">
                  {members.map((m) => {
                    const isMemberOwner = m.role === 'owner';
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-border/60 bg-muted/20 flex items-center justify-center shrink-0">
                            <KoinIcon name={m.profileAvatarIcon || 'User'} className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {m.profileName || 'Colaborador'}
                              </span>
                              {isMemberOwner && (
                                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-primary/30 text-primary font-bold">
                                  Propietario
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              Unido el {new Date(m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isOwner && !isMemberOwner ? (
                            <>
                              <select
                                value={m.role}
                                onChange={(e) => handleRoleChange(m.id, e.target.value as 'editor' | 'viewer')}
                                className="px-2 py-1 bg-muted/20 border border-border/60 text-xs focus:outline-none"
                              >
                                <option value="editor">Editor</option>
                                <option value="viewer">Observador</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleRemove(m.id, m.profileName)}
                                className="p-1.5 border border-border/40 text-muted-foreground hover:text-destructive hover:border-destructive/60 transition-colors"
                                title="Expulsar de la cuenta"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted-foreground font-mono capitalize">
                              {m.role === 'owner' ? 'Propietario' : m.role === 'editor' ? 'Editor' : 'Observador'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Leave Account Button for Non-Owners */}
              {!isOwner && (
                <div className="pt-4 border-t border-border/40 flex justify-end">
                  <button
                    type="button"
                    onClick={handleLeave}
                    className="px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Abandonar Cuenta Compartida</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border/40 flex justify-end bg-muted/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
