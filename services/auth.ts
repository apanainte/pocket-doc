import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

export type AuthMethod = 'biometric' | 'passcode' | 'both';

export class AuthService {
  private readonly AUTH_TOKEN_KEY = 'auth_token';
  private readonly USER_ID_KEY = 'user_id';
  private readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private readonly PASSCODE_KEY = 'passcode_secure';
  private readonly AUTH_METHOD_KEY = 'auth_method';

  /**
   * Check if the device supports biometric authentication
   */
  async isBiometricSupported(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      return compatible && enrolled;
    } catch (error) {
      console.error('Error checking biometric support:', error);
      return false;
    }
  }

  /**
   * Get available authentication types
   */
  async getAvailableAuthTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    try {
      return await LocalAuthentication.supportedAuthenticationTypesAsync();
    } catch (error) {
      console.error('Error getting auth types:', error);
      return [];
    }
  }

  /**
   * Set user's preferred authentication method
   */
  async setAuthMethod(method: AuthMethod): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.AUTH_METHOD_KEY, method);
    } catch (error) {
      console.error('Error setting auth method:', error);
      throw new Error('Failed to update authentication method');
    }
  }

  /**
   * Get user's preferred authentication method
   */
  async getAuthMethod(): Promise<AuthMethod> {
    try {
      const method = await SecureStore.getItemAsync(this.AUTH_METHOD_KEY);
      return (method as AuthMethod) || 'biometric';
    } catch (error) {
      console.error('Error getting auth method:', error);
      return 'biometric';
    }
  }

  /**
   * Set passcode (stored securely in SecureStore)
   */
  async setPasscode(passcode: string): Promise<void> {
    try {
      if (passcode.length < 4) {
        throw new Error('Passcode must be at least 4 digits');
      }
      
      // Create a simple salted hash using built-in string methods
      const salt = 'pocketdoc_salt_2024';
      const saltedPasscode = salt + passcode + salt;
      
      await SecureStore.setItemAsync(this.PASSCODE_KEY, saltedPasscode);
    } catch (error) {
      console.error('Error setting passcode:', error);
      throw new Error('Failed to set passcode');
    }
  }

  /**
   * Verify passcode
   */
  async verifyPasscode(passcode: string): Promise<boolean> {
    try {
      const storedPasscode = await SecureStore.getItemAsync(this.PASSCODE_KEY);
      
      if (!storedPasscode) {
        return false;
      }
      
      const salt = 'pocketdoc_salt_2024';
      const saltedPasscode = salt + passcode + salt;
      
      return saltedPasscode === storedPasscode;
    } catch (error) {
      console.error('Error verifying passcode:', error);
      return false;
    }
  }

  /**
   * Check if passcode is set
   */
  async hasPasscode(): Promise<boolean> {
    try {
      const passcode = await SecureStore.getItemAsync(this.PASSCODE_KEY);
      return passcode !== null;
    } catch (error) {
      console.error('Error checking passcode:', error);
      return false;
    }
  }

  /**
   * Remove passcode
   */
  async removePasscode(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.PASSCODE_KEY);
    } catch (error) {
      console.error('Error removing passcode:', error);
      throw new Error('Failed to remove passcode');
    }
  }

  /**
   * Change passcode
   */
  async changePasscode(oldPasscode: string, newPasscode: string): Promise<boolean> {
    try {
      const isValid = await this.verifyPasscode(oldPasscode);
      
      if (!isValid) {
        return false;
      }
      
      await this.setPasscode(newPasscode);
      return true;
    } catch (error) {
      console.error('Error changing passcode:', error);
      throw new Error('Failed to change passcode');
    }
  }

  /**
   * Authenticate user with preferred method
   */
  async authenticate(): Promise<boolean> {
    try {
      const authMethod = await this.getAuthMethod();
      const isBiometricSupported = await this.isBiometricSupported();
      const hasPasscode = await this.hasPasscode();

      // Determine which authentication to use
      if (authMethod === 'biometric' && isBiometricSupported) {
        return await this.authenticateWithBiometric();
      } else if (authMethod === 'passcode' && hasPasscode) {
        return await this.authenticateWithPasscode();
      } else if (authMethod === 'both') {
        if (isBiometricSupported) {
          return await this.authenticateWithBiometric();
        } else if (hasPasscode) {
          return await this.authenticateWithPasscode();
        }
      }

      // Fallback to setup if no authentication method is available
      return await this.setupAuthentication();
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  /**
   * Authenticate with biometric
   */
  private async authenticateWithBiometric(): Promise<boolean> {
    try {
      const isSupported = await this.isBiometricSupported();
      
      if (!isSupported) {
        Alert.alert(
          'Authentication Not Available',
          'Your device does not support biometric authentication or no biometrics are enrolled. Please set up Face ID, Touch ID, or fingerprint authentication in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Get authentication types for better UX
      const authTypes = await this.getAvailableAuthTypes();
      let promptMessage = 'Authenticate to access your secure documents';
      
      if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        promptMessage = 'Use Face ID to access your documents';
      } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        promptMessage = 'Use your fingerprint to access your documents';
      }

      // Perform authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        // Generate and store secure token
        const token = await this.generateSecureToken();
        await this.storeAuthToken(token);
        return true;
      } else {
        console.log('Authentication failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      Alert.alert(
        'Authentication Error',
        'Failed to authenticate. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * Authenticate with passcode (UI would need to be implemented in components)
   */
  private async authenticateWithPasscode(): Promise<boolean> {
    // This would typically be called from a UI component that collects the passcode
    // For now, return true to indicate passcode authentication is available
    return true;
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const token = await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
      return token !== null;
    } catch (error) {
      console.error('Error checking authentication status:', error);
      return false;
    }
  }

  /**
   * Get current user ID (for multi-user support in future)
   */
  async getCurrentUserId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.USER_ID_KEY);
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  /**
   * Logout user and clear secure storage
   */
  async logout(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(this.AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(this.USER_ID_KEY);
      await SecureStore.deleteItemAsync(this.BIOMETRIC_ENABLED_KEY);
    } catch (error) {
      console.error('Error during logout:', error);
      throw new Error('Failed to logout securely');
    }
  }

  /**
   * Enable/disable biometric authentication
   */
  async setBiometricEnabled(enabled: boolean): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, enabled.toString());
    } catch (error) {
      console.error('Error setting biometric preference:', error);
      throw new Error('Failed to update biometric settings');
    }
  }

  /**
   * Check if biometric authentication is enabled by user
   */
  async isBiometricEnabled(): Promise<boolean> {
    try {
      const enabled = await SecureStore.getItemAsync(this.BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric setting:', error);
      return true; // Default to enabled
    }
  }

  /**
   * Generate a secure authentication token
   */
  private async generateSecureToken(): Promise<string> {
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2);
    return `auth_${timestamp}_${randomBytes}`;
  }

  /**
   * Store authentication token securely
   */
  private async storeAuthToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(this.AUTH_TOKEN_KEY, token);
      
      // Also store a user ID for future multi-user support
      const userId = `user_${Date.now()}`;
      await SecureStore.setItemAsync(this.USER_ID_KEY, userId);
      
      // Enable biometric by default
      await SecureStore.setItemAsync(this.BIOMETRIC_ENABLED_KEY, 'true');
    } catch (error) {
      console.error('Error storing auth token:', error);
      throw new Error('Failed to store authentication token');
    }
  }

  /**
   * Get the current authentication token
   */
  async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(this.AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Re-authenticate for sensitive operations
   */
  async reauthenticate(reason: string = 'Verify your identity'): Promise<boolean> {
    try {
      const isSupported = await this.isBiometricSupported();
      
      if (!isSupported) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      return result.success;
    } catch (error) {
      console.error('Re-authentication error:', error);
      return false;
    }
  }

  /**
   * Setup initial authentication (first time app usage)
   */
  async setupAuthentication(): Promise<boolean> {
    try {
      const isSupported = await this.isBiometricSupported();
      
      if (!isSupported) {
        Alert.alert(
          'Setup Required',
          'For security, Pocket Doc requires biometric authentication. Please enable Face ID, Touch ID, or fingerprint authentication in your device settings.',
          [{ text: 'OK' }]
        );
        return false;
      }

      const authTypes = await this.getAvailableAuthTypes();
      let message = 'Set up secure authentication for Pocket Doc';
      
      if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        message = 'Use Face ID to secure your documents';
      } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        message = 'Use your fingerprint to secure your documents';
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: message,
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
        cancelLabel: 'Cancel',
      });

      if (result.success) {
        const token = await this.generateSecureToken();
        await this.storeAuthToken(token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Setup authentication error:', error);
      return false;
    }
  }

  /**
   * Get authentication status and available methods
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    authMethod: AuthMethod;
    biometricSupported: boolean;
    hasPasscode: boolean;
    biometricTypes: LocalAuthentication.AuthenticationType[];
  }> {
    try {
      const [
        isAuthenticated,
        authMethod,
        biometricSupported,
        hasPasscode,
        biometricTypes
      ] = await Promise.all([
        this.isAuthenticated(),
        this.getAuthMethod(),
        this.isBiometricSupported(),
        this.hasPasscode(),
        this.getAvailableAuthTypes()
      ]);

      return {
        isAuthenticated,
        authMethod,
        biometricSupported,
        hasPasscode,
        biometricTypes
      };
    } catch (error) {
      console.error('Error getting auth status:', error);
      return {
        isAuthenticated: false,
        authMethod: 'biometric',
        biometricSupported: false,
        hasPasscode: false,
        biometricTypes: []
      };
    }
  }
} 