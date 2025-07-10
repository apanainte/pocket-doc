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
  SafeAreaView
} from 'react-native';
import { Document } from '@/types/document';
import { X, CreditCard as Edit2, Save, FileText, Image as ImageIcon, Trash2 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface DocumentDetailModalProps {
  document: Document | null;
  visible: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Document>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentDetailModal({ 
  document, 
  visible, 
  onClose, 
  onUpdate, 
  onDelete 
}: DocumentDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (document) {
      setEditedTitle(document.title);
      setEditedDescription(document.description);
      setEditedTags(document.tags.join(', '));
    }
  }, [document]);

  const handleSave = async () => {
    if (!document) return;

    setLoading(true);
    try {
      const tags = editedTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      await onUpdate(document.id, {
        title: editedTitle,
        description: editedDescription,
        tags
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

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
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
          <View style={styles.thumbnailContainer}>
            {document.thumbnail ? (
              <Image 
                source={{ uri: document.thumbnail }} 
                style={styles.thumbnail}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderThumbnail}>
                {document.type === 'pdf' ? (
                  <FileText size={48} color="#8E8E93" />
                ) : (
                  <ImageIcon size={48} color="#8E8E93" />
                )}
              </View>
            )}
          </View>

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
                <Text style={styles.value}>{document.description}</Text>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: 'Inter-SemiBold',
    color: '#1C1C1E',
  },
  actionButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  thumbnailContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    backgroundColor: '#ffffff',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  fieldContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  label: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8E8E93',
    marginBottom: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1C1C1E',
    lineHeight: 22,
  },
  input: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#007AFF',
  },
  metadataContainer: {
    paddingTop: 16,
  },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  metadataLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
  },
  metadataValue: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1C1C1E',
  },
  footer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FFE5E5',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#FF3B30',
    marginLeft: 8,
  },
});