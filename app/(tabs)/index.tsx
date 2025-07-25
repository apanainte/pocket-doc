import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  Alert,
  Dimensions,
  ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentDetailModal } from '@/components/DocumentDetailModal';
import { RevolutText } from '@/components/ui/RevolutText';
import SearchBar from '@/components/SearchBar';
import { databaseService } from '@/services/database';
import { Document } from '@/types/document';
import { Grid2x2 as Grid, List } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function LibraryScreen() {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Load documents when component mounts and when screen comes into focus
  useEffect(() => {
    loadDocuments();
  }, []);

  // Refresh documents when screen comes into focus with proper dependency management
  useFocusEffect(
    useCallback(() => {
      loadDocuments();
    }, []) // Empty dependency array is correct here - we want this to run on every focus
  );

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const loadedDocuments = await databaseService.getAllDocuments();
      setDocuments(loadedDocuments);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDocuments();
    } finally {
      setRefreshing(false);
    }
  }, [loadDocuments]);

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

  const handleDocumentPress = useCallback((document: Document) => {
    setSelectedDocument(document);
  }, []);

  const closeModal = useCallback(() => {
    setSelectedDocument(null);
  }, []);

  const toggleViewMode = useCallback(() => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  }, [viewMode]);

  // Memoized render functions for performance
  const renderDocument = useCallback(({ item }: { item: Document }) => (
    <DocumentCard 
      document={item} 
      onPress={() => handleDocumentPress(item)}
    />
  ), [handleDocumentPress]);

  const keyExtractor = useCallback((item: Document) => item.id, []);

  const renderEmpty = useCallback(() => (
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
  ), [theme, spacing, iconSizes]);

  // Memoized column wrapper style for performance
  const columnWrapperStyle = useMemo(() => ({
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
  }), [spacing.lg]);

  const contentContainerStyle = useMemo(() => ({
    flexGrow: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  }), [spacing.xl]);

  // Performance optimized FlatList props
  const getItemLayout = useCallback((data: any, index: number) => {
    const itemHeight = ((width - spacing.lg * 3) / 2) * 1.3 + spacing.lg;
    return {
      length: itemHeight,
      offset: itemHeight * Math.floor(index / 2),
      index,
    };
  }, [spacing.lg]);

  // Error handling
  if (error && !refreshing) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <SafeAreaView style={{ flex: 1 }}>
          <SearchBar 
            placeholder="Search..."
            editable={false}
            onPress={() => {/* Navigate to search screen */}}
          />
          
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: spacing.lg,
            paddingTop: 120 // Account for sticky search bar
          }}>
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
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <SearchBar 
          placeholder="Search..."
          editable={false}
          onPress={() => {/* Navigate to search screen */}}
        />
        
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            paddingTop: 120, // Account for sticky search bar
            paddingBottom: spacing.xl,
            paddingHorizontal: spacing.lg
          }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }
        >
          {/* Welcome Message */}
          <View style={{ 
            marginBottom: spacing.xl,
            alignItems: 'center'
          }}>
            <RevolutText 
              variant="h2" 
              color={theme.colors.text}
              style={{ 
                textAlign: 'center',
                marginBottom: spacing.sm
              }}
              accessible={true}
              accessibilityLabel="Welcome message"
            >
              Welcome!
            </RevolutText>
            <RevolutText 
              variant="body1" 
              color={theme.colors.textSecondary}
              style={{ 
                textAlign: 'center',
                marginBottom: spacing.md
              }}
              accessible={true}
              accessibilityLabel="Document count"
            >
              {documents.length > 0 
                ? `You have ${documents.length} document${documents.length !== 1 ? 's' : ''}`
                : 'Upload your first document to get started'
              }
            </RevolutText>
          </View>

          {/* Documents Grid */}
          {documents.length > 0 ? (
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              gap: spacing.md,
            }}>
              {documents.map((document) => (
                <View 
                  key={document.id}
                  style={{
                    width: (width - spacing.lg * 2 - spacing.md) / 2,
                    marginBottom: spacing.lg,
                  }}
                >
                  <DocumentCard 
                    document={document}
                    onPress={() => handleDocumentPress(document)}
                  />
                </View>
              ))}
            </View>
          ) : (
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
                Tap the + button to upload your first document
              </RevolutText>
            </View>
          )}
        </ScrollView>

        <DocumentDetailModal
          document={selectedDocument}
          visible={!!selectedDocument}
          onClose={closeModal}
          onUpdate={updateDocument}
          onDelete={deleteDocument}
        />
      </SafeAreaView>
    </View>
  );
}

