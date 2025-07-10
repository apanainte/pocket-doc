import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentDetailModal } from '@/components/DocumentDetailModal';
import { databaseService } from '@/services/database';
import { Document } from '@/types/document';
import { Grid2x2 as Grid, List } from 'lucide-react-native';

export default function LibraryScreen() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // Initialize database and load documents
  useEffect(() => {
    const initAndLoad = async () => {
      try {
        setIsLoading(true);
        await databaseService.initialize();
        const loadedDocuments = await databaseService.getAllDocuments();
        setDocuments(loadedDocuments);
        setError(null);
      } catch (err) {
        console.error('Failed to load documents:', err);
        setError('Failed to load documents');
        setDocuments([]);
      } finally {
        setIsLoading(false);
      }
    };

    initAndLoad();
  }, []);

  // Refresh documents when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, [])
  );

  const loadDocuments = async () => {
    try {
      const loadedDocuments = await databaseService.getAllDocuments();
      setDocuments(loadedDocuments);
      setError(null);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDocuments();
    setRefreshing(false);
  };

  const updateDocument = async (id: string, updates: Partial<Document>) => {
    try {
      await databaseService.updateDocument(id, updates);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Failed to update document:', err);
      Alert.alert('Error', 'Failed to update document');
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await databaseService.deleteDocument(id);
      await loadDocuments(); // Refresh the list
    } catch (err) {
      console.error('Failed to delete document:', err);
      Alert.alert('Error', 'Failed to delete document');
    }
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <DocumentCard 
      document={item} 
      onPress={() => setSelectedDocument(item)}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No documents yet</Text>
      <Text style={styles.emptyDescription}>
        Upload your first document to get started
      </Text>
    </View>
  );

  if (error) {
    Alert.alert('Error', error);
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Documents</Text>
        <TouchableOpacity 
          onPress={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          style={styles.viewModeButton}
        >
          {viewMode === 'grid' ? (
            <List size={24} color="#007AFF" />
          ) : (
            <Grid size={24} color="#007AFF" />
          )}
        </TouchableOpacity>
      </View>

      {documents.length > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={documents}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <DocumentDetailModal
        document={selectedDocument}
        visible={!!selectedDocument}
        onClose={() => setSelectedDocument(null)}
        onUpdate={updateDocument}
        onDelete={deleteDocument}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1C1C1E',
  },
  viewModeButton: {
    padding: 8,
  },
  statsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  statsText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
});