import React, { memo } from 'react';
import { View, Image, Dimensions } from 'react-native';
import { FileText, Image as ImageIcon } from 'lucide-react-native';
import { Document } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
}

// Memoized component for performance
export const DocumentCard = memo<DocumentCardProps>(({ document, onPress }) => {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatFileSize = (size?: number): string => {
    if (!size) return '';
    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)}KB`;
    }
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  // Accessibility description
  const accessibilityLabel = `${document.title} document. ${document.type.toUpperCase()}. Created ${formatDate(document.createdAt)}. ${formatFileSize(document.fileSize)}`;
  const accessibilityHint = 'Tap to view document details and edit metadata';

  const cardWidth = (width - spacing.lg * 3) / 2;
  
  const cardStyle = {
    width: cardWidth,
    height: cardWidth * 1.3,
    marginBottom: spacing.lg,
  };

  const thumbnailContainerStyle = {
    width: cardWidth,
    height: cardWidth * 0.6,
    borderRadius: borderRadius.lg,
    overflow: 'hidden' as const,
    backgroundColor: theme.colors.surface,
  };

  const thumbnailStyle = {
    width: cardWidth,
    height: cardWidth * 0.6,
  };

  const placeholderStyle = {
    width: cardWidth,
    height: cardWidth * 0.6,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surfaceSecondary,
  };

  const footerStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  };

  const tagsContainerStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  };

  const tagStyle = {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
  };

  return (
    <RevolutCard 
      style={cardStyle} 
      onPress={onPress}
      shadow="medium"
      padding="md"
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
    >
      <View style={thumbnailContainerStyle}>
        {document.thumbnail ? (
          <Image 
            source={{ uri: document.thumbnail }} 
            style={thumbnailStyle}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`Thumbnail preview of ${document.title}`}
          />
        ) : (
          <View 
            style={placeholderStyle}
            accessible={true}
            accessibilityLabel={`${document.type.toUpperCase()} document icon`}
          >
            {document.type === 'pdf' ? (
              <FileText size={iconSizes.xl} color={theme.colors.textTertiary} />
            ) : (
              <ImageIcon size={iconSizes.xl} color={theme.colors.textTertiary} />
            )}
          </View>
        )}
      </View>
      
      <View style={{ marginTop: spacing.md }}>
        <RevolutText 
          variant="h6" 
          numberOfLines={2} 
          style={{ marginBottom: spacing.xs }}
          accessible={true}
          accessibilityLabel={`Document title: ${document.title}`}
        >
          {document.title}
        </RevolutText>
        
        <ExpandableText
          text={document.description}
          variant="body2"
          color={theme.colors.textSecondary}
          numberOfLines={2}
          style={{ marginBottom: spacing.sm }}
        />
        
        <View style={footerStyle}>
          <RevolutText 
            variant="caption" 
            color={theme.colors.textTertiary}
            accessible={true}
            accessibilityLabel={`Created on ${formatDate(document.createdAt)}`}
          >
            {formatDate(document.createdAt)}
          </RevolutText>
          <RevolutText 
            variant="caption" 
            color={theme.colors.textTertiary}
            accessible={true}
            accessibilityLabel={`File size: ${formatFileSize(document.fileSize)}`}
          >
            {formatFileSize(document.fileSize)}
          </RevolutText>
        </View>
        
        <View 
          style={tagsContainerStyle}
          accessible={true}
          accessibilityLabel={`Tags: ${document.tags.join(', ')}`}
        >
          {document.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={tagStyle}>
              <RevolutText variant="caption" color={theme.colors.primary}>
                {tag}
              </RevolutText>
            </View>
          ))}
          {document.tags.length > 2 && (
            <RevolutText 
              variant="caption" 
              color={theme.colors.textTertiary}
              accessible={true}
              accessibilityLabel={`${document.tags.length - 2} more tags`}
            >
              +{document.tags.length - 2}
            </RevolutText>
          )}
        </View>
      </View>
    </RevolutCard>
  );
});

DocumentCard.displayName = 'DocumentCard';

