import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors } from '@/constants/theme';

// Entry point - redirect based on auth state
export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  // Show loading while checking auth state
  // Also wait for profile to load if user is authenticated
  if (isLoading || (isAuthenticated && !profile)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PsychiColors.azure} />
      </View>
    );
  }

  // If authenticated with profile, go to appropriate dashboard
  if (isAuthenticated && profile) {
    if (profile.role === 'supporter') {
      return <Redirect href="/(supporter)" />;
    } else if (profile.role === 'admin') {
      return <Redirect href="/(admin)" />;
    } else {
      return <Redirect href="/(client)" />;
    }
  }

  // Not authenticated - go to welcome
  return <Redirect href="/(auth)/welcome" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PsychiColors.cream,
  },
});
