/**
 * Psychi Mobile App Theme
 * Premium, modern aesthetic with refined design tokens
 * Inspired by top-tier graphic design principles
 */

import { Platform } from 'react-native';

// =============================================================================
// COLOR PALETTE - Soft, muted, sophisticated
// =============================================================================
export const PsychiColors = {
  // Primary Blues - Softer, more refined
  midnight: '#0A1628',        // Deep navy for text
  deep: '#1E3A5F',            // Deep ocean accent
  sapphire: '#2E4A6E',        // Muted sapphire
  royalBlue: '#4A7BC7',       // Primary blue - softer, less saturated
  azure: '#6B9BD1',           // Softer azure
  sky: '#8BB8E8',             // Light sky accent

  // Warm Accent Colors - Muted and elegant
  periwinkle: '#C9A69D',      // Muted peachy-brown
  lavender: '#B8A0C8',        // Soft lavender
  violet: '#9B8AA8',          // Muted violet
  coral: '#E8A07A',           // Soft coral (primary accent)
  peach: '#F5D5C8',           // Very soft peach
  rose: '#E8C4C4',            // Muted rose

  // Background Colors - Off-white, cream tones
  ivory: '#FAFAF8',           // Near white with warmth
  cream: '#F7F6F3',           // Primary background
  mist: '#F2F1ED',            // Soft mist
  frost: '#EDECE8',           // Light frost (card backgrounds)
  cloud: '#FFFFFF',           // Pure white for elevated surfaces
  warmWhite: '#FFFFFE',       // Warm white

  // Text Colors - Refined hierarchy
  textPrimary: '#1A1F26',     // Almost black, not pure black
  textSecondary: '#4A5568',   // Medium gray-blue
  textMuted: '#718096',       // Soft gray
  textSoft: '#A0AEC0',        // Very soft for hints
  textDisabled: '#CBD5E0',    // Disabled state

  // Functional Colors - Softened
  success: '#68D391',         // Soft green
  successMuted: 'rgba(104, 211, 145, 0.12)',
  warning: '#F6AD55',         // Soft orange
  warningMuted: 'rgba(246, 173, 85, 0.12)',
  error: '#FC8181',           // Soft red
  errorMuted: 'rgba(252, 129, 129, 0.12)',
  white: '#FFFFFF',
  black: '#000000',

  // Glassmorphism Colors - Subtle transparency
  glassWhite: 'rgba(255, 255, 255, 0.72)',
  glassWhiteStrong: 'rgba(255, 255, 255, 0.88)',
  glassPremium: 'rgba(255, 255, 255, 0.56)',
  glassFrosted: 'rgba(255, 255, 255, 0.80)',
  glassSubtle: 'rgba(255, 255, 255, 0.40)',

  // Border Colors - Delicate, almost invisible
  borderUltraLight: 'rgba(0, 0, 0, 0.04)',
  borderLight: 'rgba(0, 0, 0, 0.06)',
  borderMedium: 'rgba(0, 0, 0, 0.08)',
  borderAccent: 'rgba(74, 123, 199, 0.15)',
  borderGlass: 'rgba(255, 255, 255, 0.20)',

  // Support Type Card Accents - Softer
  chatAccent: '#C9A69D',
  phoneAccent: '#B8A0C8',
  videoAccent: '#8BB8E8',

  // Legacy aliases for backwards compatibility
  pureWhite: '#FFFFFF',
  textBody: '#4A5568',
  warmBrown: '#C9A69D',
};

// =============================================================================
// GRADIENTS - Subtle and atmospheric
// =============================================================================
export const Gradients = {
  // Hero/Header gradients - Softer transitions
  hero: ['#6B9BD1', '#4A7BC7'] as [string, string],
  heroSoft: ['#F7F6F3', '#FFFFFF'] as [string, string],
  heroBlue: ['#6B9BD1', '#4A7BC7'] as [string, string],
  heroText: ['#4A7BC7', '#6B9BD1'] as [string, string],

  // Button gradients - Subtle
  primaryButton: ['#4A7BC7', '#5A8BD4'] as [string, string],
  accentButton: ['#E8A07A', '#F0B896'] as [string, string],

  // Background gradients
  pageBackground: ['#FAFAF8', '#F7F6F3', '#F2F1ED'] as [string, string, string],
  cardShimmer: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)'] as [string, string, string],

  // Glass gradients
  glassPremium: ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.60)'] as [string, string],
  glassSubtle: ['rgba(255,255,255,0.56)', 'rgba(255,255,255,0.40)'] as [string, string],

  // Footer/Dark sections
  footer: ['#2E4A6E', '#1E3A5F'] as [string, string],
  crisisBanner: ['#FC8181', '#F56565'] as [string, string],

  // Role gradients - Softer
  supporter: ['#C9A69D', '#B8A0C8'] as [string, string],
  client: ['#8BB8E8', '#6B9BD1'] as [string, string],

  // Active indicator
  activeIndicator: ['#E8A07A', '#F0B896'] as [string, string],

  // Pricing
  pricing: ['#F7F6F3', '#EDECE8'] as [string, string],

  // Support type cards
  chatCard: ['#C9A69D', '#B8A0C8'] as [string, string],
  phoneCard: ['#B8A0C8', '#9B8AA8'] as [string, string],
  videoCard: ['#8BB8E8', '#6B9BD1'] as [string, string],
  supportTypes: ['#F7F6F3', '#EDECE8'] as [string, string],
};

