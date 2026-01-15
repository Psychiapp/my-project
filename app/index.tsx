import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PsychiColors } from '@/constants/theme';

export default function Index() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={PsychiColors.azure} />
      </View>
    );
  }

  // Not authenticated - go to auth
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Authenticated - redirect based on role
  if (profile?.role === 'supporter') {
    return <Redirect href="/(supporter)" />;
  }

  // Default to client
  return <Redirect href="/(client)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PsychiColors.cream,
  },
});
