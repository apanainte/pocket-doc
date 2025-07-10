import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Alert,
} from 'react-native';
import { Fingerprint, Shield, Eye } from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const { width, height } = Dimensions.get('window');

interface SimpleAuthScreenProps {
  onAuthenticated: () => void;
}

export default function SimpleAuthScreen({ onAuthenticated }: SimpleAuthScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      // Check if biometrics are supported
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!compatible || !enrolled) {
        Alert.alert(
          'Authentication Setup Required',
          'Please enable Face ID, Touch ID, or passcode authentication in your device settings to use Pocket Doc.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Continue Anyway', onPress: () => authenticateWithoutBiometrics() }
          ]
        );
        setIsAuthenticating(false);
        return;
      }

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Pocket Doc',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Store authentication token
        const token = `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        await SecureStore.setItemAsync('auth_token', token);
        onAuthenticated();
      } else {
        console.log('Authentication cancelled or failed');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const authenticateWithoutBiometrics = async () => {
    // Simple bypass for testing
    const token = `auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    await SecureStore.setItemAsync('auth_token', token);
    onAuthenticated();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon Area */}
        <View style={styles.iconContainer}>
          <Shield size={Math.min(width * 0.2, 80)} color="#007AFF" />
          <Text style={styles.appName}>Pocket Doc</Text>
          <Text style={styles.tagline}>Your secure document wallet</Text>
        </View>

        {/* Security Features */}
        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Fingerprint size={24} color="#34C759" />
            <Text style={styles.featureText}>Biometric Security</Text>
          </View>
          <View style={styles.feature}>
            <Shield size={24} color="#34C759" />
            <Text style={styles.featureText}>Local Storage</Text>
          </View>
          <View style={styles.feature}>
            <Eye size={24} color="#34C759" />
            <Text style={styles.featureText}>Private & Secure</Text>
          </View>
        </View>

        {/* Authentication Button */}
        <View style={styles.authSection}>
          <Text style={styles.authTitle}>Secure Access Required</Text>
          <Text style={styles.authDescription}>
            Use Face ID, Touch ID, or your device passcode to access your secure documents.
          </Text>
          
          <TouchableOpacity
            style={[styles.authButton, isAuthenticating && styles.authButtonDisabled]}
            onPress={handleAuthenticate}
            disabled={isAuthenticating}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Fingerprint size={24} color="#FFFFFF" />
            )}
            <Text style={styles.authButtonText}>
              {isAuthenticating ? 'Authenticating...' : 'Unlock Pocket Doc'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            Your documents are stored locally on your device and protected by your device's security features. 
            No data is sent to external servers.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    flex: 1,
    paddingHorizontal: Math.max(24, width * 0.06),
    paddingVertical: Math.max(20, height * 0.03),
    justifyContent: 'space-between',
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: Math.max(40, height * 0.08),
    marginBottom: Math.max(32, height * 0.04),
  },
  appName: {
    fontSize: Math.min(32, width * 0.08),
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 16,
  },
  tagline: {
    fontSize: Math.min(16, width * 0.04),
    color: '#86868B',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: Math.max(20, width * 0.05),
    marginBottom: Math.max(24, height * 0.03),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: Math.min(16, width * 0.04),
    color: '#1D1D1F',
    marginLeft: 12,
    fontWeight: '500',
  },
  authSection: {
    alignItems: 'center',
    marginBottom: Math.max(24, height * 0.03),
  },
  authTitle: {
    fontSize: Math.min(20, width * 0.05),
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  authDescription: {
    fontSize: Math.min(16, width * 0.04),
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: Math.max(16, width * 0.04),
  },
  authButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Math.max(16, height * 0.02),
    paddingHorizontal: Math.max(32, width * 0.08),
    borderRadius: 12,
    gap: 12,
    minWidth: Math.min(200, width * 0.5),
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: Math.min(18, width * 0.045),
    fontWeight: '600',
  },
  privacyNotice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Math.max(16, width * 0.04),
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
    marginBottom: Math.max(20, height * 0.025),
  },
  privacyText: {
    fontSize: Math.min(14, width * 0.035),
    color: '#86868B',
    lineHeight: 20,
    textAlign: 'center',
  },
}); 