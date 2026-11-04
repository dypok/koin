import React, { useState } from 'react';
import { Coins, ShieldCheck, Layers, Globe, Zap } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Left Column: Brand & Architecture Highlights (Desktop Only) */}
      <div className="hidden md:flex md:w-1/2 lg:w-5/12 bg-muted/20 border-r border-border/40 p-8 lg:p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Coins className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Koin</h1>
              <p className="text-xs text-muted-foreground">Finanzas Personales Soberanas</p>
            </div>
          </div>

          <div className="mt-16 space-y-8">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Control financiero de alta velocidad en escritorio y móvil.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Diseñado para profesionales que exigen precisión matemática, cero distracciones y registro en menos de 3 segundos.
              </p>
            </div>

            <div className="space-y-6 pt-4">
              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Multi-Perfiles Aislados</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gestiona finanzas personales, proyectos freelance o presupuestos familiares de forma independiente con conmutación en un clic.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Motor Multidivisa Soberano</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Cuentas y transacciones en USD, EUR, COP, MXN o ARS con normalización matemática exacta en base de datos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Seguridad Criptográfica</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hashing Argon2id, comparaciones con mitigación de timing attacks y protección contra fuerza bruta por IP.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Diseño Plano &amp; Cero Emojis</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Iconografía 100% vectorial SVG Lucide, sin badges abultados ni cards innecesarias.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 text-xs text-muted-foreground flex items-center justify-between font-mono">
          <span>Koin v1.0.0</span>
          <span>Heroku &amp; Postgres</span>
        </div>
      </div>

      {/* Right Column: Interactive Form (Responsive for Mobile and Desktop) */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 lg:p-16">
        {/* Mobile Header (Hidden on Desktop) */}
        <div className="md:hidden flex items-center gap-3 border-b border-border/40 pb-5 mb-8 w-full max-w-md">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Coins className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Koin</h1>
            <p className="text-xs text-muted-foreground">Finanzas Personales Soberanas</p>
          </div>
        </div>

        <div className="w-full max-w-md">
          {mode === 'login' ? (
            <LoginForm onToggleRegister={() => setMode('register')} />
          ) : (
            <RegisterForm onToggleLogin={() => setMode('login')} />
          )}
        </div>
      </div>
    </div>
  );
}
