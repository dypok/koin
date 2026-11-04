import React, { useState } from 'react';
import { ShieldCheck, Globe, Users } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { KoinLogo } from '../common/KoinLogo';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-background text-foreground flex flex-col justify-between items-center px-4 py-6 sm:py-8 relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background select-none">
      {/* Decorative Golden Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* 1. Header (Embedded directly on page) */}
      <header className="flex flex-col items-center text-center shrink-0">
        <KoinLogo size={44} className="drop-shadow-sm" />
        <h1 className="text-xl font-bold tracking-tight mt-2 text-foreground">Koin</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Finanzas Personales Soberanas
        </p>
      </header>

      {/* 2. Embedded Form (No cards, pure flat integrated surface) */}
      <main className="w-full max-w-sm my-auto shrink-0">
        {mode === 'login' ? (
          <LoginForm onToggleRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onToggleLogin={() => setMode('login')} />
        )}
      </main>

      {/* 3. Integrated Financial Pillars & Footer (No cards, typographic hairlines) */}
      <footer className="w-full max-w-lg shrink-0 pt-2 flex flex-col items-center">
        <div className="grid grid-cols-3 gap-3 w-full text-center border-t border-border/30 pt-3">
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Soberanía Total</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
              Tus balances y datos bajo tu estricta privacidad.
            </p>
          </div>

          <div className="flex flex-col items-center border-x border-border/30 px-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Multi-Divisa</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
              USD, EUR y monedas locales sincronizadas.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>Compartidas</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">
              Presupuestos colaborativos y familiares claros.
            </p>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/60 mt-2.5 text-center">
          Tu dinero, tus decisiones, tu soberanía financiera.
        </p>
      </footer>
    </div>
  );
}