// =============================================================================
// LIGHT/DARK MODE
// =============================================================================
export const Colors = {
  light: {
    text: PsychiColors.textPrimary,
    textSecondary: PsychiColors.textSecondary,
    background: PsychiColors.cream,
    surface: PsychiColors.cloud,
    card: PsychiColors.frost,
    tint: PsychiColors.royalBlue,
    icon: PsychiColors.textMuted,
    tabIconDefault: PsychiColors.textSoft,
    tabIconSelected: PsychiColors.royalBlue,
    border: PsychiColors.borderLight,
    primary: PsychiColors.royalBlue,
    accent: PsychiColors.coral,
  },
  dark: {
    text: '#F7FAFC',
    textSecondary: '#A0AEC0',
    background: '#0A1628',
    surface: '#1A2B3C',
    card: '#1E3A5F',
    tint: PsychiColors.sky,
    icon: PsychiColors.textSoft,
    tabIconDefault: PsychiColors.textMuted,
    tabIconSelected: PsychiColors.sky,
    border: 'rgba(255, 255, 255, 0.08)',
    primary: PsychiColors.sky,
    accent: PsychiColors.coral,
  },
};

// =============================================================================
// TYPOGRAPHY - Clean, modern sans-serif
// =============================================================================
export const Typography = {
  // Font families - SF Pro / Inter style
  fontFamily: {
    // Primary sans-serif
    sans: Platform.select({
      ios: 'System',         // SF Pro on iOS
      android: 'Roboto',
      default: 'System',
    }),
    // Display/heading font
    display: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    // Serif font for elegant headings
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    }),
    // Mono for numbers/code
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  // Font sizes - Refined scale
  fontSize: {
    xs: 11,        // Tiny labels
    sm: 13,        // Small text, captions
    base: 15,      // Body text
    md: 16,        // Default
    lg: 17,        // Slightly larger body
    xl: 20,        // Section headers
    '2xl': 24,     // Page titles
    '3xl': 28,     // Hero text
    '4xl': 34,     // Large display
    '5xl': 42,     // Extra large
  },

  // Font weights - Prefer lighter weights
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },

  // Line heights
  lineHeight: {
    none: 1,
    tight: 1.2,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },

  // Letter spacing - Key for premium feel
  letterSpacing: {
    tighter: -0.5,
    tight: -0.25,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// =============================================================================
// SPACING - Generous white space
// =============================================================================
export const Spacing = {
  px: 1,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,

  // Semantic aliases
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
  '4xl': 96,
};

// =============================================================================
// BORDER RADIUS - Soft but not cartoonish
// =============================================================================
export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,       // Cards, buttons
  xl: 16,       // Large cards
  '2xl': 20,    // Modals
  '3xl': 24,    // Hero sections
  full: 9999,   // Pills
  pill: 9999,   // Alias for pill buttons
};

// =============================================================================
// SHADOWS - Natural, not harsh
// =============================================================================
export const Shadows = {
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  // Ambient glow - very subtle
  ambient: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },

  // Small shadow - for subtle elevation
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  // Soft shadow - primary for cards
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },

  // Medium shadow
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },

  // Elevated - for floating elements
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },

  // Large - for modals
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10,
    shadowRadius: 32,
    elevation: 8,
  },

  // Glass shadow - subtle for glass cards
  glass: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },

  // Button shadow
  button: {
    shadowColor: PsychiColors.royalBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },

  // Accent glow
  glow: {
    shadowColor: PsychiColors.coral,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },

  // Card shadow - for content cards
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },

  // Inner shadow effect (simulated with border)
  inner: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// =============================================================================
// COMPONENT STYLES - Refined defaults
// =============================================================================
export const ComponentStyles = {
  // Premium button - Soft pill shape
  premiumButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['6'],
    borderRadius: BorderRadius.lg,
  },

  // Primary button
  primaryButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['6'],
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.royalBlue,
  },

  // Secondary button
  secondaryButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['6'],
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
  },

  // Ghost button
  ghostButton: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: BorderRadius.md,
    backgroundColor: 'transparent',
  },

  // Card style - Glass effect
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing['5'],
    backgroundColor: PsychiColors.glassFrosted,
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },

  // Elevated card
  cardElevated: {
    borderRadius: BorderRadius.xl,
    padding: Spacing['5'],
    backgroundColor: PsychiColors.cloud,
    borderWidth: 0,
    ...Shadows.soft,
  },

  // Input field style
  input: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['4'],
    borderRadius: BorderRadius.lg,
    backgroundColor: PsychiColors.frost,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },

  // Modal style
  modal: {
    borderRadius: BorderRadius['2xl'],
    backgroundColor: PsychiColors.cloud,
    ...Shadows.large,
  },

  // Badge/Tag style
  badge: {
    paddingVertical: Spacing['1.5'],
    paddingHorizontal: Spacing['3'],
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.frost,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: PsychiColors.borderUltraLight,
  },
};

// =============================================================================
// ANIMATION DEFAULTS
// =============================================================================
export const Animation = {
  // Durations
  duration: {
    instant: 0,
    fast: 150,
    normal: 250,
    slow: 350,
    slower: 500,
  },

  // Easing
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

// =============================================================================
// ICON SIZES
// =============================================================================
export const IconSize = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  '2xl': 32,
  '3xl': 40,
};

// =============================================================================
// Z-INDEX
// =============================================================================
export const ZIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
};
