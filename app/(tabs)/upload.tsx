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
import { Camera, Upload, FileText, Edit2, Save, X, Folder, ChevronDown } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// REMOVED: AI metadata generation - using manual entry only
import { databaseService } from '@/services/database';
import { Document, Category } from '@/types/document';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutButton } from '@/components/ui/RevolutButton';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { ExpandableText } from '@/components/ui/ExpandableText';
import { useTheme } from '@/contexts/ThemeContext';
import { validateFile, FileInfo } from '@/services/fileValidation';
import { trackFileUpload, trackUIInteraction, completeOperation, startOperation } from '@/services/performanceMonitoring';
import { captureError, addBreadcrumb } from '@/services/monitoring';
import { documentScannerService } from '@/services/DocumentScannerService';
import { useFocusEffect } from '@react-navigation/native';
import { ocrService } from '@/services/ocrService';
import { fileStorageService } from '@/services/fileStorage';

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

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Load categories when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCategories();
    }, [])
  );

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const categoriesData = await databaseService.getAllCategories();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const validateSelectedFile = useCallback(async (fileInfo: FileInfo): Promise<boolean> => {
    try {
      addBreadcrumb(`Starting file validation for: ${fileInfo.name}`, 'upload');
      
      const validationResult = await validateFile(fileInfo);
      
      // Validation errors handled by validation service
      
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

  const processDocument = useCallback(async (uri: string, type: 'image' | 'pdf') => {
    const operationId = startOperation('document_processing', 'upload');
    setProcessingAI(true);
    
    try {
      let extractedText = '';
      let ocrConfidence = 0;
      let processingTime = 0;
      
      // Only do OCR for images (PDFs would need different handling)
      if (type === 'image') {
        try {
          const startTime = Date.now();
          const ocrResult = await ocrService.recognizeText(uri, {
            recognitionLevel: 'accurate',
            minimumConfidence: 0.5
          });
          processingTime = Date.now() - startTime;
          
          extractedText = ocrResult.text || '';
          ocrConfidence = ocrResult.confidence || 0;
          
          console.log(`OCR completed: "${extractedText.substring(0, 50)}...", confidence: ${ocrConfidence.toFixed(2)}`);
        } catch (error) {
          console.warn('OCR failed:', error);
          // Show user-friendly message that OCR failed
          Alert.alert(
            'Text Recognition Failed', 
            'Unable to extract text from this image. You can still add a title and description manually.',
            [{ text: 'OK' }]
          );
        }
      }
      
      // Create empty metadata for manual entry
      const emptyMetadata = {
        title: '',
        description: '',
        tags: []
      };
      
      setMetadata(emptyMetadata);
      setEditedTitle('');
      setEditedDescription('');
      setEditedTags('');
      setIsEditing(true); // Immediately enter editing mode for user input
      
      // Store OCR data if available
      setSelectedFile(prev => prev ? {
        ...prev,
        extractedText,
        ocrConfidence,
        processingTime
      } : null);
      
      completeOperation(operationId, true, {
        textLength: extractedText.length,
        confidence: ocrConfidence,
        processingTime,
        fileType: type,
      });
      
    } catch (error) {
      console.error('Error processing document:', error);
      Alert.alert('Error', 'Failed to process document');
      completeOperation(operationId, false, { reason: 'processing_failed' });
    } finally {
      setProcessingAI(false);
    }
  }, []);

  const pickImage = useCallback(async () => {
    const operationId = trackUIInteraction('pick_image_button', 'upload_screen');
    
    try {
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
        
        const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'image' });
        
        const fileInfo: FileInfo = {
          name: asset.fileName || 'image.jpg',
          size: asset.fileSize || 0,
          type: 'image/jpeg',
          uri: asset.uri,
          lastModified: Date.now(),
        };
        
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
        
        await processDocument(asset.uri, 'image');
        completeOperation(fileProcessingId, true, { fileSize: asset.fileSize });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
      completeOperation(operationId, false, { reason: 'error' });
    }
  }, [validateSelectedFile, processDocument]);

  const takePhoto = useCallback(async () => {
    const operationId = trackUIInteraction('take_photo_button', 'upload_screen');
    
    Alert.alert(
      'Take Photo',
      'Choose how you want to capture your document',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Camera', 
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              
              if (!permissionResult.granted) {
                Alert.alert('Permission required', 'Camera access is needed to take photos');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                const asset = result.assets[0];
                
                const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'image' });
                
                const fileInfo: FileInfo = {
                  name: 'photo.jpg',
                  size: asset.fileSize || 0,
                  type: 'image/jpeg',
                  uri: asset.uri,
                  lastModified: Date.now(),
                };
                
                const isValid = await validateSelectedFile(fileInfo);
                if (!isValid) {
                  completeOperation(fileProcessingId, false, { reason: 'validation_failed' });
                  return;
                }
                
                setSelectedFile({
                  uri: asset.uri,
                  type: 'image',
                  name: 'photo.jpg',
                  size: asset.fileSize
                });
                
                await processDocument(asset.uri, 'image');
                completeOperation(fileProcessingId, true, { fileSize: asset.fileSize });
                completeOperation(operationId, true, { method: 'camera' });
              }
            } catch (error) {
              console.error('Error taking photo:', error);
              Alert.alert('Error', 'Failed to take photo');
              completeOperation(operationId, false, { reason: 'error' });
            }
          }
        }
      ]
    );
  }, [validateSelectedFile, processDocument]);

  const scanDocument = useCallback(async () => {
    const operationId = trackUIInteraction('scan_document', 'upload_screen');
    
    try {
      const scanResult = await documentScannerService.scanDocument();
      
      if (scanResult && scanResult.scannedImages && scanResult.scannedImages.length > 0) {
        const firstImage = scanResult.scannedImages[0];
        
        const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'image' });
        
        const fileInfo: FileInfo = {
          name: `${scanResult.documentName}.jpg`,
          size: scanResult.metadata.fileSize || 0,
          type: 'image/jpeg',
          uri: firstImage,
          lastModified: Date.now(),
        };
        
        const isValid = await validateSelectedFile(fileInfo);
        if (!isValid) {
          completeOperation(fileProcessingId, false, { reason: 'validation_failed' });
          return;
        }
        
        setSelectedFile({
          uri: firstImage,
          type: 'image',
          name: `${scanResult.documentName}.jpg`,
          size: scanResult.metadata.fileSize
        });
        
        await processDocument(firstImage, 'image');
        completeOperation(fileProcessingId, true, { 
          fileSize: scanResult.metadata.fileSize,
          scanTime: scanResult.totalScanTime,
          confidence: scanResult.averageConfidence
        });
      } else {
        completeOperation(operationId, false, { reason: 'scan_canceled' });
      }
      
    } catch (error) {
      console.error('Error scanning document:', error);
      Alert.alert('Scan Error', 'Failed to scan document. Please try again.');
      completeOperation(operationId, false, { reason: 'scan_error' });
    }
  }, [validateSelectedFile, processDocument]);

  const pickDocument = useCallback(async () => {
    const operationId = trackUIInteraction('pick_document', 'upload_screen');
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        completeOperation(operationId, true, { action: 'document_selected' });
        
        const asset = result.assets[0];
        
        const fileProcessingId = startOperation('file_upload', 'upload', { fileType: 'pdf' });
        
        const fileInfo: FileInfo = {
          name: asset.name,
          size: asset.size || 0,
          type: 'application/pdf',
          uri: asset.uri,
          lastModified: Date.now(),
        };
        
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
        
        await processDocument(asset.uri, 'pdf');
        completeOperation(fileProcessingId, true, { fileSize: asset.size });
      } else {
        completeOperation(operationId, false, { reason: 'user_canceled' });
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to select document');
      completeOperation(operationId, false, { reason: 'error' });
    }
  }, [validateSelectedFile, processDocument]);

  // Memoized upload options for performance - moved after function definitions
  const uploadOptions = useMemo(() => [
    {
      id: 'scan',
      title: 'Scan Document',
      icon: Camera,
      color: theme.colors.primary,
      onPress: scanDocument,
      accessibilityLabel: 'Scan document button',
      accessibilityHint: 'Launch professional document scanner with edge detection and perspective correction',
    },
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
  ], [theme.colors, scanDocument, takePhoto, pickImage, pickDocument]);

  const handleSave = useCallback(async () => {
    if (!selectedFile || !metadata) return;
    
    const title = editedTitle.trim();
    if (!title) {
      Alert.alert('Error', 'Please enter a document title');
      return;
    }

    setIsUploading(true);
    const operationId = startOperation('document_save', 'upload');

    try {
      // Initialize file storage service
      await fileStorageService.initialize();
      
      // Generate unique document ID
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Store file and generate thumbnail
      const { storedUri, thumbnailUri, fileSize } = await fileStorageService.storeFile(
        selectedFile.uri,
        documentId,
        selectedFile.type
      );

      const newDocument: Omit<Document, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title,
        description: editedDescription.trim(),
        tags: editedTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
        type: selectedFile.type,
        uri: storedUri,
        thumbnail: thumbnailUri,
        fileSize: fileSize,
        extractedText: selectedFile.extractedText,
        categoryId: selectedCategory?.id,
        ocrData: selectedFile.ocrConfidence ? {
          text: selectedFile.extractedText || '',
          confidence: selectedFile.ocrConfidence,
          blocks: [],
          processingTime: selectedFile.processingTime || 0,
          imageSize: { width: 0, height: 0 }
        } : undefined
      };

      await databaseService.addDocument(newDocument);
      
      // Reset state
      setSelectedFile(null);
      setMetadata(null);
      setEditedTitle('');
      setEditedDescription('');
      setEditedTags('');
      setSelectedCategory(null);
      setIsEditing(false);

      completeOperation(operationId, true, { documentTitle: title, categoryId: selectedCategory?.id });
      Alert.alert('Success', 'Document saved successfully!');
    } catch (error) {
      console.error('Failed to save document:', error);
      captureError(error as Error, {
        tags: { operation: 'document_save', screen: 'upload' },
        extra: { documentTitle: title },
      });
      completeOperation(operationId, false, { reason: 'save_failed' });
      Alert.alert('Error', 'Failed to save document. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [selectedFile, metadata, editedTitle, editedDescription, editedTags, selectedCategory]);

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

  const renderUploadOptions = () => {
    const [scanOption, cameraOption, uploadOption, pdfOption] = uploadOptions;
    
    return (
      <View style={{
        gap: spacing.md,
        marginTop: spacing.lg,
        paddingHorizontal: spacing.lg,
      }}>
        {/* Grid Layout for Upload Options */}
        <View style={{
          flexDirection: 'row',
          gap: spacing.md,
        }}>
          <TouchableOpacity
            onPress={scanOption.onPress}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 120,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={scanOption.accessibilityLabel}
            accessibilityHint={scanOption.accessibilityHint}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: scanOption.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <scanOption.icon size={24} color={scanOption.color} />
            </View>
            <RevolutText variant="h6" style={{ textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
              {scanOption.title}
            </RevolutText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={cameraOption.onPress}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 120,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={cameraOption.accessibilityLabel}
            accessibilityHint={cameraOption.accessibilityHint}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: cameraOption.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <cameraOption.icon size={24} color={cameraOption.color} />
            </View>
            <RevolutText variant="h6" style={{ textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
              {cameraOption.title}
            </RevolutText>
          </TouchableOpacity>
        </View>

        <View style={{
          flexDirection: 'row',
          gap: spacing.md,
        }}>
          <TouchableOpacity
            onPress={uploadOption.onPress}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 120,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={uploadOption.accessibilityLabel}
            accessibilityHint={uploadOption.accessibilityHint}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: uploadOption.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <uploadOption.icon size={24} color={uploadOption.color} />
            </View>
            <RevolutText variant="h6" style={{ textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
              {uploadOption.title}
            </RevolutText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={pdfOption.onPress}
            style={{
              flex: 1,
              backgroundColor: theme.colors.surface,
              paddingVertical: spacing.lg,
              paddingHorizontal: spacing.md,
              borderRadius: borderRadius.lg,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: theme.colors.border,
              minHeight: 120,
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={pdfOption.accessibilityLabel}
            accessibilityHint={pdfOption.accessibilityHint}
          >
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: pdfOption.color + '20',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: spacing.md,
            }}>
              <pdfOption.icon size={24} color={pdfOption.color} />
            </View>
            <RevolutText variant="h6" style={{ textAlign: 'center', fontSize: 14, fontWeight: '600' }}>
              {pdfOption.title}
            </RevolutText>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
                Processing document...
              </RevolutText>
              <RevolutText 
                variant="body2" 
                color={theme.colors.textTertiary}
                style={{ marginTop: spacing.sm, textAlign: 'center' }}
              >
                Please wait while we extract text from your document
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
                Document Details
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

                {/* Category Selection */}
                <View style={{ marginBottom: spacing.lg }}>
                  <RevolutText variant="label" color={theme.colors.textSecondary} style={{ marginBottom: spacing.sm }}>
                    CATEGORY
                  </RevolutText>
                  <TouchableOpacity
                    onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    style={{
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.md,
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: theme.colors.surface,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      {selectedCategory ? (
                        <>
                          <View style={{
                            width: 24,
                            height: 24,
                            borderRadius: 12,
                            backgroundColor: selectedCategory.color + '30',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: spacing.sm,
                          }}>
                            <Folder size={12} color={selectedCategory.color} />
                          </View>
                          <RevolutText variant="body1">
                            {selectedCategory.name}
                          </RevolutText>
                        </>
                      ) : (
                        <RevolutText variant="body1" color={theme.colors.textTertiary}>
                          Select a category (optional)
                        </RevolutText>
                      )}
                    </View>
                    <ChevronDown size={iconSizes.sm} color={theme.colors.textSecondary} />
                  </TouchableOpacity>

                  {showCategoryDropdown && (
                    <View style={{
                      marginTop: spacing.sm,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      borderRadius: borderRadius.md,
                      backgroundColor: theme.colors.surface,
                      maxHeight: 200,
                    }}>
                      <ScrollView>
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCategory(null);
                            setShowCategoryDropdown(false);
                          }}
                          style={{
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.md,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                          }}
                        >
                          <RevolutText variant="body1" color={theme.colors.textTertiary}>
                            No Category
                          </RevolutText>
                        </TouchableOpacity>
                        {categories.map((category) => (
                          <TouchableOpacity
                            key={category.id}
                            onPress={() => {
                              setSelectedCategory(category);
                              setShowCategoryDropdown(false);
                            }}
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              paddingHorizontal: spacing.md,
                              paddingVertical: spacing.md,
                              borderBottomWidth: categories.indexOf(category) < categories.length - 1 ? 1 : 0,
                              borderBottomColor: theme.colors.border,
                            }}
                          >
                            <View style={{
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              backgroundColor: category.color + '30',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: spacing.sm,
                            }}>
                              <Folder size={12} color={category.color} />
                            </View>
                            <RevolutText variant="body1">
                              {category.name}
                            </RevolutText>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
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
                  <ExpandableText
                    text={editedDescription}
                    variant="body1"
                    numberOfLines={3}
                    style={{ marginTop: spacing.xs }}
                  />
                </View>

                {/* Category Display */}
                {selectedCategory && (
                  <View style={{ marginBottom: spacing.lg }}>
                    <RevolutText variant="label" color={theme.colors.textSecondary}>
                      CATEGORY
                    </RevolutText>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      marginTop: spacing.xs,
                    }}>
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 12,
                        backgroundColor: selectedCategory.color + '30',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: spacing.sm,
                      }}>
                        <Folder size={12} color={selectedCategory.color} />
                      </View>
                      <RevolutText variant="body1">
                        {selectedCategory.name}
                      </RevolutText>
                    </View>
                  </View>
                )}
                
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

                {/* Display extracted OCR text if available */}
                {selectedFile?.extractedText && (
                  <View style={{ marginBottom: spacing.lg }}>
                    <RevolutText variant="label" color={theme.colors.textSecondary}>
                      EXTRACTED TEXT
                    </RevolutText>
                    <View style={{
                      marginTop: spacing.xs,
                      padding: spacing.md,
                      backgroundColor: theme.colors.background + '80',
                      borderRadius: borderRadius.md,
                      borderWidth: 1,
                      borderColor: theme.colors.primary + '30',
                    }}>
                      <ExpandableText
                        text={selectedFile.extractedText}
                        variant="body2"
                        numberOfLines={4}
                        style={{ lineHeight: 20 }}
                      />
                      {selectedFile.ocrConfidence && (
                        <RevolutText 
                          variant="caption" 
                          color={theme.colors.textTertiary}
                          style={{ marginTop: spacing.xs }}
                        >
                          OCR Confidence: {Math.round(selectedFile.ocrConfidence * 100)}%
                        </RevolutText>
                      )}
                    </View>
                  </View>
                )}
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
          {/* Compact Header - Consistent with Library and Settings */}
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
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <View>
                <RevolutText variant="h2">
                  Upload Document
                </RevolutText>
                <RevolutText 
                  variant="caption" 
                  color={theme.colors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  Add files to your secure library
                </RevolutText>
              </View>
            </View>
          </View>

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

