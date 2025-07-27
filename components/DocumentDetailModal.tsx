import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  SafeAreaView } from 'react-native';
import { Document, Category } from '@/types/document';
import { X, CreditCard as Edit2, Save, FileText, Image as ImageIcon, Trash2, Folder, ChevronDown } from 'lucide-react-native';
import { ExpandableText } from '@/components/ui/ExpandableText';

const { width, height } = Dimensions.get('window');

interface DocumentDetailModalProps {
  document: Document | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Document>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  categories?: Category[];
}

export function DocumentDetailModal({ 
  document, 
  visible, 
  onClose, 
  onUpdate, 
  onDelete,
  categories = []
}: DocumentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  

  React.useEffect(() => {
    if (document) {
      setEditedTitle(document.title);
      setEditedDescription(document.description);
      setEditedTags(document.tags.join(', '));
      
      // Find and set the current category
      const currentCategory = categories.find(cat => cat.id === document.categoryId) || null;
      setSelectedCategory(currentCategory);
    }
  }, [document, categories]);

  const handleSave = async () => {
    if (!document) return;

    setLoading(true);
    try {
      const tags = editedTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await onUpdate(document.id, {
        title: editedTitle,
        description: editedDescription,
        tags,
        categoryId: selectedCategory?.id
      });
      
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update document');
    } finally {
      setLoading(false);
    }
  };

  

  

  const handleDelete = () => {
    if (!document) return;

    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete(document.id);
              onClose();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete document');
            }
          }
        }
      ]
    );
  };

  if (!document) return null;

  // Find current category for display
  const currentCategory = categories.find(cat => cat.id === document.categoryId);

  return (
    <><Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#007AFF" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Document Details</Text>
            
            <TouchableOpacity 
              onPress={isEditing ? handleSave : () => setIsEditing(true)}
              style={styles.actionButton}
              disabled={loading}
            >
              {isEditing ? (
                <Save size={24} color="#007AFF" />
              ) : (
                <Edit2 size={24} color="#007AFF" />
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <View style={styles.form}>
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Title</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedTitle}
                    onChangeText={setEditedTitle}
                    placeholder="Enter document title"
                  />
                ) : (
                  <Text style={styles.value}>{document.title}</Text>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Description</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.input, styles.multilineInput]}
                    value={editedDescription}
                    onChangeText={setEditedDescription}
                    placeholder="Enter document description"
                    multiline
                    numberOfLines={4}
                  />
                ) : (
                  <ExpandableText
                    text={document.description}
                    variant="body1"
                    numberOfLines={3}
                    style={styles.expandableText}
                  />
                )}
              </View>

              {/* Category Section */}
              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Category</Text>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      style={styles.categorySelector}
                    >
                      <View style={styles.categorySelectorContent}>
                        {selectedCategory ? (
                          <>
                            <View style={[styles.categoryIcon, { backgroundColor: selectedCategory.color + '30' }]}>
                              <Folder size={16} color={selectedCategory.color} />
                            </View>
                            <Text style={styles.categoryText}>
                              {selectedCategory.name}
                            </Text>
                          </>
                        ) : (
                          <Text style={styles.placeholderText}>
                            Select a category (optional)
                          </Text>
                        )}
                      </View>
                      <ChevronDown size={20} color="#8E8E93" />
                    </TouchableOpacity>

                    {showCategoryDropdown && (
                      <View style={styles.categoryDropdown}>
                        <ScrollView style={styles.categoryScrollView}>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedCategory(null);
                              setShowCategoryDropdown(false);
                            }}
                            style={styles.categoryOption}
                          >
                            <Text style={styles.categoryOptionText}>No Category</Text>
                          </TouchableOpacity>
                          {categories.map((category) => (
                            <TouchableOpacity
                              key={category.id}
                              onPress={() => {
                                setSelectedCategory(category);
                                setShowCategoryDropdown(false);
                              }}
                              style={styles.categoryOption}
                            >
                              <View style={[styles.categoryIcon, { backgroundColor: category.color + '30' }]}>
                                <Folder size={16} color={category.color} />
                              </View>
                              <Text style={styles.categoryOptionText}>
                                {category.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.categoryDisplay}>
                    {currentCategory ? (
                      <>
                        <View style={[styles.categoryIcon, { backgroundColor: currentCategory.color + '30' }]}>
                          <Folder size={16} color={currentCategory.color} />
                        </View>
                        <Text style={styles.value}>
                          {currentCategory.name}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.noCategoryText}>No category assigned</Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.fieldContainer}>
                <Text style={styles.label}>Tags</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.input}
                    value={editedTags}
                    onChangeText={setEditedTags}
                    placeholder="Enter tags separated by commas"
                  />
                ) : (
                  <View style={styles.tagsContainer}>
                    {document.tags.map((tag, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Display extracted OCR text if available */}
              {document.extractedText && (
                <View style={styles.fieldContainer}>
                  <Text style={styles.label}>Extracted Text</Text>
                  <View style={styles.extractedTextContainer}>
                    <ExpandableText
                      text={document.extractedText}
                      variant="body2"
                      numberOfLines={4}
                      style={styles.extractedText}
                    />
                    {document.ocrData?.confidence && (
                      <Text style={styles.ocrConfidence}>
                        OCR Confidence: {Math.round(document.ocrData.confidence * 100)}%
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.metadataContainer}>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Created</Text>
                  <Text style={styles.metadataValue}>
                    {document.createdAt.toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.metadataRow}>
                  <Text style={styles.metadataLabel}>Type</Text>
                  <Text style={styles.metadataValue}>{document.type.toUpperCase()}</Text>
                </View>
                {document.fileSize && (
                  <View style={styles.metadataRow}>
                    <Text style={styles.metadataLabel}>Size</Text>
                    <Text style={styles.metadataValue}>
                      {document.fileSize < 1024 * 1024 
                        ? `${(document.fileSize / 1024).toFixed(1)}KB`
                        : `${(document.fileSize / (1024 * 1024)).toFixed(1)}MB`
                      }
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={handleDelete}
              style={styles.deleteButton}
            >
              <Trash2 size={20} color="#FF3B30" />
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  closeButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF'
  },
  actionButton: {
    padding: 8
  },
  content: {
    flex: 1
  },
  form: {
    backgroundColor: '#1C1C1E',
    marginTop: 16,
    paddingHorizontal: 16
  },
  fieldContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E'
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8E8E93',
    marginBottom: 8
  },
  value: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 22
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2C2C2E'
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  categorySelector: {
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#2C2C2E',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  categorySelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8
  },
  categoryText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF'
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93'
  },
  categoryDropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    maxHeight: 200
  },
  categoryScrollView: {
    maxHeight: 200
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A3C'
  },
  categoryOptionText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    marginLeft: 8
  },
  categoryDisplay: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  noCategoryText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    fontStyle: 'italic'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#007AFF'
  },
  metadataContainer: {
    paddingTop: 16
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  metadataLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93'
  },
  metadataValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#FFFFFF'
  },
  footer: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E'
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5'
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FF3B30',
    marginLeft: 8
  },
  expandableText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#FFFFFF',
    lineHeight: 22
  },
  extractedTextContainer: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3A3C',
    marginTop: 8
  },
  extractedText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter-Regular'
  },
  ocrConfidence: {
    color: '#8E8E93',
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 8
  }
});