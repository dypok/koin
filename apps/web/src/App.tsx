import React, { useState, useEffect } from 'react';
import {
  Wallet,
  History,
  PieChart,
  Layers,
  Settings,
  LogOut,
  ChevronDown,
  Plus,
  Calendar,
} from 'lucide-react';
import { ProfileDTO } from '@koin/shared';
import { useAuthStore } from './stores/authStore';
import { useRecurringStore } from './stores/recurringStore';
import { AuthPage } from './components/auth/AuthPage';
import { KoinIcon } from './lib/icons';
import { KoinLogo } from './components/common/KoinLogo';
import { ProfileModal } from './components/profiles/ProfileModal';
import { ProfilePinModal } from './components/profiles/ProfilePinModal';
import { ProfileSwitcherSheet } from './components/profiles/ProfileSwitcherSheet';
import { SettingsHub } from './components/profiles/SettingsHub';
import { AccountsView } from './components/accounts/AccountsView';
import { AcceptInviteModal } from './components/accounts/AcceptInviteModal';
import { TransactionsView } from './components/transactions/TransactionsView';
import { QuickTransactionModal } from './components/transactions/QuickTransactionModal';
import { UndoToast } from './components/transactions/UndoToast';
import { UnimplementedView } from './components/common/UnimplementedView';
import { getProfileAvatarStyle } from './lib/theme';

