import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles, Moon, Sun, Smartphone, Eye, RefreshCw } from 'lucide-react';
import { ThemeConfig } from '@koin/shared';
import { useAuthStore } from '../../stores/authStore';
import {
  THEME_PRESETS,
  hexToHsl,
  getAccessibleTextColor,
  applyTheme,
  ContrastResult,
} from '../../lib/theme';

export const AppearanceSettingsView: React.FC = () => {
  const { activeProfile, updateProfile } = useAuthStore();

  const currentTheme: ThemeConfig = activeProfile?.themeConfig || {
    preset: 'gold',
    primaryHex: '#F59E0B',
    accentHex: '#FCD34D',
    baseMode: 'dark',
  };

  const [selectedPresetId, setSelectedPresetId] = useState<string>(currentTheme.preset);
  const [primaryHex, setPrimaryHex] = useState<string>(currentTheme.primaryHex);
  const [accentHex, setAccentHex] = useState<string>(currentTheme.accentHex);
  const [baseMode, setBaseMode] = useState<'dark' | 'light' | 'amoled'>(currentTheme.baseMode || 'dark');
  const [contrast, setContrast] = useState<ContrastResult>(getAccessibleTextColor(currentTheme.primaryHex));
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activeProfile?.themeConfig) {
      setSelectedPresetId(activeProfile.themeConfig.preset);
      setPrimaryHex(activeProfile.themeConfig.primaryHex);
      setAccentHex(activeProfile.themeConfig.accentHex);
      setBaseMode(activeProfile.themeConfig.baseMode || 'dark');
      setContrast(getAccessibleTextColor(activeProfile.themeConfig.primaryHex));
    }
  }, [activeProfile?.id]);

  // Live preview whenever selections change
  const handlePreviewTheme = (presetId: string, pHex: string, aHex: string, mode: 'dark' | 'light' | 'amoled') => {
    setSelectedPresetId(presetId);
    setPrimaryHex(pHex);
    setAccentHex(aHex);
    setBaseMode(mode);

    const newContrast = getAccessibleTextColor(pHex);
    setContrast(newContrast);

    // Apply directly to DOM for instantaneous live feedback without reloading
    applyTheme({
      preset: presetId,
      primaryHex: pHex,
      accentHex: aHex,
      baseMode: mode,
    });
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    handlePreviewTheme(preset.id, preset.primaryHex, preset.accentHex, baseMode);
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value.trim();
    setPrimaryHex(hex);
    if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
      handlePreviewTheme('custom', hex, accentHex, baseMode);
    }
  };

  const handleModeChange = (mode: 'dark' | 'light' | 'amoled') => {
    handlePreviewTheme(selectedPresetId, primaryHex, accentHex, mode);
  };

  const handleSave = async () => {
    if (!activeProfile) return;
    setSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    const themePayload: ThemeConfig = {
      preset: selectedPresetId,
      primaryHex,
      accentHex,
      baseMode,
    };

    try {
      await updateProfile(activeProfile.id, { themeConfig: themePayload });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al guardar la apariencia');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Active Profile Context */}
      <div className="flex items-center justify-between pb-3 border-b border-border/40 text-xs">
        <p className="text-muted-foreground">
          Personalizando tema para: <span className="font-semibold text-foreground">{activeProfile?.name}</span>
        </p>
        <span className="text-[10px] text-muted-foreground font-mono">
          Modo actual: {baseMode}
        </span>
      </div>

      {errorMessage && (
        <div className="p-3 border border-destructive/40 bg-destructive/10 text-destructive text-xs font-medium">
          {errorMessage}
        </div>
      )}

      {/* 1. Selector de Presets Soberanos */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Paletas de Color Predefinidas
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {THEME_PRESETS.map((p) => {
            const isSelected = selectedPresetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p.id)}
                className={`p-3 border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/10 shadow-sm'
                    : 'border-border/40 hover:border-border bg-muted/5'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-5 h-5 rounded-full shrink-0 border border-black/20 shadow-inner"
                    style={{ backgroundColor: p.primaryHex }}
                  />
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/20"
                    style={{ backgroundColor: p.accentHex }}
                  />
                </div>
                <p className="text-xs font-semibold truncate text-foreground">{p.name}</p>
                <p className="text-[10px] text-muted-foreground font-mono">{p.primaryHex}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Selector Libre de Color Hexadecimal & Calculadora WCAG AA */}
      <div className="space-y-4 pt-4 border-t border-border/30">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Color Hexadecimal Libre &amp; Contraste Accesible
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Hex Input & Color Picker */}
          <div className="p-4 border border-border/40 bg-muted/5 space-y-3">
            <span className="text-[11px] text-muted-foreground font-medium block">
              Código Hexadecimal (#RRGGBB)
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryHex}
                onChange={(e) => handlePreviewTheme('custom', e.target.value, accentHex, baseMode)}
                className="w-10 h-10 border border-border/60 cursor-pointer bg-transparent p-0"
              />
              <input
                type="text"
                value={primaryHex}
                onChange={handleCustomHexChange}
                maxLength={7}
                placeholder="#F59E0B"
                className="flex-1 px-3 py-2 bg-muted/20 border border-border/60 text-foreground font-mono text-xs focus:outline-none focus:border-primary uppercase"
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-mono">
              Vista previa en tiempo real aplicada sobre la aplicación.
            </p>
          </div>

          {/* Contrast Card */}
          <div className="p-4 border border-border/40 bg-muted/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-muted-foreground font-medium">
                Nivel de Legibilidad
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 font-bold uppercase tracking-wider font-mono border ${
                  contrast.passesAA
                    ? 'border-emerald-500/40 text-emerald-500 bg-emerald-500/10'
                    : 'border-destructive/40 text-destructive bg-destructive/10'
                }`}
              >
                {contrast.passesAA ? 'Contraste Óptimo' : 'Bajo Contraste'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Ratio de Contraste:</span>
              <span className="text-base font-mono font-bold text-foreground">
                {contrast.ratioFormatted}
              </span>
            </div>

            {/* Contrast Dynamic Test Bar */}
            <div
              className="py-2.5 px-4 font-semibold text-xs text-center transition-colors shadow-sm"
              style={{
                backgroundColor: primaryHex,
                color: contrast.textColor,
              }}
            >
              Texto Legible Seleccionado: {contrast.textColor === '#FFFFFF' ? 'Blanco Puro (#FFF)' : 'Negro Oscuro (#000)'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Selector de Modo Base: Claro, Oscuro, AMOLED */}
      <div className="space-y-3 pt-4 border-t border-border/30">
        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Modo de Pantalla &amp; Ahorro de Energía
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`p-4 border text-left flex items-start gap-3 transition-all ${
              baseMode === 'dark'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/40 hover:border-border bg-muted/5'
            }`}
          >
            <Moon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Modo Oscuro</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Fondo Obsidian (#09090B) con contraste calibrado para baja fatiga visual.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('amoled')}
            className={`p-4 border text-left flex items-start gap-3 transition-all ${
              baseMode === 'amoled'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/40 hover:border-border bg-muted/5'
            }`}
          >
            <Smartphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Negro AMOLED</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Negro absoluto (#000000). Apaga los píxeles en pantallas OLED ahorrando batería.
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`p-4 border text-left flex items-start gap-3 transition-all ${
              baseMode === 'light'
                ? 'border-primary bg-primary/10 shadow-sm'
                : 'border-border/40 hover:border-border bg-muted/5'
            }`}
          >
            <Sun className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">Modo Claro</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Superficie blanca limpia (#FFFFFF) con acentos de color de alta legibilidad.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-6 border-t border-border/40 flex items-center justify-between">
        <div>
          {savedSuccess && (
            <span className="text-xs text-primary font-medium flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-4 h-4" />
              <span>Configuración de tema guardada en tu perfil</span>
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 shadow-sm"
        >
          {saving ? (
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <Check className="w-3.5 h-3.5" />
          )}
          <span>Guardar Apariencia</span>
        </button>
      </div>
    </div>
  );
};
