/**
 * Psychi Mobile App Theme
 * Haute, editorial-quality design that feels expensive and hand-crafted
 * Think luxury brand meets modern tech - every element intentional
 */

import { Platform } from 'react-native';

// =============================================================================
// COLOR PALETTE - Warm, muted, sophisticated luxury
// =============================================================================
export const PsychiColors = {
  // Primary Blues - Refined, less saturated
  midnight: '#1A1F2E',        // Deep navy for headlines
  deep: '#2D3748',            // Deep charcoal accent
  sapphire: '#3D5A80',        // Muted sapphire
  royalBlue: '#4A6FA5',       // Primary blue - sophisticated, muted
  azure: '#6B8CAE',           // Softer azure
  sky: '#89A7C4',             // Light sky accent

  // Warm Accent Colors - Muted and elegant
  periwinkle: '#C4A69B',      // Muted peachy-brown
  lavender: '#B5A3BD',        // Soft lavender
  violet: '#8E7D99',          // Muted violet
  coral: '#D4977A',           // Soft terracotta (primary accent)
  peach: '#EDD5C8',           // Very soft peach
  rose: '#DBBFBF',            // Muted rose
  gold: '#C5A572',            // Subtle gold for premium accents

  // Background Colors - Warm off-whites, cream tones (no pure white)
  ivory: '#FAF9F7',           // Warmest near-white
  cream: '#F5F4F1',           // Primary background - warm cream
  mist: '#EFEEEA',            // Soft mist
  frost: '#E8E7E3',           // Card backgrounds
  cloud: '#FDFCFA',           // Elevated surfaces (warm white, not pure)
  warmWhite: '#FEFDFB',       // Warmest white

  // Text Colors - Warm blacks and grays
  textPrimary: '#2D2926',     // Warm charcoal, not harsh black
  textSecondary: '#5C564F',   // Warm medium gray
  textMuted: '#8A847B',       // Soft warm gray
  textSoft: '#ADA89F',        // Very soft for hints
  textDisabled: '#C8C4BC',    // Disabled state

  // Functional Colors - Softened, less saturated
  success: '#7CB590',         // Sage green
  successMuted: 'rgba(124, 181, 144, 0.12)',
  warning: '#D4A574',         // Warm amber
  warningMuted: 'rgba(212, 165, 116, 0.12)',
  error: '#C98B8B',           // Muted rose-red
  errorMuted: 'rgba(201, 139, 139, 0.12)',
  white: '#FDFCFA',           // Warm white (not pure)
  black: '#1A1714',           // Warm black

  // Premium Glassmorphism - Refined transparency
  glassWhite: 'rgba(253, 252, 250, 0.78)',
  glassWhiteStrong: 'rgba(253, 252, 250, 0.92)',
  glassPremium: 'rgba(253, 252, 250, 0.64)',
  glassFrosted: 'rgba(253, 252, 250, 0.85)',
  glassSubtle: 'rgba(253, 252, 250, 0.48)',
  glassCard: 'rgba(255, 255, 255, 0.72)',

  // Border Colors - Delicate, warm
  borderUltraLight: 'rgba(45, 41, 38, 0.04)',
  borderLight: 'rgba(45, 41, 38, 0.06)',
  borderMedium: 'rgba(45, 41, 38, 0.10)',
  borderAccent: 'rgba(74, 111, 165, 0.12)',
  borderGlass: 'rgba(255, 255, 255, 0.24)',
  borderWarm: 'rgba(197, 165, 114, 0.20)',

  // Editorial Divider
  divider: 'rgba(45, 41, 38, 0.08)',

  // Support Type Card Accents - Softer
  chatAccent: '#C4A69B',
  phoneAccent: '#B5A3BD',
  videoAccent: '#89A7C4',

  // Legacy aliases for backwards compatibility
  pureWhite: '#FDFCFA',
  textBody: '#5C564F',
  warmBrown: '#C4A69B',
};

