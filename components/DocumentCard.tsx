import React, { memo } from 'react';
import { View, Image, Dimensions } from 'react-native';
import { FileText, Image as ImageIcon, Folder } from 'lucide-react-native';
import { Document, Category } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface DocumentCardProps {
  document: Document;
  category?: Category | null;
  onPress: () => void;
  viewMode?: 'grid' | 'list';
}

// Memoized component for performance
export const DocumentCard = memo<DocumentCardProps>(({ document, category, onPress, viewMode = 'grid' }) => {
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

  // Different layouts for grid vs list view
  if (viewMode === 'list') {
    return (
      <RevolutCard 
        style={{
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        }} 
        onPress={onPress}
        shadow="small"
        padding="sm"
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
      >
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
        }}>
          {/* Compact List View Thumbnail */}
          <View style={{
            width: 48,
            height: 48,
            borderRadius: borderRadius.md,
            overflow: 'hidden',
            backgroundColor: theme.colors.surface,
            marginRight: spacing.md,
          }}>
            {document.thumbnail ? (
              <Image 
                source={{ uri: document.thumbnail }} 
                style={{ width: 48, height: 48 }}
                resizeMode="cover"
                accessible={true}
                accessibilityLabel={`Thumbnail preview of ${document.title}`}
              />
            ) : (
              <View 
                style={{
                  width: 48,
                  height: 48,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: theme.colors.surfaceSecondary,
                }}
                accessible={true}
                accessibilityLabel={`${document.type.toUpperCase()} document icon`}
              >
                {document.type === 'pdf' ? (
                  <FileText size={20} color={theme.colors.textTertiary} />
                ) : (
                  <ImageIcon size={20} color={theme.colors.textTertiary} />
                )}
              </View>
            )}
          </View>
          
          {/* Compact List View Content */}
          <View style={{ flex: 1 }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 2,
            }}>
              <RevolutText 
                variant="subtitle1" 
                numberOfLines={1} 
                style={{ flex: 1, marginRight: spacing.sm, fontSize: 14, fontWeight: '600' }}
                accessible={true}
                accessibilityLabel={`Document title: ${document.title}`}
              >
                {document.title}
              </RevolutText>
              <RevolutText 
                variant="caption" 
                color={theme.colors.textTertiary}
                style={{ fontSize: 10 }}
                accessible={true}
                accessibilityLabel={`File size: ${formatFileSize(document.fileSize)}`}
              >
                {formatFileSize(document.fileSize)}
              </RevolutText>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {category && (
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: spacing.md,
                  }}>
                    <View style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: category.color + '30',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 4,
                    }}>
                      <Folder size={6} color={category.color} />
                    </View>
                    <RevolutText 
                      variant="caption" 
                      color={theme.colors.textSecondary}
                      style={{ fontSize: 10 }}
                      accessible={true}
                      accessibilityLabel={`Category: ${category.name}`}
                    >
                      {category.name}
                    </RevolutText>
                  </View>
                )}
                {document.tags.length > 0 && (
                  <RevolutText 
                    variant="caption" 
                    color={theme.colors.textTertiary}
                    numberOfLines={1}
                    style={{ flex: 1, fontSize: 10 }}
                  >
                    {document.tags.slice(0, 2).join(', ')}
                    {document.tags.length > 2 && '...'}
                  </RevolutText>
                )}
              </View>
              <RevolutText 
                variant="caption" 
                color={theme.colors.textTertiary}
                style={{ fontSize: 10 }}
                accessible={true}
                accessibilityLabel={`Created on ${formatDate(document.createdAt)}`}
              >
                {formatDate(document.createdAt)}
              </RevolutText>
            </View>
          </View>
        </View>
      </RevolutCard>
    );
  }

  // Compact Grid view
  const cardWidth = (width - spacing.lg * 3) / 2;
  
  const cardStyle = {
    width: cardWidth,
    height: cardWidth * 1.2, // Reduced from 1.3
    marginBottom: spacing.sm, // Reduced from spacing.lg
  };

  const thumbnailContainerStyle = {
    width: cardWidth,
    height: cardWidth * 0.55, // Reduced from 0.6
    borderRadius: borderRadius.md,
    overflow: 'hidden' as const,
    backgroundColor: theme.colors.surface,
  };

  const thumbnailStyle = {
    width: cardWidth,
    height: cardWidth * 0.55,
  };

  const placeholderStyle = {
    width: cardWidth,
    height: cardWidth * 0.55,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: theme.colors.surfaceSecondary,
  };

  const footerStyle = {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs, // Reduced
  };

  const tagsContainerStyle = {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'center' as const,
    gap: 4, // Reduced
  };

  const tagStyle = {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 4, // Reduced
    paddingVertical: 1, // Reduced
    borderRadius: borderRadius.xs,
  };

  return (
    <RevolutCard 
      style={cardStyle} 
      onPress={onPress}
      shadow="small"
      padding="sm"
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
              <FileText size={24} color={theme.colors.textTertiary} />
            ) : (
              <ImageIcon size={24} color={theme.colors.textTertiary} />
            )}
          </View>
        )}
      </View>
      
      <View style={{ marginTop: spacing.sm }}>
        <RevolutText 
          variant="h6" 
          numberOfLines={2} 
          style={{ marginBottom: 2, fontSize: 14, fontWeight: '600', lineHeight: 18 }}
          accessible={true}
          accessibilityLabel={`Document title: ${document.title}`}
        >
          {document.title}
        </RevolutText>
        
        <ExpandableText
          text={document.description}
          variant="body2"
          color={theme.colors.textSecondary}
          numberOfLines={1}
          style={{ marginBottom: spacing.xs, fontSize: 12, lineHeight: 16 }}
        />

        {/* Compact Category Display */}
        {category && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing.xs,
          }}>
            <View style={{
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: category.color + '30',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 4,
            }}>
              <Folder size={8} color={category.color} />
            </View>
            <RevolutText 
              variant="caption" 
              color={theme.colors.textSecondary}
              style={{ fontSize: 10 }}
              accessible={true}
              accessibilityLabel={`Category: ${category.name}`}
            >
              {category.name}
            </RevolutText>
          </View>
        )}
        
        <View style={footerStyle}>
          <RevolutText 
            variant="caption" 
            color={theme.colors.textTertiary}
            style={{ fontSize: 9 }}
            accessible={true}
            accessibilityLabel={`Created on ${formatDate(document.createdAt)}`}
          >
            {formatDate(document.createdAt)}
          </RevolutText>
          <RevolutText 
            variant="caption" 
            color={theme.colors.textTertiary}
            style={{ fontSize: 9 }}
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
              <RevolutText variant="caption" color={theme.colors.primary} style={{ fontSize: 9 }}>
                {tag}
              </RevolutText>
            </View>
          ))}
          {document.tags.length > 2 && (
            <RevolutText 
              variant="caption" 
              color={theme.colors.textTertiary}
              style={{ fontSize: 9 }}
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

