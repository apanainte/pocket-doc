import { TextStyle } from 'react-native';

export const typography = {
  // Display - Large hero text
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.5,
  } as TextStyle,
  
  // Headings
  h1: {
    fontSize: 32,
    lineHeight: 40,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.4,
  } as TextStyle,
  
  h2: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.3,
  } as TextStyle,
  
  h3: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.2,
  } as TextStyle,
  
  h4: {
    fontSize: 20,
    lineHeight: 28,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.1,
  } as TextStyle,
  
  h5: {
    fontSize: 18,
    lineHeight: 26,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  } as TextStyle,
  
  h6: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0,
  } as TextStyle,
  
  // Body text
  body1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  } as TextStyle,
  
  body2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0,
  } as TextStyle,
  
  // Subtitles
  subtitle1: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  } as TextStyle,
  
  subtitle2: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.1,
  } as TextStyle,
  
  // Small text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.4,
  } as TextStyle,
  
  overline: {
    fontSize: 10,
    lineHeight: 16,
    fontFamily: 'Inter-Medium',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  } as TextStyle,
  
  // Button text
  button: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  } as TextStyle,
  
  buttonLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: 0.25,
  } as TextStyle,
  
  // Labels
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.5,
  } as TextStyle,
  
  // Numbers - for amounts, counts, etc.
  numbers: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: 'Inter-Bold',
    letterSpacing: -0.2,
  } as TextStyle,
  
  numbersSmall: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Inter-SemiBold',
    letterSpacing: -0.1,
  } as TextStyle,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export type TypographyVariant = keyof typeof typography;
export type Spacing = keyof typeof spacing;
export type BorderRadius = keyof typeof borderRadius;
export type IconSize = keyof typeof iconSizes; 