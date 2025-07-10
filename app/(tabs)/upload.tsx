import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Camera, Upload, FileText, CreditCard as Edit2, Save, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useDocuments } from '@/hooks/useDocuments';
import { generateMetadata } from '@/services/aiMetadata';
import { Document } from '@/types/document';

const { width } = Dimensions.get('window');

export default function UploadScreen() {
  const { addDocument, loading } = useDocuments();
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: 'image' | 'pdf';
    name: string;
    size?: number;
  } | null>(null);
  const [metadata, setMetadata] = useState<{
    title: string;
    description: string;
    tags: string[];
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedTags, setEditedTags] = useState('');
  const [processingAI, setProcessingAI] = useState(false);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access photo library is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: 'image',
        name: asset.fileName || 'image.jpg',
        size: asset.fileSize
      });
      await processWithAI(asset.uri, 'image');
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert('Permission required', 'Permission to access camera is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        type: 'image',
        name: 'photo.jpg',
        size: asset.fileSize
      });
      await processWithAI(asset.uri, 'image');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          type: 'pdf',
          name: asset.name,
          size: asset.size
        });
        await processWithAI(asset.uri, 'pdf');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const processWithAI = async (uri: string, type: 'image' | 'pdf') => {
    setProcessingAI(true);
    try {
      const generatedMetadata = await generateMetadata(uri, type);
      setMetadata(generatedMetadata);
      setEditedTitle(generatedMetadata.title);
      setEditedDescription(generatedMetadata.description);
      setEditedTags(generatedMetadata.tags.join(', '));
    } catch (error) {
      Alert.alert('Error', 'Failed to generate metadata');
    } finally {
      setProcessingAI(false);
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !metadata) return;

    try {
      const tags = editedTags.split(',').map(tag => tag.trim()).filter(tag => tag);
      
      const newDocument: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: editedTitle,
        description: editedDescription,
        tags,
        type: selectedFile.type,
        uri: selectedFile.uri,
        thumbnail: selectedFile.type === 'image' ? selectedFile.uri : undefined,
        fileSize: selectedFile.size
      };

      await addDocument(newDocument);
      
      // Reset form
      setSelectedFile(null);
      setMetadata(null);
      setIsEditing(false);
      setEditedTitle('');
      setEditedDescription('');
      setEditedTags('');
      
      Alert.alert('Success', 'Document uploaded successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save document');
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setMetadata(null);
    setIsEditing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Upload Document</Text>
        {selectedFile && (
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <X size={24} color="#FF3B30" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!selectedFile ? (
          <View style={styles.uploadOptionsContainer}>
            <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
              <Camera size={32} color="#007AFF" />
              <Text style={styles.uploadOptionTitle}>Take Photo</Text>
              <Text style={styles.uploadOptionDescription}>
                Capture a document with your camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
              <Upload size={32} color="#007AFF" />
              <Text style={styles.uploadOptionTitle}>Upload Image</Text>
              <Text style={styles.uploadOptionDescription}>
                Choose an image from your library
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
              <FileText size={32} color="#007AFF" />
              <Text style={styles.uploadOptionTitle}>Upload PDF</Text>
              <Text style={styles.uploadOptionDescription}>
                Choose a PDF document
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <View style={styles.filePreview}>
              {selectedFile.type === 'image' ? (
                <Image 
                  source={{ uri: selectedFile.uri }} 
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.pdfPreview}>
                  <FileText size={48} color="#8E8E93" />
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                </View>
              )}
            </View>

            {processingAI ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.processingText}>
                  Analyzing document with AI...
                </Text>
              </View>
            ) : metadata && (
              <View style={styles.metadataContainer}>
                <View style={styles.metadataHeader}>
                  <Text style={styles.metadataTitle}>Generated Metadata</Text>
                  <TouchableOpacity 
                    onPress={() => setIsEditing(!isEditing)}
                    style={styles.editButton}
                  >
                    <Edit2 size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Title</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedTitle}
                      onChangeText={setEditedTitle}
                      placeholder="Enter document title"
                    />
                  ) : (
                    <Text style={styles.fieldValue}>{metadata.title}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Description</Text>
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
                    <Text style={styles.fieldValue}>{metadata.description}</Text>
                  )}
                </View>

                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>Tags</Text>
                  {isEditing ? (
                    <TextInput
                      style={styles.input}
                      value={editedTags}
                      onChangeText={setEditedTags}
                      placeholder="Enter tags separated by commas"
                    />
                  ) : (
                    <View style={styles.tagsContainer}>
                      {metadata.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity 
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Save size={20} color="#ffffff" />
                      <Text style={styles.saveButtonText}>Save Document</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
  cancelButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  uploadOptionsContainer: {
    padding: 16,
  },
  uploadOption: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  uploadOptionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1C1C1E',
    marginTop: 12,
    marginBottom: 4,
  },
  uploadOptionDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#8E8E93',
    textAlign: 'center',
  },
  previewContainer: {
    padding: 16,
  },
  filePreview: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: width - 64,
    height: 200,
    borderRadius: 8,
  },
  pdfPreview: {
    alignItems: 'center',
    padding: 32,
  },
  fileName: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1C1C1E',
    marginTop: 8,
    textAlign: 'center',
  },
  processingContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  processingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#1C1C1E',
    marginTop: 16,
    textAlign: 'center',
  },
  metadataContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  metadataHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  metadataTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#1C1C1E',
  },
  editButton: {
    padding: 8,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#8E8E93',
    marginBottom: 8,
  },
  fieldValue: {
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#8E8E93',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
    marginLeft: 8,
  },
});