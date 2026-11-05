import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Lock, Unlock, KeyRound, Check } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { apiRequest } from '../../lib/api';
import { ProfilePinModal } from './ProfilePinModal';

export const SecuritySettingsView: React.FC = () => {
  const { activeProfile, updateProfile } = useAuthStore();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);

  if (!activeProfile) {
    return (
      <div className="p-8 text-center text-xs text-muted-foreground">
        No hay perfil activo seleccionado.
      </div>
    );
  }

  const handleSetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!/^\d{4,6}$/.test(pin)) {
      setErrorMsg('El PIN debe contener exactamente de 4 a 6 dígitos numéricos.');
      return;
    }

    if (pin !== confirmPin) {
      setErrorMsg('Los PIN ingresados no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await apiRequest(`/profiles/${activeProfile.id}/pin`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });

      // Update local profile state
      await updateProfile(activeProfile.id, {
        pin,
      });

      setSuccessMsg('PIN de seguridad actualizado correctamente.');
      setPin('');
      setConfirmPin('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al configurar el PIN de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePin = async () => {
    const confirmed = window.confirm(
      '¿Deseas deshabilitar la protección por PIN para este perfil? Cualquier usuario podrá acceder sin clave.'
    );
    if (!confirmed) return;

    setSuccessMsg(null);
    setErrorMsg(null);
    setLoading(true);

    try {
      await updateProfile(activeProfile.id, {
        pin: '',
      });
      setSuccessMsg('Protección por PIN deshabilitada para este perfil.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el PIN.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Active Profile Context */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 text-xs">
        <p className="text-muted-foreground">
          Seguridad para el perfil: <span className="font-semibold text-foreground">{activeProfile.name}</span>
        </p>
        <span className="text-[10px] text-muted-foreground font-mono">
          {activeProfile.hasPin ? 'Protección activa' : 'Sin protección'}
        </span>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="p-3 border border-primary/40 bg-primary/10 text-primary text-xs font-medium flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Status Bar */}
      <div className="p-4 border border-border/40 bg-muted/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
              activeProfile.hasPin
                ? 'bg-primary/10 border-primary/40 text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            {activeProfile.hasPin ? (
              <ShieldCheck className="w-5 h-5" />
            ) : (
              <ShieldAlert className="w-5 h-5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Estado de Protección:
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 font-bold ${
                  activeProfile.hasPin
                    ? 'bg-primary/15 text-primary border border-primary/30'
                    : 'bg-muted text-muted-foreground border border-border'
                }`}
              >
                {activeProfile.hasPin ? 'Bloqueo con PIN Activo' : 'Sin Protección de PIN'}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
              {activeProfile.hasPin
                ? 'Se solicita PIN al ingresar a este perfil desde cualquier pantalla.'
                : 'Cualquier persona puede ingresar a este perfil sin solicitar clave.'}
            </p>
          </div>
        </div>

        {activeProfile.hasPin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsTestModalOpen(true)}
              className="px-3.5 py-1.5 border border-primary/50 text-primary hover:bg-primary/10 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Probar Teclado PIN</span>
            </button>

            <button
              onClick={handleRemovePin}
              disabled={loading}
              className="px-3.5 py-1.5 border border-destructive/40 text-destructive hover:bg-destructive/10 text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Deshabilitar PIN</span>
            </button>
          </div>
        )}
      </div>

      {/* Set or Change PIN Form */}
      <div className="border border-border/40 p-6 bg-background space-y-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            {activeProfile.hasPin ? 'Cambiar PIN de Seguridad' : 'Configurar PIN de Seguridad'}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Digita entre 4 y 6 dígitos numéricos para proteger tu información.
          </p>
        </div>

        <form onSubmit={handleSetPin} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nuevo PIN (4 a 6 dígitos)
            </label>
            <input
              type="password"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono tracking-widest text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Confirmar Nuevo PIN
            </label>
            <input
              type="password"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono tracking-widest text-sm focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || !pin || !confirmPin}
              className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-40"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{activeProfile.hasPin ? 'Actualizar PIN' : 'Habilitar Bloqueo de Perfil'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Security Specifications Cardless Box */}
      <div className="border border-border/40 p-5 bg-muted/5 space-y-3">
        <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground font-mono">
          Parámetros de Protección
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 border border-border/30 bg-background">
            <p className="text-[10px] text-muted-foreground uppercase">Nivel de Cifrado</p>
            <p className="font-bold text-foreground mt-0.5">Alta Seguridad</p>
          </div>
          <div className="p-3 border border-border/30 bg-background">
            <p className="text-[10px] text-muted-foreground uppercase">Límite de Intentos</p>
            <p className="font-bold text-destructive mt-0.5">5 Intentos Consecutivos</p>
          </div>
          <div className="p-3 border border-border/30 bg-background">
            <p className="text-[10px] text-muted-foreground uppercase">Tiempo de Bloqueo</p>
            <p className="font-bold text-foreground mt-0.5">15 Minutos de Espera</p>
          </div>
        </div>
      </div>

      {/* Interactive PIN Testing Modal */}
      <ProfilePinModal
        isOpen={isTestModalOpen}
        profile={activeProfile}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={() => {
          setIsTestModalOpen(false);
          setSuccessMsg('Verificación de PIN exitosa. Perfil desbloqueado correctamente.');
        }}
      />
    </div>
  );
};
