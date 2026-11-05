import React, { useState, useEffect } from 'react';
import {
  Users,
  Palette,
  Shield,
  Wallet,
  History,
  PieChart,
  Layers,
  LogOut,
  ChevronDown,
  Plus,
  Lock,
} from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { KoinIcon } from './lib/icons';
import { KoinLogo } from './components/common/KoinLogo';
import { ProfileModal } from './components/profiles/ProfileModal';
import { ProfilePinModal } from './components/profiles/ProfilePinModal';
import { ProfileSwitcherSheet } from './components/profiles/ProfileSwitcherSheet';
import { ProfileStreamingView } from './components/profiles/ProfileStreamingView';
import { AppearanceSettingsView } from './components/profiles/AppearanceSettingsView';
import { SecuritySettingsView } from './components/profiles/SecuritySettingsView';
import { UnimplementedView } from './components/common/UnimplementedView';

type NavigationTab =
  | 'profiles'
  | 'appearance'
  | 'security'
  | 'accounts'
  | 'history'
  | 'budgets'
  | 'home';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('profiles');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);

  const {
    user,
    profiles,
    activeProfile,
    isAuthenticated,
    isLoading,
    checkSession,
    setActiveProfile,
    logout,
  } = useAuthStore();

  const handleSelectProfile = (p: ProfileDTO) => {
    setIsProfileMenuOpen(false);
    if (p.id === activeProfile?.id) return;
    if (p.hasPin) {
      setPinModalProfile(p);
    } else {
      setActiveProfile(p);
    }
  };

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted-foreground tracking-wider uppercase font-mono">Cargando Koin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  const profile = activeProfile || profiles[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ---------------------------------------------------- */}
      {/* Desktop Sidebar (hidden on mobile, visible md+)       */}
      {/* ---------------------------------------------------- */}
      <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-border/40 bg-background flex-col justify-between shrink-0 p-5">
        <div className="space-y-6">
          {/* Logo (Sin textos redundantes como "Desktop & Cloud") */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <KoinLogo size={36} />
            <div>
              <span className="text-lg font-bold tracking-tight">Koin</span>
            </div>
          </div>

          {/* Profile Switcher Trigger in Sidebar */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="w-full p-2.5 flex items-center justify-between border border-border/50 hover:border-primary/50 transition-colors text-left bg-muted/20"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center shrink-0">
                  <KoinIcon name={profile?.avatarIcon || 'User'} className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-semibold truncate">{profile?.name || user.fullName}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {profile?.baseCurrency || 'USD'} · Activo
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {/* Profile Dropdown */}
            {isProfileMenuOpen && (
              <div className="absolute top-14 left-0 w-full bg-background border border-border/60 shadow-xl py-1 z-30 divide-y divide-border/30">
                <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground flex items-center justify-between">
                  <span>Perfiles ({profiles.length})</span>
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsCreateProfileModalOpen(true);
                    }}
                    className="text-primary hover:underline flex items-center gap-1 font-semibold text-[10px]"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nuevo</span>
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto divide-y divide-border/20">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProfile(p)}
                      className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/40 transition-colors ${
                        p.id === profile?.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <KoinIcon name={p.avatarIcon} className="w-4 h-4" />
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-medium">{p.name}</p>
                            {p.hasPin && <Lock className="w-2.5 h-2.5 text-muted-foreground" />}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-mono">{p.baseCurrency}</p>
                        </div>
                      </div>
                      {p.id === profile?.id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                    </button>
                  ))}
                </div>
                <div className="p-1.5 bg-muted/10">
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setActiveTab('profiles');
                    }}
                    className="w-full py-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-center font-medium block"
                  >
                    Gestionar Perfiles
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-4">
            {/* Active Group: Perfiles */}
            <div className="space-y-1">
              <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/80 block pb-1">
                Perfiles &amp; Personalización
              </span>

              <button
                onClick={() => setActiveTab('profiles')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'profiles'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Perfiles de Usuario</span>
              </button>

              <button
                onClick={() => setActiveTab('appearance')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'appearance'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>Apariencia y Colores</span>
              </button>

              <button
                onClick={() => setActiveTab('security')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'security'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Seguridad y Bloqueo PIN</span>
              </button>
            </div>

            {/* Unimplemented Group: En desarrollo */}
            <div className="space-y-1 pt-2 border-t border-border/30">
              <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 block pb-1">
                Próximamente
              </span>

              <button
                onClick={() => setActiveTab('accounts')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'accounts'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/10'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Cuentas Financieras</span>
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/10'
                }`}
              >
                <History className="w-4 h-4" />
                <span>Movimientos</span>
              </button>

              <button
                onClick={() => setActiveTab('budgets')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'budgets'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/10'
                }`}
              >
                <PieChart className="w-4 h-4" />
                <span>Presupuestos</span>
              </button>

              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium transition-colors ${
                  activeTab === 'home'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground/70 hover:text-foreground hover:bg-muted/10'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>Inicio y Balance</span>
              </button>
            </div>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-border/40 space-y-3">
          <div className="px-2">
            <p className="text-xs font-medium truncate">{user.fullName}</p>
            <p className="text-[11px] text-muted-foreground truncate font-mono">{user.email}</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* Main Responsive Canvas (Mobile & Desktop)            */}
      {/* ---------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Mobile Header (Hidden on md+) */}
        <header className="md:hidden p-4 flex items-center justify-between border-b border-border/40 bg-background sticky top-0 z-20">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <KoinIcon name={profile?.avatarIcon || 'User'} className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{profile?.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{profile?.baseCurrency} · Moneda Base</p>
            </div>
          </button>

          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Profile Switcher Bottom Sheet / Popover (<100ms switching) */}
        <ProfileSwitcherSheet
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          onOpenCreateProfile={() => setIsCreateProfileModalOpen(true)}
          onOpenManageProfiles={() => setActiveTab('profiles')}
          onRequestPin={(p) => setPinModalProfile(p)}
        />

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/40 bg-background sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
              {activeTab === 'profiles' && 'Perfiles de Usuario'}
              {activeTab === 'appearance' && 'Apariencia y Colores'}
              {activeTab === 'security' && 'Seguridad y PIN'}
              {activeTab === 'accounts' && 'Cuentas Financieras'}
              {activeTab === 'history' && 'Historial de Movimientos'}
              {activeTab === 'budgets' && 'Presupuestos'}
              {activeTab === 'home' && 'Inicio y Balance'}
            </h2>
            <div className="h-4 w-[1px] bg-border/60" />
            <button
              onClick={() => setIsProfileMenuOpen(true)}
              className="flex items-center gap-2 px-2.5 py-1 text-xs border border-border/40 hover:border-primary/50 transition-colors bg-muted/10 group"
              title="Conmutar perfil rápido (<100ms)"
            >
              <KoinIcon name={profile?.avatarIcon || 'User'} className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {profile?.name}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">({profile?.baseCurrency})</span>
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsCreateProfileModalOpen(true);
              }}
              className="py-1.5 px-3 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
              title="Crear un nuevo perfil"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Perfil</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 flex-1">
          {activeTab === 'profiles' && (
            <ProfileStreamingView
              onNavigateToAppearance={() => setActiveTab('appearance')}
              onNavigateToSecurity={() => setActiveTab('security')}
            />
          )}

          {activeTab === 'appearance' && <AppearanceSettingsView />}

          {activeTab === 'security' && <SecuritySettingsView />}

          {activeTab === 'accounts' && (
            <UnimplementedView
              moduleName="Cuentas Financieras"
              onGoToProfiles={() => setActiveTab('profiles')}
            />
          )}

          {activeTab === 'history' && (
            <UnimplementedView
              moduleName="Historial de Movimientos"
              onGoToProfiles={() => setActiveTab('profiles')}
            />
          )}

          {activeTab === 'budgets' && (
            <UnimplementedView
              moduleName="Presupuestos y Metas"
              onGoToProfiles={() => setActiveTab('profiles')}
            />
          )}

          {activeTab === 'home' && (
            <UnimplementedView
              moduleName="Inicio y Balance"
              onGoToProfiles={() => setActiveTab('profiles')}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (md:hidden) */}
        <nav className="md:hidden border-t border-border/40 bg-background py-2 px-3 flex items-center justify-around sticky bottom-0 z-20">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'profiles' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-medium">Perfiles</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'appearance' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Palette className="w-5 h-5" />
            <span className="text-[10px] font-medium">Apariencia</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'security' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Shield className="w-5 h-5" />
            <span className="text-[10px] font-medium">Seguridad</span>
          </button>

          <button
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'accounts' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cuentas</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'history' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-[10px] font-medium">Movimientos</span>
          </button>
        </nav>
      </div>

      {/* Global Profile Creation Modal */}
      <ProfileModal
        isOpen={isCreateProfileModalOpen}
        onClose={() => setIsCreateProfileModalOpen(false)}
        onSuccess={(newProfile) => {
          setActiveProfile(newProfile);
        }}
      />

      {/* Global Profile PIN Unlock Modal */}
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
}