// =============================================================================
// GRADIENTS - Subtle, atmospheric, premium
// =============================================================================
export const Gradients = {
  // Hero/Header gradients - Refined
  hero: ['#6B8CAE', '#4A6FA5'] as [string, string],
  heroSoft: ['#FAF9F7', '#F5F4F1'] as [string, string],
  heroBlue: ['#6B8CAE', '#4A6FA5'] as [string, string],
  heroText: ['#4A6FA5', '#6B8CAE'] as [string, string],

  // Editorial page background - warm cream
  editorial: ['#FAF9F7', '#F5F4F1', '#EFEEEA'] as [string, string, string],

  // Button gradients - Sophisticated
  primaryButton: ['#4A6FA5', '#5A7FB5'] as [string, string],
  accentButton: ['#D4977A', '#E0A88C'] as [string, string],
  premiumButton: ['#4A6FA5', '#3D5A80'] as [string, string],

  // Background gradients - Warm
  pageBackground: ['#FAF9F7', '#F5F4F1', '#EFEEEA'] as [string, string, string],
  cardShimmer: ['rgba(253,252,250,0)', 'rgba(253,252,250,0.6)', 'rgba(253,252,250,0)'] as [string, string, string],

  // Premium Glass gradients - Within cards
  glassPremium: ['rgba(255,255,255,0.85)', 'rgba(248,247,244,0.70)'] as [string, string],
  glassSubtle: ['rgba(253,252,250,0.60)', 'rgba(248,247,244,0.45)'] as [string, string],
  glassCard: ['rgba(255,255,255,0.75)', 'rgba(250,249,247,0.60)'] as [string, string],

  // Glass card internal gradient - Light gray to slightly darker
  glassInternal: ['rgba(255,255,255,0.40)', 'rgba(240,239,235,0.30)'] as [string, string],

  // Footer/Dark sections
  footer: ['#3D5A80', '#2D3748'] as [string, string],
  crisisBanner: ['#C98B8B', '#B87A7A'] as [string, string],

  // Role gradients - Warm
  supporter: ['#C4A69B', '#B5A3BD'] as [string, string],
  client: ['#89A7C4', '#6B8CAE'] as [string, string],

  // Active indicator - Gold accent
  activeIndicator: ['#C5A572', '#B89860'] as [string, string],

  // Pricing - Premium feel
  pricing: ['#FAF9F7', '#EFEEEA'] as [string, string],
  pricingPremium: ['#F5F4F1', '#E8E7E3'] as [string, string],

  // Support type cards
  chatCard: ['#C4A69B', '#B5A3BD'] as [string, string],
  phoneCard: ['#B5A3BD', '#8E7D99'] as [string, string],
  videoCard: ['#89A7C4', '#6B8CAE'] as [string, string],
  supportTypes: ['#FAF9F7', '#EFEEEA'] as [string, string],

  // Premium accents
  gold: ['#C5A572', '#A88B5A'] as [string, string],
  subtle: ['#F5F4F1', '#EFEEEA'] as [string, string],
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
// TYPOGRAPHY - Editorial, magazine-quality hierarchy
// Mix of refined serif for headlines + clean sans for body
// =============================================================================
export const Typography = {
  // Font families
  fontFamily: {
    // Primary sans-serif for body text
    sans: Platform.select({
      ios: 'System',         // SF Pro on iOS
      android: 'Roboto',
      default: 'System',
    }),
    // Display/heading font - use system with specific weights
    display: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    // Serif font for elegant editorial headings
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia',
    }),
    // Mono for numbers/stats - premium monospace feel
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
  },

  // Font sizes - Editorial scale with larger display sizes
  fontSize: {
    '2xs': 10,       // Superscript, micro labels
    xs: 11,          // Tiny labels, badges
    sm: 13,          // Captions, secondary text
    base: 15,        // Body text - generous
    md: 16,          // Default
    lg: 18,          // Slightly larger body
    xl: 21,          // Section subheaders
    '2xl': 26,       // Section headers
    '3xl': 32,       // Page titles - editorial
    '4xl': 38,       // Large display headlines
    '5xl': 46,       // Hero headlines
    '6xl': 56,       // Extra large display
    '7xl': 72,       // Massive editorial headlines
  },

  // Font weights - Premium feels lighter
  fontWeight: {
    thin: '200' as const,
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    black: '900' as const,
  },

  // Line heights - Generous for readability
  lineHeight: {
    none: 1,
    tight: 1.15,     // Headlines
    snug: 1.3,       // Subheadlines
    normal: 1.5,     // Body text
    relaxed: 1.6,    // Body text - more space
    loose: 1.8,      // Editorial body
    editorial: 1.75, // Magazine-style body text
  },

  // Letter spacing - Key for premium feel
  letterSpacing: {
    tightest: -1.5,  // Large headlines
    tighter: -0.75,  // Headlines
    tight: -0.25,    // Subheadlines
    normal: 0,
    wide: 0.5,       // Small caps
    wider: 1.5,      // Labels
    widest: 3,       // Uppercase labels
    editorial: -0.5, // Editorial headlines
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
// SHADOWS - Deep but soft, grounds elements in physical space
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

  // Ambient glow - barely perceptible
  ambient: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },

  // Small shadow - subtle lift
  sm: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  // Soft shadow - primary for cards
  soft: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },

  // Medium shadow - noticeable elevation
  medium: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },

  // Elevated - floating elements
  elevated: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },

  // Large - for modals, overlays
  large: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.16,
    shadowRadius: 48,
    elevation: 12,
  },

  // Premium glass shadow - deep but diffuse
  glass: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },

  // Premium card - luxurious depth
  premium: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.10,
    shadowRadius: 30,
    elevation: 6,
  },

  // Button shadow - colored
  button: {
    shadowColor: PsychiColors.royalBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.20,
    shadowRadius: 12,
    elevation: 4,
  },

  // Accent glow - warm
  glow: {
    shadowColor: PsychiColors.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 5,
  },

  // Editorial card - sophisticated
  editorial: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 6,
  },

  // Card shadow - content cards
  card: {
    shadowColor: '#1A1714',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 4,
  },

  // Inner shadow effect (simulated)
  inner: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

