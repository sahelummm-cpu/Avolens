/**
 * Font families matching the web app: Poppins (display) + Plus Jakarta Sans (body).
 * The web used CSS `font: <weight> <size> var(--font-display|body)`; in RN each
 * weight is its own family name.
 */

export const F = {
  // display = Poppins
  d500: 'Poppins_500Medium',
  d600: 'Poppins_600SemiBold',
  d700: 'Poppins_700Bold',
  d800: 'Poppins_800ExtraBold',
  // body = Plus Jakarta Sans
  b400: 'PlusJakartaSans_400Regular',
  b500: 'PlusJakartaSans_500Medium',
  b600: 'PlusJakartaSans_600SemiBold',
  b700: 'PlusJakartaSans_700Bold',
} as const;
