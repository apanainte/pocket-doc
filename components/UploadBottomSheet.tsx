import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Camera, Upload, FileText, ScanLine, Paperclip } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface UploadBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onFileSelected?: (fileInfo: { uri: string; type: 'image' | 'pdf'; name: string; mimeType?: string }) => void;
}

interface UploadOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export default function UploadBottomSheet({ visible, onClose, onFileSelected }: UploadBottomSheetProps) {
  const { theme, spacing, borderRadius } = useTheme();
  const router = useRouter();
  const [translateY] = useState(new Animated.Value(SCREEN_HEIGHT));

  React.useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, translateY]);

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Camera permission is required to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onClose();
        // Call the file selected callback
        if (onFileSelected) {
          onFileSelected({
            uri: result.assets[0].uri,
            type: 'image',
            name: `photo_${Date.now()}.jpg`,
            mimeType: 'image/jpeg'
          });
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      alert('Failed to take photo. Please try again.');
    }
  };

  const handlePhotoLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Photo library permission is required to select photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        onClose();
        // Call the file selected callback
        if (onFileSelected) {
          onFileSelected({
            uri: result.assets[0].uri,
            type: 'image',
            name: `photo_${Date.now()}.jpg`,
            mimeType: 'image/jpeg'
          });
        }
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      alert('Failed to select photo. Please try again.');
    }
  };

  const handleScanDocument = async () => {
    // For now, use camera - in future could integrate with document scanner
    await handleTakePhoto();
  };

  const handleScanText = async () => {
    // For now, use camera - in future could integrate with text recognition
    await handleTakePhoto();
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        onClose();
        // Call the file selected callback
        if (onFileSelected) {
          const fileType = result.assets[0].mimeType?.startsWith('image/') ? 'image' : 'pdf';
          onFileSelected({
            uri: result.assets[0].uri,
            type: fileType,
            name: result.assets[0].name || 'document.pdf',
            mimeType: result.assets[0].mimeType
          });
        }
      }
    } catch (error) {
      console.error('Error selecting document:', error);
      alert('Failed to select document. Please try again.');
    }
  };

  const uploadOptions: UploadOption[] = [
    {
      id: 'photo',
      title: 'Take Photo or Video',
      description: 'Capture documents with your camera',
      icon: <Camera size={24} color={theme.colors.primary} />,
      action: handleTakePhoto,
    },
    {
      id: 'library',
      title: 'Photo Library',
      description: 'Select from your photo library',
      icon: <Upload size={24} color={theme.colors.secondary} />,
      action: handlePhotoLibrary,
    },
    {
      id: 'scan',
      title: 'Scan Document',
      description: 'Scan and enhance documents',
      icon: <FileText size={24} color={theme.colors.success} />,
      action: handleScanDocument,
    },
    {
      id: 'text',
      title: 'Scan Text',
      description: 'Extract text from images',
      icon: <ScanLine size={24} color={theme.colors.info} />,
      action: handleScanText,
    },
    {
      id: 'file',
      title: 'Attach File',
      description: 'Choose files from your device',
      icon: <Paperclip size={24} color={theme.colors.warning} />,
      action: handleAttachFile,
    },
  ];

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dy) > 10;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100) {
        onClose();
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <Animated.View
              style={[
                styles.bottomSheet,
                {
                  backgroundColor: theme.colors.surface,
                  transform: [{ translateY }],
                },
              ]}
              {...panResponder.panHandlers}
            >
              {/* Handle */}
              <View style={[
                styles.handle,
                { backgroundColor: theme.colors.border }
              ]} />

              {/* Content */}
              <ScrollView 
                style={[styles.content, { padding: spacing.lg }]}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <RevolutText 
                  variant="h3" 
                  color={theme.colors.text}
                  style={{ 
                    textAlign: 'center',
                    marginBottom: spacing.lg
                  }}
                >
                  Upload Options
                </RevolutText>

                {uploadOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    onPress={option.action}
                    style={[styles.optionButton, { marginBottom: spacing.md }]}
                  >
                    <RevolutCard
                      padding="md"
                      shadow="small"
                      style={{
                        borderRadius: borderRadius.lg,
                        backgroundColor: theme.colors.surface,
                      }}
                    >
                      <View style={styles.optionContent}>
                        <View style={[
                          styles.iconContainer,
                          { 
                            backgroundColor: theme.colors.surfaceSecondary,
                            borderRadius: borderRadius.md,
                          }
                        ]}>
                          {option.icon}
                        </View>
                        <View style={styles.textContainer}>
                          <RevolutText 
                            variant="subtitle1" 
                            color={theme.colors.text}
                            style={{ marginBottom: spacing.xs }}
                          >
                            {option.title}
                          </RevolutText>
                          <RevolutText 
                            variant="body2" 
                            color={theme.colors.textSecondary}
                          >
                            {option.description}
                          </RevolutText>
                        </View>
                      </View>
                    </RevolutCard>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
    minHeight: SCREEN_HEIGHT * 0.6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  content: {
    flex: 1,
  },
  optionButton: {
    // Button styling handled by TouchableOpacity
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
});