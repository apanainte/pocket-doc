import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LogOut, Shield, User } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';

export default function ProfileScreen() {
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? You will need to authenticate again to access your documents.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync('auth_token');
              // Force app reload by reloading the page in Expo
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout properly');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.userSection}>
          <View style={styles.userIcon}>
            <User size={40} color="#007AFF" />
          </View>
          <Text style={styles.userName}>Pocket Doc User</Text>
          <Text style={styles.userEmail}>Authenticated Locally</Text>
        </View>

        <View style={styles.settingsSection}>
          <View style={styles.settingItem}>
            <Shield size={24} color="#34C759" />
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Security</Text>
              <Text style={styles.settingDescription}>
                Documents are encrypted and stored locally
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={24} color="#FF3B30" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your documents are stored securely on this device only.
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  userSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  userIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#86868B',
  },
  settingsSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingContent: {
    marginLeft: 16,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#86868B',
    lineHeight: 20,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginLeft: 12,
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  footerText: {
    fontSize: 14,
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 20,
  },
});