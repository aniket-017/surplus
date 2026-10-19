export const colors = {
  accent: '#5CB335',
  accentHover: '#4A9B2A',
  navy: '#0F1B2D',
  bg: '#FFFFFF',
  bgSubtle: '#F4F7FA',
  surface: '#FFFFFF',
  surfaceMuted: '#EEF2F6',
  text: '#2C3E50',
  textStrong: '#0F1B2D',
  muted: '#5A6B7D',
  border: 'rgba(15, 27, 45, 0.1)',
  borderAccent: 'rgba(92, 179, 53, 0.25)',
  error: '#C0392B',
  white: '#FFFFFF',
} as const;

/** Plus Jakarta Sans weights; set fontFamily instead of fontWeight so Android picks the right face. */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
} as const;

export const cardShadow = {
  shadowColor: '#0F1B2D',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 16,
  elevation: 3,
} as const;
