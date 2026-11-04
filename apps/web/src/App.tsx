import React, { useState } from 'react';
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
} from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@koin/shared';

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'history' | 'analytics' | 'settings'>('home');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto relative border-x border-border/40">
      {/* Top Header */}
      <header className="p-4 flex items-center justify-between border-b border-border/40 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight">Dylan</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs text-muted-foreground">Personal</span>
            </div>
            <p className="text-[11px] text-muted-foreground">USD · Moneda Base</p>
          </div>
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
          <h1 className="text-3xl font-extrabold tracking-tight mt-1">$ 14,820.50</h1>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-border/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Ingresos (Mes)</p>
                <p className="text-sm font-semibold text-primary">+$ 4,200.00</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Gastos (Mes)</p>
                <p className="text-sm font-semibold text-destructive">-$ 1,850.00</p>
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
            <span className="text-xs text-muted-foreground">3 activas</span>
          </div>

          <div className="divide-y divide-border/40 border-y border-border/40">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Billetera Efectivo</p>
                  <p className="text-xs text-muted-foreground">Efectivo · USD</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">$ 420.00</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Cuenta Nómina</p>
                  <p className="text-xs text-muted-foreground">Banco · USD</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">$ 8,150.50</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted text-foreground flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Fondo Emergencia</p>
                  <p className="text-xs text-muted-foreground">Ahorros · USD</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold">$ 6,250.00</span>
            </div>
          </div>
        </section>

        {/* Recent Transactions List (Minimalist flat rows) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Últimos Movimientos
            </h2>
            <span className="text-xs text-muted-foreground">Hoy</span>
          </div>

          <div className="divide-y divide-border/40 border-y border-border/40">
            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Supermercado</p>
                  <p className="text-xs text-muted-foreground">Alimentación · 11:30 AM</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold text-destructive">-$ 42.80</span>
            </div>

            <div className="py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Pago Cliente Freelance</p>
                  <p className="text-xs text-muted-foreground">Ingresos · 09:15 AM</p>
                </div>
              </div>
              <span className="text-sm font-mono font-semibold text-primary">+$ 1,200.00</span>
            </div>
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
