import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export interface PasskeyCredentials {
  id: string;
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: Date;
  lastUsed: Date;
}

export interface AuthenticationResult {
  success: boolean;
  credentials?: PasskeyCredentials;
  error?: string;
}

export class PasskeyAuthService {
  private static readonly PASSKEY_STORAGE_KEY = 'user_passkey';
  private static readonly AUTH_STATUS_KEY = 'auth_status';
  
  // Check if device supports biometric authentication
  async isBiometricSupported(): Promise<boolean> {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      return hasHardware && isEnrolled;
    } catch (error) {
      console.error('Failed to check biometric support:', error);
      return false;
    }
  }

  // Get available biometric types
  async getAvailableBiometrics(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Failed to get biometric types:', error);
      return [];
    }
  }

  // Generate a new passkey
  private generatePasskey(): PasskeyCredentials {
    // In a real implementation, you'd use proper cryptographic libraries
    // For now, we'll simulate passkey generation
    const id = `passkey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const keyPair = this.generateKeyPair();
    
    return {
      id,
      publicKey: keyPair.publicKey,
      encryptedPrivateKey: keyPair.encryptedPrivateKey,
      createdAt: new Date(),
      lastUsed: new Date()
    };
  }

  // Simulate key pair generation (in production, use actual crypto libraries)
  private generateKeyPair(): { publicKey: string; encryptedPrivateKey: string } {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36);
    
    return {
      publicKey: Buffer.from(`public_${timestamp}_${random}`).toString('base64'),
      encryptedPrivateKey: Buffer.from(`private_${timestamp}_${random}`).toString('base64')
    };
  }

  // Create a new passkey with biometric authentication
  async createPasskey(): Promise<AuthenticationResult> {
    try {
      // Check if biometrics are supported
      const biometricSupported = await this.isBiometricSupported();
      if (!biometricSupported) {
        return {
          success: false,
          error: 'Biometric authentication is not available on this device'
        };
      }

      // Authenticate user to create passkey
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Create your secure passkey',
        subtitle: 'Use your biometric to secure your document vault',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        };
      }

      // Generate new passkey
      const passkey = this.generatePasskey();

      // Store securely
      await SecureStore.setItemAsync(
        PasskeyAuthService.PASSKEY_STORAGE_KEY, 
        JSON.stringify(passkey)
      );

      // Mark as authenticated
      await AsyncStorage.setItem(PasskeyAuthService.AUTH_STATUS_KEY, 'authenticated');

      return {
        success: true,
        credentials: passkey
      };

    } catch (error) {
      console.error('Failed to create passkey:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create passkey'
      };
    }
  }

  // Authenticate using existing passkey
  async authenticateWithPasskey(): Promise<AuthenticationResult> {
    try {
      // Check if passkey exists
      const storedPasskey = await SecureStore.getItemAsync(PasskeyAuthService.PASSKEY_STORAGE_KEY);
      if (!storedPasskey) {
        return {
          success: false,
          error: 'No passkey found. Please create a passkey first.'
        };
      }

      // Authenticate user
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock your document vault',
        subtitle: 'Use your biometric to access your documents',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error || 'Authentication failed'
        };
      }

      // Parse stored passkey
      const credentials: PasskeyCredentials = JSON.parse(storedPasskey);
      
      // Update last used timestamp
      credentials.lastUsed = new Date();
      await SecureStore.setItemAsync(
        PasskeyAuthService.PASSKEY_STORAGE_KEY, 
        JSON.stringify(credentials)
      );

      // Mark as authenticated
      await AsyncStorage.setItem(PasskeyAuthService.AUTH_STATUS_KEY, 'authenticated');

      return {
        success: true,
        credentials
      };

    } catch (error) {
      console.error('Failed to authenticate with passkey:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      };
    }
  }

  // Check if user is currently authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const authStatus = await AsyncStorage.getItem(PasskeyAuthService.AUTH_STATUS_KEY);
      return authStatus === 'authenticated';
    } catch (error) {
      console.error('Failed to check auth status:', error);
      return false;
    }
  }

  // Check if passkey exists
  async hasPasskey(): Promise<boolean> {
    try {
      const storedPasskey = await SecureStore.getItemAsync(PasskeyAuthService.PASSKEY_STORAGE_KEY);
      return !!storedPasskey;
    } catch (error) {
      console.error('Failed to check passkey existence:', error);
      return false;
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PasskeyAuthService.AUTH_STATUS_KEY);
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  }

  // Delete passkey (dangerous operation)
  async deletePasskey(): Promise<AuthenticationResult> {
    try {
      // Require authentication before deletion
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Delete your passkey',
        subtitle: 'This will permanently delete your passkey and all data',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use PIN',
      });

      if (!authResult.success) {
        return {
          success: false,
          error: 'Authentication required to delete passkey'
        };
      }

      // Delete stored passkey
      await SecureStore.deleteItemAsync(PasskeyAuthService.PASSKEY_STORAGE_KEY);
      await AsyncStorage.removeItem(PasskeyAuthService.AUTH_STATUS_KEY);

      return { success: true };

    } catch (error) {
      console.error('Failed to delete passkey:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete passkey'
      };
    }
  }

  // Get passkey info (without sensitive data)
  async getPasskeyInfo(): Promise<{
    id: string;
    createdAt: Date;
    lastUsed: Date;
  } | null> {
    try {
      const storedPasskey = await SecureStore.getItemAsync(PasskeyAuthService.PASSKEY_STORAGE_KEY);
      if (!storedPasskey) return null;

      const credentials: PasskeyCredentials = JSON.parse(storedPasskey);
      return {
        id: credentials.id,
        createdAt: new Date(credentials.createdAt),
        lastUsed: new Date(credentials.lastUsed)
      };
    } catch (error) {
      console.error('Failed to get passkey info:', error);
      return null;
    }
  }

  // Generate recovery code (for backup purposes)
  async generateRecoveryCode(): Promise<string | null> {
    try {
      const storedPasskey = await SecureStore.getItemAsync(PasskeyAuthService.PASSKEY_STORAGE_KEY);
      if (!storedPasskey) return null;

      const credentials: PasskeyCredentials = JSON.parse(storedPasskey);
      
      // Generate recovery code based on passkey
      const recoveryData = {
        id: credentials.id,
        created: credentials.createdAt.getTime()
      };
      
      return Buffer.from(JSON.stringify(recoveryData)).toString('base64');
    } catch (error) {
      console.error('Failed to generate recovery code:', error);
      return null;
    }
  }
}

// Singleton instance
export const passkeyAuthService = new PasskeyAuthService(); 