import React, { useState, useEffect } from 'react';
import {
  View,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Linking,
  ActivityIndicator,
  TextInput,
  Modal,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LogOut, Shield, User, Moon, Sun, Smartphone, Settings, Info, ExternalLink, Mail, Trash2, HardDrive, Lock, Key, Fingerprint, ChevronRight, Plus, Edit3, Folder, Tag, X } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { RevolutCard } from '@/components/ui/RevolutCard';
import { RevolutText } from '@/components/ui/RevolutText';
import { RevolutButton } from '@/components/ui/RevolutButton';
import { RevolutInput } from '@/components/ui/RevolutInput';
import { useTheme } from '@/contexts/ThemeContext';
import { databaseService } from '@/services/database';
import { AuthService, AuthMethod } from '@/services/auth';
import { Category } from '@/types/document';
import { useFocusEffect } from '@react-navigation/native';

const authService = new AuthService();

// Available category icons and colors
const categoryIcons = ['folder', 'receipt', 'file-text', 'user', 'briefcase', 'calculator', 'heart', 'plane', 'tag', 'star'];
const categoryColors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6B7280', '#84CC16', '#F97316'];

// Get screen dimensions for responsive design
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive spacing based on screen size
const getResponsiveSpacing = (baseSpacing: number) => {
  // Scale spacing for different iPhone sizes
  if (screenHeight < 700) return baseSpacing * 0.8; // iPhone SE/mini
  if (screenHeight > 900) return baseSpacing * 1.1; // iPhone Pro Max
  return baseSpacing; // Standard iPhone sizes
};

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode, isDark, spacing, borderRadius, iconSizes } = useTheme();
  
  // Responsive spacing
  const responsiveSpacing = {
    xs: getResponsiveSpacing(spacing.xs),
    sm: getResponsiveSpacing(spacing.sm),
    md: getResponsiveSpacing(spacing.md),
    lg: getResponsiveSpacing(spacing.lg),
    xl: getResponsiveSpacing(spacing.xl),
  };

  const [storageStats, setStorageStats] = useState<{
    documentCount: number;
    totalFileSize: number;
    averageFileSize: number;
    documentsWithOCR: number;
    ocrSuccessRate: number;
  } | null>(null);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);

  // Auth states
  const [authStatus, setAuthStatus] = useState<{
    isAuthenticated: boolean;
    authMethod: AuthMethod;
    biometricSupported: boolean;
    hasPasscode: boolean;
    biometricTypes: any[];
  } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Categories states
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryStats, setCategoryStats] = useState<Record<string, number>>({});
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState(categoryColors[0]);
  const [newCategoryIcon, setNewCategoryIcon] = useState(categoryIcons[0]);

  // Load storage stats, auth status, and categories when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadStorageStats();
      loadAuthStatus();
      loadCategories();
    }, [])
  );

  const loadStorageStats = async () => {
    setIsLoadingStorage(true);
    try {
      const stats = await databaseService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
      setStorageStats({
        documentCount: 0,
        totalFileSize: 0,
        averageFileSize: 0,
        documentsWithOCR: 0,
        ocrSuccessRate: 0,
      });
    } finally {
      setIsLoadingStorage(false);
    }
  };

  const loadAuthStatus = async () => {
    setIsLoadingAuth(true);
    try {
      const status = await authService.getAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Failed to load auth status:', error);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const [categoriesData, statsData] = await Promise.all([
        databaseService.getAllCategories(),
        databaseService.getCategoryStats()
      ]);
      setCategories(categoriesData);
      setCategoryStats(statsData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handlePasscodeSetup = () => {
    Alert.prompt(
      'Set Passcode',
      'Enter a 4-6 digit passcode for additional security:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Set',
          onPress: async (passcode) => {
            if (!passcode || passcode.length < 4) {
              Alert.alert('Invalid Passcode', 'Passcode must be at least 4 digits');
              return;
            }
            try {
              await authService.setPasscode(passcode);
              await loadAuthStatus();
              Alert.alert('Success', 'Passcode has been set successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to set passcode');
            }
          }
        }
      ],
      'secure-text'
    );
  };

  const handlePasscodeChange = () => {
    let oldPasscode = '';
    
    Alert.prompt(
      'Change Passcode',
      'Enter your current passcode:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: (current) => {
            if (!current) return;
            oldPasscode = current;
            
            Alert.prompt(
              'Change Passcode',
              'Enter your new passcode:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Change',
                  onPress: async (newPasscode) => {
                    if (!newPasscode || newPasscode.length < 4) {
                      Alert.alert('Invalid Passcode', 'Passcode must be at least 4 digits');
                      return;
                    }
                    try {
                      const success = await authService.changePasscode(oldPasscode, newPasscode);
                      if (success) {
                        await loadAuthStatus();
                        Alert.alert('Success', 'Passcode has been changed successfully');
                      } else {
                        Alert.alert('Error', 'Current passcode is incorrect');
                      }
                    } catch (error) {
                      Alert.alert('Error', 'Failed to change passcode');
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ],
      'secure-text'
    );
  };

  const handlePasscodeRemove = () => {
    Alert.alert(
      'Remove Passcode',
      'Are you sure you want to remove your passcode? This will reduce security.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.removePasscode();
              await loadAuthStatus();
              Alert.alert('Success', 'Passcode has been removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove passcode');
            }
          }
        }
      ]
    );
  };

  const handleAuthMethodChange = (method: AuthMethod) => {
    Alert.alert(
      'Change Authentication Method',
      `Switch to ${method === 'biometric' ? 'biometric only' : method === 'passcode' ? 'passcode only' : 'both biometric and passcode'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            try {
              await authService.setAuthMethod(method);
              await loadAuthStatus();
              Alert.alert('Success', 'Authentication method updated');
            } catch (error) {
              Alert.alert('Error', 'Failed to update authentication method');
            }
          }
        }
      ]
    );
  };

  const getAuthMethodText = (method: AuthMethod) => {
    switch (method) {
      case 'biometric': return 'Biometric only';
      case 'passcode': return 'Passcode only';
      case 'both': return 'Biometric + Passcode';
      default: return 'Not set';
    }
  };

  const getBiometricTypeText = (types: any[]) => {
    if (!types.length) return 'None available';
    if (types.includes(1)) return 'Face ID'; // FACIAL_RECOGNITION
    if (types.includes(2)) return 'Touch ID / Fingerprint'; // FINGERPRINT
    return 'Biometric authentication';
  };

  const handleStorageCleanup = async () => {
    Alert.alert(
      'Clean Up Storage',
      'This will remove orphaned files and temporary data. Your documents will not be affected. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clean Up',
          style: 'default',
          onPress: async () => {
            setIsCleaningUp(true);
            try {
              const result = await databaseService.cleanupStorage();
              if (result.success) {
                const savedMB = (result.reclaimedSpace / (1024 * 1024)).toFixed(2);
                Alert.alert(
                  'Cleanup Complete',
                  `Removed ${result.deletedFiles} orphaned file(s) and reclaimed ${savedMB} MB of storage.`,
                  [{ text: 'OK' }]
                );
                await loadStorageStats(); // Refresh stats
              } else {
                Alert.alert('Cleanup Failed', 'Unable to complete storage cleanup. Please try again.');
              }
            } catch (error) {
              console.error('Storage cleanup error:', error);
              Alert.alert('Error', 'Storage cleanup failed.');
            } finally {
              setIsCleaningUp(false);
            }
          },
        },
      ]
    );
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'PocketDoc stores all your documents locally on your device. We do not collect, store, or transmit any personal data or documents to external servers. Your privacy is our priority.',
      [{ text: 'OK' }]
    );
  };

  const handleContactDeveloper = () => {
    const email = 'support@pocketdoc.app';
    const subject = 'PocketDoc Support Request';
    const body = 'Hello PocketDoc team,\n\nI have a question about...\n\nApp Version: 1.1.0\nDevice: iOS/Android\n\nPlease describe your issue or question here.';
    
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    Linking.openURL(mailtoUrl).catch(() => {
      Alert.alert(
        'Contact Developer',
        `Please send your questions or feedback to:\n\n${email}`,
        [{ text: 'OK' }]
      );
    });
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

  const handleCategoryAdd = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor(categoryColors[0]);
    setNewCategoryIcon(categoryIcons[0]);
    setShowCategoryModal(true);
  };

  const handleCategoryEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryColor(category.color);
    setNewCategoryIcon(category.icon);
    setShowCategoryModal(true);
  };

  const handleCategoryDelete = (category: Category) => {
    const documentCount = categoryStats[category.id] || 0;
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? ${documentCount > 0 ? `${documentCount} document(s) will be uncategorized.` : ''}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deleteCategory(category.id);
              await loadCategories();
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete category');
            }
          }
        }
      ]
    );
  };

  const handleCategorySave = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Category name cannot be empty');
      return;
    }

    try {
      if (editingCategory) {
        // Update existing category
        await databaseService.updateCategory(editingCategory.id, {
          name: newCategoryName.trim(),
          color: newCategoryColor,
          icon: newCategoryIcon
        });
      } else {
        // Add new category
        await databaseService.addCategory({
          name: newCategoryName.trim(),
          color: newCategoryColor,
          icon: newCategoryIcon
        });
      }
      
      await loadCategories();
      setShowCategoryModal(false);
      Alert.alert('Success', `Category ${editingCategory ? 'updated' : 'created'} successfully`);
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingCategory ? 'update' : 'create'} category`);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <LinearGradient
        colors={theme.colors.backgroundGradient as [string, string]}
        style={{ flex: 1 }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {/* Compact Header - Consistent with Library */}
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
                  Settings
                </RevolutText>
                <RevolutText 
                  variant="caption" 
                  color={theme.colors.textSecondary}
                  style={{ marginTop: 2 }}
                >
                  Manage preferences and security
                </RevolutText>
              </View>
              
              {/* Quick Theme Toggle */}
              <TouchableOpacity
                onPress={cycleTheme}
                style={{
                  backgroundColor: theme.colors.surface,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderRadius: borderRadius.full,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                {isDark ? (
                  <Moon size={16} color={theme.colors.textSecondary} />
                ) : (
                  <Sun size={16} color={theme.colors.textSecondary} />
                )}
                <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ marginLeft: spacing.xs, fontSize: 12 }}>
                  {getThemeDisplayText()}
                </RevolutText>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingHorizontal: responsiveSpacing.md, // Reduced from lg to md (16px instead of 20px)
              paddingTop: responsiveSpacing.sm, // Reduced from md to sm  
              paddingBottom: responsiveSpacing.lg, // Reduced from xl to lg
            }}
            showsVerticalScrollIndicator={false}
          >
            {/* Categories Management - Optimized Layout */}
            <RevolutCard shadow="small" style={{ marginBottom: responsiveSpacing.sm, padding: responsiveSpacing.md }}> {/* Reduced padding and margin */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: responsiveSpacing.md, // Reduced from lg to md
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}> {/* Added flex: 1 for better space usage */}
                  <Folder size={18} color={theme.colors.secondary} /> {/* Reduced icon size */}
                  <RevolutText variant="subtitle1" style={{ marginLeft: responsiveSpacing.sm, fontSize: 17, fontWeight: '600' }}>
                    Categories ({categories.length})
                  </RevolutText>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}> {/* Added flexShrink: 0 */}
                  {isLoadingCategories && (
                    <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: responsiveSpacing.xs }} />
                  )}
                  <TouchableOpacity
                    onPress={handleCategoryAdd}
                    style={{
                      backgroundColor: theme.colors.primary,
                      paddingHorizontal: responsiveSpacing.sm, // Reduced padding
                      paddingVertical: responsiveSpacing.xs, // Reduced padding
                      borderRadius: borderRadius.md, // Reduced border radius
                      flexDirection: 'row',
                      alignItems: 'center',
                      minHeight: 36, // Reduced height
                    }}
                  >
                    <Plus size={14} color="#ffffff" />
                    <RevolutText variant="caption" color="#ffffff" style={{ marginLeft: 4, fontSize: 12 }}>
                      Add
                    </RevolutText>
                  </TouchableOpacity>
                </View>
              </View>

              {categories.length > 0 ? (
                <View style={{ gap: responsiveSpacing.xs }}> {/* Reduced gap from sm to xs */}
                  {categories.slice(0, showAllCategories ? categories.length : 3).map((category) => (
                    <TouchableOpacity
                      key={category.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: responsiveSpacing.sm, // Reduced from md to sm
                        paddingHorizontal: responsiveSpacing.md, // Reduced from lg to md
                        backgroundColor: theme.colors.background,
                        borderRadius: borderRadius.md, // Reduced from lg to md
                        minHeight: 56, // Reduced from 64 to 56
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                      }}
                      onPress={() => handleCategoryEdit(category)}
                    >
                      <View style={{
                        width: 28, // Reduced from 36 to 28
                        height: 28, // Reduced from 36 to 28
                        borderRadius: 14, // Reduced from 18 to 14
                        backgroundColor: category.color + '20',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: responsiveSpacing.sm, // Reduced from md to sm
                      }}>
                        <Tag size={14} color={category.color} /> {/* Reduced from 18 to 14 */}
                      </View>
                      <View style={{ flex: 1, marginRight: responsiveSpacing.sm }}> {/* Added marginRight for spacing */}
                        <RevolutText 
                          variant="body2" 
                          style={{ fontSize: 15, fontWeight: '500' }}
                          numberOfLines={1} // Prevent wrapping
                          ellipsizeMode="tail" // Add ellipsis if needed
                        >
                          {category.name}
                        </RevolutText>
                        <RevolutText 
                          variant="caption" 
                          color={theme.colors.textSecondary} 
                          style={{ fontSize: 12, marginTop: 1 }}
                          numberOfLines={1} // Prevent wrapping
                        >
                          {categoryStats[category.id] || 0} docs
                        </RevolutText>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}> {/* Added flexShrink: 0 */}
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCategoryEdit(category);
                          }}
                          style={{ 
                            padding: responsiveSpacing.xs, // Reduced padding
                            marginRight: 4, // Reduced margin
                            backgroundColor: theme.colors.surface,
                            borderRadius: borderRadius.sm, // Reduced border radius
                            minWidth: 32, // Reduced from 36
                            minHeight: 32, // Reduced from 36
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Edit3 size={12} color={theme.colors.textSecondary} /> {/* Reduced icon size */}
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleCategoryDelete(category);
                          }}
                          style={{ 
                            padding: responsiveSpacing.xs, // Reduced padding
                            backgroundColor: theme.colors.error + '10',
                            borderRadius: borderRadius.sm, // Reduced border radius
                            minWidth: 32, // Reduced from 36
                            minHeight: 32, // Reduced from 36
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                        >
                          <Trash2 size={12} color={theme.colors.error} /> {/* Reduced icon size */}
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {categories.length > 3 && (
                    <TouchableOpacity
                      onPress={() => setShowAllCategories(!showAllCategories)}
                      style={{
                        paddingVertical: responsiveSpacing.sm, // Reduced from md to sm
                        alignItems: 'center',
                        backgroundColor: theme.colors.surface,
                        borderRadius: borderRadius.md, // Reduced from lg to md
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        minHeight: 44, // Reduced from 52
                        justifyContent: 'center',
                      }}
                    >
                      <RevolutText variant="caption" color={theme.colors.primary} style={{ fontSize: 13, fontWeight: '500' }}>
                        {showAllCategories ? 'Show less' : `View all ${categories.length} categories`}
                      </RevolutText>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: responsiveSpacing.lg, // Reduced from xl to lg
                  backgroundColor: theme.colors.background,
                  borderRadius: borderRadius.md, // Reduced from lg to md
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                  <Folder size={28} color={theme.colors.textTertiary} /> {/* Reduced from 32 to 28 */}
                  <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ marginTop: responsiveSpacing.sm, textAlign: 'center', fontSize: 13 }}>
                    No categories yet
                  </RevolutText>
                  <RevolutText variant="caption" color={theme.colors.textTertiary} style={{ textAlign: 'center', fontSize: 11, marginTop: 2 }}>
                    Tap Add to create your first category
                  </RevolutText>
                </View>
              )}
            </RevolutCard>

            {/* Security Section - Optimized Layout */}
            <RevolutCard shadow="small" style={{ marginBottom: responsiveSpacing.sm, padding: responsiveSpacing.md }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: responsiveSpacing.md,
              }}>
                <Shield size={18} color={theme.colors.success} />
                <RevolutText variant="subtitle1" style={{ marginLeft: responsiveSpacing.sm, fontSize: 17, fontWeight: '600' }}>
                  Security
                </RevolutText>
                {isLoadingAuth && (
                  <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginLeft: responsiveSpacing.sm }} />
                )}
              </View>
              
              {authStatus && (
                <View style={{ gap: responsiveSpacing.xs }}>
                  {/* Current Authentication Method - Optimized */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: responsiveSpacing.sm,
                    paddingHorizontal: responsiveSpacing.md,
                    backgroundColor: theme.colors.background,
                    borderRadius: borderRadius.md,
                    minHeight: 56,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}>
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: theme.colors.success + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: responsiveSpacing.sm,
                    }}>
                      <Lock size={14} color={theme.colors.success} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                        {getAuthMethodText(authStatus.authMethod)}
                      </RevolutText>
                      <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        Current authentication method
                      </RevolutText>
                    </View>
                  </View>

                  {/* Biometric Settings - Optimized */}
                  <TouchableOpacity
                    onPress={() => handleAuthMethodChange('biometric')}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: responsiveSpacing.sm,
                      paddingHorizontal: responsiveSpacing.md,
                      backgroundColor: theme.colors.background,
                      borderRadius: borderRadius.md,
                      minHeight: 56,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      opacity: authStatus.biometricSupported ? 1 : 0.5,
                    }}
                    disabled={!authStatus.biometricSupported}
                  >
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: theme.colors.primary + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: responsiveSpacing.sm,
                    }}>
                      <Fingerprint size={14} color={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, marginRight: responsiveSpacing.sm }}>
                      <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                        Biometric Authentication
                      </RevolutText>
                      <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {authStatus.biometricSupported 
                          ? getBiometricTypeText(authStatus.biometricTypes)
                          : 'Not available on this device'
                        }
                      </RevolutText>
                    </View>
                    {authStatus.biometricSupported && (
                      <ChevronRight size={14} color={theme.colors.textTertiary} />
                    )}
                  </TouchableOpacity>

                  {/* Passcode Settings - Optimized */}
                  <TouchableOpacity
                    onPress={() => {
                      if (authStatus.hasPasscode) {
                        Alert.alert(
                          'Passcode Options',
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Change Passcode', onPress: handlePasscodeChange },
                            { text: 'Remove Passcode', onPress: handlePasscodeRemove, style: 'destructive' },
                            { text: 'Use Passcode Only', onPress: () => handleAuthMethodChange('passcode') },
                          ]
                        );
                      } else {
                        handlePasscodeSetup();
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: responsiveSpacing.sm,
                      paddingHorizontal: responsiveSpacing.md,
                      backgroundColor: theme.colors.background,
                      borderRadius: borderRadius.md,
                      minHeight: 56,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                    }}
                  >
                    <View style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: theme.colors.info + '20',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: responsiveSpacing.sm,
                    }}>
                      <Key size={14} color={theme.colors.info} />
                    </View>
                    <View style={{ flex: 1, marginRight: responsiveSpacing.sm }}>
                      <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                        Passcode Protection
                      </RevolutText>
                      <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                        {authStatus.hasPasscode ? 'Tap to manage passcode settings' : 'Set up 4-6 digit passcode'}
                      </RevolutText>
                    </View>
                    <ChevronRight size={14} color={theme.colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              )}
            </RevolutCard>

            {/* Storage Information - Optimized Layout */}
            <RevolutCard shadow="small" style={{ marginBottom: responsiveSpacing.sm, padding: responsiveSpacing.md }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: responsiveSpacing.md,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <HardDrive size={18} color={theme.colors.info} />
                  <RevolutText variant="subtitle1" style={{ marginLeft: responsiveSpacing.sm, fontSize: 17, fontWeight: '600' }}>
                    Storage
                  </RevolutText>
                </View>
                {isLoadingStorage && (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                )}
              </View>
              
              {/* Optimized Storage Statistics Grid */}
              {storageStats && (
                <View style={{
                  flexDirection: 'row',
                  marginBottom: responsiveSpacing.md,
                  gap: responsiveSpacing.xs, // Reduced gap
                }}>
                  <View style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    padding: responsiveSpacing.sm, // Reduced padding
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    minHeight: 64, // Reduced from 72
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}>
                    <RevolutText variant="h6" style={{ fontSize: 18, fontWeight: '700' }}>
                      {storageStats.documentCount}
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                      Documents
                    </RevolutText>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    padding: responsiveSpacing.sm,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    minHeight: 64,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}>
                    <RevolutText variant="h6" style={{ fontSize: 18, fontWeight: '700' }}>
                      {formatFileSize(storageStats.totalFileSize)}
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                      Total Size
                    </RevolutText>
                  </View>
                  <View style={{
                    flex: 1,
                    backgroundColor: theme.colors.background,
                    padding: responsiveSpacing.sm,
                    borderRadius: borderRadius.md,
                    alignItems: 'center',
                    minHeight: 64,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}>
                    <RevolutText variant="h6" style={{ fontSize: 18, fontWeight: '700' }}>
                      {storageStats.ocrSuccessRate.toFixed(0)}%
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                      OCR Success
                    </RevolutText>
                  </View>
                </View>
              )}

              {/* Storage Cleanup - Optimized */}
              <TouchableOpacity
                onPress={handleStorageCleanup}
                disabled={isCleaningUp}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: responsiveSpacing.sm,
                  paddingHorizontal: responsiveSpacing.md,
                  backgroundColor: theme.colors.background,
                  borderRadius: borderRadius.md,
                  minHeight: 56,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  opacity: isCleaningUp ? 0.6 : 1,
                }}
              >
                <View style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: theme.colors.warning + '20',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: responsiveSpacing.sm,
                }}>
                  {isCleaningUp ? (
                    <ActivityIndicator size="small" color={theme.colors.warning} />
                  ) : (
                    <Trash2 size={14} color={theme.colors.warning} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                    {isCleaningUp ? 'Cleaning up...' : 'Clean Up Storage'}
                  </RevolutText>
                  <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                    Remove temporary files and cache
                  </RevolutText>
                </View>
              </TouchableOpacity>
            </RevolutCard>

            {/* About Section - Optimized Layout */}
            <RevolutCard shadow="small" style={{ marginBottom: responsiveSpacing.sm, padding: responsiveSpacing.md }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: responsiveSpacing.md,
              }}>
                <Info size={18} color={theme.colors.primary} />
                <RevolutText variant="subtitle1" style={{ marginLeft: responsiveSpacing.sm, fontSize: 17, fontWeight: '600' }}>
                  About
                </RevolutText>
              </View>
              
              {/* Optimized Info Grid */}
              <View style={{ gap: responsiveSpacing.xs }}>
                <TouchableOpacity
                  onPress={handlePrivacyPolicy}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: responsiveSpacing.sm,
                    paddingHorizontal: responsiveSpacing.md,
                    backgroundColor: theme.colors.background,
                    borderRadius: borderRadius.md,
                    minHeight: 56,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.secondary + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: responsiveSpacing.sm,
                  }}>
                    <Shield size={14} color={theme.colors.secondary} />
                  </View>
                  <View style={{ flex: 1, marginRight: responsiveSpacing.sm }}>
                    <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                      Privacy Policy
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                      Local storage only - No cloud sync
                    </RevolutText>
                  </View>
                  <ExternalLink size={12} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleContactDeveloper}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: responsiveSpacing.sm,
                    paddingHorizontal: responsiveSpacing.md,
                    backgroundColor: theme.colors.background,
                    borderRadius: borderRadius.md,
                    minHeight: 56,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                  }}
                >
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.success + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: responsiveSpacing.sm,
                  }}>
                    <Mail size={14} color={theme.colors.success} />
                  </View>
                  <View style={{ flex: 1, marginRight: responsiveSpacing.sm }}>
                    <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                      Contact Support
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                      Get help, report issues & share feedback
                    </RevolutText>
                  </View>
                  <ExternalLink size={12} color={theme.colors.textTertiary} />
                </TouchableOpacity>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: responsiveSpacing.sm,
                  paddingHorizontal: responsiveSpacing.md,
                  backgroundColor: theme.colors.background,
                  borderRadius: borderRadius.md,
                  minHeight: 56,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }}>
                  <View style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: theme.colors.info + '20',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: responsiveSpacing.sm,
                  }}>
                    <Smartphone size={14} color={theme.colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <RevolutText variant="body2" style={{ fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                      Version 1.1.0
                    </RevolutText>
                    <RevolutText variant="caption" color={theme.colors.textSecondary} style={{ fontSize: 12, marginTop: 1 }} numberOfLines={1}>
                      Latest release - Build 2024.12
                    </RevolutText>
                  </View>
                </View>
              </View>
            </RevolutCard>

            {/* Logout Button - Optimized */}
            <TouchableOpacity
              onPress={handleLogout}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: responsiveSpacing.md,
                borderWidth: 2,
                borderColor: theme.colors.error,
                borderRadius: borderRadius.lg,
                backgroundColor: 'transparent',
                minHeight: 52, // Reduced from 56
              }}
            >
              <LogOut size={18} color={theme.colors.error} />
              <RevolutText 
                variant="subtitle1" 
                color={theme.colors.error}
                style={{ marginLeft: responsiveSpacing.sm, fontSize: 16, fontWeight: '600' }}
              >
                Logout
              </RevolutText>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>

          {/* Category Modal */}
          <Modal
            visible={showCategoryModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowCategoryModal(false)}
          >
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
              <LinearGradient
                colors={theme.colors.backgroundGradient as [string, string]}
                style={{ flex: 1 }}
              >
                <SafeAreaView style={{ flex: 1 }}>
                  {/* Modal Header */}
                  <LinearGradient
                    colors={theme.colors.primaryGradient as [string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: spacing.lg,
                      paddingTop: spacing.lg,
                      paddingBottom: spacing.xl,
                      borderBottomLeftRadius: borderRadius.xl,
                      borderBottomRightRadius: borderRadius.xl,
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <RevolutText variant="h2" color="#ffffff">
                        {editingCategory ? 'Edit Category' : 'Add Category'}
                      </RevolutText>
                      <TouchableOpacity
                        onPress={() => setShowCategoryModal(false)}
                        style={{
                          padding: spacing.sm,
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: borderRadius.md,
                        }}
                      >
                        <X size={iconSizes.lg} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  </LinearGradient>

                  <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{
                      paddingHorizontal: spacing.lg,
                      paddingTop: spacing.xl,
                      paddingBottom: spacing.xl,
                    }}
                  >
                    {/* Category Name */}
                    <RevolutCard shadow="medium" style={{ marginBottom: spacing.lg }}>
                      <RevolutText variant="h6" style={{ marginBottom: spacing.md }}>
                        Category Name
                      </RevolutText>
                      <RevolutInput
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="Enter category name"
                        autoFocus={true}
                      />
                    </RevolutCard>

                    {/* Color Selection */}
                    <RevolutCard shadow="medium" style={{ marginBottom: spacing.lg }}>
                      <RevolutText variant="h6" style={{ marginBottom: spacing.md }}>
                        Color
                      </RevolutText>
                      <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: spacing.md,
                      }}>
                        {categoryColors.map((color) => (
                          <TouchableOpacity
                            key={color}
                            onPress={() => setNewCategoryColor(color)}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              backgroundColor: color,
                              borderWidth: newCategoryColor === color ? 3 : 0,
                              borderColor: theme.colors.primary,
                            }}
                          />
                        ))}
                      </View>
                    </RevolutCard>

                    {/* Icon Selection */}
                    <RevolutCard shadow="medium" style={{ marginBottom: spacing.xl }}>
                      <RevolutText variant="h6" style={{ marginBottom: spacing.md }}>
                        Icon
                      </RevolutText>
                      <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: spacing.md,
                      }}>
                        {categoryIcons.map((icon) => (
                          <TouchableOpacity
                            key={icon}
                            onPress={() => setNewCategoryIcon(icon)}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 25,
                              backgroundColor: newCategoryIcon === icon ? theme.colors.primary + '20' : theme.colors.surface,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderWidth: newCategoryIcon === icon ? 2 : 1,
                              borderColor: newCategoryIcon === icon ? theme.colors.primary : theme.colors.border,
                            }}
                          >
                            <Folder size={iconSizes.lg} color={newCategoryIcon === icon ? theme.colors.primary : theme.colors.textSecondary} />
                          </TouchableOpacity>
                        ))}
                      </View>
                    </RevolutCard>

                    {/* Save Button */}
                    <RevolutButton
                      title={editingCategory ? 'Update Category' : 'Create Category'}
                      onPress={handleCategorySave}
                      fullWidth
                    />
                  </ScrollView>
                </SafeAreaView>
              </LinearGradient>
            </View>
          </Modal>
    </View>
  );
}

