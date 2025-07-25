import React from 'react';
import { View, TextInput, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useRouter } from 'expo-router';

interface SearchBarProps {
  placeholder?: string;
  onPress?: () => void;
  editable?: boolean;
  value?: string;
  onChangeText?: (text: string) => void;
}

export default function SearchBar({ 
  placeholder = "Search...", 
  onPress, 
  editable = true,
  value,
  onChangeText
}: SearchBarProps) {
  const { theme, spacing, borderRadius } = useTheme();
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push('/(tabs)/search');
    }
  };

  return (
    <View style={[styles.container, { marginTop: Platform.OS === 'ios' ? 60 : 40 }]}>
      <TouchableOpacity 
        style={[
          styles.searchContainer,
          {
            backgroundColor: theme.colors.surfaceSecondary,
            borderRadius: borderRadius.lg,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            ...theme.shadows.small,
          }
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Search 
          size={20} 
          color={theme.colors.textTertiary} 
          style={[styles.searchIcon, { marginRight: spacing.sm }]} 
        />
        <TextInput
          style={[
            styles.searchInput,
            {
              color: theme.colors.text,
              fontFamily: 'Inter-Medium',
              fontSize: 16,
              flex: 1,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          editable={false}
          pointerEvents="none"
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  searchIcon: {
    // Icon styling handled by props
  },
  searchInput: {
    // Input styling handled by props
  },
});