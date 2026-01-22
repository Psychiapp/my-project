import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/database';
import { UserProfile, UserRole } from '@/types';
import { UserProfile as DbUserProfile } from '@/types/database';
import {
  isDemoLogin,
  getDemoProfile,
} from '@/constants/demo';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null; user?: { id: string; email: string } | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Transform database profile to app profile format
function transformDbProfile(dbProfile: DbUserProfile): UserProfile {
  const nameParts = (dbProfile.full_name || '').split(' ');
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    role: dbProfile.role,
    avatarUrl: dbProfile.avatar_url || undefined,
    createdAt: dbProfile.created_at,
    onboardingCompleted: true, // TODO: Add this field to database
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch user profile from database
  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    const dbProfile = await getUserProfile(userId);
    if (dbProfile) {
      return transformDbProfile(dbProfile);
    }
    return null;
  };

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (!supabase) {
          console.log('Supabase not configured, using demo mode only');
          setIsLoading(false);
          return;
        }

        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || '' };
          setUser(authUser);

          // Fetch profile from database
          const userProfile = await fetchProfile(session.user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth state changes
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event);

          if (event === 'SIGNED_IN' && session?.user) {
            const authUser = { id: session.user.id, email: session.user.email || '' };
            setUser(authUser);
            setIsDemoMode(false);

            // Fetch profile
            const userProfile = await fetchProfile(session.user.id);
            if (userProfile) {
              setProfile(userProfile);
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setIsDemoMode(false);
          }
        }
      );

      return () => {
        subscription.unsubscribe();
      };
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Check for demo login first
      if (isDemoLogin(email, password)) {
        const { profile: demoProfile, role } = getDemoProfile(email);

        const demoUser = { id: demoProfile.id, email: demoProfile.email };
        setUser(demoUser);
        setIsDemoMode(true);

        setProfile({
          id: demoProfile.id,
          email: demoProfile.email,
          firstName: demoProfile.full_name.split(' ')[0],
          lastName: demoProfile.full_name.split(' ').slice(1).join(' '),
          role: role,
          avatarUrl: demoProfile.avatar_url || undefined,
          createdAt: demoProfile.created_at,
          onboardingCompleted: true,
        });

        // Navigate to appropriate dashboard
        setTimeout(() => {
          if (role === 'supporter') {
            router.replace('/(supporter)' as any);
          } else if (role === 'admin') {
            router.replace('/(admin)' as any);
          } else {
            router.replace('/(client)' as any);
          }
        }, 100);

        return { error: null };
      }

      // Real Supabase authentication
      if (!supabase) {
        return { error: new Error('Supabase not configured. Use demo credentials to test.') };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        const authUser = { id: data.user.id, email: data.user.email || '' };
        setUser(authUser);
        setIsDemoMode(false);

        // Fetch profile from database
        const userProfile = await fetchProfile(data.user.id);
        if (userProfile) {
          setProfile(userProfile);

          // Navigate based on role
          setTimeout(() => {
            if (userProfile.role === 'supporter') {
              router.replace('/(supporter)' as any);
            } else if (userProfile.role === 'admin') {
              router.replace('/(admin)' as any);
            } else {
              router.replace('/(client)' as any);
            }
          }, 100);
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, role: UserRole) => {
    try {
      setIsLoading(true);

      if (!supabase) {
        return { error: new Error('Supabase not configured. Cannot create account.') };
      }

      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role,
          },
        },
      });

      if (error) {
        return { error: new Error(error.message) };
      }

      if (data.user) {
        // Create profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: '',
            role: role,
            avatar_url: null,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
          // Don't fail signup, profile might be created by trigger
        }

        const authUser = { id: data.user.id, email: data.user.email || '' };
        setUser(authUser);
        setIsDemoMode(false);
        setProfile({
          id: data.user.id,
          email: data.user.email || '',
          firstName: '',
          lastName: '',
          role,
          createdAt: new Date().toISOString(),
          onboardingCompleted: false,
        });

        return { error: null, user: authUser };
      }

      return { error: null, user: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      if (supabase && !isDemoMode) {
        await supabase.auth.signOut();
      }

      setUser(null);
      setProfile(null);
      setIsDemoMode(false);
      router.replace('/(auth)/welcome' as any);
    } catch (error) {
      console.error('Sign out error:', error);
      // Still clear local state even if Supabase signout fails
      setUser(null);
      setProfile(null);
      setIsDemoMode(false);
      router.replace('/(auth)/welcome' as any);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        return { error: new Error('No user logged in') };
      }

      // Update local state
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));

      // Update database if not in demo mode
      if (supabase && !isDemoMode) {
        const dbUpdates: Partial<DbUserProfile> = {};

        if (updates.firstName !== undefined || updates.lastName !== undefined) {
          const firstName = updates.firstName ?? profile?.firstName ?? '';
          const lastName = updates.lastName ?? profile?.lastName ?? '';
          dbUpdates.full_name = `${firstName} ${lastName}`.trim();
        }

        if (updates.avatarUrl !== undefined) {
          dbUpdates.avatar_url = updates.avatarUrl || null;
        }

        if (Object.keys(dbUpdates).length > 0) {
          const { error } = await supabase
            .from('profiles')
            .update(dbUpdates)
            .eq('id', user.id);

          if (error) {
            console.error('Error updating profile:', error);
            return { error: new Error(error.message) };
          }
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshProfile = async () => {
    if (user && !isDemoMode) {
      const userProfile = await fetchProfile(user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        isDemoMode,
        signIn,
        signUp,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
