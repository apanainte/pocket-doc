import React, { useState } from 'react';
import { View, TextInput, TextInputProps, ViewStyle, Text } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface RevolutInputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  containerStyle?: ViewStyle;
}

export const RevolutInput: React.FC<RevolutInputProps> = ({
  label,
  error,
  icon,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const { theme, typography, spacing, borderRadius } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };
  
  const containerStyles: ViewStyle = {
    marginBottom: spacing.md,
    ...containerStyle,
  };
  
  const inputContainerStyles: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: error 
      ? theme.colors.error 
      : isFocused 
        ? theme.colors.primary 
        : theme.colors.border,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 56,
  };
  
  const inputStyles = [
    {
      flex: 1,
      ...typography.body1,
      color: theme.colors.text,
      marginLeft: icon ? spacing.sm : 0,
    },
    style,
  ];
  
  const labelStyles = {
    ...typography.label,
    color: theme.colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase' as const,
  };
  
  const errorStyles = {
    ...typography.caption,
    color: theme.colors.error,
    marginTop: spacing.xs,
  };
  
  return (
    <View style={containerStyles}>
      {label && <Text style={labelStyles}>{label}</Text>}
      <View style={inputContainerStyles}>
        {icon}
        <TextInput
          style={inputStyles}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </View>
      {error && <Text style={errorStyles}>{error}</Text>}
    </View>
  );
}; 