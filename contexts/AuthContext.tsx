import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getUserProfile } from '@/lib/database';
import { UserProfile, UserRole } from '@/types';
import { UserProfile as DbUserProfile } from '@/types/database';
import {
  isDemoLogin,
  getDemoProfile,
} from '@/constants/demo';
import { logDiagnostic, sendDiagnosticReport } from '@/lib/diagnosticLogger';

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
function transformDbProfile(dbProfile: DbUserProfile & { first_name?: string; last_name?: string }): UserProfile {
  // Prefer separate name fields, fallback to splitting full_name
  let firstName = dbProfile.first_name;
  let lastName = dbProfile.last_name;

  if (!firstName || !lastName) {
    const nameParts = (dbProfile.full_name || '').trim().split(' ').filter(Boolean);
    firstName = firstName || nameParts[0] || '';
    lastName = lastName || nameParts.slice(1).join(' ') || '';
  }

  return {
    id: dbProfile.id,
    email: dbProfile.email,
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    role: dbProfile.role,
    avatarUrl: dbProfile.avatar_url || undefined,
    createdAt: dbProfile.created_at,
    onboardingCompleted: Boolean(firstName && lastName),
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Ref to track when signup is in progress - prevents onAuthStateChange from
  // overwriting profile state during the signup flow race condition
  const isSigningUpRef = useRef(false);

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
        let session = null;
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error) {
            console.error('Error getting session:', error);
            // Clear corrupted session
            await supabase.auth.signOut();
            setIsLoading(false);
            return;
          }
          session = data.session;
        } catch (sessionError) {
          console.error('Session fetch crashed, clearing auth state:', sessionError);
          // Something went wrong, clear auth state
          try {
            await supabase.auth.signOut();
          } catch (e) {
            // Ignore signout errors
          }
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const authUser = { id: session.user.id, email: session.user.email || '' };
          setUser(authUser);

          // Fetch profile from database
          try {
            const userProfile = await fetchProfile(session.user.id);
            if (userProfile) {
              setProfile(userProfile);
            }
          } catch (profileError) {
            console.error('Profile fetch error:', profileError);
            // Don't crash, just continue without profile
          }
        }
      } catch (error) {
        console.error('Auth init error:', error);
        // Try to clear any corrupted state
        try {
          if (supabase) {
            await supabase.auth.signOut();
          }
        } catch (e) {
          // Ignore
        }
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
            // Skip profile fetch during signup - signUp() handles state directly
            // This prevents race condition where onAuthStateChange overwrites profile
            if (isSigningUpRef.current) {
              console.log('Skipping profile fetch during signup');
              return;
            }

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

      // Check for demo login first (disabled in production)
      const demoResult = getDemoProfile(email);
      if (isDemoLogin(email, password) && demoResult) {
        const { profile: demoProfile, role } = demoResult;

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
      // Set flag to prevent onAuthStateChange from interfering with signup flow
      isSigningUpRef.current = true;

      if (!supabase) {
        isSigningUpRef.current = false;
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
        logDiagnostic('SIGNUP', 'Signup successful, processing user', {
          userId: data.user.id,
          email: data.user.email,
          hasSession: !!data.session,
          sessionExpiresAt: data.session?.expires_at,
        });

        // CRITICAL FIX: Explicitly set the session in the Supabase client
        // This ensures the session is available immediately for subsequent requests
        // Without this, getSession() may return null because SecureStore write is async
        if (data.session) {
          logDiagnostic('SIGNUP', 'Explicitly setting session in Supabase client');
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });

          if (setSessionError) {
            logDiagnostic('SIGNUP', 'setSession failed', {
              error: setSessionError.message,
            });
          } else {
            logDiagnostic('SIGNUP', 'Session explicitly set successfully');
          }
        }

        // Verify session is now available
        const { data: sessionCheck } = await supabase.auth.getSession();
        logDiagnostic('SIGNUP', 'Session verification after setSession', {
          hasSession: !!sessionCheck?.session,
          sessionUserId: sessionCheck?.session?.user?.id || 'NO_SESSION',
          matchesSignupUser: sessionCheck?.session?.user?.id === data.user.id,
        });

        // Create profile in database using upsert to handle any existing partial profile
        // Use a timeout to prevent hanging if the database is slow or RLS blocks
        const now = new Date().toISOString();
        const upsertPayload = {
          id: data.user.id,
          email: data.user.email,
          full_name: '',
          role: role,
          avatar_url: null,
          created_at: now,
          updated_at: now,
        };

        logDiagnostic('SIGNUP', 'Attempting profile upsert', { upsertPayload });

        // Profile creation with timeout (10 seconds) - don't let it block signup
        const PROFILE_TIMEOUT_MS = 10000;
        let profileData = null;
        let profileError = null;

        try {
          const profilePromise = supabase
            .from('profiles')
            .upsert(upsertPayload, {
              onConflict: 'id',
              ignoreDuplicates: false
            })
            .select();

          const timeoutPromise = new Promise<{ data: null; error: { message: string } }>((resolve) => {
            setTimeout(() => {
              resolve({ data: null, error: { message: 'Profile creation timed out' } });
            }, PROFILE_TIMEOUT_MS);
          });

          const result = await Promise.race([profilePromise, timeoutPromise]);
          profileData = result.data;
          profileError = result.error;
        } catch (err) {
          profileError = { message: 'Profile creation failed unexpectedly' };
          logDiagnostic('SIGNUP', 'Profile upsert threw exception', { error: err });
        }

        if (profileError) {
          // Only send diagnostic report to Sentry when there's an actual error
          // Type-safe access to error properties (may be Supabase error or timeout error)
          const errorInfo = {
            message: profileError.message,
            code: (profileError as { code?: string }).code,
            details: (profileError as { details?: string }).details,
            hint: (profileError as { hint?: string }).hint,
          };

          sendDiagnosticReport('Signup Profile Creation Error', {
            signupUser: {
              id: data.user.id,
              email: data.user.email,
            },
            signupSession: {
              exists: !!data.session,
              expiresAt: data.session?.expires_at,
              accessTokenExists: !!data.session?.access_token,
            },
            sessionAfterDelay: {
              exists: !!sessionCheck?.session,
              userId: sessionCheck?.session?.user?.id || 'NO_SESSION',
              matchesSignupUser: sessionCheck?.session?.user?.id === data.user.id,
            },
            profileUpsert: {
              payload: upsertPayload,
              error: errorInfo,
            },
          });

          logDiagnostic('SIGNUP', 'Profile upsert failed - will retry in profile-setup', {
            error: profileError.message,
            code: errorInfo?.code,
          });
          // Continue - profile-setup will handle creation if this fails
        } else {
          logDiagnostic('SIGNUP', 'Profile created successfully', { profileData });
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

        // Clear signup flag - state is now set correctly
        isSigningUpRef.current = false;

        return { error: null, user: authUser };
      }

      isSigningUpRef.current = false;
      return { error: null, user: null };
    } catch (error) {
      isSigningUpRef.current = false;
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
