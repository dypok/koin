import React, { useState } from 'react';
import { Users, Palette, Shield } from 'lucide-react';
import { ProfileStreamingView } from './ProfileStreamingView';
import { AppearanceSettingsView } from './AppearanceSettingsView';
import { SecuritySettingsView } from './SecuritySettingsView';

interface SettingsHubProps {
  initialSubTab?: 'profiles' | 'appearance' | 'security';
}

export const SettingsHub: React.FC<SettingsHubProps> = ({ initialSubTab = 'profiles' }) => {
  const [subTab, setSubTab] = useState<'profiles' | 'appearance' | 'security'>(initialSubTab);

  return (
    <div className="space-y-6">
      {/* Subtab Navigation (Flat typographic tabs with 1px border) */}
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
          <span>Perfiles Soberanos (PROF-01/02)</span>
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
          <span>Apariencia y Colores HSL (PROF-03)</span>
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
          <span>Seguridad y PIN (PROF-04)</span>
        </button>
      </div>

      {/* Render active subview */}
      {subTab === 'profiles' && (
        <ProfileStreamingView
          onNavigateToAppearance={() => setSubTab('appearance')}
          onNavigateToSecurity={() => setSubTab('security')}
        />
      )}
      {subTab === 'appearance' && <AppearanceSettingsView />}
      {subTab === 'security' && <SecuritySettingsView />}
    </div>
  );
};
