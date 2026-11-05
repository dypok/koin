import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, Check, Settings2, Shield, ArrowRight } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { ProfileModal } from './ProfileModal';
import { ProfilePinModal } from './ProfilePinModal';

interface ProfileStreamingViewProps {
  onNavigateToAppearance?: () => void;
  onNavigateToSecurity?: () => void;
}

export const ProfileStreamingView: React.FC<ProfileStreamingViewProps> = ({
  onNavigateToAppearance,
  onNavigateToSecurity,
}) => {
  const { profiles, activeProfile, setActiveProfile, deleteProfile } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<ProfileDTO | null>(null);
  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);
  const [isManageMode, setIsManageMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSelectProfile = (p: ProfileDTO) => {
    if (isManageMode) {
      setProfileToEdit(p);
      setIsModalOpen(true);
      return;
    }

    if (p.id === activeProfile?.id) return;

    if (p.hasPin) {
      setPinModalProfile(p);
    } else {
      setActiveProfile(p);
    }
  };

  const handleDelete = async (e: React.MouseEvent, p: ProfileDTO) => {
    e.stopPropagation();
    if (profiles.length <= 1) {
      setErrorMsg('No es posible eliminar el único perfil activo de tu cuenta.');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de que deseas eliminar el perfil "${p.name}"? Sus datos contables quedarán eliminados.`
    );
    if (!confirmed) return;

    setErrorMsg(null);
    try {
      await deleteProfile(p.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al eliminar el perfil.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner / Streaming Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary font-mono">
            Perfiles de Usuario
          </span>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
            ¿Quién está administrando fondos hoy?
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona un perfil para cargar sus finanzas y entorno visual independiente.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsManageMode(!isManageMode)}
            className={`px-3 py-1.5 border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isManageMode
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{isManageMode ? 'Listo' : 'Administrar'}</span>
          </button>

          <button
            onClick={() => {
              setProfileToEdit(null);
              setIsModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-1.5 transition-transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Perfil</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
          {errorMsg}
        </div>
      )}

      {/* Streaming Profile Grid (Flat tiles with 1px border, zero cards, zero floating shadows) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {profiles.map((p) => {
          const isActive = p.id === activeProfile?.id;
          const profileColor = p.themeConfig?.primaryHex || '#F59E0B';

          return (
            <div
              key={p.id}
              onClick={() => handleSelectProfile(p)}
              className={`group relative p-4 flex flex-col items-center text-center border transition-all cursor-pointer select-none ${
                isActive
                  ? 'border-primary bg-primary/5 ring-1 ring-primary/40'
                  : 'border-border/40 hover:border-border hover:bg-muted/10'
              }`}
            >
              {/* Profile Avatar Container */}
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center border transition-transform group-hover:scale-105"
                style={{
                  backgroundColor: `${profileColor}15`,
                  borderColor: `${profileColor}40`,
                  color: profileColor,
                }}
              >
                <KoinIcon name={p.avatarIcon} className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>

              {/* Profile Name & Meta */}
              <div className="mt-3 w-full">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-xs sm:text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">
                    {p.name}
                  </p>
                  {p.hasPin && (
                    <span title="Protegido con PIN">
                      <Lock className="w-3 h-3 text-muted-foreground shrink-0" />
                    </span>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                  {p.baseCurrency} · {p.themeConfig?.preset || 'gold'}
                </p>
              </div>

              {/* Status or Management Overlay */}
              <div className="mt-3">
                {isManageMode ? (
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => {
                        setProfileToEdit(p);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 border border-border/60 hover:border-primary text-muted-foreground hover:text-primary transition-colors bg-background"
                      title="Editar perfil"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p)}
                      disabled={profiles.length <= 1}
                      className="p-1.5 border border-border/60 hover:border-destructive text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed bg-background"
                      title={profiles.length <= 1 ? 'No se puede eliminar el único perfil' : 'Eliminar perfil'}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ) : isActive ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary px-2 py-0.5 border border-primary/30 uppercase tracking-widest font-mono">
                    <Check className="w-2.5 h-2.5" />
                    <span>Activo</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                    Conmutar &lt;100ms
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add Profile Tile */}
        <div
          onClick={() => {
            setProfileToEdit(null);
            setIsModalOpen(true);
          }}
          className="p-4 flex flex-col items-center justify-center text-center border border-dashed border-border/60 hover:border-primary/60 hover:bg-muted/5 transition-all cursor-pointer group min-h-[160px]"
        >
          <div className="w-12 h-12 rounded-full border border-dashed border-border flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary transition-colors">
            <Plus className="w-6 h-6" />
          </div>
          <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground mt-3 transition-colors">
            Agregar Perfil
          </p>
          <span className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">Segregado</span>
        </div>
      </div>

      {/* Profile Features Quick Access (Flat Row) */}
      <div className="pt-6 border-t border-border/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {onNavigateToAppearance && (
          <button
            onClick={onNavigateToAppearance}
            className="p-4 border border-border/40 hover:border-primary/50 text-left transition-colors bg-muted/5 flex items-center justify-between group"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                Personalizar Colores y Apariencia
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ajusta la paleta de {activeProfile?.name || 'tu perfil'} con contraste visual optimizado.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-3" />
          </button>
        )}

        {onNavigateToSecurity && (
          <button
            onClick={onNavigateToSecurity}
            className="p-4 border border-border/40 hover:border-primary/50 text-left transition-colors bg-muted/5 flex items-center justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-foreground group-hover:text-primary transition-colors">
                  Seguridad y Bloqueo con PIN
                </p>
                {activeProfile?.hasPin && (
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 border border-primary/40 text-primary">
                    Protegido
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Bloqueo de seguridad con clave de 4 a 6 dígitos y protección temporal ante intentos fallidos.
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 ml-3" />
          </button>
        )}
      </div>

      {/* Modals */}
      <ProfileModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        profileToEdit={profileToEdit}
      />

      <ProfilePinModal
        isOpen={!!pinModalProfile}
        profile={pinModalProfile}
        onClose={() => setPinModalProfile(null)}
        onSuccess={() => {
          if (pinModalProfile) {
            setActiveProfile(pinModalProfile);
            setPinModalProfile(null);
          }
        }}
      />
    </div>
  );
};
