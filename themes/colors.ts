export const HeadspaceColors = {
  // Primary Colors - Warm orange (Headspace-inspired)
  primary: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#FF6B35', // Main brand color - warm orange
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  
  // Secondary Colors - Soft blue accent
  secondary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#42A5F5', // Soft blue
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
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
  
  // Success Colors - Gentle green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#81C784', // Gentle green
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
  
  // Warning Colors - Gentle yellow
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#FFA726', // Gentle yellow-orange
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
};

export const lightTheme = {
  colors: {
    // Backgrounds - Clean and calming
    background: '#ffffff',
    surface: '#ffffff',
    surfaceSecondary: HeadspaceColors.neutral[50],
    surfaceTertiary: HeadspaceColors.neutral[100],
    
    // Primary - Warm orange
    primary: HeadspaceColors.primary[500],
    primaryLight: HeadspaceColors.primary[400],
    primaryDark: HeadspaceColors.primary[600],
    onPrimary: '#ffffff',
    
    // Secondary - Soft blue
    secondary: HeadspaceColors.secondary[500],
    secondaryLight: HeadspaceColors.secondary[400],
    secondaryDark: HeadspaceColors.secondary[600],
    onSecondary: '#ffffff',
    
    // Text - Soft and readable
    text: HeadspaceColors.neutral[900],
    textSecondary: HeadspaceColors.neutral[600],
    textTertiary: HeadspaceColors.neutral[500],
    textInverse: '#ffffff',
    
    // Borders - Gentle and subtle
    border: HeadspaceColors.neutral[200],
    borderLight: HeadspaceColors.neutral[100],
    borderDark: HeadspaceColors.neutral[300],
    
    // Status Colors - Headspace inspired
    success: HeadspaceColors.success[500],
    error: HeadspaceColors.error[500],
    warning: HeadspaceColors.warning[500],
    info: HeadspaceColors.secondary[500],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.3)',
    
    // Gradients - Headspace inspired
    primaryGradient: ['#FF6B35', '#FFA726'],
    backgroundGradient: ['#ffffff', '#f8fafc'],
    cardGradient: ['#ffffff', '#fff7ed'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export const darkTheme = {
  colors: {
    // Backgrounds - Dark but calming
    background: '#000000',
    surface: '#1a1a1a',
    surfaceSecondary: '#2a2a2a',
    surfaceTertiary: '#3a3a3a',
    
    // Primary - Warm orange for dark mode
    primary: HeadspaceColors.primary[400],
    primaryLight: HeadspaceColors.primary[300],
    primaryDark: HeadspaceColors.primary[500],
    onPrimary: '#000000',
    
    // Secondary - Soft blue for dark mode
    secondary: HeadspaceColors.secondary[400],
    secondaryLight: HeadspaceColors.secondary[300],
    secondaryDark: HeadspaceColors.secondary[500],
    onSecondary: '#000000',
    
    // Text - Soft and readable in dark mode
    text: '#ffffff',
    textSecondary: HeadspaceColors.neutral[300],
    textTertiary: HeadspaceColors.neutral[400],
    textInverse: '#000000',
    
    // Borders - Gentle even in dark mode
    border: '#333333',
    borderLight: '#2a2a2a',
    borderDark: '#404040',
    
    // Status Colors - Headspace inspired for dark mode
    success: HeadspaceColors.success[400],
    error: HeadspaceColors.error[400],
    warning: HeadspaceColors.warning[400],
    info: HeadspaceColors.secondary[400],
    
    // Overlays
    overlay: 'rgba(0, 0, 0, 0.7)',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    
    // Gradients - Headspace inspired for dark mode
    primaryGradient: ['#fb923c', '#FFA726'],
    backgroundGradient: ['#000000', '#1a1a1a'],
    cardGradient: ['#1a1a1a', '#2a2a2a'],
  },
  
  shadows: {
    small: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 20,
      elevation: 8,
    },
  },
};

export type Theme = typeof lightTheme;
export type ColorName = keyof Theme['colors'];
export type ShadowName = keyof Theme['shadows']; 