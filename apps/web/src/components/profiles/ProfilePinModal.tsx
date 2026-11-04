import React, { useState } from 'react';
import { Lock, X, Delete, ArrowRight } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { apiRequest } from '../../lib/api';
import { KoinIcon } from '../../lib/icons';

interface ProfilePinModalProps {
  isOpen: boolean;
  profile: ProfileDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ProfilePinModal: React.FC<ProfilePinModalProps> = ({
  isOpen,
  profile,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !profile) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + num);
      setErrorMsg(null);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleVerify = async (pinToTest?: string) => {
    const finalPin = pinToTest || pin;
    if (finalPin.length < 4) {
      setErrorMsg('Ingresa al menos 4 dígitos');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      await apiRequest(`/profiles/${profile.id}/verify-pin`, {
        method: 'POST',
        body: JSON.stringify({ pin: finalPin }),
      });
      setPin('');
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'PIN de seguridad incorrecto');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xs bg-background border border-border/60 shadow-2xl flex flex-col p-6 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold tracking-tight">Perfil Protegido</span>
          </div>
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="py-6 flex flex-col items-center gap-2 text-center">
          <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <KoinIcon name={profile.avatarIcon} className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold">{profile.name}</h3>
          <p className="text-[11px] text-muted-foreground">Ingresa el PIN de seguridad para acceder</p>

          {/* Dots Indicator */}
          <div className="flex items-center gap-2.5 my-3">
            {[0, 1, 2, 3, 4, 5].map((idx) => (
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

          {errorMsg && (
            <p className="text-[11px] text-destructive font-medium animate-pulse">{errorMsg}</p>
          )}
        </div>

        {/* Flat Numeric Keypad */}
        <div className="grid grid-cols-3 gap-2 py-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={loading}
              onClick={() => handleKeyPress(digit)}
              className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-base font-mono font-semibold transition-colors active:scale-95 flex items-center justify-center"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            disabled={loading || pin.length === 0}
            onClick={handleDelete}
            className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-muted-foreground transition-colors active:scale-95 flex items-center justify-center"
          >
            <Delete className="w-4 h-4" />
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleKeyPress('0')}
            className="h-12 border border-border/40 bg-muted/10 hover:bg-muted/30 text-base font-mono font-semibold transition-colors active:scale-95 flex items-center justify-center"
          >
            0
          </button>
          <button
            type="button"
            disabled={loading || pin.length < 4}
            onClick={() => handleVerify()}
            className="h-12 border border-primary/50 bg-primary/20 text-primary hover:bg-primary/30 transition-colors active:scale-95 flex items-center justify-center disabled:opacity-40"
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
