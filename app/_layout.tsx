/**
 * Root Layout Component
 * 
 * This is the main layout component that wraps the entire app.
 * It handles:
 * - Font loading and initialization
 * - Database initialization
 * - Theme provider setup
 * - Error boundary for crash handling
 * - Navigation structure
 * - Splash screen management
 */

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts } from 'expo-font';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold
} from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { databaseService } from '@/services/database';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AppProvider } from '@/contexts/AppContext';
import { initializeMonitoring } from '@/services/monitoring';
import { performanceMonitoringService } from '@/services/performanceMonitoring';

// Prevent splash screen from auto-hiding until fonts are loaded
SplashScreen.preventAutoHideAsync();

/**
 * Root Layout Component
 * 
 * This component is the entry point for the entire app.
 * It sets up all the necessary providers and initializes core services.
 */
export default function RootLayout() {
  // Initialize framework and check if it's ready
  useFrameworkReady();
  
  // Load custom fonts from Google Fonts
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  // Initialize core services when the app starts
  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize monitoring services first
        initializeMonitoring();
        console.log('Monitoring services initialized');

        // Initialize database
        await databaseService.initialize();
        console.log('Database initialized in root layout');

        // OCR service initialization no longer needed - using direct OpenAI API calls

        // Performance monitoring is automatically initialized
        console.log('Performance monitoring initialized');
      } catch (error) {
        console.error('Failed to initialize services in root layout:', error);
      }
    };

    initializeServices();
  }, []);

  // Hide splash screen once fonts are loaded (or failed to load)
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Show nothing while fonts are loading
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // App Provider: Provides app-wide state and authentication
    <AppProvider>
      {/* Theme Provider: Provides theme context to all child components */}
      <ThemeProvider>
        {/* Error Boundary: Catches and handles JavaScript errors */}
        <ErrorBoundary>
          {/* Stack Navigator: Handles screen navigation */}
          <Stack screenOptions={{ headerShown: false }}>
            {/* Main tab navigation group */}
            <Stack.Screen name="(tabs)" />
            {/* 404 error page */}
            <Stack.Screen name="+not-found" />
          </Stack>
          {/* Status bar configuration */}
          <StatusBar style="auto" />
        </ErrorBoundary>
      </ThemeProvider>
    </AppProvider>
  );
}