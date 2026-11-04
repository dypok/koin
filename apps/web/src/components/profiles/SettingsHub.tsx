import React, { useState } from 'react';
import { Users, Palette } from 'lucide-react';
import { ProfileManagerView } from './ProfileManagerView';
import { AppearanceSettingsView } from './AppearanceSettingsView';

export const SettingsHub: React.FC = () => {
  const [subTab, setSubTab] = useState<'profiles' | 'appearance'>('profiles');

  return (
    <div className="space-y-6">
      {/* Subtab Navigation (Flat typographic tabs with 1px border) */}
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <button
          onClick={() => setSubTab('profiles')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors ${
            subTab === 'profiles'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Perfiles Soberanos</span>
        </button>

        <button
          onClick={() => setSubTab('appearance')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors ${
            subTab === 'appearance'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Apariencia y Colores HSL</span>
        </button>
      </div>

      {/* Render active subview */}
      {subTab === 'profiles' ? <ProfileManagerView /> : <AppearanceSettingsView />}
    </div>
  );
};