// =============================================================================
// COMPONENT STYLES - Premium, editorial defaults
// =============================================================================
export const ComponentStyles = {
  // Premium button - Pill with arrow affordance
  premiumButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['7'],
    borderRadius: BorderRadius.full,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing['2'],
  },

  // Primary button - Pill shape
  primaryButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['7'],
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.royalBlue,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing['2'],
  },

  // Secondary button - Outlined pill
  secondaryButton: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['7'],
    borderRadius: BorderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PsychiColors.borderMedium,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing['2'],
  },

  // Ghost button
  ghostButton: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['4'],
    borderRadius: BorderRadius.lg,
    backgroundColor: 'transparent',
  },

  // Premium Glass Card - Luxurious glassmorphism
  glassCard: {
    borderRadius: 20,
    padding: Spacing['6'],
    backgroundColor: PsychiColors.glassCard,
    borderWidth: 1,
    borderColor: PsychiColors.borderGlass,
    overflow: 'hidden' as const,
  },

  // Editorial Card - Clean, minimal
  editorialCard: {
    borderRadius: 20,
    padding: Spacing['6'],
    backgroundColor: PsychiColors.cloud,
    borderWidth: 0,
  },

  // Card style - Standard
  card: {
    borderRadius: 18,
    padding: Spacing['5'],
    backgroundColor: PsychiColors.cloud,
    borderWidth: 1,
    borderColor: PsychiColors.borderUltraLight,
  },

  // Elevated card
  cardElevated: {
    borderRadius: 20,
    padding: Spacing['6'],
    backgroundColor: PsychiColors.cloud,
    borderWidth: 0,
    ...Shadows.premium,
  },

  // Input field style - Premium
  input: {
    paddingVertical: Spacing['4'],
    paddingHorizontal: Spacing['5'],
    borderRadius: 14,
    backgroundColor: PsychiColors.frost,
    borderWidth: 1,
    borderColor: PsychiColors.borderLight,
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },

  // Modal style - Elevated
  modal: {
    borderRadius: 24,
    backgroundColor: PsychiColors.cloud,
    ...Shadows.large,
  },

  // Badge/Tag style - Refined pill
  badge: {
    paddingVertical: Spacing['1.5'],
    paddingHorizontal: Spacing['3'],
    borderRadius: BorderRadius.full,
    backgroundColor: PsychiColors.frost,
  },

  // Premium badge
  premiumBadge: {
    paddingVertical: Spacing['1'],
    paddingHorizontal: Spacing['2.5'],
    borderRadius: BorderRadius.full,
    backgroundColor: `${PsychiColors.gold}15`,
  },

  // Divider - Editorial thin line
  divider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
  },

  // Section divider - Full width with padding
  sectionDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
    marginVertical: Spacing['6'],
  },

  // Segmented control - Premium pill tabs
  segmentedControl: {
    flexDirection: 'row' as const,
    backgroundColor: PsychiColors.frost,
    borderRadius: 14,
    padding: Spacing['1'],
  },

  // Segmented control tab
  segmentedTab: {
    paddingVertical: Spacing['3'],
    paddingHorizontal: Spacing['5'],
    borderRadius: 12,
  },

  // Segmented control active tab
  segmentedTabActive: {
    backgroundColor: PsychiColors.cloud,
    ...Shadows.sm,
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
