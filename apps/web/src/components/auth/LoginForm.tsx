import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

interface LoginFormProps {
  onToggleRegister: () => void;
}

export function LoginForm({ onToggleRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const setSession = useAuthStore((s) => s.setSession);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const { user, profiles, activeProfile, token } = response.data;
      setSession(user, profiles, token, activeProfile);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Iniciar Sesión</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Ingresa tus credenciales maestras para acceder a tus perfiles y finanzas.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 text-xs border border-destructive/40 bg-destructive/10 text-destructive rounded-none">
          {errorMessage}
        </div>
      )}

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
            className="w-full bg-background border border-border/50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors"
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
            className="w-full bg-background border border-border/50 py-2 pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Botón de Envío */}
      <button
        type="submit"
        disabled={!email || !password || isSubmitting}
        className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-50 active:scale-[0.99]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verificando credenciales...</span>
          </>
        ) : (
          <>
            <span>Ingresar a Koin</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={onToggleRegister}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ¿No tienes una cuenta? <span className="text-primary font-medium">Regístrate</span>
        </button>
      </div>
    </form>
  );
}
