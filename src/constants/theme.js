// Modernized Design System
// Tokens are grouped for consistency and accessibility.
// Legacy tokens are kept for compatibility (deprecated).

export const COLORS = {
  // Brand & Master Palette
  primary: '#92CDE5',        // Sky Blue (#92CDE5)
  primaryDark: '#5BA8C7',    // Medium sky blue
  primaryDarkest: '#1E586E', // Deep sky blue
  primaryDeep: '#2E7A99',    // High-contrast primary for buttons/icons
  primaryLight: '#DDF1F8',   // Light tint of #92CDE5
  primaryBg: '#F0F8FB',      // Subtle sky background tint

  secondary: '#B8D3C3',      // Soft Sage Green (#B8D3C3)
  secondaryDark: '#528367',  // Deeper sage green
  secondaryLight: '#EBF4EF', // Pale sage wash

  accent: '#FBEEAC',         // Warm Pastel Yellow / Butter (#FBEEAC)
  accentDark: '#C9AB20',     // Golden amber
  accentLight: '#FCF8E8',    // Pale butter tint of #FBEEAC

  teal: '#B8E4E5',           // Pastel Teal / Aqua (#B8E4E5)
  tealDark: '#3D9496',
  tealLight: '#EBF7F7',

  sky: '#ABD7E2',            // Soft Sky Blue (#ABD7E2)
  skyLight: '#EDF6F9',

  sage: '#B8D3C3',           // Sage (#B8D3C3)
  brown: '#473018',          // Deep Warm Brown for fonts (#473018)

  danger: '#D94F4F',
  warning: '#D97706',
  success: '#2D9E5F',
  info: '#3A8BAA',

  // Neutrals & Warm Palette
  white: '#FFFFFF',
  black: '#473018',
  gray100: '#FAF5E8',
  gray200: '#F5EED8',
  gray300: '#E8DFC8',
  gray400: '#947E68',
  gray500: '#685038',

  // Surfaces & App Layout (Pale lighter tint of #FBEEAC)
  background: '#FCF8E8',     // Pale, lighter tint of #FBEEAC
  surface: '#FFFFFF',
  cardBg: '#FFFFFF',
  inputBg: '#FFFDF6',
  border: '#E8DEC5',
  borderLight: '#F4EDE0',
  divider: '#F4EDE0',

  // Typography (Requested #473018 font)
  textPrimary: '#473018',    // Primary font color: #473018
  textSecondary: '#685038',  // Warm medium brown
  textMuted: '#947E68',      // Warm soft brown for captions
  textOnPrimary: '#FFFFFF',
  textOnSecondary: '#473018',

  tagBg: '#EBF4EF',          // Sage soft tint
  tagText: '#306B4D',
  advocateBadge: '#EBF4EF',  // Uses #B8D3C3 tint
  advocateBadgeText: '#306B4D',
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

  heading:    { fontFamily: 'PlusJakartaSans_700Bold', color: '#473018' },
  subheading: { fontFamily: 'PlusJakartaSans_600SemiBold', color: '#473018' },
  body:       { fontFamily: 'PlusJakartaSans_400Regular', color: '#473018' },

  titleXl: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: '#473018',
  },
  titleLg: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -0.4,
    color: '#473018',
  },
  titleMd: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.3,
    color: '#473018',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: '#685038',
  },
  bodyRegular: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#473018',
  },
  bodyMedium: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13.5,
    lineHeight: 20,
    color: '#473018',
  },
  meta: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    color: '#685038',
  },
  caption: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 15,
    color: '#947E68',
  },
  badge: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    letterSpacing: 0.2,
    color: '#473018',
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
