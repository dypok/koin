import { ThemeConfig } from '@koin/shared';

export interface ThemePreset {
  id: string;
  name: string;
  primaryHex: string;
  accentHex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'emerald', name: 'Esmeralda', primaryHex: '#10B981', accentHex: '#F59E0B' },
  { id: 'indigo', name: 'Índigo', primaryHex: '#6366F1', accentHex: '#EC4899' },
  { id: 'amethyst', name: 'Amatista', primaryHex: '#8B5CF6', accentHex: '#06B6D4' },
  { id: 'coral', name: 'Coral', primaryHex: '#F43F5E', accentHex: '#3B82F6' },
  { id: 'amber', name: 'Ámbar', primaryHex: '#F59E0B', accentHex: '#10B981' },
  { id: 'sapphire', name: 'Zafiro', primaryHex: '#0EA5E9', accentHex: '#F97316' },
];

/**
 * Converts Hex string '#RRGGBB' to HSL values 'h s% l%'
 */
export function hexToHsl(hex: string): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }

  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = Math.round(h * 60);
  }

  const sPct = Math.round(s * 100);
  const lPct = Math.round(l * 100);

  return `${h} ${sPct}% ${lPct}%`;
}

/**
 * Dynamically applies a profile's theme configuration to document.documentElement
 */
export function applyTheme(config: ThemeConfig): void {
  const root = document.documentElement;

  // 1. Set mode classes
  root.classList.remove('dark', 'amoled');
  if (config.baseMode === 'dark') {
    root.classList.add('dark');
  }

  // 2. Set dynamic HSL primary & accent variables
  const primaryHsl = hexToHsl(config.primaryHex);
  const accentHsl = hexToHsl(config.accentHex);

  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--accent', accentHsl);
}
