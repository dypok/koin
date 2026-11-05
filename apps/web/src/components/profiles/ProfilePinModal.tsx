import React, { useState, useEffect, useRef } from 'react';
import { Lock, X, Delete, ArrowRight, ShieldAlert } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { apiRequest } from '../../lib/api';
import { KoinIcon } from '../../lib/icons';
import { getProfileAvatarStyle } from '../../lib/theme';
import { ModalPortal } from '../common/ModalPortal';

interface ProfilePinModalProps {
  isOpen: boolean;
  profile: ProfileDTO | null;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
}

export const ProfilePinModal: React.FC<ProfilePinModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSuccess,
  title,
  subtitle,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [shake, setShake] = useState(false);

  const targetDigits =
    profile && profile.pinDigits && profile.pinDigits >= 4 && profile.pinDigits <= 6
      ? profile.pinDigits
      : 4;

  const pinRef = useRef(pin);
  pinRef.current = pin;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const isLockedRef = useRef(isLocked);
  isLockedRef.current = isLocked;

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setErrorMsg(null);
      setIsLocked(false);
      setShake(false);
    }
  }, [isOpen, profile?.id]);

  const triggerHaptic = (success = false) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      if (success) {
        navigator.vibrate?.(30);
      } else {
        navigator.vibrate?.([50, 60, 50]);
      }
    }
  };

  const handleVerify = async (pinToTest?: string) => {
    const finalPin = pinToTest !== undefined ? pinToTest : pinRef.current;
    if (finalPin.length < 4) {
      setErrorMsg('Ingresa entre 4 y 6 dígitos');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await apiRequest(`/profiles/${profile!.id}/unlock`, {
        method: 'POST',
        body: JSON.stringify({ pin: finalPin }),
      });
      triggerHaptic(true);
      setPin('');
      onSuccess();
    } catch (err: any) {
      triggerHaptic(false);
      setShake(true);
      setTimeout(() => setShake(false), 500);

      const msg = err.message || 'PIN de seguridad incorrecto';
      setErrorMsg(msg);
      setPin('');

      if (err.statusCode === 429 || msg.includes('bloqueado')) {
        setIsLocked(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (num: string) => {
    if (isLockedRef.current || loadingRef.current) return;
    const currentPin = pinRef.current;
    if (currentPin.length < targetDigits) {
      triggerHaptic(true);
      const nextPin = currentPin + num;
      setPin(nextPin);
      setErrorMsg(null);
      if (nextPin.length === targetDigits) {
        handleVerify(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isLockedRef.current || loadingRef.current) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  useEffect(() => {
    if (!isOpen || !profile) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (!loadingRef.current && !isLockedRef.current) {
          handleVerify();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, profile?.id, targetDigits]);

  if (!isOpen || !profile) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 w-screen h-screen z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div
          className={`w-full max-w-xs bg-background border border-border/60 shadow-2xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150 ${
            shake ? 'translate-x-1 transition-transform' : ''
          }`}
        >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            {isLocked ? (
              <ShieldAlert className="w-4 h-4 text-destructive" />
            ) : (
              <Lock className="w-4 h-4 text-primary" />
            )}
            <span className="text-xs font-bold tracking-tight">
              {isLocked ? 'Perfil Bloqueado' : title || 'Perfil Protegido'}
            </span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="py-6 flex flex-col items-center gap-2 text-center">
          {(() => {
            const avatarStyle = getProfileAvatarStyle(profile.themeConfig?.primaryHex, profile.themeConfig?.baseMode);
            return (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors border ${
                  isLocked
                    ? 'bg-destructive/15 border-destructive/30 text-destructive'
                    : ''
                }`}
                style={!isLocked ? {
                  backgroundColor: avatarStyle.bg,
                  borderColor: avatarStyle.border,
                  color: avatarStyle.color,
                } : undefined}
              >
                <KoinIcon name={profile.avatarIcon} className="w-6 h-6" />
              </div>
            );
          })()}
          <h3 className="text-sm font-semibold">{profile.name}</h3>
          <p className="text-[11px] text-muted-foreground">
            {isLocked
              ? 'Bloqueo preventivo de 15 minutos activado'
              : subtitle || `Ingresa el PIN de ${targetDigits} dígitos para continuar`}
          </p>

          {/* Dynamic Dots Indicator */}
          {!isLocked && (
            <div className="flex items-center gap-2.5 my-3">
              {Array.from({ length: targetDigits }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all duration-150 ${
                    pin.length > idx
                      ? 'bg-primary scale-110'
                      : 'border border-border/60 bg-muted/20'
                  }`}
                />
              ))}
            </div>
          )}

          {errorMsg && (
            <p className="text-[11px] text-destructive font-medium mt-1 leading-tight">
              {errorMsg}
            </p>
          )}
        </div>

        {/* Flat Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 py-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={loading || isLocked}
              onClick={() => handleKeyPress(digit)}
              className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-base font-mono font-semibold transition-colors active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={loading || isLocked || pin.length === 0}
            onClick={handleDelete}
            className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-muted-foreground transition-colors active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={loading || isLocked}
            onClick={() => handleKeyPress('0')}
            className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-base font-mono font-semibold transition-colors active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading || isLocked || pin.length < 4}
            onClick={() => handleVerify()}
            className="h-12 border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 transition-colors active:scale-95 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
            title="Verificar PIN (Enter)"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
