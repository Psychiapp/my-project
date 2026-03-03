import { useEffect, useState, useRef } from 'react';
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
  // Track if we should wait for profile to settle after auth state change
  const [isWaitingForProfile, setIsWaitingForProfile] = useState(false);
  const waitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // If authenticated but no profile, wait briefly for profile state to settle
  // This handles the race condition where user is set before profile during signup
  useEffect(() => {
    if (isAuthenticated && user && !profile && !isWaitingForProfile && !isCheckingMetadata) {
      setIsWaitingForProfile(true);

      // Wait 500ms for profile state to propagate before checking metadata
      waitTimeoutRef.current = setTimeout(() => {
        setIsWaitingForProfile(false);
      }, 500);
    }

    // If profile becomes available, cancel the wait
    if (profile && waitTimeoutRef.current) {
      clearTimeout(waitTimeoutRef.current);
      waitTimeoutRef.current = null;
      setIsWaitingForProfile(false);
    }

    return () => {
      if (waitTimeoutRef.current) {
        clearTimeout(waitTimeoutRef.current);
      }
    };
  }, [isAuthenticated, user, profile, isWaitingForProfile, isCheckingMetadata]);

  // If still no profile after waiting, try to get role from user metadata
  useEffect(() => {
    const getRoleFromMetadata = async () => {
      // Only check metadata if we've waited and still have no profile
      if (isAuthenticated && user && !profile && !isWaitingForProfile && supabase) {
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
  }, [isAuthenticated, user, profile, isWaitingForProfile]);

  // Show loading while checking auth state, waiting for profile, or checking metadata
  if (isLoading || isWaitingForProfile || isCheckingMetadata) {
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
