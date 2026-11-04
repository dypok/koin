import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, Check, Sparkles } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { ALLOWED_AVATAR_ICONS } from '@koin/shared';
import { SUPPORTED_CURRENCIES } from '@koin/shared';
import { THEME_PRESETS } from '../../lib/theme';
import { KoinIcon } from '../../lib/icons';
import { useAuthStore } from '../../stores/authStore';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileToEdit?: ProfileDTO | null;
  onSuccess?: (profile: ProfileDTO) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profileToEdit,
  onSuccess,
}) => {
  const isEditing = !!profileToEdit;
  const { createProfile, updateProfile } = useAuthStore();

  const [name, setName] = useState('');
  const [avatarIcon, setAvatarIcon] = useState<string>('User');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [selectedPresetId, setSelectedPresetId] = useState('gold');
  const [enablePin, setEnablePin] = useState(false);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profileToEdit) {
      setName(profileToEdit.name);
      setAvatarIcon(profileToEdit.avatarIcon);
      setBaseCurrency(profileToEdit.baseCurrency);
      setSelectedPresetId(profileToEdit.themeConfig?.preset || 'gold');
      setEnablePin(profileToEdit.hasPin);
      setPin('');
    } else {
      setName('');
      setAvatarIcon('User');
      setBaseCurrency('USD');
      setSelectedPresetId('gold');
      setEnablePin(false);
      setPin('');
    }
    setErrorMsg(null);
  }, [profileToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Por favor ingresa un nombre para el perfil.');
      return;
    }

    if (enablePin && pin) {
      if (!/^\d{4,6}$/.test(pin)) {
        setErrorMsg('El PIN de seguridad debe contener exactamente entre 4 y 6 números.');
        return;
      }
    }

    const preset = THEME_PRESETS.find((p) => p.id === selectedPresetId) || THEME_PRESETS[0];
    const themeConfig = {
      preset: preset.id,
      primaryHex: preset.primaryHex,
      accentHex: preset.accentHex,
      baseMode: 'dark' as const,
    };

    setLoading(true);

    try {
      if (isEditing && profileToEdit) {
        const updatePayload: any = {
          name: trimmedName,
          avatarIcon,
          baseCurrency,
          themeConfig,
        };
        if (enablePin && pin) {
          updatePayload.pin = pin;
        } else if (!enablePin && profileToEdit.hasPin) {
          updatePayload.pin = ''; // removes PIN
        }

        const updated = await updateProfile(profileToEdit.id, updatePayload);
        onSuccess?.(updated);
        onClose();
      } else {
        const created = await createProfile({
          name: trimmedName,
          avatarIcon,
          baseCurrency,
          themeConfig,
          pin: enablePin && pin ? pin : undefined,
        });
        onSuccess?.(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al guardar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-background border border-border/60 shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <KoinIcon name={avatarIcon} className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                {isEditing ? 'Configurar Perfil Soberano' : 'Crear Nuevo Perfil'}
              </h2>
              <p className="text-[11px] text-muted-foreground font-mono">
                {isEditing ? 'Ajusta identidad, divisa y seguridad' : 'Espacio contable y financiero 100% independiente'}
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

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
              {errorMsg}
            </div>
          )}

          {/* 1. Nombre del Perfil */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nombre del Perfil
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Personal, Negocio, Viajes, Inversión..."
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground placeholder:text-muted-foreground text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 2. Selector de Avatar SVG (Cero Emojis) */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Icono de Identidad (SVG Vectorial)
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ALLOWED_AVATAR_ICONS.map((iconName) => {
                const isSelected = avatarIcon === iconName;
                return (
                  <button
                    type="button"
                    key={iconName}
                    onClick={() => setAvatarIcon(iconName)}
                    className={`p-3 flex items-center justify-center border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/15 text-primary scale-105 shadow-sm'
                        : 'border-border/40 hover:border-border text-muted-foreground hover:text-foreground bg-muted/10'
                    }`}
                    title={iconName}
                  >
                    <KoinIcon name={iconName} className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Moneda Base */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Moneda Base Contable
            </label>
            <select
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
              className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground text-xs focus:outline-none focus:border-primary transition-colors"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((c) => (
                <option key={c.code} value={c.code} className="bg-background text-foreground">
                  {c.code} - {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground font-mono">
              Todas las estadísticas y presupuestos de este perfil se calcularán en esta divisa.
            </p>
          </div>

          {/* 4. Paleta Visual Soberana */}
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Color de Acento &amp; Tema
            </label>
            <div className="grid grid-cols-4 gap-2">
              {THEME_PRESETS.map((p) => {
                const isSelected = selectedPresetId === p.id;
                return (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setSelectedPresetId(p.id)}
                    className={`p-2 border text-left flex items-center gap-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10'
                        : 'border-border/40 hover:border-border bg-muted/5'
                    }`}
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                      style={{ backgroundColor: p.primaryHex }}
                    />
                    <span className="text-[11px] truncate font-medium">{p.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Bloqueo con PIN de Seguridad */}
          <div className="pt-2 border-t border-border/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-semibold">Bloqueo de Perfil con PIN</p>
                  <p className="text-[10px] text-muted-foreground">
                    Exige un PIN de 4 a 6 dígitos al ingresar a este perfil
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enablePin}
                onChange={(e) => setEnablePin(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
            </div>

            {enablePin && (
              <div className="space-y-1.5 pt-1">
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder={isEditing && profileToEdit?.hasPin ? 'Dejar vacío para conservar el actual' : 'PIN numérico (4-6 dígitos)'}
                  className="w-full px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono tracking-widest text-xs focus:outline-none focus:border-primary transition-colors"
                />
                <p className="text-[10px] text-muted-foreground font-mono">
                  Cifrado seguro mediante algoritmo Argon2id en el servidor.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-border/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border/50 text-muted-foreground hover:text-foreground text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
