// Pure constants — no imports, no function calls, no dynamic values.
// This guarantees the module always evaluates cleanly on any RN runtime.

export const COLORS = {
  primary:        '#92CDE5',
  primaryDark:    '#5AABCC',
  primaryLight:   '#C8E8F4',
  primaryDeep:    '#2E7A99',

  secondary:      '#B8D3C3',
  secondaryDark:  '#5A9478',
  secondaryLight: '#D8EDE4',

  accent:         '#FBEEAC',
  accentDark:     '#C9AB20',

  teal:           '#B8E4E5',
  tealDark:       '#4DAFB1',
  sky:            '#ABD7E2',
  brown:          '#473018',

  danger:         '#D94F4F',
  warning:        '#D97706',
  success:        '#2D9E5F',
  info:           '#3A8BAA',

  background:     '#F2F8FB',
  surface:        '#FFFFFF',
  cardBg:         '#FFFFFF',
  inputBg:        '#EEF7FA',
  border:         '#CCE3EE',
  divider:        '#E3EFF6',

  textPrimary:    '#2D1F12',
  textSecondary:  '#5C4E3A',
  textMuted:      '#8C7D6A',
  textOnPrimary:  '#FFFFFF',
  textOnSecondary:'#473018',

  tagBg:              '#E0F2FA',
  tagText:            '#2E7A99',
  advocateBadge:      '#D4EDE1',
  advocateBadgeText:  '#2A7050',
};

export const SIZES = {
  // ── Font sizes ────────────────────────────────────────
  xs:      10,
  sm:      12,
  body:    14,
  md:      16,
  lg:      18,
  xl:      22,
  xxl:     26,
  title:   30,

  // ── Spacing ───────────────────────────────────────────
  xs4:     4,
  sm8:     8,
  md16:    16,
  lg24:    24,
  xl32:    32,
  xl40:    40,

  // ── Border radii ──────────────────────────────────────
  r4:      4,
  r8:      8,
  r12:     12,
  r16:     16,
  r20:     20,
  r24:     24,
  r999:    999,

  // ── Legacy aliases (used by older screens) ────────────
  xsmall:    10,
  small:     12,
  medium:    16,
  large:     18,
  xlarge:    22,
  xxlarge:   26,

  paddingXS: 4,
  paddingS:  8,
  paddingM:  16,
  paddingL:  24,
  paddingXL: 32,

  radius:     12,
  radiusLg:   20,
  radiusFull: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0D1B2A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
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
    shadowOpacity: 0.25,
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

export const FONTS = {
  heading:    { fontWeight: '700' },
  subheading: { fontWeight: '600' },
  body:       { fontWeight: '400' },
  bold:       { fontWeight: '700' },
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
