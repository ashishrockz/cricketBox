// ─── CricketBox Design Tokens ─────────────────────────────────────────────────

export const Colors = {
  primary:        '#006B3C',
  primaryDark:    '#004D2B',
  primaryLight:   '#00A35A',
  accent:         '#F5A623',
  accentDark:     '#C07D0B',
  background:     '#0D1117',
  surface:        '#161B22',
  card:           '#21262D',
  cardBorder:     '#30363D',
  text:           '#F0F6FC',
  textSecondary:  '#8B949E',
  textMuted:      '#6E7681',
  success:        '#3FB950',
  error:          '#F85149',
  warning:        '#D29922',
  info:           '#58A6FF',
  white:          '#FFFFFF',
  black:          '#000000',
  overlay:        'rgba(0,0,0,0.75)',
  divider:        '#21262D',
};

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
};

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  full: 9999,
};

export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 30,
};

export const FontWeight = {
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
};
