import React from 'react';
import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface RevolutButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const RevolutButton: React.FC<RevolutButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const { theme, typography, spacing, borderRadius } = useTheme();
  
  const isDisabled = disabled || loading;
  
  // Size configurations
  const sizeConfig = {
    sm: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      typography: typography.button,
      borderRadius: borderRadius.md,
    },
    md: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      typography: typography.buttonLarge,
      borderRadius: borderRadius.lg,
    },
    lg: {
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.lg,
      typography: typography.buttonLarge,
      borderRadius: borderRadius.xl,
    },
  }[size];
  
  // Base button style
  const baseStyle: ViewStyle = {
    ...sizeConfig,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    minHeight: size === 'lg' ? 56 : size === 'md' ? 48 : 40,
    opacity: isDisabled ? 0.6 : 1,
    ...(fullWidth && { width: '100%' }),
    ...style,
  };
  
  // Base text style
  const baseTextStyle: TextStyle = {
    ...sizeConfig.typography,
    textAlign: 'center',
    ...textStyle,
  };
  
  // Variant-specific styles
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          buttonStyle: baseStyle,
          textStyle: { ...baseTextStyle, color: theme.colors.onPrimary },
          useGradient: true,
          colors: theme.colors.primaryGradient as [string, string],
        };
        
      case 'secondary':
        return {
          buttonStyle: { ...baseStyle, backgroundColor: theme.colors.secondary },
          textStyle: { ...baseTextStyle, color: theme.colors.onSecondary },
          useGradient: false,
        };
        
      case 'outline':
        return {
          buttonStyle: {
            ...baseStyle,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: theme.colors.primary,
          },
          textStyle: { ...baseTextStyle, color: theme.colors.primary },
          useGradient: false,
        };
        
      case 'ghost':
        return {
          buttonStyle: { ...baseStyle, backgroundColor: 'transparent' },
          textStyle: { ...baseTextStyle, color: theme.colors.primary },
          useGradient: false,
        };
        
      default:
        return {
          buttonStyle: baseStyle,
          textStyle: { ...baseTextStyle, color: theme.colors.onPrimary },
          useGradient: true,
          colors: theme.colors.primaryGradient as [string, string],
        };
    }
  };
  
  const variantStyles = getVariantStyles();
  
  const content = (
    <>
      {loading && (
        <ActivityIndicator
          size="small"
          color={variantStyles.textStyle.color}
          style={{ marginRight: spacing.sm }}
        />
      )}
      <Text style={variantStyles.textStyle}>{title}</Text>
    </>
  );
  
  if (variantStyles.useGradient && variantStyles.colors) {
    return (
      <TouchableOpacity onPress={onPress} disabled={isDisabled} activeOpacity={0.8}>
        <LinearGradient
          colors={variantStyles.colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={variantStyles.buttonStyle}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }
  
  return (
    <TouchableOpacity
      style={variantStyles.buttonStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {content}
    </TouchableOpacity>
  );
}; 