import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  User,
  Settings,
  PieChart,
  History,
  Layers,
  LogOut,
  ChevronDown,
  Coins,
  Search,
  Filter,
  CreditCard,
  Building2,
  Tag,
  TrendingUp,
} from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { KoinIcon } from './lib/icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'budgets' | 'accounts' | 'settings'>('home');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');

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
      <aside className="hidden md:flex md:w-64 lg:w-72 border-r border-border/40 bg-background/95 flex-col justify-between shrink-0 p-5">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-3 pb-3 border-b border-border/30">
            <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Coins className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight">Koin</span>
              <p className="text-[11px] text-muted-foreground font-mono">Desktop &amp; Cloud</p>
            </div>
          </div>

          {/* Profile Switcher Card in Sidebar (Flat, No Badges) */}
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
                <div className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Perfiles ({profiles.length})
                </div>
                {profiles.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setActiveProfile(p);
                      setIsProfileMenuOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between text-left hover:bg-muted/40 transition-colors ${
                      p.id === profile?.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <KoinIcon name={p.avatarIcon} className="w-4 h-4" />
                      <div>
                        <p className="text-xs font-medium">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{p.baseCurrency}</p>
                      </div>
                    </div>
                    {p.id === profile?.id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Desktop Navigation Links (Flat Rows) */}
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
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Historial de Movimientos</span>
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
              <span>Presupuestos y Metas</span>
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

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary/10 text-primary border-l-2 border-primary font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/20'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes y Apariencia</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer: User details and Logout */}
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
        <header className="md:hidden p-4 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <KoinIcon name={profile?.avatarIcon || 'User'} className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">{profile?.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">{profile?.baseCurrency} · Moneda Base</p>
            </div>
          </div>

          <button onClick={logout} className="p-2 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Desktop Top Header Bar */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-border/40 bg-background/60 backdrop-blur sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-base font-bold tracking-tight">
              {activeTab === 'home' && 'Panel Financiero Consolidado'}
              {activeTab === 'history' && 'Historial de Transacciones'}
              {activeTab === 'budgets' && 'Presupuestos por Categoría'}
              {activeTab === 'accounts' && 'Cuentas y Billeteras'}
              {activeTab === 'settings' && 'Ajustes del Perfil'}
            </h2>
            <div className="h-4 w-[1px] bg-border/60" />
            <span className="text-xs text-muted-foreground font-mono">
              Perfil: {profile?.name} ({profile?.baseCurrency})
            </span>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            <button
              className="py-2 px-4 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 shadow-sm"
              title="Registrar gasto o ingreso en menos de 3 segundos"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Nuevo Movimiento (&lt;3s)</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 md:p-8 max-w-6xl w-full mx-auto space-y-8 flex-1">
          {/* Section 1: Financial Balance & Metrics (Flat, No Card Clutter) */}
          <section className="space-y-4">
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                Balance Total Consolidado
              </span>
              <div className="flex items-baseline gap-3 mt-1">
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight font-mono">$ 0.00</h1>
                <span className="text-sm text-muted-foreground font-mono">{profile?.baseCurrency}</span>
              </div>
            </div>

            {/* 3-Metric Flat Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border/40">
              <div className="flex items-center gap-3.5 p-3 border border-border/30 bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Ingresos Totales (Mes)</p>
                  <p className="text-base font-semibold text-primary font-mono">+$ 0.00</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 border border-border/30 bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Gastos Totales (Mes)</p>
                  <p className="text-base font-semibold text-destructive font-mono">-$ 0.00</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-3 border border-border/30 bg-muted/10">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-medium">Ahorro Neto Proyectado</p>
                  <p className="text-base font-semibold font-mono">+$ 0.00</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Two-Column Desktop Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left/Main Column: Recent Transactions & Filters (lg:col-span-8) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Movimientos Recientes
                  </h3>
                </div>

                {/* Filter Selector (Flat typographic tabs, zero badges) */}
                <div className="flex items-center gap-1 border border-border/40 p-0.5 text-xs self-start sm:self-auto">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1 transition-colors ${
                      filterType === 'all' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => setFilterType('expense')}
                    className={`px-3 py-1 transition-colors ${
                      filterType === 'expense' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Gastos
                  </button>
                  <button
                    onClick={() => setFilterType('income')}
                    className={`px-3 py-1 transition-colors ${
                      filterType === 'income' ? 'bg-primary text-primary-foreground font-medium' : 'text-muted-foreground'
                    }`}
                  >
                    Ingresos
                  </button>
                </div>
              </div>

              {/* Transactions Flat List */}
              <div className="border border-border/40 divide-y divide-border/30 bg-background">
                <div className="py-12 px-4 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-muted/40 mx-auto flex items-center justify-center text-muted-foreground">
                    <History className="w-5 h-5 opacity-50" />
                  </div>
                  <p className="text-sm font-medium">Aún no hay transacciones en este perfil</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Los movimientos que registres aparecerán organizados cronológicamente con conversión automática a tu divisa base ({profile?.baseCurrency}).
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Financial Accounts & Budgets (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-6">
              {/* Financial Accounts List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Cuentas Financieras
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">2 iniciales</span>
                </div>

                <div className="border border-border/40 divide-y divide-border/30 bg-background">
                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Billetera Efectivo</p>
                        <p className="text-[11px] text-muted-foreground font-mono">Efectivo · {profile?.baseCurrency}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">$ 0.00</span>
                  </div>

                  <div className="p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold">Cuenta Bancaria</p>
                        <p className="text-[11px] text-muted-foreground font-mono">Banco · {profile?.baseCurrency}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold">$ 0.00</span>
                  </div>
                </div>
              </div>

              {/* Monthly Budgets Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                    Presupuestos del Mes
                  </h3>
                  <span className="text-xs text-muted-foreground font-mono">Control</span>
                </div>

                <div className="p-4 border border-border/40 bg-background space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Alimentación</span>
                      <span className="text-muted-foreground font-mono">$ 0.00 / $ 400.00</span>
                    </div>
                    {/* 4px minimal progress line */}
                    <div className="w-full h-1 bg-muted rounded-none overflow-hidden">
                      <div className="h-full bg-primary w-0" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Transporte</span>
                      <span className="text-muted-foreground font-mono">$ 0.00 / $ 150.00</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-none overflow-hidden">
                      <div className="h-full bg-primary w-0" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">Vivienda y Servicios</span>
                      <span className="text-muted-foreground font-mono">$ 0.00 / $ 800.00</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-none overflow-hidden">
                      <div className="h-full bg-primary w-0" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Mobile Floating Action Button (Only on mobile) */}
        <button
          className="md:hidden fixed bottom-18 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
          title="Nuevo Movimiento (<3s)"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Mobile Bottom Navigation Bar (md:hidden) */}
        <nav className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur py-2 px-6 flex items-center justify-around sticky bottom-0 z-20">
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
            onClick={() => setActiveTab('accounts')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'accounts' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-medium">Cuentas</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 transition-colors ${
              activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ajustes</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
