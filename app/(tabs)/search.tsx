import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Search, X, Filter } from 'lucide-react-native';
import { DocumentCard } from '@/components/DocumentCard';
import { DocumentDetailModal } from '@/components/DocumentDetailModal';
import { useDocuments } from '@/hooks/useDocuments';
import { Document } from '@/types/document';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const { documents, updateDocument, deleteDocument, searchDocuments } = useDocuments();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchDocuments(searchQuery);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, documents]);

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const renderDocument = ({ item }: { item: Document }) => (
    <DocumentCard 
      document={item} 
      onPress={() => setSelectedDocument(item)}
    />
  );

  const renderEmpty = () => {
    if (!searchQuery.trim()) {
      return (
        <View style={styles.emptyContainer}>
          <Search size={48} color="#8E8E93" />
          <Text style={styles.emptyTitle}>Search Documents</Text>
          <Text style={styles.emptyDescription}>
            Find documents by title, description, or tags
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No results found</Text>
        <Text style={styles.emptyDescription}>
          Try adjusting your search terms
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Search size={20} color="#8E8E93" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search documents..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#8E8E93"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <X size={20} color="#8E8E93" />
          </TouchableOpacity>
        )}
      </View>
      
      <TouchableOpacity 
        onPress={() => setShowFilters(!showFilters)}
        style={styles.filterButton}
      >
        <Filter size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      {renderHeader()}

      {searchQuery.trim() && searchResults.length > 0 ? (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
          </Text>
        </View>
      ) : null}

      <FlatList
        data={searchResults}
        renderItem={renderDocument}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={searchResults.length > 0 ? styles.row : undefined}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmpty}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#1C1C1E',
  },
  headerContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1C1C1E',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  resultsText: {
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
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
});