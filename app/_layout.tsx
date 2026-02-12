import { useEffect, ReactNode, useState } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useRootNavigationState } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { PsychiColors, Colors } from '@/constants/theme';
import { StripeConfig, SentryConfig } from '@/constants/config';
import ErrorBoundary from '@/components/ErrorBoundary';
import OfflineBanner from '@/components/OfflineBanner';
import DemoModeBanner from '@/components/DemoModeBanner';
import { setupDeepLinkListener, setupNotificationResponseListener } from '@/lib/deep-linking';

// Conditionally import Sentry to avoid crash in Expo Go
let Sentry: any = null;
try {
  Sentry = require('@sentry/react-native');
  if (SentryConfig.dsn && SentryConfig.enabled) {
    Sentry.init({
      dsn: SentryConfig.dsn,
      environment: SentryConfig.environment,
      enableAutoSessionTracking: true,
      tracesSampleRate: 0.2,
      debug: false,
    });
    console.log('Sentry initialized for', SentryConfig.environment);
  }
} catch (e) {
  console.log('Sentry not available (running in Expo Go)');
}

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

function RootLayout() {
  const colorScheme = useColorScheme();
  const rootNavigationState = useRootNavigationState();
  const [hasNavigatedToWelcome, setHasNavigatedToWelcome] = useState(false);

  // Navigate to welcome screen once navigation is ready
  useEffect(() => {
    if (rootNavigationState?.key && !hasNavigatedToWelcome) {
      setHasNavigatedToWelcome(true);
      // Small delay to ensure navigation is fully ready
      setTimeout(() => {
        router.replace('/(auth)/welcome');
      }, 100);
    }
  }, [rootNavigationState?.key, hasNavigatedToWelcome]);

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
              <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                <Stack.Screen name="index" options={{ headerShown: false }} />
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

// Wrap with Sentry if available (production builds), otherwise export directly
export default Sentry ? Sentry.wrap(RootLayout) : RootLayout;