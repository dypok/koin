import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, Check, Settings2 } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { ProfileModal } from './ProfileModal';
import { ProfilePinModal } from './ProfilePinModal';

export const ProfileStreamingView: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, deleteProfile } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<ProfileDTO | null>(null);
  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);
  const [pinAction, setPinAction] = useState<'switch' | 'edit'>('switch');
  const [isManageMode, setIsManageMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRequestEdit = (p: ProfileDTO) => {
    if (p.hasPin) {
      setPinModalProfile(p);
      setPinAction('edit');
    } else {
      setProfileToEdit(p);
      setIsModalOpen(true);
    }
  };

  const handleSelectProfile = (p: ProfileDTO) => {
    if (isManageMode) {
      handleRequestEdit(p);
      return;
    }

    if (p.id === activeProfile?.id) return;

    if (p.hasPin) {
      setPinModalProfile(p);
      setPinAction('switch');
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Streaming Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
            ¿Quién está administrando fondos hoy?
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Selecciona un perfil para cargar sus finanzas y entorno visual independiente.
          </p>
        </div>

        <button
          onClick={() => setIsManageMode(!isManageMode)}
          className={`px-3 py-1.5 border text-xs font-semibold flex items-center gap-1.5 transition-colors self-start sm:self-auto ${
            isManageMode
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border/60 hover:border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>{isManageMode ? 'Listo' : 'Administrar'}</span>
        </button>
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
                      onClick={() => handleRequestEdit(p)}
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
                    Conmutar
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
        </div>
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
        title={pinAction === 'edit' ? 'Desbloquear Perfil' : 'Perfil Protegido'}
        subtitle={
          pinAction === 'edit'
            ? `Ingresa el PIN de ${pinModalProfile?.pinDigits || 4} dígitos para editar este perfil`
            : undefined
        }
        onClose={() => setPinModalProfile(null)}
        onSuccess={() => {
          if (pinModalProfile) {
            const target = pinModalProfile;
            setPinModalProfile(null);
            if (pinAction === 'edit') {
              setProfileToEdit(target);
              setIsModalOpen(true);
            } else {
              setActiveProfile(target);
            }
          }
        }}
      />
    </div>
  );
};
