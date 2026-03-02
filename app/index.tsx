import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { PsychiColors } from '@/constants/theme';
import { UserRole } from '@/types';

// Entry point - redirect based on auth state
export default function Index() {
  const { isAuthenticated, isLoading, profile, user } = useAuth();
  const [userMetadataRole, setUserMetadataRole] = useState<UserRole | null>(null);
  const [isCheckingMetadata, setIsCheckingMetadata] = useState(false);

  // If authenticated but no profile, try to get role from user metadata
  useEffect(() => {
    const getRoleFromMetadata = async () => {
      if (isAuthenticated && user && !profile && supabase) {
        setIsCheckingMetadata(true);
        try {
          const { data } = await supabase.auth.getUser();
          if (data?.user?.user_metadata?.role) {
            setUserMetadataRole(data.user.user_metadata.role as UserRole);
          }
        } catch (error) {
          console.error('Error fetching user metadata:', error);
        } finally {
          setIsCheckingMetadata(false);
        }
      }
    };

    getRoleFromMetadata();
  }, [isAuthenticated, user, profile]);

  // Show loading while checking auth state or metadata
  if (isLoading || isCheckingMetadata) {
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

  // If authenticated but no profile (new user or profile fetch failed)
  // Use the role from user metadata if available
  if (isAuthenticated && user && !profile) {
    // Note: This typically means the profile trigger didn't run or fetch failed
    // The user's intended role was stored in auth metadata during signup
    const role = userMetadataRole || 'client';
    return <Redirect href={`/profile-setup?role=${role}&missing=Profile%20not%20found`} />;
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
