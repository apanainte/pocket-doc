import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { TypographyVariant } from '@/themes/typography';

interface RevolutTextProps extends TextProps {
  variant?: TypographyVariant;
  color?: string;
  children: React.ReactNode;
}

export const RevolutText: React.FC<RevolutTextProps> = ({
  variant = 'body1',
  color,
  style,
  children,
  ...props
}) => {
  const { theme, typography } = useTheme();
  
  const textStyle = [
    typography[variant],
    { color: color || theme.colors.text },
    style,
  ];
  
  return (
    <Text style={textStyle} {...props}>
      {children}
    </Text>
  );
}; 