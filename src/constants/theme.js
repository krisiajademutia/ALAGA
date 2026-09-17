// Modernized Design System
// Tokens are grouped for consistency and accessibility.
// Legacy tokens are kept for compatibility (deprecated).

export const COLORS = {
  // Brand
  primary: '#2E7A99',
  primaryDark: '#1E586E',
  primaryDarkest: '#143C4B',
  primaryDeep: '#2E7A99',
  primaryLight: '#C8E8F4',
  primaryBg: '#F0F7FA',

  secondary: '#5A9478',
  secondaryDark: '#3D6D56',
  secondaryLight: '#D8EDE4',

  accent: '#FBEEAC',
  accentDark: '#C9AB20',

  teal: '#B8E4E5',
  tealDark: '#4DAFB1',
  sky: '#ABD7E2',
  brown: '#473018',

  danger: '#D94F4F',
  warning: '#D97706',
  success: '#2D9E5F',
  info: '#3A8BAA',

  // Neutrals
  white: '#FFFFFF',
  black: '#2D1F12',
  gray100: '#F2F8FB',
  gray200: '#EEF7FA',
  gray300: '#CCE3EE',
  gray400: '#8C7D6A',
  gray500: '#5C4E3A',

  // Surfaces & App Layout
  background: '#F2F8FB',
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  inputBg: '#EEF7FA',
  border: '#CCE3EE',
  borderLight: '#E3EFF6',
  divider: '#E3EFF6',

  textPrimary: '#2D1F12',
  textSecondary: '#5C4E3A',
  textMuted: '#8C7D6A',
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#473018',

  tagBg: '#E0F2FA',
  tagText: '#2E7A99',
  advocateBadge: '#D4EDE1',
  advocateBadgeText: '#2A7050',
};

// Standardized Spacing (x4 base)
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Standardized Border Radii
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

// Subtle, modern shadow elevation
export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  button: {
    shadowColor: '#2E7A99',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  hero: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
};

// ── SIZES (Font, Spacing, Radii & Aliases) ───────────
export const SIZES = {
  // Font sizes
  xs: 10,
  sm: 12,
  body: 14,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  title: 30,

  // Spacing
  xs4: 4,
  sm8: 8,
  md16: 16,
  lg24: 24,
  xl32: 32,
  xl40: 40,

  // Border radii
  r4: 4,
  r8: 8,
  r12: 12,
  r14: 14,
  r16: 16,
  r18: 18,
  r20: 20,
  r24: 24,
  r999: 999,

  // Aliases
  xsmall: 10,
  small: 12,
  medium: 16,
  large: 18,
  xlarge: 22,
  xxlarge: 26,

  paddingXS: 4,
  paddingS: 8,
  paddingM: 16,
  paddingL: 24,
  paddingXL: 32,

  radius: 12,
  radiusLg: 20,
  radiusFull: 999,
};
// ─────────────────────────────────────────────────────

export const FONT_FAMILY = {
  regular:   'PlusJakartaSans_400Regular',
  medium:    'PlusJakartaSans_500Medium',
  semiBold:  'PlusJakartaSans_600SemiBold',
  bold:      'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
};

export const FONTS = {
  regular:   { fontFamily: 'PlusJakartaSans_400Regular' },
  medium:    { fontFamily: 'PlusJakartaSans_500Medium' },
  semiBold:  { fontFamily: 'PlusJakartaSans_600SemiBold' },
  bold:      { fontFamily: 'PlusJakartaSans_700Bold' },
  extraBold: { fontFamily: 'PlusJakartaSans_800ExtraBold' },

  heading:    { fontFamily: 'PlusJakartaSans_700Bold' },
  subheading: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  body:       { fontFamily: 'PlusJakartaSans_400Regular' },

  titleXl: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  titleLg: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
  },
  titleMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  bodyRegular: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
  },
  bodyMedium: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 20,
  },
  meta: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  caption: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 15,
  },
  badge: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
  },
  button: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    letterSpacing: 0.1,
  },
};

// Responsive helpers — safe to call anywhere after module load
// Import Dimensions inside the function to avoid top-level native calls
export function screenWidth() {
  const { Dimensions } = require('react-native');
  return Dimensions.get('window').width;
}
export function screenHeight() {
  const { Dimensions } = require('react-native');
  return Dimensions.get('window').height;
}
