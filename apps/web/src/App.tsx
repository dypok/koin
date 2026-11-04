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
  Shield,
  Layers,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './components/auth/AuthPage';
import { KoinIcon } from './lib/icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'analytics' | 'settings'>('home');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

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
          <p className="text-xs text-muted-foreground tracking-wider uppercase">Cargando Koin...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <AuthPage />;
  }

  const profile = activeProfile || profiles[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative border-x border-border/40">
      {/* Top Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="relative">
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-3 text-left focus:outline-none"
          >
            <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
              <KoinIcon name={profile?.avatarIcon || 'User'} className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight">{profile?.name || user.fullName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {profile?.baseCurrency || 'USD'} · Moneda Base
              </p>
            </div>
          </button>

          {/* Profile Switcher Dropdown (Flat, No Badges) */}
          {isProfileMenuOpen && (
            <div className="absolute top-12 left-0 w-64 bg-background border border-border/60 shadow-lg py-1 z-20 divide-y divide-border/30">
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
                  className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-muted/40 transition-colors ${
                    p.id === profile?.id ? 'bg-primary/10 text-primary' : 'text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <KoinIcon name={p.avatarIcon} className="w-4 h-4" />
                    <div>
                      <p className="text-xs font-semibold">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.baseCurrency}</p>
                    </div>
                  </div>
                  {p.id === profile?.id && <span className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </button>
              ))}
              <div className="p-1">
                <button
                  onClick={() => {
                    logout();
                    setIsProfileMenuOpen(false);
                  }}
                  className="w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors text-left font-medium"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setActiveTab('settings')}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
          title="Ajustes"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Consolidated Balance Section (Flat typography, zero card) */}
        <section className="pt-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
            Balance Consolidado
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">$ 0.00</h1>

          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Ingresos (Mes)</p>
                <p className="text-sm font-semibold text-primary">+$ 0.00</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Gastos (Mes)</p>
                <p className="text-sm font-semibold text-destructive">-$ 0.00</p>
              </div>
            </div>
          </div>
        </section>

        {/* Financial Accounts List (Flat minimalist rows) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Cuentas Financieras
            </h2>
            <span className="text-xs text-muted-foreground">2 iniciales</span>
          </div>

          <div className="divide-y divide-border/40 border-y border-border/40">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Billetera Efectivo</p>
                  <p className="text-xs text-muted-foreground">Efectivo · {profile?.baseCurrency || 'USD'}</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">$ 0.00</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cuenta Bancaria</p>
                  <p className="text-xs text-muted-foreground">Banco · {profile?.baseCurrency || 'USD'}</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">$ 0.00</span>
            </div>
          </div>
        </section>

        {/* Recent Transactions List (Minimalist flat rows) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Últimos Movimientos
            </h2>
            <span className="text-xs text-muted-foreground">Sin movimientos aún</span>
          </div>

          <div className="py-8 text-center border-y border-border/40">
            <p className="text-xs text-muted-foreground">No tienes transacciones registradas todavía.</p>
            <p className="text-[11px] text-muted-foreground/70 mt-1">Presiona (+) para registrar tu primer gasto en &lt;3s.</p>
          </div>
        </section>
      </main>

      {/* Floating Action Button for Quick Entry (<3s) */}
      <button
        className="fixed bottom-20 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        title="Nuevo Movimiento (<3s)"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Bottom Navigation Bar */}
      <nav className="border-t border-border/40 bg-background/95 backdrop-blur py-2 px-6 flex items-center justify-around sticky bottom-0 z-10">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'home' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'history' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium">Movimientos</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'analytics' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-[10px] font-medium">Presupuestos</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 transition-colors ${
            activeTab === 'settings' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] font-medium">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
