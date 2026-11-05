import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

type TransactionsSubTab = 'history' | 'recurring';
type SettingsSubTab = 'profiles' | 'appearance' | 'security';

function parseRoute(pathname: string): {
  tab: NavigationTab;
  txSubTab: TransactionsSubTab;
  settingsSubTab: SettingsSubTab;
} {
  const clean = pathname.toLowerCase().replace(/\/+$/, '') || '/';

  if (clean === '/inicio' || clean === '/home') {
    return { tab: 'home', txSubTab: 'history', settingsSubTab: 'profiles' };
  }
  if (clean === '/presupuestos' || clean === '/budgets') {
    return { tab: 'budgets', txSubTab: 'history', settingsSubTab: 'profiles' };
  }
  if (clean.startsWith('/movimientos') || clean.startsWith('/history')) {
    if (
      clean.includes('compromiso') ||
      clean.includes('fijo') ||
      clean.includes('deuda') ||
      clean.includes('recurring')
    ) {
      return { tab: 'history', txSubTab: 'recurring', settingsSubTab: 'profiles' };
    }
    return { tab: 'history', txSubTab: 'history', settingsSubTab: 'profiles' };
  }
  if (clean.startsWith('/configuracion') || clean.startsWith('/settings')) {
    if (clean.includes('apariencia') || clean.includes('appearance') || clean.includes('colores')) {
      return { tab: 'settings', txSubTab: 'history', settingsSubTab: 'appearance' };
    }
    if (clean.includes('seguridad') || clean.includes('security') || clean.includes('pin')) {
      return { tab: 'settings', txSubTab: 'history', settingsSubTab: 'security' };
    }
    return { tab: 'settings', txSubTab: 'history', settingsSubTab: 'profiles' };
  }

  // Default to accounts ('/cuentas' or '/')
  return { tab: 'accounts', txSubTab: 'history', settingsSubTab: 'profiles' };
}

function getPathForState(
  tab: NavigationTab,
  txSubTab: TransactionsSubTab,
  settingsSubTab: SettingsSubTab
): string {
  switch (tab) {
    case 'home':
      return '/inicio';
    case 'accounts':
      return '/cuentas';
    case 'history':
      return txSubTab === 'recurring' ? '/movimientos/compromisos' : '/movimientos';
    case 'budgets':
      return '/presupuestos';
    case 'settings':
      if (settingsSubTab === 'appearance') return '/configuracion/apariencia';
      if (settingsSubTab === 'security') return '/configuracion/seguridad';
      return '/configuracion/perfiles';
    default:
      return '/cuentas';
  }
}

