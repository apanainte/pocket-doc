import React, { useState, useCallback, useMemo, useEffect } from 'react';
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
import { Camera, Upload, FileText, Edit2, Save, X } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { generateMetadata } from '@/services/aiMetadata.simplified';
import { databaseService } from '@/services/database';
import { Document } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutButton } from '@/components/ui/RevolutButton';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { useTheme } from '@/contexts/ThemeContext';
import { validateFile, FileInfo } from '@/services/fileValidation';
import { trackFileUpload, trackUIInteraction, completeOperation, startOperation } from '@/services/performanceMonitoring';
import { captureError, addBreadcrumb } from '@/services/monitoring';
import UploadBottomSheet from '@/components/UploadBottomSheet';
import { useRouter } from 'expo-router';
import SearchBar from '@/components/SearchBar';

const { width } = Dimensions.get('window');

export default function UploadScreen() {
  const { theme, spacing, borderRadius, iconSizes } = useTheme();
  const router = useRouter();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  // Show bottom sheet when upload screen is accessed directly or after successful upload
  useEffect(() => {
    console.log('Upload screen useEffect - selectedFile:', selectedFile ? 'exists' : 'null');
    if (!selectedFile) {
      console.log('Setting showBottomSheet to true');
      setShowBottomSheet(true);
    }
  }, [selectedFile]);

  // Debug logging for showBottomSheet changes
  useEffect(() => {
    console.log('showBottomSheet changed to:', showBottomSheet);
  }, [showBottomSheet]);


  const processFile = useCallback(async (fileInfo: FileInfo, type: 'image' | 'pdf') => {
    setIsUploading(true);
    setValidationErrors([]);
    setValidationWarnings([]);

    try {
      // Validate file
      const isValid = await validateSelectedFile(fileInfo);
      if (!isValid) {
        setIsUploading(false);
        return;
      }

      // Generate metadata first
      setProcessingAI(true);
      const generatedMetadata = await generateMetadata(fileInfo.uri, type);
      
      // Set selected file with extracted text and metadata
      setSelectedFile({
        uri: fileInfo.uri,
        type,
        name: fileInfo.name,
        size: fileInfo.size,
        extractedText: generatedMetadata.extractedText,
        ocrConfidence: generatedMetadata.confidence,
        processingTime: generatedMetadata.processingTime,
      });
      
      setMetadata(generatedMetadata);
      setEditedTitle(generatedMetadata.title);
      setEditedDescription(generatedMetadata.description);
      setEditedTags(generatedMetadata.tags.join(', '));
      
    } catch (error) {
      console.error('Error processing file:', error);
      Alert.alert('Error', 'Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
      setProcessingAI(false);
    }
  }, [validateSelectedFile]);

  const handleCloseBottomSheet = useCallback(() => {
    console.log('Closing bottom sheet');
    setShowBottomSheet(false);
    // Navigate back to library only if no file was selected and user explicitly closed
    if (!selectedFile) {
      console.log('No file selected, navigating back to library');
      router.push('/(tabs)/');
    }
  }, [selectedFile, router]);

  const handleFileSelected = useCallback(async (fileInfo: { uri: string; type: 'image' | 'pdf'; name: string; mimeType?: string }) => {
    try {
      // Get file size from the URI
      const response = await fetch(fileInfo.uri);
      const blob = await response.blob();
      
      const fullFileInfo: FileInfo = {
        uri: fileInfo.uri,
        name: fileInfo.name,
        type: fileInfo.mimeType || (fileInfo.type === 'image' ? 'image/jpeg' : 'application/pdf'),
        size: blob.size,
      };
      
      await processFile(fullFileInfo, fileInfo.type);
    } catch (error) {
      console.error('Error processing selected file:', error);
      Alert.alert('Error', 'Failed to process selected file. Please try again.');
    }
  }, [processFile]);

  const validateSelectedFile = useCallback(async (fileInfo: FileInfo): Promise<boolean> => {
    try {
      addBreadcrumb(`Starting file validation for: ${fileInfo.name}`, 'upload');
      
      const validationResult = await validateFile(fileInfo);
      
      setValidationErrors(validationResult.errors);
      setValidationWarnings(validationResult.warnings);
      
      if (!validationResult.isValid) {
        Alert.alert(
          'File Validation Failed',
          `The selected file has the following issues:\n\n${validationResult.errors.join('\n')}`,
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }
      
      if (validationResult.warnings.length > 0) {
        Alert.alert(
          'File Validation Warnings',
          `The selected file has some warnings:\n\n${validationResult.warnings.join('\n')}\n\nDo you want to continue?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => {} },
            { text: 'Continue', style: 'default', onPress: () => {} }
          ]
        );
      }
      
      addBreadcrumb(`File validation completed successfully for: ${fileInfo.name}`, 'upload');
      return true;
    } catch (error) {
      captureError(error as Error, {
        tags: { operation: 'file_validation', screen: 'upload' },
        extra: { fileName: fileInfo.name, fileSize: fileInfo.size },
      });
      
      Alert.alert('Validation Error', 'Failed to validate file. Please try again.');
      return false;
    }
  }, []);

  const pickImage = useCallback(async () => {
    const operationId = trackUIInteraction('pick_image_button', 'upload_screen');
    
    try {
      // Complete UI interaction immediately after button press
      completeOperation(operationId, true, { action: 'button_pressed' });
      
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
        
        // Start file processing operation separately
        const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'image' });
        
        // Create file info for validation
        const fileInfo: FileInfo = {
          name: asset.fileName || 'image.jpg',
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          uri: asset.uri,
          lastModified: Date.now(),
        };
        
        // Validate file before processing
        const isValid = await validateSelectedFile(fileInfo);
        if (!isValid) {
          completeOperation(fileProcessingId, false, { reason: 'validation_failed' });
          return;
        }
        
        setSelectedFile({
          uri: asset.uri,
          type: 'image',
          name: asset.fileName || 'image.jpg',
          size: asset.fileSize
        });
        
        await processWithAI(asset.uri, 'image');
        completeOperation(fileProcessingId, true, { fileSize: asset.fileSize });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      captureError(error as Error, {
        tags: { operation: 'pick_image', screen: 'upload' },
      });
      Alert.alert('Error', 'Failed to pick image');
    }
  }, [validateSelectedFile]);

  const takePhoto = useCallback(async () => {
    const operationId = trackUIInteraction('take_photo', 'upload_screen');
    
    // Apple HIG: Clear permission request with context
    Alert.alert(
      'Camera Access',
      'Pocket Doc needs camera access to capture document photos for your personal library.',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => completeOperation(operationId, false, { reason: 'user_canceled' }) },
        { 
          text: 'Allow', 
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              
              if (!permissionResult.granted) {
                Alert.alert('Permission required', 'Camera permission is needed to take photos');
                completeOperation(operationId, false, { reason: 'permission_denied' });
                return;
              }
              
              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              // Complete UI interaction here - user has taken photo
              if (!result.canceled && result.assets[0]) {
                completeOperation(operationId, true, { action: 'photo_taken' });
                
                const asset = result.assets[0];
                
                // Start file processing operation separately
                const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'image' });
                
                // Create file info for validation
                const fileInfo: FileInfo = {
                  name: asset.fileName || 'photo.jpg',
                  size: asset.fileSize || 0,
                  type: 'image/jpeg',
                  uri: asset.uri,
                  lastModified: Date.now(),
                };
                
                // Validate file before processing
                const isValid = await validateSelectedFile(fileInfo);
                if (!isValid) {
                  completeOperation(fileProcessingId, false, { reason: 'validation_failed' });
                  return;
                }
                
                setSelectedFile({
                  uri: asset.uri,
                  type: 'image',
                  name: asset.fileName || 'photo.jpg',
                  size: asset.fileSize
                });
                
                await processWithAI(asset.uri, 'image');
                completeOperation(fileProcessingId, true, { fileSize: asset.fileSize });
              } else {
                completeOperation(operationId, false, { reason: 'user_canceled' });
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              captureError(error as Error, {
                tags: { operation: 'take_photo', screen: 'upload' },
              });
              Alert.alert('Error', 'Failed to take photo');
              completeOperation(operationId, false, { reason: 'error' });
            }
          }
        }
      ]
    );
  }, [validateSelectedFile]);

  const pickDocument = useCallback(async () => {
    const operationId = trackUIInteraction('pick_document', 'upload_screen');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      // Complete UI interaction here - user has selected document
      if (!result.canceled && result.assets[0]) {
        completeOperation(operationId, true, { action: 'document_selected' });
        
        const asset = result.assets[0];
        
        // Start file processing operation separately
        const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'pdf' });
        
        // Create file info for validation
        const fileInfo: FileInfo = {
          name: asset.name,
          size: asset.size || 0,
          type: 'application/pdf',
          uri: asset.uri,
          lastModified: Date.now(),
        };
        
        // Validate file before processing
        const isValid = await validateSelectedFile(fileInfo);
        if (!isValid) {
          completeOperation(fileProcessingId, false, { reason: 'validation_failed' });
          return;
        }
        
        setSelectedFile({
          uri: asset.uri,
          type: 'pdf',
          name: asset.name,
          size: asset.size
        });
        
        await processWithAI(asset.uri, 'pdf');
        completeOperation(fileProcessingId, true, { fileSize: asset.size });
      } else {
        completeOperation(operationId, false, { reason: 'user_canceled' });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      captureError(error as Error, {
        tags: { operation: 'pick_document', screen: 'upload' },
      });
      Alert.alert('Error', 'Failed to pick document');
      completeOperation(operationId, false, { reason: 'error' });
    }
  }, [validateSelectedFile]);

  const processWithAI = useCallback(async (uri: string, type: 'image' | 'pdf') => {
    const operationId = startOperation('ai_metadata_generation', 'ai', { model: 'enhanced_metadata' });
    setProcessingAI(true);
    
    try {
      addBreadcrumb(`Starting AI processing for ${type} file`, 'ai_processing');
      
      // Use the simplified metadata generation with direct OpenAI API calls
      const result = await generateMetadata(uri, type);
      
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
      
      completeOperation(operationId, true, {
        textLength: result.extractedText?.length || 0,
        confidence: result.confidence,
        processingTime: result.processingTime,
        fileType: type,
      });
      
      addBreadcrumb(`AI processing completed successfully for ${type} file`, 'ai_processing');
      
    } catch (error) {
      console.error('Error processing with AI:', error);
      captureError(error as Error, {
        tags: { operation: 'ai_processing', screen: 'upload', fileType: type },
        extra: { fileUri: uri },
      });
      Alert.alert('Error', 'Failed to generate metadata');
      completeOperation(operationId, false, { reason: 'ai_processing_failed' });
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

    const operationId = startOperation('document_save', 'database', {
      fileType: selectedFile.type,
      fileSize: selectedFile.size,
      hasOCR: !!selectedFile.extractedText,
    });

    try {
      addBreadcrumb(`Starting document save for: ${selectedFile.name}`, 'document_save');
      
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
      setValidationErrors([]);
      setValidationWarnings([]);
      
      completeOperation(operationId, true, {
        documentId: newDocument.title,
        tagsCount: tags.length,
        extractedTextLength: selectedFile.extractedText?.length || 0,
      });
      
      addBreadcrumb(`Document saved successfully: ${selectedFile.name}`, 'document_save');
      
      // Show success message and prepare for next upload
      Alert.alert('Success', 'Document uploaded successfully with OCR!', [
        {
          text: 'OK',
          onPress: () => {
            // Ensure bottom sheet is shown for next upload
            setShowBottomSheet(true);
          }
        }
      ]);
    } catch (error) {
      console.error('Error saving document:', error);
      captureError(error as Error, {
        tags: { operation: 'document_save', screen: 'upload' },
        extra: { 
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        },
      });
      Alert.alert('Error', 'Failed to save document');
      completeOperation(operationId, false, { reason: 'database_error' });
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, metadata, editedTitle, editedDescription, editedTags]);

  const handleCancel = useCallback(() => {
    console.log('Canceling upload and resetting all states');
    setSelectedFile(null);
    setMetadata(null);
    setIsEditing(false);
    setEditedTitle('');
    setEditedDescription('');
    setEditedTags('');
    setValidationErrors([]);
    setValidationWarnings([]);
    setShowBottomSheet(true);
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
          accessible={true}
          accessibilityLabel="Upload screen content"
        >
          {selectedFile ? (
            <>
              {renderFilePreview()}
              {renderMetadataForm()}
            </>
          ) : isUploading ? (
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingVertical: spacing.xxxl || spacing.xl,
            }}>
              <RevolutText 
                variant="h3" 
                color={theme.colors.textSecondary} 
                style={{ textAlign: 'center' }}
                accessible={true}
                accessibilityLabel="Processing upload"
              >
                Processing your upload...
              </RevolutText>
            </View>
          ) : (
            <TouchableOpacity 
              style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                paddingVertical: spacing.xxxl || spacing.xl,
              }}
              onPress={() => {
                console.log('Manual trigger: setting showBottomSheet to true');
                setShowBottomSheet(true);
              }}
            >
              <RevolutText 
                variant="h3" 
                color={theme.colors.textSecondary} 
                style={{ textAlign: 'center' }}
                accessible={true}
                accessibilityLabel="Upload ready"
              >
                Ready to upload
              </RevolutText>
              <RevolutText 
                variant="body2" 
                color={theme.colors.textTertiary} 
                style={{ textAlign: 'center', marginTop: spacing.sm }}
                accessible={true}
                accessibilityLabel="Tap to start upload"
              >
                Tap to start upload
              </RevolutText>
            </TouchableOpacity>
          )}
        </ScrollView>

        <UploadBottomSheet
          visible={showBottomSheet}
          onClose={handleCloseBottomSheet}
          onFileSelected={handleFileSelected}
        />
      </SafeAreaView>
    </View>
  );
}

