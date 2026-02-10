import { useEffect, ReactNode, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { PsychiColors, Colors } from '@/constants/theme';
import { StripeConfig } from '@/constants/config';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
import DemoModeBanner from '@/components/DemoModeBanner';
import { setupDeepLinkListener, setupNotificationResponseListener } from '@/lib/deep-linking';

// Conditionally import Stripe to avoid crash in Expo Go
let StripeProvider: any = ({ children }: { children: ReactNode }) => children;
try {
  const stripe = require('@stripe/stripe-react-native');
  StripeProvider = stripe.StripeProvider;
} catch (e) {
  console.log('Stripe native module not available (running in Expo Go)');
}

// Custom Psychi theme
const PsychiLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: PsychiColors.azure,
    background: PsychiColors.cream,
    card: PsychiColors.white,
    text: '#2A2A2A',
    border: 'rgba(176, 224, 230, 0.3)',
    notification: PsychiColors.coral,
  },
};

const PsychiDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: PsychiColors.sky,
    background: PsychiColors.midnight,
    card: PsychiColors.sapphire,
    text: '#ECEDEE',
    border: 'rgba(74, 144, 226, 0.2)',
    notification: PsychiColors.coral,
  },
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [hasRedirected, setHasRedirected] = useState(false);

  // Always start at the welcome/home page on app launch
  useEffect(() => {
    if (!navigationState?.key || hasRedirected) return;

    // Only redirect if we're not already on the welcome page
    const isOnWelcome = segments[0] === '(auth)';
    if (!isOnWelcome) {
      router.replace('/(auth)/welcome');
    }
    setHasRedirected(true);
  }, [navigationState?.key, hasRedirected, segments]);

  // Set up deep linking and notification listeners
  useEffect(() => {
    const unsubscribeDeepLink = setupDeepLinkListener();
    const unsubscribeNotification = setupNotificationResponseListener();

    return () => {
      unsubscribeDeepLink();
      unsubscribeNotification();
    };
  }, []);

  return (
    <ErrorBoundary>
      <NetworkProvider>
        <StripeProvider
          publishableKey={StripeConfig.publishableKey || 'pk_test_placeholder'}
          merchantIdentifier="merchant.com.psychi.app"
        >
          <AuthProvider>
            <ThemeProvider value={colorScheme === 'dark' ? PsychiDarkTheme : PsychiLightTheme}>
              <DemoModeBanner />
              <OfflineBanner />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(client)" options={{ headerShown: false }} />
                <Stack.Screen name="(supporter)" options={{ headerShown: false }} />
                <Stack.Screen name="(admin)" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false, presentation: 'modal' }} />
                <Stack.Screen name="session" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
              </Stack>
              <StatusBar style="auto" />
            </ThemeProvider>
          </AuthProvider>
        </StripeProvider>
      </NetworkProvider>
    </ErrorBoundary>
  );
}
