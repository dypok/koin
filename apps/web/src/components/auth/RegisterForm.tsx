import React, { useState } from 'react';
import { User, Mail, Lock, Check, X, ArrowRight, Loader2 } from 'lucide-react';
import { SUPPORTED_CURRENCIES } from '@koin/shared';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface RegisterFormProps {
  onToggleLogin: () => void;
}

export function RegisterForm({ onToggleLogin }: RegisterFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [baseCurrency, setBaseCurrency] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);

  // Real-time password criteria
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName,
          email,
          password,
          baseCurrency,
        }),
      });

      const { user, profile, token } = response.data;
      setSession(user, [profile], token, profile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al registrar la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 w-full">
      <div>
        <h2 className="text-lg sm:text-xl font-bold tracking-tight">Crear Cuenta Titular</h2>
        <p className="text-xs text-muted-foreground">
          Configura tu espacio soberano en Koin con perfil y cuentas iniciales.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs border border-destructive/40 bg-destructive/10 text-destructive rounded-none">
          {errorMessage}
        </div>
      )}

      {/* Nombre Completo */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Nombre Completo</label>
        <div className="relative flex items-center">
          <User className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Dylan Gamero"
            className="w-full bg-background border border-border/50 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Correo Electrónico */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Correo Electrónico</label>
        <div className="relative flex items-center">
          <Mail className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="dylan@ejemplo.com"
            className="w-full bg-background border border-border/50 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Contraseña Maestra</label>
        <div className="relative flex items-center">
          <Lock className="w-4 h-4 absolute left-3 text-muted-foreground" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-background border border-border/50 py-1.5 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Entropy / Security Criteria Checkers */}
        <div className="grid grid-cols-2 gap-1 pt-1 text-[11px]">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
            <span>Mínimo 8 caracteres</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
            <span>Una letra mayúscula</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
            <span>Una letra minúscula</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-primary' : 'text-muted-foreground'}`}>
            {hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3 opacity-40" />}
            <span>Al menos un número</span>
          </div>
        </div>
      </div>

      {/* Moneda Base */}
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground font-medium">Moneda Base Principal</label>
        <select
          value={baseCurrency}
          onChange={(e) => setBaseCurrency(e.target.value)}
          className="w-full bg-background border border-border/50 py-1.5 px-3 text-sm focus:outline-none focus:border-primary transition-colors"
        >
          {Object.values(SUPPORTED_CURRENCIES).map((c) => (
            <option key={c.code} value={c.code}>
              {c.code} — {c.name} ({c.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Botón de Envío */}
      <button
        type="submit"
        disabled={!isPasswordValid || !fullName || !email || isSubmitting}
        className="w-full py-2 px-4 bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 active:scale-[0.99] mt-1"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Creando cuenta...</span>
          </>
        ) : (
          <>
            <span>Registrar y Comenzar</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onToggleLogin}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ¿Ya tienes cuenta titular? <span className="text-primary font-medium">Inicia sesión</span>
        </button>
      </div>
    </form>
  );
}