type NavigationTab =
  | 'home'
  | 'accounts'
  | 'history'
  | 'budgets'
  | 'settings';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavigationTab>('accounts');
  const [transactionsSubTab, setTransactionsSubTab] = useState<'history' | 'recurring'>('history');
  const [isMovimientosDropdownOpen, setIsMovimientosDropdownOpen] = useState(false);
  const [recurringTrigger, setRecurringTrigger] = useState(0);
  const [settingsSubTab, setSettingsSubTab] = useState<'profiles' | 'appearance' | 'security'>('profiles');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isQuickTxModalOpen, setIsQuickTxModalOpen] = useState(false);
  const [quickTxConfig, setQuickTxConfig] = useState<{
    type?: 'expense' | 'income' | 'transfer';
    accountId?: string;
  }>({ type: 'expense' });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const t = params.get('token');
      if (t) {
        setInviteToken(t);
      }
    }
  }, []);

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

  const { rules, fetchRules } = useRecurringStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const profile = activeProfile || (profiles && profiles.length > 0 ? profiles[0] : null);

  useEffect(() => {
    if (isAuthenticated && profile?.id) {
      fetchRules(profile.id);
    }
  }, [isAuthenticated, profile?.id, fetchRules]);

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

  const activeAvatarStyle = getProfileAvatarStyle(
    profile?.themeConfig?.primaryHex,
    profile?.themeConfig?.baseMode
  );

  const activeRulesCount = rules.filter((r) => r.status === 'active').length;

  const handleGoToSettings = (subTab: 'profiles' | 'appearance' | 'security' = 'profiles') => {
    setSettingsSubTab(subTab);
    setActiveTab('settings');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* ---------------------------------------------------- */}
      {/* Desktop Sidebar (hidden on mobile, visible md+)       */}
      {/* ---------------------------------------------------- */}
      <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-border/40 bg-background flex-col justify-between shrink-0 p-5">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <KoinLogo size={36} />
            <div>
              <span className="text-lg font-bold tracking-tight">Koin</span>
            </div>
          </div>

          {/* Profile Switcher Trigger in Sidebar */}
          <div>
            <button
              onClick={() => setIsProfileMenuOpen(true)}
              className="w-full p-2.5 flex items-center justify-between border border-border/50 hover:border-primary/50 transition-colors text-left bg-muted/20"
              title="Cambiar perfil"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div
                  className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: activeAvatarStyle.bg,
                    borderColor: activeAvatarStyle.border,
                    color: activeAvatarStyle.color,
                  }}
                >
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
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'home'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Inicio y Balance</span>
            </button>

            <button
              onClick={() => setActiveTab('accounts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'accounts'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Cuentas Financieras</span>
            </button>

            {/* Movimientos with Sub-navigation */}
            <div className="space-y-0.5">
              <button
                onClick={() => {
                  setActiveTab('history');
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-xs font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4" />
                  <span>Movimientos</span>
                </div>
                {activeRulesCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-400 text-[10px] flex items-center justify-center font-mono font-bold">
                    {activeRulesCount}
                  </span>
                )}
              </button>

              {/* Sub-items in Sidebar */}
              {activeTab === 'history' && (
                <div className="ml-7 space-y-0.5 border-l border-border/40 pl-3 py-1 animate-in fade-in duration-100">
                  <button
                    onClick={() => setTransactionsSubTab('history')}
                    className={`w-full text-left py-1 text-[11px] transition-colors flex items-center gap-2 ${
                      transactionsSubTab === 'history'
                        ? 'text-primary font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        transactionsSubTab === 'history' ? 'bg-primary' : 'bg-transparent'
                      }`}
                    />
                    <span>Historial</span>
                  </button>

                  <button
                    onClick={() => setTransactionsSubTab('recurring')}
                    className={`w-full text-left py-1 text-[11px] transition-colors flex items-center justify-between ${
                      transactionsSubTab === 'recurring'
                        ? 'text-purple-400 font-bold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          transactionsSubTab === 'recurring' ? 'bg-purple-400' : 'bg-transparent'
                        }`}
                      />
                      <span>Compromisos y Deudas</span>
                    </div>
                    {activeRulesCount > 0 && (
                      <span className="text-[10px] font-mono text-purple-400 font-bold">
                        ({activeRulesCount})
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setActiveTab('budgets')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'budgets'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Presupuestos</span>
            </button>

            <button
              onClick={() => handleGoToSettings('profiles')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configuración</span>
            </button>
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
            <div
              className="w-8 h-8 rounded-full border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: activeAvatarStyle.bg,
                borderColor: activeAvatarStyle.border,
                color: activeAvatarStyle.color,
              }}
            >
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
          onOpenManageProfiles={() => handleGoToSettings('profiles')}
          onRequestPin={(p) => setPinModalProfile(p)}
        />

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/40 bg-background sticky top-0 z-10">
          <div>
            {activeTab === 'history' ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMovimientosDropdownOpen(!isMovimientosDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 border border-border/80 bg-muted/15 hover:border-border text-foreground font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                  aria-expanded={isMovimientosDropdownOpen}
                  title="Cambiar vista de Movimientos"
                >
                  {transactionsSubTab === 'history' ? (
                    <>
                      <History className="w-3.5 h-3.5 text-primary" />
                      <span>Historial de Movimientos</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      <span>Compromisos, Fijos y Deudas</span>
                    </>
                  )}
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${
                      isMovimientosDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isMovimientosDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsMovimientosDropdownOpen(false)}
                    />
                    <div className="absolute left-0 top-full mt-1.5 w-72 border border-border/80 bg-background shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={() => {
                          setTransactionsSubTab('history');
                          setIsMovimientosDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 text-left text-xs flex items-start gap-2.5 transition-colors border ${
                          transactionsSubTab === 'history'
                            ? 'border-primary/40 bg-primary/10 text-primary font-bold'
                            : 'border-transparent hover:bg-muted/15 text-foreground'
                        }`}
                      >
                        <History className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
                        <div>
                          <p className="font-bold">Historial de Movimientos</p>
                          <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            Ingresos, gastos y transferencias registradas
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTransactionsSubTab('recurring');
                          setIsMovimientosDropdownOpen(false);
                        }}
                        className={`w-full p-2.5 text-left text-xs flex items-start gap-2.5 transition-colors border mt-1 ${
                          transactionsSubTab === 'recurring'
                            ? 'border-purple-500/40 bg-purple-500/10 text-purple-400 font-bold'
                            : 'border-transparent hover:bg-muted/15 text-foreground'
                        }`}
                      >
                        <Calendar className="w-4 h-4 shrink-0 mt-0.5 text-purple-400" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-bold">Compromisos, Fijos y Deudas</p>
                            {activeRulesCount > 0 && (
                              <span className="text-[10px] font-mono px-1 bg-purple-500/20 text-purple-400 font-bold">
                                {activeRulesCount}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-normal mt-0.5">
                            Salarios nómina, gastos mensuales y amortización de deudas
                          </p>
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <h2 className="text-sm font-bold tracking-tight text-foreground uppercase">
                {activeTab === 'home' && 'Inicio y Balance'}
                {activeTab === 'accounts' && 'Cuentas Financieras'}
                {activeTab === 'budgets' && 'Presupuestos'}
                {activeTab === 'settings' && 'Configuración'}
              </h2>
            )}
          </div>

          {/* Global Quick Action: only on other views to avoid redundancy when already inside Movimientos */}
          {activeTab !== 'history' && (
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setQuickTxConfig({ type: 'expense' });
                  setIsQuickTxModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity shadow-sm"
                title="Registrar gasto, ingreso o transferencia puntual"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo Movimiento</span>
              </button>
            </div>
          )}
        </header>

        {/* Main Content Area */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 flex-1">
          {activeTab === 'settings' && (
            <SettingsHub initialSubTab={settingsSubTab} />
          )}

          {activeTab === 'accounts' && (
            <AccountsView onGoToSettings={() => handleGoToSettings('profiles')} />
          )}

          {activeTab === 'history' && (
            <TransactionsView
              activeMainTab={transactionsSubTab}
              onTabChange={(t) => setTransactionsSubTab(t)}
              openRecurringModalTrigger={recurringTrigger}
              onNewTransaction={(type = 'expense', accountId) => {
                setQuickTxConfig({ type, accountId });
                setIsQuickTxModalOpen(true);
              }}
            />
          )}

          {activeTab === 'budgets' && (
            <UnimplementedView
              moduleName="Presupuestos"
              onGoToSettings={() => handleGoToSettings('profiles')}
            />
          )}

          {activeTab === 'home' && (
            <UnimplementedView
              moduleName="Inicio y Balance"
              onGoToSettings={() => handleGoToSettings('profiles')}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation Bar (md:hidden) */}
        <nav className="md:hidden border-t border-border/40 bg-background py-2 px-3 flex items-center justify-around sticky bottom-0 z-20">
          <button
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'home' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-medium">Inicio</span>
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

          <button
            onClick={() => setActiveTab('budgets')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'budgets' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="text-[10px] font-medium">Presupuestos</span>
          </button>

          <button
            onClick={() => handleGoToSettings('profiles')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Configuración</span>
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

      {/* Global Shared Account Invitation Modal */}
      {inviteToken && (
        <AcceptInviteModal
          token={inviteToken}
          onClose={() => {
            setInviteToken(null);
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
          onSuccess={() => {
            setActiveTab('accounts');
            setInviteToken(null);
            if (typeof window !== 'undefined') {
              window.history.replaceState({}, '', window.location.pathname);
            }
          }}
        />
      )}

      {/* Global Quick 2-Touch Transaction & Transfer Modal */}
      <QuickTransactionModal
        isOpen={isQuickTxModalOpen}
        onClose={() => setIsQuickTxModalOpen(false)}
        defaultType={quickTxConfig.type}
        defaultAccountId={quickTxConfig.accountId}
      />

      {/* Global 5-Second Undo Toast Notification */}
      <UndoToast />
    </div>
  );
}
