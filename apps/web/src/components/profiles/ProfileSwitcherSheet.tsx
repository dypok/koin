import React from 'react';
import { X, Plus, Lock, Check, Settings, ChevronRight } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { getProfileAvatarStyle } from '../../lib/theme';

interface ProfileSwitcherSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateProfile: () => void;
  onOpenManageProfiles: () => void;
  onRequestPin: (profile: ProfileDTO) => void;
}

export const ProfileSwitcherSheet: React.FC<ProfileSwitcherSheetProps> = ({
  isOpen,
  onClose,
  onOpenCreateProfile,
  onOpenManageProfiles,
  onRequestPin,
}) => {
  const { profiles, activeProfile, setActiveProfile } = useAuthStore();

  if (!isOpen) return null;

  const handleSelect = (p: ProfileDTO) => {
    if (p.id === activeProfile?.id) {
      onClose();
      return;
    }

    if (p.hasPin) {
      onClose();
      onRequestPin(p);
    } else {
      // Instant switch in <100ms
      setActiveProfile(p);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-0 md:p-4 animate-in fade-in duration-150">
      <div className="w-full md:max-w-md bg-background border-t md:border border-border/60 shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-200">
        {/* Sheet Header */}
        <div className="px-5 py-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Conmutador de Perfiles ({profiles.length})
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flat List (Zero Cards, 1px Hairlines) */}
        <div className="overflow-y-auto divide-y divide-border/25 max-h-[55vh]">
          {profiles.map((p) => {
            const isActive = p.id === activeProfile?.id;
            const avatarStyle = getProfileAvatarStyle(p.themeConfig?.primaryHex, activeProfile?.themeConfig?.baseMode);
            return (
              <button
                key={p.id}
                onClick={() => handleSelect(p)}
                className={`w-full p-4 flex items-center justify-between text-left transition-colors ${
                  isActive ? 'bg-primary/10' : 'hover:bg-muted/20 active:bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: avatarStyle.bg,
                      borderColor: avatarStyle.border,
                      color: avatarStyle.color,
                    }}
                  >
                    <KoinIcon name={p.avatarIcon} className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{p.name}</span>
                      {isActive && (
                        <span className="text-[9px] font-semibold text-primary px-1.5 py-0.2 border border-primary/30 uppercase tracking-widest font-mono">
                          Activo
                        </span>
                      )}
                      {p.hasPin && (
                        <span title="Requiere PIN">
                          <Lock className="w-3 h-3 text-muted-foreground" />
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                      {p.baseCurrency} · {p.themeConfig?.preset || 'gold'}
                    </p>
                  </div>
                </div>

                {isActive ? (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Sheet Footer Actions */}
        <div className="p-3 border-t border-border/40 bg-muted/10 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              onClose();
              onOpenCreateProfile();
            }}
            className="py-2.5 px-3 bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Crear Perfil</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenManageProfiles();
            }}
            className="py-2.5 px-3 border border-border/60 hover:border-border text-foreground text-xs font-semibold flex items-center justify-center gap-2 transition-colors bg-background"
          >
            <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Gestionar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
