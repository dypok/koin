import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Lock, Check, Shield, Users } from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from '../../stores/authStore';
import { KoinIcon } from '../../lib/icons';
import { getProfileAvatarStyle } from '../../lib/theme';
import { ProfileModal } from './ProfileModal';
import { ProfilePinModal } from './ProfilePinModal';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProfileManagerView: React.FC = () => {
  const { profiles, activeProfile, setActiveProfile, deleteProfile } = useAuthStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<ProfileDTO | null>(null);

  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);
  const [pinAction, setPinAction] = useState<'switch' | 'edit'>('switch');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<ProfileDTO | null>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const handleOpenCreate = () => {
    setProfileToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ProfileDTO) => {
    if (p.hasPin) {
      setPinModalProfile(p);
      setPinAction('edit');
    } else {
      setProfileToEdit(p);
      setIsModalOpen(true);
    }
  };

  const handleSelectProfile = (p: ProfileDTO) => {
    if (p.id === activeProfile?.id) return;

    if (p.hasPin) {
      setPinModalProfile(p);
      setPinAction('switch');
    } else {
      setActiveProfile(p);
    }
  };

  const handleDelete = (p: ProfileDTO) => {
    if (profiles.length <= 1) {
      setDeleteError('No es posible eliminar el único perfil activo de tu cuenta.');
      return;
    }
    setDeleteError(null);
    setProfileToDelete(p);
  };

  const confirmDeleteProfile = async () => {
    if (!profileToDelete) return;
    setIsDeletingProfile(true);
    try {
      await deleteProfile(profileToDelete.id);
      setProfileToDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || 'Error al eliminar el perfil.');
    } finally {
      setIsDeletingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Gestión de Perfiles Independientes
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Cada perfil mantiene un libro contable, cuentas y categorías estrictamente aislados.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-3.5 py-2 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Crear Perfil</span>
        </button>
      </div>

      {deleteError && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
          {deleteError}
        </div>
      )}

      {/* Flat List (Zero Cards, Subtle 1px Hairlines) */}
      <div className="border border-border/40 divide-y divide-border/30 bg-background">
        {profiles.map((p) => {
          const isActive = p.id === activeProfile?.id;
          const avatarStyle = getProfileAvatarStyle(p.themeConfig?.primaryHex, activeProfile?.themeConfig?.baseMode);
          return (
            <div
              key={p.id}
              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                isActive ? 'bg-primary/5' : 'hover:bg-muted/10'
              }`}
            >
              {/* Profile Identity */}
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
                    <span className="text-sm font-bold text-foreground">{p.name}</span>
                    {isActive && (
                      <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 border border-primary/30 uppercase tracking-wider font-mono">
                        Activo
                      </span>
                    )}
                    {p.hasPin && (
                      <span
                        className="text-[10px] text-muted-foreground flex items-center gap-0.5"
                        title="Protegido con PIN"
                      >
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground font-mono">
                    <span>Divisa: {p.baseCurrency}</span>
                    <span>·</span>
                    <span>Tema: {p.themeConfig?.preset || 'gold'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto">
                {!isActive ? (
                  <button
                    onClick={() => handleSelectProfile(p)}
                    className="px-3 py-1.5 border border-border/60 hover:border-primary/50 text-xs font-semibold hover:text-primary transition-colors"
                  >
                    Conmutar
                  </button>
                ) : (
                  <span className="text-xs text-primary font-medium flex items-center gap-1.5 px-3 py-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>En uso</span>
                  </span>
                )}

                <button
                  onClick={() => handleOpenEdit(p)}
                  className="p-2 border border-border/40 hover:border-border text-muted-foreground hover:text-foreground transition-colors"
                  title="Editar perfil"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleDelete(p)}
                  disabled={profiles.length <= 1}
                  className="p-2 border border-border/40 hover:border-destructive/60 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title={
                    profiles.length <= 1
                      ? 'No es posible eliminar el único perfil'
                      : 'Eliminar perfil'
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
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

      {/* Confirm Modal: Delete Profile */}
      <ConfirmModal
        isOpen={!!profileToDelete}
        onClose={() => setProfileToDelete(null)}
        onConfirm={confirmDeleteProfile}
        title="¿Eliminar perfil?"
        description={
          profileToDelete ? (
            <div className="space-y-1.5">
              <p>
                Estás a punto de eliminar el perfil{' '}
                <strong className="text-foreground">"{profileToDelete.name}"</strong>.
              </p>
              <p className="text-muted-foreground/80">
                Esta acción borrará sus cuentas privadas y categorías asociadas permanentemente.
              </p>
            </div>
          ) : null
        }
        confirmText="Eliminar Perfil"
        cancelText="Conservar"
        variant="danger"
        isLoading={isDeletingProfile}
      />
    </div>
  );
};
