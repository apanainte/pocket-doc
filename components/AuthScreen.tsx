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

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const { authenticate, isAuthenticated, isLoading } = useApp();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    try {
      await authenticate();
    } catch (error) {
      console.error('Authentication failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isAuthenticated) {
    return null; // Let the main app render
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Initializing Pocket Doc...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo/Icon Area */}
        <View style={styles.iconContainer}>
          <Shield size={80} color="#007AFF" />
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
            <Text style={styles.featureText}>End-to-End Encryption</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#86868B',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1D1D1F',
    marginTop: 16,
  },
  tagline: {
    fontSize: 16,
    color: '#86868B',
    marginTop: 8,
    textAlign: 'center',
  },
  featuresContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    fontSize: 16,
    color: '#1D1D1F',
    marginLeft: 12,
    fontWeight: '500',
  },
  authSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 12,
  },
  authDescription: {
    fontSize: 16,
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  authButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    gap: 12,
    minWidth: 200,
  },
  authButtonDisabled: {
    opacity: 0.6,
  },
  authButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  privacyNotice: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  privacyText: {
    fontSize: 14,
    color: '#86868B',
    lineHeight: 20,
    textAlign: 'center',
  },
}); 