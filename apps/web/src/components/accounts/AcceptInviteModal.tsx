import React, { useState, useEffect } from 'react';
import { X, Check, Users, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { AccountInvitationDTO, ProfileDTO } from '@koin/shared';
import { useAccountStore } from '../../stores/accountStore';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { getProfileAvatarStyle } from '../../lib/theme';

interface AcceptInviteModalProps {
  token: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AcceptInviteModal: React.FC<AcceptInviteModalProps> = ({
  token,
  onClose,
  onSuccess,
}) => {
  const { validateInvitation, acceptInvitation } = useAccountStore();
  const { profiles, activeProfile, setActiveProfile } = useAuthStore();

  const [invitation, setInvitation] = useState<AccountInvitationDTO | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string>(activeProfile?.id || profiles[0]?.id || '');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      loadInvitation();
    }
  }, [token]);

  useEffect(() => {
    if (activeProfile) {
      setSelectedProfileId(activeProfile.id);
    } else if (profiles.length > 0 && !selectedProfileId) {
      setSelectedProfileId(profiles[0].id);
    }
  }, [activeProfile?.id, profiles.length]);

  const loadInvitation = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await validateInvitation(token);
      if (data.isExpired) {
        setErrorMsg('Este enlace de invitación ha expirado.');
      } else if (data.isAccepted) {
        setErrorMsg('Esta invitación ya ha sido aceptada previamente.');
      } else {
        setInvitation(data);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'El enlace de invitación es inválido o no existe.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!selectedProfileId) {
      setErrorMsg('Por favor selecciona un perfil para vincular la cuenta.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await acceptInvitation(token, selectedProfileId);
      const chosen = profiles.find((p) => p.id === selectedProfileId);
      if (chosen && chosen.id !== activeProfile?.id) {
        setActiveProfile(chosen);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al unirse a la cuenta compartida.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background border border-border/60 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold tracking-tight">Invitación a Cuenta Compartida</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs">
          {loading ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-muted-foreground font-mono">Verificando enlace criptográfico...</p>
            </div>
          ) : errorMsg ? (
            <div className="space-y-4">
              <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-border/50 text-xs font-semibold text-foreground hover:bg-muted/10 transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : success ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-5 h-5" />
              </div>
              <p className="font-bold text-sm text-foreground">¡Te has unido con éxito!</p>
              <p className="text-muted-foreground text-xs font-mono">
                Cargando el entorno financiero de la cuenta...
              </p>
            </div>
          ) : invitation ? (
            <div className="space-y-5">
              {/* Account Cardless Preview */}
              <div className="p-4 border border-border/50 bg-muted/10 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
                  Detalles de la Cuenta Compartida
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">{invitation.accountName}</h3>
                  <p className="text-[11px] text-muted-foreground font-mono">
                    Moneda: {invitation.accountCurrency} · Invitado por: <span className="font-semibold text-foreground">{invitation.inviterProfileName}</span>
                  </p>
                </div>
                <div className="pt-2 border-t border-border/30 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground">Rol otorgado:</span>
                  <span className="font-semibold uppercase font-mono px-2 py-0.5 border border-primary/40 bg-primary/10 text-primary">
                    {invitation.role === 'editor' ? 'Editor (Transacciones)' : 'Observador (Solo Lectura)'}
                  </span>
                </div>
              </div>

              {/* Profile Selector */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Vincular a tu perfil personal
                </label>
                <div className="space-y-1.5">
                  {profiles.map((p) => {
                    const isSelected = selectedProfileId === p.id;
                    const avatarStyle = getProfileAvatarStyle(p.themeConfig?.primaryHex, p.themeConfig?.baseMode);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setSelectedProfileId(p.id)}
                        className={`w-full p-2.5 flex items-center justify-between border text-left transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10'
                            : 'border-border/40 hover:border-border bg-muted/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: avatarStyle.bg,
                              borderColor: avatarStyle.border,
                              color: avatarStyle.color,
                            }}
                          >
                            <KoinIcon name={p.avatarIcon} className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-semibold text-foreground text-xs">{p.name}</span>
                            <p className="text-[10px] text-muted-foreground font-mono">{p.baseCurrency}</p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  La cuenta compartida se agregará a este perfil sin alterar tus otras cuentas privadas.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-border/50 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={submitting || !selectedProfileId}
                  className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  <span>Unirse a la Cuenta</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
