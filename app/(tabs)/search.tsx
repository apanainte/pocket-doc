import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Search, X, Filter } from 'lucide-react-native';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentDetailModal } from '@/components/DocumentDetailModal';
import { databaseService } from '@/services/database';
import { Document } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Initialize database and load documents
  useEffect(() => {
    const initAndLoad = async () => {
      try {
        await databaseService.initialize();
        const loadedDocuments = await databaseService.getAllDocuments();
        setDocuments(loadedDocuments);
      } catch (err) {
        console.error('Failed to load documents for search:', err);
        setDocuments([]);
      }
    };

    initAndLoad();
  }, []);

  // Refresh documents when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = useCallback(async () => {
    try {
      const loadedDocuments = await databaseService.getAllDocuments();
      setDocuments(loadedDocuments);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  }, []);

  // Memoized search function for performance
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const searchTerm = searchQuery.toLowerCase();
    return documents.filter(doc =>
      doc.title.toLowerCase().includes(searchTerm) ||
      doc.description.toLowerCase().includes(searchTerm) ||
      doc.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }, [searchQuery, documents]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      await databaseService.updateDocument(id, updates);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Failed to update document:', err);
      Alert.alert('Error', 'Failed to update document');
    }
  }, [loadDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await databaseService.deleteDocument(id);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete document:', err);
      Alert.alert('Error', 'Failed to delete document');
    }
  }, [loadDocuments]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  const handleDocumentPress = useCallback((document: Document) => {
    setSelectedDocument(document);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  // Memoized render functions for performance
  const renderDocument = useCallback(({ item }: { item: Document }) => (
    <DocumentCard 
      document={item} 
      onPress={() => handleDocumentPress(item)}
    />
  ), [handleDocumentPress]);

  const keyExtractor = useCallback((item: Document) => item.id, []);

  const renderHeader = useCallback(() => (
    <View style={{
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
    }}>
      <RevolutCard shadow="small">
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        }}>
          <Search 
            size={iconSizes.md} 
            color={theme.colors.textSecondary} 
            style={{ marginRight: spacing.sm }}
          />
          <RevolutInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents..."
            style={{
              flex: 1,
              borderWidth: 0,
              backgroundColor: 'transparent',
              paddingHorizontal: 0,
              paddingVertical: 0,
              minHeight: 40,
              fontSize: 16,
            }}
            containerStyle={{ 
              marginBottom: 0,
              flex: 1,
            }}
            accessible={true}
            accessibilityLabel="Search input"
            accessibilityHint="Enter keywords to search through your documents"
            accessibilityRole="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={clearSearch}
              style={{
                padding: spacing.xs,
                marginLeft: spacing.sm,
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              accessibilityHint="Tap to clear the search query"
            >
              <X size={iconSizes.sm} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </RevolutCard>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.md,
      }}>
        {searchQuery.trim() && searchResults.length > 0 && (
          <RevolutText 
            variant="caption" 
            color={theme.colors.textSecondary}
            accessible={true}
            accessibilityLabel={`Found ${searchResults.length} search results`}
          >
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </RevolutText>
        )}
        <TouchableOpacity
          onPress={() => setShowFilters(!showFilters)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: spacing.sm,
            backgroundColor: theme.colors.surface,
            borderRadius: borderRadius.md,
            opacity: 0.7, // Future feature indicator
          }}
          disabled={true} // Future feature
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Filter options"
          accessibilityHint="Filters are coming soon"
        >
          <Filter size={iconSizes.sm} color={theme.colors.textTertiary} />
          <RevolutText 
            variant="caption" 
            color={theme.colors.textTertiary}
            style={{ marginLeft: spacing.xs }}
          >
            Filter
          </RevolutText>
        </TouchableOpacity>
      </View>
    </View>
  ), [searchQuery, searchResults.length, theme, spacing, borderRadius, iconSizes, clearSearch]);

  const renderEmpty = useCallback(() => {
    if (searchQuery.trim()) {
      // No search results
      return (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingVertical: spacing.xxxl,
          paddingHorizontal: spacing.lg,
        }}>
          <Search 
            size={iconSizes.xxl} 
            color={theme.colors.textTertiary} 
            style={{ marginBottom: spacing.lg }}
          />
          <RevolutText 
            variant="h3" 
            color={theme.colors.textSecondary} 
            style={{ marginBottom: spacing.sm, textAlign: 'center' }}
          >
            No results found
          </RevolutText>
          <RevolutText 
            variant="body1" 
            color={theme.colors.textTertiary} 
            style={{ textAlign: 'center' }}
          >
            Try searching with different keywords or check your spelling
          </RevolutText>
        </View>
      );
    }

    // Empty state - no search query
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl,
        paddingHorizontal: spacing.lg,
      }}>
        <Search 
          size={iconSizes.xxl} 
          color={theme.colors.textTertiary} 
          style={{ marginBottom: spacing.lg }}
        />
        <RevolutText 
          variant="h3" 
          color={theme.colors.textSecondary} 
          style={{ marginBottom: spacing.sm, textAlign: 'center' }}
        >
          Search Your Documents
        </RevolutText>
        <RevolutText 
          variant="body1" 
          color={theme.colors.textTertiary} 
          style={{ textAlign: 'center' }}
        >
          Enter keywords to find documents by title, description, or tags
        </RevolutText>
      </View>
    );
  }, [searchQuery, theme, spacing, iconSizes]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={theme.colors.backgroundGradient as [string, string]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Header with gradient background */}
          <LinearGradient
            colors={theme.colors.primaryGradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingHorizontal: spacing.lg,
              paddingTop: spacing.lg,
              paddingBottom: spacing.xl,
              borderBottomLeftRadius: borderRadius.xl,
              borderBottomRightRadius: borderRadius.xl,
            }}
          >
            <RevolutText variant="h1" color="#ffffff">
              Search
            </RevolutText>
            <RevolutText 
              variant="subtitle1" 
              color="rgba(255, 255, 255, 0.9)"
              style={{ marginTop: spacing.sm }}
            >
              Find documents quickly by title, content, or tags
            </RevolutText>
          </LinearGradient>

          {renderHeader()}

          <FlatList
            data={searchResults}
            renderItem={renderDocument}
            keyExtractor={keyExtractor}
            numColumns={2}
            columnWrapperStyle={searchResults.length > 0 ? {
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
            } : undefined}
            contentContainerStyle={{
              flexGrow: 1,
              paddingBottom: spacing.xl,
            }}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={100}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={searchResults.length > 0 ? (data, index) => {
              const itemHeight = ((width - spacing.lg * 3) / 2) * 1.3 + spacing.lg;
              return {
                length: itemHeight,
                offset: itemHeight * Math.floor(index / 2),
                index,
              };
            } : undefined}
            accessible={true}
            accessibilityLabel="Search results"
          />

          <DocumentDetailModal
            document={selectedDocument}
            visible={!!selectedDocument}
            onClose={closeModal}
            onUpdate={updateDocument}
            onDelete={deleteDocument}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}