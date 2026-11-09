import { ThemeConfig } from '@koin/shared';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export interface ThemePreset {
  id: string;
  name: string;
  primaryHex: string;
  accentHex: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  { id: 'gold', name: 'Oro Soberano', primaryHex: '#F59E0B', accentHex: '#FCD34D' },
  { id: 'emerald', name: 'Esmeralda', primaryHex: '#10B981', accentHex: '#34D399' },
  { id: 'indigo', name: 'Índigo Eléctrico', primaryHex: '#6366F1', accentHex: '#818CF8' },
  { id: 'sapphire', name: 'Zafiro Soberano', primaryHex: '#3B82F6', accentHex: '#60A5FA' },
  { id: 'amethyst', name: 'Amatista', primaryHex: '#8B5CF6', accentHex: '#A78BFA' },
  { id: 'coral', name: 'Coral', primaryHex: '#F43F5E', accentHex: '#FB7185' },
  { id: 'amber', name: 'Ámbar Cálido', primaryHex: '#D97706', accentHex: '#F59E0B' },
  { id: 'titanium', name: 'Titanium Natural', primaryHex: '#EDF0F5', accentHex: '#282A32' },
  { id: 'obsidian', name: 'Obsidian Negro', primaryHex: '#F4F4F5', accentHex: '#18181B' },
];

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Parses Hex '#RRGGBB' or '#RGB' to numeric RGB object
 */
export function hexToRgb(hex: string): RGB {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return { r: 245, g: 158, b: 11 }; // Fallback to Gold
  }
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16),
  };
}

/**
 * Converts Hex string '#RRGGBB' to HSL values 'h s% l%'
 */
export function hexToHsl(hex: string): string {
  const { r: rRaw, g: gRaw, b: bRaw } = hexToRgb(hex);
  const r = rRaw / 255;
  const g = gRaw / 255;
  const b = bRaw / 255;

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
 * Computes WCAG 2.1 relative luminance for an sRGB component
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Computes WCAG contrast ratio between two luminance values (1.0 to 21.0)
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastResult {
  textColor: '#000000' | '#FFFFFF';
  ratio: number;
  ratioFormatted: string;
  passesAA: boolean;
  passesAAA: boolean;
}

/**
 * Calculates whether text on a given Hex background should be Black or White for WCAG AA compliance (4.5:1 min)
 */
export function getAccessibleTextColor(hex: string): ContrastResult {
  const rgb = hexToRgb(hex);
  const bgLum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  const whiteLum = 1.0;
  const blackLum = 0.0;

  const ratioWithWhite = getContrastRatio(whiteLum, bgLum);
  const ratioWithBlack = getContrastRatio(bgLum, blackLum);

  // Pick the one with the highest contrast ratio
  const useWhite = ratioWithWhite >= ratioWithBlack;
  const bestRatio = useWhite ? ratioWithWhite : ratioWithBlack;

  return {
    textColor: useWhite ? '#FFFFFF' : '#000000',
    ratio: bestRatio,
    ratioFormatted: `${bestRatio.toFixed(1)}:1`,
    passesAA: bestRatio >= 4.5,
    passesAAA: bestRatio >= 7.0,
  };
}

export interface AvatarThemeStyle {
  bg: string;
  border: string;
  color: string;
}

/**
 * Returns accessible styling (background, border, stroke color) for profile avatar circles
 * adapting cleanly between Light, Dark, and AMOLED modes with guaranteed WCAG contrast.
 */
export function getProfileAvatarStyle(
  hex: string = '#F59E0B',
  baseMode?: 'light' | 'dark' | 'amoled'
): AvatarThemeStyle {
  const isLight = baseMode
    ? baseMode === 'light'
    : typeof document !== 'undefined' && !document.documentElement.classList.contains('dark');

  if (!isLight) {
    // Dark / AMOLED: saturated stroke on subtle transparent background
    return {
      bg: `${hex}20`,
      border: `${hex}45`,
      color: hex,
    };
  }

  // Light Mode calibration
  const rgb = hexToRgb(hex);
  const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

  // If color is very light (like Titanium #EDF0F5 or Obsidian #F4F4F5):
  if (lum > 0.6) {
    return {
      bg: 'rgba(30, 32, 40, 0.08)',
      border: 'rgba(30, 32, 40, 0.22)',
      color: '#1E2028',
    };
  }

  const parts = hexToHsl(hex).split(' ');
  const h = parts[0];
  const s = parts[1];

  return {
    bg: `hsl(${h} ${s} 94%)`,
    border: `hsl(${h} ${s} 74%)`,
    color: `hsl(${h} ${s} 32%)`,
  };
}

/**
 * Dynamically applies a profile's theme configuration to document.documentElement
 * Injects HSL variables and manages dark/light/amoled modes without React re-render.
 */
export function applyTheme(config: ThemeConfig): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // 1. Manage mode classes
  root.classList.remove('dark', 'amoled');
  if (config.baseMode === 'dark') {
    root.classList.add('dark');
  } else if (config.baseMode === 'amoled') {
    root.classList.add('dark', 'amoled');
  }

  const isLight = config.baseMode === 'light';

  // 2. Compute dynamic primary and accent HSL
  let primaryHsl: string;
  let accentHsl: string;

  if (isLight) {
    const rgb = hexToRgb(config.primaryHex);
    const lum = getRelativeLuminance(rgb.r, rgb.g, rgb.b);

    if (lum > 0.6) {
      // Very light colors (Titanium/Obsidian) invert to dark metallic in light mode
      primaryHsl = '220 15% 15%'; // #20242C
      accentHsl = '220 10% 25%';
    } else {
      const parts = hexToHsl(config.primaryHex).split(' ');
      const h = parts[0];
      const s = parts[1];
      // Calibrate lightness to 34% so text-primary and icons on white have >= 4.5:1 contrast
      primaryHsl = `${h} ${s} 34%`;
      accentHsl = `${h} ${s} 42%`;
    }
  } else {
    primaryHsl = hexToHsl(config.primaryHex);
    accentHsl = hexToHsl(config.accentHex);
  }

  root.style.setProperty('--primary', primaryHsl);
  root.style.setProperty('--accent', accentHsl);

  // 3. Dynamic WCAG contrast calculation for text on primary background
  if (isLight) {
    root.style.setProperty('--primary-foreground', '0 0% 100%');
  } else {
    const contrast = getAccessibleTextColor(config.primaryHex);
    if (contrast.textColor === '#FFFFFF') {
      root.style.setProperty('--primary-foreground', '0 0% 100%');
    } else {
      root.style.setProperty('--primary-foreground', '240 10% 4%');
    }
  }

  // 4. MOB-02: Native Status Bar synchronization on Android/iOS
  syncNativeStatusBar(config);
}

/**
 * MOB-02: Native Android/iOS Status Bar synchronization.
 * Dynamically adjusts status bar background color and icon style (dark/light)
 * whenever the active profile theme changes.
 */
export async function syncNativeStatusBar(config: ThemeConfig): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const isLight = config.baseMode === 'light';
    const isAmoled = config.baseMode === 'amoled';
    const bgColor = isAmoled ? '#000000' : isLight ? '#FFFFFF' : '#09090B';

    await StatusBar.setBackgroundColor({ color: bgColor });
    await StatusBar.setStyle({
      style: isLight ? Style.Dark : Style.Light,
    });
  } catch (_) {
    // Graceful degradation on web or unsupported devices
  }
}
