import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Upload, FileText, Edit2, Save, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { generateMetadata, generateEnhancedMetadata } from '@/services/aiMetadata';
import { databaseService } from '@/services/database';
import { Document } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutButton } from '@/components/ui/RevolutButton';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

export default function UploadScreen() {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{
    uri: string;
    type: 'image' | 'pdf';
    name: string;
    size?: number;
    extractedText?: string;
    ocrConfidence?: number;
    processingTime?: number;
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

  const pickImage = useCallback(async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        Alert.alert('Permission required', 'Photo library access is needed to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
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
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    // Apple HIG: Clear permission request with context
    Alert.alert(
      'Camera Access',
      'Pocket Doc needs camera access to capture document photos for your personal library.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Allow', 
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              
              if (!permissionResult.granted) {
                Alert.alert('Permission required', 'Camera permission is needed to take photos');
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
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo');
            }
          }
        }
      ]
    );
  }, []);

  const pickDocument = useCallback(async () => {
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
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  }, []);

  const processWithAI = useCallback(async (uri: string, type: 'image' | 'pdf') => {
    setProcessingAI(true);
    try {
      // Use the enhanced metadata generation with OCR
      const result = await generateEnhancedMetadata(uri, type);
      
      const generatedMetadata = {
        title: result.title,
        description: result.description,
        tags: result.tags
      };
      
      setMetadata(generatedMetadata);
      setEditedTitle(result.title);
      setEditedDescription(result.description);
      setEditedTags(result.tags.join(', '));
      
      // Store OCR data for later use
      if (result.extractedText) {
        setSelectedFile(prev => prev ? {
          ...prev,
          extractedText: result.extractedText,
          ocrConfidence: result.confidence,
          processingTime: result.processingTime
        } : null);
      }
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      Alert.alert('Error', 'Failed to generate metadata');
    } finally {
      setProcessingAI(false);
    }
  }, []);

  // Memoized upload options for performance - moved after function definitions
  const uploadOptions = useMemo(() => [
    {
      id: 'camera',
      title: 'Take Photo',
      icon: Camera,
      color: theme.colors.success,
      onPress: takePhoto,
      accessibilityLabel: 'Take photo button',
      accessibilityHint: 'Opens camera to capture a document photo',
    },
    {
      id: 'upload',
      title: 'Upload Image',
      icon: Upload,
      color: theme.colors.primary,
      onPress: pickImage,
      accessibilityLabel: 'Upload image button',
      accessibilityHint: 'Select an image from your photo library',
    },
    {
      id: 'pdf',
      title: 'Upload PDF',
      icon: FileText,
      color: theme.colors.warning,
      onPress: pickDocument,
      accessibilityLabel: 'Upload PDF button',
      accessibilityHint: 'Select a PDF document from your files',
    },
  ], [theme.colors, takePhoto, pickImage, pickDocument]);

  const handleSave = useCallback(async () => {
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
        fileSize: selectedFile.size,
        extractedText: selectedFile.extractedText,
        ocrData: selectedFile.ocrConfidence ? {
          text: selectedFile.extractedText || '',
          confidence: selectedFile.ocrConfidence,
          blocks: [],
          processingTime: selectedFile.processingTime || 0,
          imageSize: { width: 0, height: 0 }
        } : undefined
      };

      setIsUploading(true);
      await databaseService.addDocument(newDocument);
      
      // Reset form
      setSelectedFile(null);
      setMetadata(null);
      setIsEditing(false);
      setEditedTitle('');
      setEditedDescription('');
      setEditedTags('');
      
      Alert.alert('Success', 'Document uploaded successfully with OCR!');
    } catch (error) {
      console.error('Error saving document:', error);
      Alert.alert('Error', 'Failed to save document');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, metadata, editedTitle, editedDescription, editedTags]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setMetadata(null);
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
    setEditedTags('');
  }, []);

  const toggleEditing = useCallback(() => {
    setIsEditing(!isEditing);
  }, [isEditing]);

  const renderUploadOptions = () => (
    <View style={{
      gap: spacing.lg,
      marginTop: spacing.xl,
    }}>
      {uploadOptions.map((option) => (
        <RevolutCard 
          key={option.id}
          shadow="medium" 
          style={{ marginHorizontal: spacing.lg }}
        >
          <TouchableOpacity
            onPress={option.onPress}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: spacing.lg,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={option.accessibilityLabel}
            accessibilityHint={option.accessibilityHint}
          >
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: option.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing.lg,
            }}>
              <option.icon size={iconSizes.xl} color={option.color} />
            </View>
            <View style={{ flex: 1 }}>
              <RevolutText variant="h6" style={{ marginBottom: spacing.xs }}>
                {option.title}
              </RevolutText>
              <RevolutText variant="body2" color={theme.colors.textSecondary}>
                {option.id === 'camera' ? 'Capture documents with your camera' :
                 option.id === 'upload' ? 'Select from your photo library' :
                 'Choose PDF files from your device'}
              </RevolutText>
            </View>
          </TouchableOpacity>
        </RevolutCard>
      ))}
    </View>
  );

  const renderFilePreview = () => {
    if (!selectedFile) return null;

    return (
      <RevolutCard shadow="medium" style={{ margin: spacing.lg }}>
        <View style={{
          alignItems: 'center',
          paddingVertical: spacing.lg,
        }}>
          {selectedFile.type === 'image' ? (
            <Image
              source={{ uri: selectedFile.uri }}
              style={{
                width: width - 80,
                height: 200,
                borderRadius: borderRadius.lg,
                marginBottom: spacing.md,
              }}
              resizeMode="cover"
              accessible={true}
              accessibilityLabel={`Preview of selected image: ${selectedFile.name}`}
            />
          ) : (
            <View style={{
              width: width - 80,
              height: 200,
              backgroundColor: theme.colors.surface,
              borderRadius: borderRadius.lg,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <FileText size={iconSizes.xxl} color={theme.colors.textSecondary} />
              <RevolutText 
                variant="h6" 
                color={theme.colors.textSecondary}
                style={{ marginTop: spacing.md }}
              >
                PDF Document
              </RevolutText>
            </View>
          )}
          
          <RevolutText variant="subtitle1" style={{ marginBottom: spacing.xs }}>
            {selectedFile.name}
          </RevolutText>
          
          {selectedFile.size && (
            <RevolutText variant="caption" color={theme.colors.textSecondary}>
              {selectedFile.size < 1024 * 1024 
                ? `${(selectedFile.size / 1024).toFixed(1)}KB`
                : `${(selectedFile.size / (1024 * 1024)).toFixed(1)}MB`}
            </RevolutText>
          )}
          
          {selectedFile.extractedText && (
            <View style={{
              marginTop: spacing.sm,
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              backgroundColor: theme.colors.success + '20',
              borderRadius: borderRadius.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <RevolutText variant="caption" color={theme.colors.success} style={{ fontWeight: '600' }}>
                ✓ Text Extracted{selectedFile.ocrConfidence ? ` (${Math.round(selectedFile.ocrConfidence * 100)}% confidence)` : ''}
              </RevolutText>
            </View>
          )}
          
          <TouchableOpacity
            onPress={handleCancel}
            style={{
              position: 'absolute',
              top: spacing.md,
              right: spacing.md,
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: theme.colors.error + '20',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Remove selected file"
            accessibilityHint="Tap to remove the selected file and start over"
          >
            <X size={iconSizes.md} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </RevolutCard>
    );
  };

  const renderMetadataForm = () => {
    if (!metadata) return null;

    return (
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
        {processingAI ? (
          <RevolutCard shadow="medium">
            <View style={{
              alignItems: 'center',
              paddingVertical: spacing.xl,
            }}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <RevolutText 
                variant="h5" 
                color={theme.colors.textSecondary}
                style={{ marginTop: spacing.md }}
              >
                Analyzing document with AI...
              </RevolutText>
              <RevolutText 
                variant="body2" 
                color={theme.colors.textTertiary}
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                Please wait while we extract metadata from your document
              </RevolutText>
            </View>
          </RevolutCard>
        ) : (
          <RevolutCard shadow="medium">
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: spacing.lg,
            }}>
              <RevolutText variant="h5">
                Generated Metadata
              </RevolutText>
              <TouchableOpacity 
                onPress={toggleEditing}
                style={{
                  padding: spacing.sm,
                  backgroundColor: theme.colors.primary + '20',
                  borderRadius: borderRadius.md,
                }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={isEditing ? "Stop editing metadata" : "Edit metadata"}
                accessibilityHint={isEditing ? "Tap to stop editing the document metadata" : "Tap to edit the document metadata"}
              >
                <Edit2 size={iconSizes.md} color={theme.colors.primary} />
              </TouchableOpacity>
            </View>

            {isEditing ? (
              <>
                <RevolutInput
                  label="Title"
                  value={editedTitle}
                  onChangeText={setEditedTitle}
                  placeholder="Enter document title"
                  accessibilityLabel="Document title input"
                  accessibilityHint="Enter a title for your document"
                />
                
                <RevolutInput
                  label="Description"
                  value={editedDescription}
                  onChangeText={setEditedDescription}
                  placeholder="Enter document description"
                  multiline
                  numberOfLines={4}
                  style={{ height: 100 }}
                  accessibilityLabel="Document description input"
                  accessibilityHint="Enter a description for your document"
                />
                
                <RevolutInput
                  label="Tags (comma separated)"
                  value={editedTags}
                  onChangeText={setEditedTags}
                  placeholder="Enter tags separated by commas"
                  accessibilityLabel="Document tags input"
                  accessibilityHint="Enter tags separated by commas to categorize your document"
                />
              </>
            ) : (
              <>
                <View style={{ marginBottom: spacing.lg }}>
                  <RevolutText variant="label" color={theme.colors.textSecondary}>
                    TITLE
                  </RevolutText>
                  <RevolutText variant="body1" style={{ marginTop: spacing.xs }}>
                    {editedTitle}
                  </RevolutText>
                </View>
                
                <View style={{ marginBottom: spacing.lg }}>
                  <RevolutText variant="label" color={theme.colors.textSecondary}>
                    DESCRIPTION
                  </RevolutText>
                  <RevolutText variant="body1" style={{ marginTop: spacing.xs }}>
                    {editedDescription}
                  </RevolutText>
                </View>
                
                <View style={{ marginBottom: spacing.lg }}>
                  <RevolutText variant="label" color={theme.colors.textSecondary}>
                    TAGS
                  </RevolutText>
                  <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    marginTop: spacing.xs,
                    gap: spacing.xs,
                  }}>
                    {editedTags.split(',').map((tag, index) => {
                      const trimmedTag = tag.trim();
                      if (!trimmedTag) return null;
                      
                      return (
                        <View
                          key={index}
                          style={{
                            backgroundColor: theme.colors.primary + '20',
                            paddingHorizontal: spacing.xs,
                            paddingVertical: 2,
                            borderRadius: borderRadius.xs,
                          }}
                        >
                          <RevolutText variant="caption" color={theme.colors.primary}>
                            {trimmedTag}
                          </RevolutText>
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            )}

            <RevolutButton
              title={isUploading ? "Saving..." : "Save Document"}
              onPress={handleSave}
              variant="primary"
              fullWidth
              loading={isUploading}
              disabled={isUploading || !editedTitle.trim()}
              style={{ marginTop: spacing.lg }}
            />
          </RevolutCard>
        )}
      </View>
    );
  };

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
              Upload Document
            </RevolutText>
            <RevolutText 
              variant="subtitle1" 
              color="rgba(255, 255, 255, 0.9)"
              style={{ marginTop: spacing.sm }}
            >
              Add photos, images, or PDF files to your secure library
            </RevolutText>
          </LinearGradient>

          <ScrollView 
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            accessible={true}
            accessibilityLabel="Upload screen content"
          >
            {!selectedFile ? renderUploadOptions() : (
              <>
                {renderFilePreview()}
                {renderMetadataForm()}
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

