import React from 'react';
import { View, ViewStyle, TouchableOpacity, TouchableOpacityProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface RevolutCardProps extends TouchableOpacityProps {
  children: React.ReactNode;
  gradient?: boolean;
  shadow?: 'small' | 'medium' | 'large';
  padding?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  onPress?: () => void;
}

export const RevolutCard: React.FC<RevolutCardProps> = ({
  children,
  gradient = false,
  shadow = 'medium',
  padding = 'md',
  style,
  onPress,
  ...props
}) => {
  const { theme, spacing, borderRadius } = useTheme();
  
  const paddingSize = {
    sm: spacing.md,
    md: spacing.lg,
    lg: spacing.xl,
  }[padding];
  
  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows[shadow],
    ...style,
  };
  
  const contentStyle: ViewStyle = {
    padding: paddingSize,
  };
  
  if (gradient) {
    const Component = onPress ? TouchableOpacity : View;
    
    return (
      <Component style={cardStyle} onPress={onPress} {...props}>
        <LinearGradient
          colors={theme.colors.cardGradient as [string, string]}
          style={contentStyle}
        >
          {children}
        </LinearGradient>
      </Component>
    );
  }
  
  if (onPress) {
    return (
      <TouchableOpacity style={[cardStyle, { backgroundColor: theme.colors.surface }]} onPress={onPress} {...props}>
        <View style={contentStyle}>
          {children}
        </View>
      </TouchableOpacity>
    );
  }
  
  return (
    <View style={[cardStyle, { backgroundColor: theme.colors.surface }]}>
      <View style={contentStyle}>
        {children}
      </View>
    </View>
  );
}; 