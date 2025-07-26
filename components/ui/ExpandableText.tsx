import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { RevolutText } from './RevolutText';
import { useTheme } from '@/contexts/ThemeContext';
import { TypographyVariant } from '@/themes/typography';

interface ExpandableTextProps {
  text: string;
  variant?: TypographyVariant;
  color?: string;
  numberOfLines?: number;
  showMoreText?: string;
  showLessText?: string;
  style?: any;
}

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  variant = 'body2',
  color,
  numberOfLines = 2,
  showMoreText = 'Show more',
  showLessText = 'Show less',
  style
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const [textHeight, setTextHeight] = useState(0);
  const [truncatedHeight, setTruncatedHeight] = useState(0);
  const { theme } = useTheme();

  // Check if text needs truncation by measuring height
  useEffect(() => {
    if (text && text.length > 100) { // Quick length check first
      setShouldShowButton(true);
    }
  }, [text]);

  const handleFullTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setTextHeight(height);
  };

  const handleTruncatedTextLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setTruncatedHeight(height);
    
    // If we have both measurements, compare them
    if (textHeight > 0 && height > 0) {
      setShouldShowButton(textHeight > height * 1.1); // 10% tolerance
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  const buttonColor = theme.colors.primary;

  // For very long text, use length-based detection
  const isLongText = text.length > 200;

  return (
    <View style={style}>
      {/* Invisible full text for measurement */}
      {!isExpanded && (
        <View style={{ position: 'absolute', opacity: 0, zIndex: -1 }}>
          <RevolutText
            variant={variant}
            color={color}
            onLayout={handleFullTextLayout}
          >
            {text}
          </RevolutText>
        </View>
      )}
      
      {/* Visible text */}
      <RevolutText
        variant={variant}
        color={color}
        numberOfLines={isExpanded ? undefined : numberOfLines}
        onLayout={isExpanded ? undefined : handleTruncatedTextLayout}
        style={{ lineHeight: variant === 'body2' ? 20 : undefined }}
      >
        {text}
      </RevolutText>
      
      {(shouldShowButton || isLongText) && (
        <TouchableOpacity 
          onPress={toggleExpanded}
          style={{ 
            marginTop: 8,
            alignSelf: 'flex-start',
            paddingVertical: 4,
            paddingHorizontal: 8,
            backgroundColor: buttonColor + '15',
            borderRadius: 12,
          }}
          activeOpacity={0.7}
        >
          <RevolutText
            variant="caption"
            color={buttonColor}
            style={{ 
              fontWeight: '600',
            }}
          >
            {isExpanded ? showLessText : showMoreText}
          </RevolutText>
        </TouchableOpacity>
      )}
    </View>
  );
}; 