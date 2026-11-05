import React, { useState, useEffect } from 'react';
import { Users, Palette, Shield } from 'lucide-react';
import { ProfileStreamingView } from './ProfileStreamingView';
import { AppearanceSettingsView } from './AppearanceSettingsView';
import { SecuritySettingsView } from './SecuritySettingsView';

interface SettingsHubProps {
  initialSubTab?: 'profiles' | 'appearance' | 'security';
}

export const SettingsHub: React.FC<SettingsHubProps> = ({ initialSubTab = 'profiles' }) => {
  const [subTab, setSubTab] = useState<'profiles' | 'appearance' | 'security'>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Settings Section Header */}
      <div className="pb-4 border-b border-border/40">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Administra tus perfiles de usuario, personalización visual y seguridad.
        </p>
      </div>

      {/* Subtab Navigation (Flat typographic tabs with 1px border, zero cards) */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto">
        <button
          onClick={() => setSubTab('profiles')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'profiles'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Perfiles de Usuario</span>
        </button>

        <button
          onClick={() => setSubTab('appearance')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'appearance'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Apariencia y Colores</span>
        </button>

        <button
          onClick={() => setSubTab('security')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'security'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Seguridad y PIN</span>
        </button>
      </div>

      {/* Render active subview */}
      <div>
        {subTab === 'profiles' && (
          <ProfileStreamingView
            onNavigateToAppearance={() => setSubTab('appearance')}
            onNavigateToSecurity={() => setSubTab('security')}
          />
        )}
        {subTab === 'appearance' && <AppearanceSettingsView />}
        {subTab === 'security' && <SecuritySettingsView />}
      </div>
    </div>
  );
};
