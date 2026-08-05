/**
 * Paleta de la app, derivada de la identidad real de Nivel Fitness Club
 * (logo: azul royal profundo + acento cian). El azul es el color de acción
 * primaria en ambos modos; el cian se reserva para estados de selección y
 * acentos puntuales (ver Colors.light.accent / Colors.dark.accent).
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    textMuted: '#64748B',
    background: '#F5F7FB',
    brandBackground: '#0A1E42',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF2F8',
    border: '#E2E8F0',
    tint: '#0B4F9E',
    tintOn: '#FFFFFF',
    accent: '#0E7490',
    icon: '#64748B',
    tabIconDefault: '#94A3B8',
    tabIconSelected: '#0E7490',
    danger: '#DC2626',
    dangerMuted: '#FDE8E8',
    success: '#15803D',
    successMuted: '#E3F5E9',
    warning: '#B45309',
    warningMuted: '#FBEDD0',
    shadow: 'rgba(15, 23, 42, 0.10)',
  },
  dark: {
    text: '#EEF3FA',
    textMuted: '#93A7C4',
    background: '#0A1628',
    brandBackground: '#050D1D',
    surface: '#111F35',
    surfaceAlt: '#16273F',
    border: '#233350',
    tint: '#3D82F3',
    tintOn: '#FFFFFF',
    accent: '#22D3EE',
    icon: '#8FA3C4',
    tabIconDefault: '#5D7290',
    tabIconSelected: '#22D3EE',
    danger: '#F87171',
    dangerMuted: '#3A1A1A',
    success: '#4ADE80',
    successMuted: '#14301F',
    warning: '#FBBF24',
    warningMuted: '#3A2A0E',
    shadow: 'rgba(0, 0, 0, 0.45)',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

// Sombra suave con offset y blur real (no un halo plano), para diferenciar
// tarjetas de la superficie de fondo sin recurrir a un borde de 1px.
export function cardShadow(colorScheme: 'light' | 'dark') {
  return Platform.select({
    web: { boxShadow: `0 1px 2px ${Colors[colorScheme].shadow}, 0 8px 20px -12px ${Colors[colorScheme].shadow}` },
    default: {
      shadowColor: colorScheme === 'dark' ? '#000000' : '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colorScheme === 'dark' ? 0.35 : 0.08,
      shadowRadius: 10,
      elevation: 3,
    },
  }) as object;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
