/**
 * Psychi Mobile App Theme
 * Exact match to web app design system
 */

import { Platform } from 'react-native';

// Exact color palette from web app CSS variables
export const PsychiColors = {
  // Primary Blues (exact from web CSS --psychi-*)
  midnight: '#0C1E3D',      // --psychi-midnight (deepest navy)
  deep: '#0F4C81',          // --psychi-deep (deep ocean)
  sapphire: '#1E3A5F',      // --psychi-sapphire
  royalBlue: '#2563EB',     // --psychi-royal (primary) [MOST USED]
  azure: '#3B82F6',         // --psychi-azure
  sky: '#60A5FA',           // --psychi-sky

  // Warm Accent Colors (exact from web CSS)
  periwinkle: '#E8A090',    // --psychi-periwinkle (warm peachy-brown)
  lavender: '#D4847A',      // --psychi-lavender (dusty rose-brown)
  violet: '#C9705F',        // --psychi-violet (deeper rose)
  coral: '#FB923C',         // --psychi-coral (orange-coral) [KEY ACCENT]
  peach: '#FECACA',         // --psychi-peach (light peach)
  rose: '#FDA4AF',          // --psychi-rose (soft rose)

  // Background Colors (Cream palette - exact from web)
  ivory: '#F8EBE3',         // --psychi-ivory (warm ivory)
  cream: '#F5E8DF',         // --psychi-cream (primary background) [MOST USED]
  mist: '#F2E5DB',          // --psychi-mist (soft mist)
  frost: '#EFE2D8',         // --psychi-frost (light frost)
  cloud: '#FAF8F5',         // lighter cream
  pureWhite: '#FFFBFA',     // almost white with warmth

  // Text Colors (exact from web CSS)
  textPrimary: '#0F172A',   // --psychi-text-primary (dark)
  textSecondary: '#334155', // --psychi-text-secondary (medium-dark)
  textMuted: '#64748B',     // --psychi-text-muted
  textSoft: '#94A3B8',      // --psychi-text-soft
  textBody: '#3D4660',      // body text color
  warmBrown: '#6B5A52',     // subtitle color from SupportTypes

  // Functional Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  white: '#FFFFFF',
  black: '#000000',

  // Glassmorphism Colors
  glassWhite: 'rgba(255, 255, 255, 0.6)',
  glassWhiteStrong: 'rgba(255, 255, 255, 0.9)',
  glassPremium: 'rgba(255, 255, 255, 0.18)',
  glassFrosted: 'rgba(255, 255, 255, 0.85)',

  // Border Colors
  borderLight: 'rgba(255, 255, 255, 0.25)',
  borderMedium: 'rgba(255, 255, 255, 0.5)',
  borderGlass: 'rgba(255, 255, 255, 0.3)',

  // Support Type Card Accents (from web)
  chatAccent: '#D4847A',     // Chat sessions
  phoneAccent: '#B896C8',    // Phone calls
  videoAccent: '#8AB5D8',    // Video chat
};

// Gradients (for LinearGradient components) - exact from web
export const Gradients = {
  // Hero text gradient (for "accessible" word)
  heroText: ['#2563EB', '#FB923C'] as [string, string],  // royal blue to coral

  // Button gradients
  primaryButton: ['#2563EB', '#3B82F6'] as [string, string],  // royal to azure

  // Section backgrounds
  hero: ['#60A5FA', '#3B82F6', '#FB923C'] as [string, string, string],
  supportTypes: ['#F5E8DF', '#FAF8F5', '#FFFBFA'] as [string, string, string],
  pricing: ['#FFFBFA', '#FFFFFF'] as [string, string],

  // Footer gradient (sapphire to midnight)
  footer: ['#1E3A5F', '#0C1E3D'] as [string, string],

  // Crisis banner gradient
  crisisBanner: ['rgba(37,99,235,0.9)', 'rgba(139,92,246,0.9)'] as [string, string],

  // Role/User type gradients
  supporter: ['#E8A090', '#D4847A'] as [string, string],  // peach to dusty rose
  client: ['#60A5FA', '#2563EB'] as [string, string],     // sky to royal

  // Glassmorphism gradients
  glassPremium: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.12)'] as [string, string, string],
  glassFrosted: ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.75)'] as [string, string],
  glassIridescent: [
    'rgba(165,180,252,0.15)',
    'rgba(196,181,253,0.12)',
    'rgba(254,202,202,0.1)',
    'rgba(251,146,60,0.08)',
    'rgba(165,180,252,0.15)'
  ] as [string, string, string, string, string],

  // Modal/Card gradients
  modal: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)', 'rgba(250, 248, 245, 0.95)'] as [string, string, string],
  glass: ['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)'] as [string, string],

  // Support type card accents
  chatCard: ['#D4847A', '#C9705F'] as [string, string],
  phoneCard: ['#B896C8', '#A680B8'] as [string, string],
  videoCard: ['#8AB5D8', '#6BA3D0'] as [string, string],
};

