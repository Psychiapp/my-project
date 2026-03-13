import React, { Component, ReactNode, ErrorInfo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates';
import { PsychiColors, Spacing, BorderRadius } from '@/constants/theme';
import { SadFaceIcon } from '@/components/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Report to Sentry in production
    try {
      const Sentry = require('@sentry/react-native');
      Sentry.captureException(error, {
        extra: {
          componentStack: errorInfo.componentStack,
        },
      });
    } catch (e) {
      // Sentry not available
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearDataAndRestart = async () => {
    try {
      // Clear all Supabase auth-related keys from SecureStore
      // These are the keys Supabase uses to store session data
      const keysToDelete = [
        'supabase.auth.token',
        'supabase-auth-token',
        'sb-auth-token',
        // Supabase may use project-specific keys
        'supabase.auth.session',
      ];

      for (const key of keysToDelete) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (e) {
          // Ignore individual key deletion errors
        }
      }

      // Also try to delete any keys that start with common prefixes
      // Note: SecureStore doesn't have a "list all keys" API, so we try common patterns

      Alert.alert(
        'Data Cleared',
        'Auth data has been cleared. The app will now restart.',
        [
          {
            text: 'OK',
            onPress: async () => {
              // Reload the app
              try {
                await Updates.reloadAsync();
              } catch (e) {
                // If Updates.reloadAsync() fails (e.g., in dev), just clear state
                this.setState({ hasError: false, error: null });
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Failed to clear data:', error);
      Alert.alert('Error', 'Failed to clear data. Please try reinstalling the app.');
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.content}>
            <SadFaceIcon size={64} color={PsychiColors.textMuted} />
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.clearButton]}
              onPress={this.handleClearDataAndRestart}
            >
              <Text style={[styles.buttonText, styles.clearButtonText]}>Clear Data & Restart</Text>
            </TouchableOpacity>
            <Text style={styles.helpText}>
              If "Try Again" doesn't work, tap "Clear Data & Restart" to reset the app.
            </Text>
            {this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.message}</Text>
                <Text style={styles.errorText}>{this.state.error.stack?.substring(0, 500)}</Text>
              </View>
            )}
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  button: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
  },
  buttonText: {
    color: PsychiColors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  clearButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: PsychiColors.textMuted,
    marginTop: Spacing.sm,
  },
  clearButtonText: {
    color: PsychiColors.textSecondary,
  },
  helpText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  errorDetails: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: BorderRadius.md,
    width: '100%',
  },
  errorTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: '#FF6B6B',
    fontFamily: 'monospace',
  },
});
