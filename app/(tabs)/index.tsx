import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { DocumentCard } from '@/components/DocumentCard';
import { FullDocumentViewer, DocumentDetailModal } from '@/components';
import * as FileSystem from 'expo-file-system';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { databaseService } from '@/services/database';
import { Document, Category } from '@/types/document';
import { Grid2x2 as Grid, List, Search, X, Filter, Folder } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [documentToEdit, setDocumentToEdit] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<Category | null>(null);

  // Load documents and categories when component mounts and when screen comes into focus
  useEffect(() => {
    loadDocumentsAndCategories();
  }, []);

  // Refresh documents when screen comes into focus with proper dependency management
  useFocusEffect(
    useCallback(() => {
      loadDocumentsAndCategories();
    }, []) // Empty dependency array is correct here - we want this to run on every focus
  );

  const loadDocumentsAndCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Add debugging for file paths
      const { fileStorageService } = await import('@/services/fileStorage');
      console.log('📁 Current documents directory:', fileStorageService.getCurrentDocumentsDirectory());
      
      const [loadedDocuments, loadedCategories] = await Promise.all([
        databaseService.getAllDocuments(),
        databaseService.getAllCategories()
      ]);
      
      // Debug first document's paths
      if (loadedDocuments.length > 0) {
        const firstDoc = loadedDocuments[0];
        console.log('📄 First document:', {
          id: firstDoc.id,
          title: firstDoc.title,
          uri: firstDoc.uri,
          thumbnail: firstDoc.thumbnail
        });
        
                 // Check if files exist
         if (firstDoc.uri) {
           const mainFileExists = await FileSystem.getInfoAsync(firstDoc.uri);
           console.log('📄 Main file exists:', mainFileExists.exists, 'at', firstDoc.uri);
         }
         
         if (firstDoc.thumbnail) {
           const thumbExists = await FileSystem.getInfoAsync(firstDoc.thumbnail);
           console.log('📄 Thumbnail exists:', thumbExists.exists, 'at', firstDoc.thumbnail);
         }
      }
      
      setDocuments(loadedDocuments);
      setCategories(loadedCategories);
    } catch (err) {
      console.error('Failed to load documents and categories:', err);
      setError('Failed to load documents');
      setDocuments([]);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Enhanced search with OCR text support and category filtering
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim() && !selectedCategoryFilter) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        let results = documents;

        // Apply text search
        if (searchQuery.trim()) {
          const searchResults = await databaseService.searchDocuments(searchQuery);
          results = searchResults;
        }

        // Apply category filter
        if (selectedCategoryFilter) {
          results = results.filter(doc => doc.categoryId === selectedCategoryFilter.id);
        }

        setSearchResults(results);
      } catch (error) {
        console.error('Search failed:', error);
        // Fallback to local search
        let results = documents;
        
        if (searchQuery.trim()) {
          const searchTerm = searchQuery.toLowerCase();
          results = documents.filter(doc =>
            doc.title.toLowerCase().includes(searchTerm) ||
            doc.description.toLowerCase().includes(searchTerm) ||
            doc.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            (doc.extractedText && doc.extractedText.toLowerCase().includes(searchTerm))
          );
        }

        // Apply category filter
        if (selectedCategoryFilter) {
          results = results.filter(doc => doc.categoryId === selectedCategoryFilter.id);
        }

        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategoryFilter, documents]);

  // Get category for a document
  const getCategoryForDocument = useCallback((document: Document): Category | null => {
    if (!document.categoryId) return null;
    return categories.find(cat => cat.id === document.categoryId) || null;
  }, [categories]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDocumentsAndCategories();
    } finally {
      setRefreshing(false);
    }
  }, [loadDocumentsAndCategories]);

  const updateDocument = useCallback(async (id: string, updates: Partial<Document>) => {
    try {
      await databaseService.updateDocument(id, updates);
      await loadDocumentsAndCategories(); // Refresh the list
    } catch (err) {
      console.error('Failed to update document:', err);
      Alert.alert('Error', 'Failed to update document');
    }
  }, [loadDocumentsAndCategories]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await databaseService.deleteDocument(id);
      await loadDocumentsAndCategories(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete document:', err);
      Alert.alert('Error', 'Failed to delete document');
    }
  }, [loadDocumentsAndCategories]);

  const handleDocumentPress = useCallback((document: Document) => {
    setSelectedDocument(document);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  const handleEditDocument = useCallback((document: Document) => {
    setSelectedDocument(null); // Close viewer
    setDocumentToEdit(document); // Open edit modal
  }, []);

  const closeEditModal = useCallback(() => {
    setDocumentToEdit(null);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  }, [viewMode]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSelectedCategoryFilter(null);
  }, []);

  const handleCategoryFilter = useCallback((category: Category | null) => {
    setSelectedCategoryFilter(category);
    setShowFilters(false);
  }, []);

  // Memoized render functions for performance
  const renderDocument = useCallback(({ item }: { item: Document }) => (
    <DocumentCard 
      document={item} 
      category={getCategoryForDocument(item)}
      onPress={() => handleDocumentPress(item)}
      viewMode={viewMode}
    />
  ), [handleDocumentPress, getCategoryForDocument, viewMode]);

  const keyExtractor = useCallback((item: Document) => item.id, []);

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

    // Empty state - no documents
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: spacing.xxxl || spacing.xl,
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: theme.colors.primary + '20',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: spacing.lg,
        }}>
          <Grid size={iconSizes.xl} color={theme.colors.primary} />
        </View>
        <RevolutText 
          variant="h3" 
          color={theme.colors.textSecondary} 
          style={{ marginBottom: spacing.sm, textAlign: 'center' }}
          accessible={true}
          accessibilityLabel="No documents message"
        >
          No documents yet
        </RevolutText>
        <RevolutText 
          variant="body1" 
          color={theme.colors.textTertiary} 
          style={{ textAlign: 'center' }}
          accessible={true}
          accessibilityLabel="Upload first document instruction"
        >
          Upload your first document to get started
        </RevolutText>
      </View>
    );
  }, [searchQuery, theme, spacing, iconSizes]);

  // Memoized column wrapper style for performance
  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
  }), [spacing.lg]);

  const contentContainerStyle = useMemo(() => ({
    flexGrow: 1,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  }), [spacing.xl]);

  // Performance optimized FlatList props
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemHeight = ((width - spacing.lg * 3) / 2) * 1.2 + spacing.sm;
    return {
      length: itemHeight,
      offset: itemHeight * Math.floor(index / 2),
      index,
    };
  }, [spacing.lg]);

  // Determine which documents to display
  const displayDocuments = searchQuery.trim() || selectedCategoryFilter ? searchResults : documents;

  // Dynamic columns based on view mode
  const numColumns = viewMode === 'grid' ? 2 : 1;

  // Error handling
  if (error && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <LinearGradient
          colors={theme.colors.backgroundGradient as [string, string]}
          style={{ flex: 1 }}
        >
          <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.lg }}>
            <RevolutText variant="h3" color={theme.colors.error} style={{ marginBottom: spacing.md, textAlign: 'center' }}>
              Error Loading Documents
            </RevolutText>
            <RevolutText variant="body1" color={theme.colors.textSecondary} style={{ marginBottom: spacing.xl, textAlign: 'center' }}>
              {error}
            </RevolutText>
            <TouchableOpacity
              onPress={handleRefresh}
              style={{
                backgroundColor: theme.colors.primary,
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                borderRadius: borderRadius.lg,
              }}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Retry loading documents"
              accessibilityHint="Tap to try loading your documents again"
            >
              <RevolutText variant="button" color="#ffffff">
                Try Again
              </RevolutText>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={theme.colors.backgroundGradient as [string, string]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Compact Header - Consistent with Settings */}
          <View style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: spacing.md,
            backgroundColor: theme.colors.background,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View style={{ flex: 1 }}>
                <RevolutText 
                  variant="h2"
                  accessible={true}
                  accessibilityLabel="Document library"
                >
                  Pocket docs
                </RevolutText>
                {documents.length > 0 && !searchQuery.trim() && (
                  <RevolutText 
                    variant="caption" 
                    color={theme.colors.textSecondary}
                    style={{ marginTop: 2 }}
                    accessible={true}
                    accessibilityLabel={`You have ${documents.length} document${documents.length !== 1 ? 's' : ''}`}
                  >
                    {documents.length} document{documents.length !== 1 ? 's' : ''}
                  </RevolutText>
                )}
              </View>
              <TouchableOpacity 
                onPress={toggleViewMode}
                style={{
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
                accessibilityHint={`Currently showing ${viewMode} view. Tap to switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
              >
                {viewMode === 'grid' ? (
                  <List size={16} color={theme.colors.textSecondary} />
                ) : (
                  <Grid size={16} color={theme.colors.textSecondary} />
                )}
                <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ marginLeft: spacing.xs, fontSize: 12 }}>
                  {viewMode === 'grid' ? 'List' : 'Grid'}
                </RevolutText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Compact Search Bar */}
          <View style={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.sm,
            paddingBottom: spacing.sm,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: theme.colors.surface,
              borderRadius: borderRadius.lg,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 36,
            }}>
              <Search 
                size={16} 
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
                  fontSize: 14,
                  color: theme.colors.text,
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
              {(searchQuery.length > 0 || selectedCategoryFilter) && (
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
                  <X size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Compact Category Filter */}
            {categories.length > 0 && (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: spacing.sm }}
                style={{ marginTop: spacing.sm, flexGrow: 0 }}
              >
                <TouchableOpacity
                  onPress={() => handleCategoryFilter(null)}
                  style={{
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 4,
                    borderRadius: borderRadius.lg,
                    backgroundColor: !selectedCategoryFilter ? theme.colors.primary : theme.colors.surface,
                    borderWidth: 1,
                    borderColor: !selectedCategoryFilter ? theme.colors.primary : theme.colors.border,
                    minHeight: 28,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Show all documents"
                >
                  <RevolutText 
                    variant="caption" 
                    color={!selectedCategoryFilter ? '#ffffff' : theme.colors.textSecondary}
                    style={{ fontWeight: '600', fontSize: 11 }}
                  >
                    All
                  </RevolutText>
                </TouchableOpacity>
                
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleCategoryFilter(category)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: spacing.sm,
                      paddingVertical: 4,
                      borderRadius: borderRadius.lg,
                      backgroundColor: selectedCategoryFilter?.id === category.id ? category.color : theme.colors.surface,
                      borderWidth: 1,
                      borderColor: selectedCategoryFilter?.id === category.id ? category.color : theme.colors.border,
                      minHeight: 28,
                    }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`Filter by ${category.name} category`}
                  >
                    <Folder 
                      size={10} 
                      color={selectedCategoryFilter?.id === category.id ? '#ffffff' : category.color}
                      style={{ marginRight: 4 }}
                    />
                    <RevolutText 
                      variant="caption" 
                      color={selectedCategoryFilter?.id === category.id ? '#ffffff' : theme.colors.textSecondary}
                      style={{ fontWeight: '600', fontSize: 11 }}
                    >
                      {category.name}
                    </RevolutText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Compact Search Results Info */}
            {(searchQuery.trim() || selectedCategoryFilter) && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: spacing.sm,
              }}>
                {isSearching && (
                  <ActivityIndicator 
                    size="small" 
                    color={theme.colors.primary} 
                    style={{ marginRight: spacing.sm }}
                  />
                )}
                <RevolutText 
                  variant="caption" 
                  color={theme.colors.textSecondary}
                  style={{ fontSize: 12 }}
                  accessible={true}
                  accessibilityLabel={isSearching ? 'Searching documents' : `Found ${searchResults.length} search results`}
                >
                  {isSearching 
                    ? 'Searching...' 
                    : `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''} found`}
                </RevolutText>
              </View>
            )}
          </View>

          <FlatList
            data={displayDocuments}
            renderItem={renderDocument}
            keyExtractor={keyExtractor}
            numColumns={numColumns}
            key={viewMode} // Force re-render when viewMode changes
            columnWrapperStyle={viewMode === 'grid' ? columnWrapperStyle : undefined}
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={theme.colors.primary}
                colors={[theme.colors.primary]}
              />
            }
            showsVerticalScrollIndicator={false}
            // Performance optimizations
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            updateCellsBatchingPeriod={100}
            windowSize={10}
            initialNumToRender={8}
            getItemLayout={displayDocuments.length > 0 && viewMode === 'grid' ? getItemLayout : undefined}
            accessible={true}
            accessibilityLabel="Document library list"
          />

          <FullDocumentViewer
            document={selectedDocument}
            visible={!!selectedDocument}
            onClose={closeModal}
            onEdit={handleEditDocument}
          />
          
          <DocumentDetailModal
            document={documentToEdit}
            visible={!!documentToEdit}
            onClose={closeEditModal}
            onUpdate={updateDocument}
            onDelete={deleteDocument}
            categories={categories}
          />
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