export default function App() {
  const initialRoute = useMemo(() => {
    if (typeof window !== 'undefined') {
      return parseRoute(window.location.pathname);
    }
    return {
      tab: 'accounts' as NavigationTab,
      txSubTab: 'history' as TransactionsSubTab,
      settingsSubTab: 'profiles' as SettingsSubTab,
    };
  }, []);

  const [activeTab, setActiveTabState] = useState<NavigationTab>(initialRoute.tab);
  const [transactionsSubTab, setTransactionsSubTabState] = useState<TransactionsSubTab>(initialRoute.txSubTab);
  const [settingsSubTab, setSettingsSubTabState] = useState<SettingsSubTab>(initialRoute.settingsSubTab);

  const [isMovimientosDropdownOpen, setIsMovimientosDropdownOpen] = useState(false);
  const [recurringTrigger, setRecurringTrigger] = useState(0);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isCreateProfileModalOpen, setIsCreateProfileModalOpen] = useState(false);
  const [pinModalProfile, setPinModalProfile] = useState<ProfileDTO | null>(null);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [isQuickTxModalOpen, setIsQuickTxModalOpen] = useState(false);
  const [quickTxConfig, setQuickTxConfig] = useState<{
    type?: 'expense' | 'income' | 'transfer';
    accountId?: string;
  }>({ type: 'expense' });

  // Retractable Navbar scroll state
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const lastScrollTopRef = React.useRef(0);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const currentScrollTop = e.currentTarget.scrollTop;
    const lastScrollTop = lastScrollTopRef.current;
    const delta = currentScrollTop - lastScrollTop;

    // Near the top of the canvas: always show navbar
    if (currentScrollTop <= 40) {
      setIsNavbarVisible(true);
    } else if (delta > 6 && currentScrollTop > 60) {
      // Scrolling down significantly -> retract navbar and close dropdown
      setIsNavbarVisible(false);
      setIsMovimientosDropdownOpen(false);
    } else if (delta < -6) {
      // Scrolling up -> reveal navbar
      setIsNavbarVisible(true);
    }

    lastScrollTopRef.current = currentScrollTop;
  }, []);

  // SPA Route navigation dispatcher
  const navigate = useCallback(
    (
      tab: NavigationTab,
      txSub?: TransactionsSubTab,
      setSub?: SettingsSubTab,
      replace = false
    ) => {
      setIsNavbarVisible(true);
      setActiveTabState(tab);
      const nextTx = txSub || (tab === 'history' ? transactionsSubTab : 'history');
      const nextSet = setSub || (tab === 'settings' ? settingsSubTab : 'profiles');
      if (txSub) setTransactionsSubTabState(txSub);
      if (setSub) setSettingsSubTabState(setSub);

      if (typeof window !== 'undefined') {
        const targetPath = getPathForState(tab, nextTx, nextSet);
        const search = window.location.search;
        const fullUrl = targetPath + (search || '');

        if (window.location.pathname !== targetPath) {
          if (replace) {
            window.history.replaceState({ tab, txSub: nextTx, setSub: nextSet }, '', fullUrl);
          } else {
            window.history.pushState({ tab, txSub: nextTx, setSub: nextSet }, '', fullUrl);
          }
        }
      }
    },
    [transactionsSubTab, settingsSubTab]
  );

  const setActiveTab = (tab: NavigationTab) => {
    navigate(tab);
  };

  const setTransactionsSubTab = (txSub: TransactionsSubTab) => {
    navigate('history', txSub);
  };

  const setSettingsSubTab = (setSub: SettingsSubTab) => {
    navigate('settings', undefined, setSub);
  };

  const handleGoToSettings = (subTab: SettingsSubTab = 'profiles') => {
    navigate('settings', undefined, subTab);
  };

  // Sync route on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const route = parseRoute(window.location.pathname);
      setActiveTabState(route.tab);
      setTransactionsSubTabState(route.txSubTab);
      setSettingsSubTabState(route.settingsSubTab);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Normalize initial root URL to /cuentas if on /
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/') {
      const search = window.location.search;
      window.history.replaceState(null, '', '/cuentas' + (search || ''));
    }
  }, []);

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

            {/* Movimientos button (sub-views are controlled strictly from the navbar dropdown) */}
            <button
              onClick={() => setActiveTab('history')}
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
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto"
      >
        {/* Mobile Header (Hidden on md+, retractable on scroll) */}
        <header
          className={`md:hidden px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-20 transition-transform duration-300 ease-in-out ${
            isNavbarVisible ? 'translate-y-0 shadow-xs' : '-translate-y-full pointer-events-none'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 text-left focus:outline-none min-w-0"
            >
              <div
                className="w-7 h-7 rounded-full border flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: activeAvatarStyle.bg,
                  borderColor: activeAvatarStyle.border,
                  color: activeAvatarStyle.color,
                }}
              >
                <KoinIcon name={profile?.avatarIcon || 'User'} className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold truncate">{profile?.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"></span>
                  <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                </div>
                <p className="text-[9px] text-muted-foreground font-mono">{profile?.baseCurrency} · Moneda Base</p>
              </div>
            </button>

            <button onClick={logout} className="p-1.5 text-muted-foreground hover:text-destructive shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Movimientos Sub-view Dropdown (sole control for Movimientos sub-views) */}
          {activeTab === 'history' && (
            <div className="mt-2.5 pt-2 border-t border-border/40 relative">
              <button
                type="button"
                onClick={() => setIsMovimientosDropdownOpen(!isMovimientosDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-1.5 border border-border/80 bg-muted/15 hover:border-border text-foreground font-bold text-xs uppercase tracking-wider transition-colors shadow-2xs"
                aria-expanded={isMovimientosDropdownOpen}
              >
                <div className="flex items-center gap-2 truncate">
                  {transactionsSubTab === 'history' ? (
                    <>
                      <History className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">Historial de Movimientos</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">Compromisos, Fijos y Deudas</span>
                    </>
                  )}
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0 ${
                    isMovimientosDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Mobile Dropdown Options */}
              {isMovimientosDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setIsMovimientosDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 border border-border/80 bg-background shadow-xl p-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
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
          )}
        </header>

        {/* Profile Switcher Bottom Sheet / Popover (<100ms switching) */}
        <ProfileSwitcherSheet
          isOpen={isProfileMenuOpen}
          onClose={() => setIsProfileMenuOpen(false)}
          onOpenCreateProfile={() => setIsCreateProfileModalOpen(true)}
          onOpenManageProfiles={() => handleGoToSettings('profiles')}
          onRequestPin={(p) => setPinModalProfile(p)}
        />

        {/* Desktop Top Header Bar (Retractable on scroll) */}
        <header
          className={`hidden md:flex items-center justify-between px-8 py-3.5 border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-30 transition-transform duration-300 ease-in-out ${
            isNavbarVisible ? 'translate-y-0 shadow-xs' : '-translate-y-full pointer-events-none'
          }`}
        >
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
            <SettingsHub
              initialSubTab={settingsSubTab}
              onSubTabChange={(sub) => setSettingsSubTab(sub)}
            />
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
              onGoToAccounts={() => setActiveTab('accounts')}
              onGoToSettings={() => handleGoToSettings('profiles')}
            />
          )}

          {activeTab === 'home' && (
            <UnimplementedView
              moduleName="Inicio y Balance"
              onGoToAccounts={() => setActiveTab('accounts')}
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
