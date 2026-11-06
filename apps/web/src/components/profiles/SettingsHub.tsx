import React, { useState, useEffect } from 'react';
import { Users, Palette, Shield, Tag, Download } from 'lucide-react';
import { ProfileStreamingView } from './ProfileStreamingView';
import { AppearanceSettingsView } from './AppearanceSettingsView';
import { SecuritySettingsView } from './SecuritySettingsView';
import { CategoriesManagerView } from '../categories/CategoriesManagerView';
import { DataExportView } from './DataExportView';

export type SettingsSubTab = 'profiles' | 'appearance' | 'security' | 'categories' | 'data';

interface SettingsHubProps {
  initialSubTab?: SettingsSubTab;
  onSubTabChange?: (tab: SettingsSubTab) => void;
}

export const SettingsHub: React.FC<SettingsHubProps> = ({
  initialSubTab = 'profiles',
  onSubTabChange,
}) => {
  const [subTab, setSubTab] = useState<SettingsSubTab>(initialSubTab);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const handleSubTabChange = (t: SettingsSubTab) => {
    setSubTab(t);
    onSubTabChange?.(t);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Subtab Navigation (Flat typographic tabs with 1px border, zero cards) */}
      <div className="flex items-center gap-1 border-b border-border/40 pb-2 overflow-x-auto">
        <button
          onClick={() => handleSubTabChange('profiles')}
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
          onClick={() => handleSubTabChange('categories')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'categories'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Categorías</span>
        </button>

        <button
          onClick={() => handleSubTabChange('appearance')}
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
          onClick={() => handleSubTabChange('security')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'security'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Seguridad y PIN</span>
        </button>

        <button
          onClick={() => handleSubTabChange('data')}
          className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold transition-colors shrink-0 ${
            subTab === 'data'
              ? 'bg-primary/10 text-primary border-b-2 border-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Datos y Respaldo</span>
        </button>
      </div>

      {/* Render active subview */}
      <div>
        {subTab === 'profiles' && <ProfileStreamingView />}
        {subTab === 'categories' && <CategoriesManagerView />}
        {subTab === 'appearance' && <AppearanceSettingsView />}
        {subTab === 'security' && <SecuritySettingsView />}
        {subTab === 'data' && <DataExportView />}
      </div>
    </div>
  );
};