export const Colors = {
  light: {
    text: PsychiColors.textPrimary,
    textSecondary: PsychiColors.textSecondary,
    background: PsychiColors.cream,
    card: PsychiColors.white,
    tint: PsychiColors.royalBlue,
    icon: PsychiColors.textMuted,
    tabIconDefault: PsychiColors.textSoft,
    tabIconSelected: PsychiColors.royalBlue,
    border: PsychiColors.borderLight,
    primary: PsychiColors.royalBlue,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: PsychiColors.midnight,
    card: '#1B263B',
    tint: PsychiColors.sky,
    icon: PsychiColors.textSoft,
    tabIconDefault: PsychiColors.textMuted,
    tabIconSelected: PsychiColors.sky,
    border: 'rgba(74, 144, 226, 0.2)',
    primary: PsychiColors.sky,
  },
};

// Typography - matching web app
export const Typography = {
  // Font families
  fontFamily: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    }),
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },

  // Font sizes (in pixels, same as web)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing (matching web app rem values converted to pixels)
export const Spacing = {
  xs: 4,    // 0.25rem
  sm: 8,    // 0.5rem
  md: 16,   // 1rem
  lg: 24,   // 1.5rem
  xl: 32,   // 2rem
  '2xl': 40, // 2.5rem
  '3xl': 48, // 3rem
  '4xl': 64, // 4rem
};

// Border radius (matching web app)
export const BorderRadius = {
  sm: 6,    // 0.375rem
  md: 12,   // 0.75rem
  lg: 16,   // 1rem
  xl: 20,   // 1.25rem
  '2xl': 24, // 1.5rem
  '3xl': 30, // 1.875rem
  full: 9999,
};

// Shadows (matching web app --shadow-* system)
export const Shadows = {
  // --shadow-ambient: 0 0 80px rgba(15,76,129,0.06)
  ambient: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 40,
    elevation: 2,
  },
  // --shadow-soft: 0 4px 24px rgba(15,76,129,0.08)
  soft: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  // --shadow-medium: 0 8px 40px rgba(15,76,129,0.12)
  medium: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
  // --shadow-elevated: 0 20px 60px rgba(15,76,129,0.16)
  elevated: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 30,
    elevation: 8,
  },
  // --shadow-dramatic: 0 32px 80px rgba(15,76,129,0.24)
  dramatic: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 32 },
    shadowOpacity: 0.24,
    shadowRadius: 40,
    elevation: 12,
  },
  // Button shadow (for .btn-premium hover)
  button: {
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  // Card shadow
  card: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  // Glassmorphism card shadow (from .glass-premium)
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  // Modal shadow
  modal: {
    shadowColor: '#0F4C81',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.2,
    shadowRadius: 32,
    elevation: 10,
  },
  // Iridescent glow (from .glass-iridescent)
  iridescent: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 5,
  },
};

// Common component styles
export const ComponentStyles = {
  // Premium button style (pill shape)
  premiumButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: PsychiColors.royalBlue,
  },

  // Primary gradient button
  primaryButton: {
    paddingVertical: 14,
    borderRadius: BorderRadius['2xl'],
  },

  // Card style
  card: {
    borderRadius: BorderRadius['2xl'],
    padding: Spacing['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },

  // Input field style
  input: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: BorderRadius['2xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },

  // Modal style
  modal: {
    borderRadius: BorderRadius['3xl'],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
};
