import React from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { LogOut, Shield, User, Moon, Sun, Smartphone, Settings } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutButton } from '@/components/ui/RevolutButton';
import { useTheme } from '@/contexts/ThemeContext';
import SearchBar from '@/components/SearchBar';

export default function ProfileScreen() {
  const { theme, themeMode, setThemeMode, isDark, spacing, borderRadius, iconSizes } = useTheme();

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

  const getThemeDisplayText = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      default: return 'System';
    }
  };

  const cycleTheme = () => {
    const modes: Array<'light' | 'dark' | 'system'> = ['system', 'light', 'dark'];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
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
            paddingHorizontal: spacing.lg,
            paddingBottom: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
        >
            {/* User Section */}
            <RevolutCard 
              gradient={true}
              shadow="medium"
              style={{ marginBottom: spacing.lg }}
            >
              <View style={{
                alignItems: 'center',
                paddingVertical: spacing.md,
              }}>
                <View style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: theme.colors.primaryLight + '30',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: spacing.md,
                }}>
                  <User size={iconSizes.xxl} color={theme.colors.primary} />
                </View>
                <RevolutText variant="h4" style={{ marginBottom: spacing.xs }}>
                  Pocket Doc User
                </RevolutText>
                <RevolutText variant="body2" color={theme.colors.textSecondary}>
                  Authenticated Locally
                </RevolutText>
              </View>
            </RevolutCard>

            {/* Settings Section */}
            <RevolutCard shadow="medium" style={{ marginBottom: spacing.lg }}>
              <RevolutText variant="h5" style={{ marginBottom: spacing.lg }}>
                Settings
              </RevolutText>
              
              {/* Theme Setting */}
              <TouchableOpacity
                onPress={cycleTheme}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.md,
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.secondary + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md,
                }}>
                  {isDark ? (
                    <Moon size={iconSizes.lg} color={theme.colors.secondary} />
                  ) : (
                    <Sun size={iconSizes.lg} color={theme.colors.secondary} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <RevolutText variant="subtitle1">
                    Theme
                  </RevolutText>
                  <RevolutText variant="caption" color={theme.colors.textSecondary}>
                    {getThemeDisplayText()} mode
                  </RevolutText>
                </View>
                <RevolutText variant="body2" color={theme.colors.primary}>
                  Tap to change
                </RevolutText>
              </TouchableOpacity>

              {/* Security Setting */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.md,
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.success + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md,
                }}>
                  <Shield size={iconSizes.lg} color={theme.colors.success} />
                </View>
                <View style={{ flex: 1 }}>
                  <RevolutText variant="subtitle1">
                    Security
                  </RevolutText>
                  <RevolutText variant="caption" color={theme.colors.textSecondary}>
                    Documents are encrypted and stored locally
                  </RevolutText>
                </View>
              </View>
            </RevolutCard>

            {/* Device Section */}
            <RevolutCard shadow="medium" style={{ marginBottom: spacing.xl }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: spacing.sm,
              }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: theme.colors.info + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: spacing.md,
                }}>
                  <Smartphone size={iconSizes.lg} color={theme.colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <RevolutText variant="subtitle1">
                    Local Storage
                  </RevolutText>
                  <RevolutText variant="caption" color={theme.colors.textSecondary}>
                    Your documents are stored securely on this device only
                  </RevolutText>
                </View>
              </View>
            </RevolutCard>

            {/* Logout Button */}
            <RevolutButton
              title="Logout"
              onPress={handleLogout}
              variant="outline"
              fullWidth
              style={{
                borderColor: theme.colors.error,
                backgroundColor: 'transparent',
              }}
              textStyle={{ color: theme.colors.error }}
            />
          </ScrollView>
        </SafeAreaView>
    </View>
  );
}

