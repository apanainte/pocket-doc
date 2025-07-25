import React, { useState, useEffect, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Plus, Library, User } from 'lucide-react-native';
import SimpleAuthScreen from '@/components/SimpleAuthScreen';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabLayout() {
  const { theme, spacing, borderRadius } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuthStatus = useCallback(async () => {
    try {
      // For testing, always require authentication
      // const token = await SecureStore.getItemAsync('auth_token');
      // setIsAuthenticated(!!token);
      
      // Force authentication screen for now
      setIsAuthenticated(false);
      console.log('Authentication required');
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleAuthenticated = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isAuthenticated) {
    return <SimpleAuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : spacing.sm,
          paddingTop: spacing.sm,
          paddingHorizontal: spacing.lg,
          borderRadius: 16,
          marginHorizontal: spacing.md,
          marginBottom: spacing.sm,
          ...theme.shadows.medium,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          letterSpacing: 0.2,
          textTransform: 'capitalize',
        },
        tabBarItemStyle: {
          paddingTop: spacing.xs,
          borderRadius: borderRadius.md,
        },
        tabBarItemTransitionDuration: 300,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Library',
          tabBarIcon: ({ size, color }) => (
            <Library 
              size={size} 
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="upload"
        options={{
          title: '',
          tabBarIcon: ({ size, color }) => (
            <Plus 
              size={size + 4} 
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User 
              size={size} 
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}