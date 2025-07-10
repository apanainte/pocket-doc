export const RevolutColors = {
  // Primary Colors - Revolut's signature blue/purple gradient
  primary: {
    50: '#f0f4ff',
    100: '#e0ecff',
    200: '#c7ddff',
    300: '#a4c7ff',
    400: '#81a9ff',
    500: '#6366f1', // Main brand color
    600: '#4f46e5',
    700: '#4338ca',
    800: '#3730a3',
    900: '#312e81',
  },
  
  // Secondary Colors - Purple accent
  secondary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
  
  // Neutral Colors
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Success Colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Error Colors
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  
  // Warning Colors
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

export const lightTheme = {
  colors: {
    // Backgrounds
    background: RevolutColors.neutral[50],
    surface: '#ffffff',
    surfaceSecondary: RevolutColors.neutral[100],
    surfaceTertiary: RevolutColors.neutral[200],
    
    // Primary
    primary: RevolutColors.primary[600],
    primaryLight: RevolutColors.primary[500],
    primaryDark: RevolutColors.primary[700],
    onPrimary: '#ffffff',
    
    // Secondary
    secondary: RevolutColors.secondary[600],
    secondaryLight: RevolutColors.secondary[500],
    secondaryDark: RevolutColors.secondary[700],
    onSecondary: '#ffffff',
    
    // Text
    text: RevolutColors.neutral[900],
    textSecondary: RevolutColors.neutral[600],
    textTertiary: RevolutColors.neutral[500],
    textInverse: '#ffffff',
    
    // Borders
    border: RevolutColors.neutral[200],
    borderLight: RevolutColors.neutral[100],
    borderDark: RevolutColors.neutral[300],
    
    // Status Colors
    success: RevolutColors.success[600],
    error: RevolutColors.error[600],
    warning: RevolutColors.warning[600],
    info: RevolutColors.primary[600],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    
    // Gradients
    primaryGradient: ['#6366f1', '#a855f7'],
    backgroundGradient: ['#f8fafc', '#f1f5f9'],
    cardGradient: ['#ffffff', '#f8fafc'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export const darkTheme = {
  colors: {
    // Backgrounds
    background: '#000000',
    surface: '#1a1a1a',
    surfaceSecondary: '#2a2a2a',
    surfaceTertiary: '#3a3a3a',
    
    // Primary
    primary: RevolutColors.primary[500],
    primaryLight: RevolutColors.primary[400],
    primaryDark: RevolutColors.primary[600],
    onPrimary: '#000000',
    
    // Secondary
    secondary: RevolutColors.secondary[500],
    secondaryLight: RevolutColors.secondary[400],
    secondaryDark: RevolutColors.secondary[600],
    onSecondary: '#000000',
    
    // Text
    text: '#ffffff',
    textSecondary: RevolutColors.neutral[300],
    textTertiary: RevolutColors.neutral[400],
    textInverse: '#000000',
    
    // Borders
    border: '#333333',
    borderLight: '#2a2a2a',
    borderDark: '#404040',
    
    // Status Colors
    success: RevolutColors.success[500],
    error: RevolutColors.error[500],
    warning: RevolutColors.warning[500],
    info: RevolutColors.primary[500],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    
    // Gradients
    primaryGradient: ['#6366f1', '#a855f7'],
    backgroundGradient: ['#000000', '#1a1a1a'],
    cardGradient: ['#1a1a1a', '#2a2a2a'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 16,
      elevation: 8,
    },
  },
};

export type Theme = typeof lightTheme;
export type ColorName = keyof Theme['colors'];
export type ShadowName = keyof Theme['shadows']; 