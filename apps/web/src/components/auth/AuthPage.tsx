import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center p-6 max-w-md mx-auto border-x border-border/40">
      <div className="w-full space-y-6">
        {/* Minimalist Flat Header */}
        <div className="flex items-center gap-3 border-b border-border/40 pb-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Coins className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Koin</h1>
            <p className="text-xs text-muted-foreground">Finanzas Personales Soberanas</p>
          </div>
        </div>

        {/* Auth Forms */}
        {mode === 'login' ? (
          <LoginForm onToggleRegister={() => setMode('register')} />
        ) : (
          <RegisterForm onToggleLogin={() => setMode('login')} />
        )}
      </div>
    </div>
  );
}
