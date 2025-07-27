import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import { Document } from '@/types/document';
import { X, Edit3 } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface FullDocumentViewerProps {
  document: Document | null;
  visible: boolean;
  onClose: () => void;
  onEdit?: (document: Document) => void;
}

export function FullDocumentViewer({ 
  document, 
  visible, 
  onClose, 
  onEdit 
}: FullDocumentViewerProps) {
  
  const handleEdit = () => {
    if (document && onEdit) {
      onEdit(document);
    }
  };

  const checkFileAndShow = async () => {
    if (!document) return;
    
    try {
      const fileInfo = await FileSystem.getInfoAsync(document.uri);
      if (!fileInfo.exists) {
        Alert.alert('Error', 'Document file not found.');
        onClose();
        return;
      }
    } catch (error) {
      console.error('Error checking file:', error);
      Alert.alert('Error', 'Failed to access document.');
      onClose();
    }
  };

  React.useEffect(() => {
    if (visible && document) {
      checkFileAndShow();
    }
  }, [visible, document]);

  if (!document) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header with controls */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.title} numberOfLines={1}>
            {document.title}
          </Text>
          
          {onEdit && (
            <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
              <Edit3 size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Document content */}
        <View style={styles.content}>
          {document.type === 'pdf' ? (
            <WebView
              source={{ uri: document.uri }}
              style={styles.webView}
              startInLoadingState={true}
              originWhitelist={['file://', 'http://', 'https://']}
              allowFileAccess={true}
              allowUniversalAccessFromFileURLs={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              mixedContentMode="compatibility"
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error('PDF loading error:', nativeEvent);
                Alert.alert('Error', 'Failed to load PDF document.');
              }}
            />
          ) : (
            <ScrollView 
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}
              showsHorizontalScrollIndicator={false}
            >
              <Image
                source={{ uri: document.uri }}
                style={styles.fullImage}
                resizeMode="contain"
                onError={() => {
                  Alert.alert('Error', 'Failed to load image.');
                }}
              />
            </ScrollView>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height,
  },
  fullImage: {
    width: width,
    height: height * 0.9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '500',
  },
});
