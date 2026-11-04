import React, { useState } from 'react';
import { ShieldCheck, Globe, Users } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { KoinLogo } from '../common/KoinLogo';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between items-center p-4 sm:p-6 md:p-10 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      {/* Decorative Golden Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Centered Content */}
      <main className="w-full max-w-lg flex flex-col items-center my-auto">
        {/* Unified Brand Header */}
        <header className="flex flex-col items-center text-center mb-6">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <KoinLogo size={52} className="relative drop-shadow-md" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-3 text-foreground">Koin</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs">
            Finanzas Personales Soberanas · Tu patrimonio bajo tu control total
          </p>
        </header>

        {/* Auth Form Card */}
        <div className="w-full bg-card/60 backdrop-blur-md border border-border/60 p-6 sm:p-8 rounded-2xl shadow-2xl">
          {mode === 'login' ? (
            <LoginForm onToggleRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onToggleLogin={() => setMode('login')} />
          )}
        </div>

        {/* Financial Value Pillars (Relevant product benefits, zero tech jargon) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-6">
          <div className="p-3 rounded-xl bg-card/30 border border-border/40 flex items-center sm:flex-col sm:items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">Soberanía Total</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Tus datos patrimoniales y balances bajo tu estricta privacidad.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card/30 border border-border/40 flex items-center sm:flex-col sm:items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">Multi-Divisa Real</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Cuentas en USD, EUR y monedas locales sincronizadas sin fricción.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-card/30 border border-border/40 flex items-center sm:flex-col sm:items-start gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-foreground">Cuentas Compartidas</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                Presupuestos colaborativos en familia con límites y roles claros.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="w-full text-center text-xs text-muted-foreground/60 py-4 mt-6">
        <p>Koin · Tu dinero, tus decisiones, tu soberanía financiera.</p>
      </footer>
    </div>
  );
}
