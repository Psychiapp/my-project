import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { UserProfile, UserRole } from '@/types';
import {
  isDemoLogin,
  getDemoProfile,
  DEMO_CLIENT_PROFILE,
  DEMO_SUPPORTER_PROFILE,
  DEMO_ADMIN_PROFILE,
} from '@/constants/demo';

interface AuthContextType {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, role: UserRole) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);

      // Check for demo login
      if (isDemoLogin(email, password)) {
        const { profile: demoProfile, role } = getDemoProfile(email);

        const mockUser = { id: demoProfile.id, email: demoProfile.email };
        setUser(mockUser);
        setIsDemoMode(true);

        // Set profile with proper structure
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

      // Regular authentication flow
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful login for non-demo users
      const mockUser = { id: 'user-1', email };
      setUser(mockUser);
      setIsDemoMode(false);

      // Determine role from email for demo
      const role: UserRole = email.includes('supporter') ? 'supporter' :
                             email.includes('admin') ? 'admin' : 'client';

      setProfile({
        id: mockUser.id,
        email,
        firstName: 'Demo',
        lastName: 'User',
        role,
        createdAt: new Date().toISOString(),
        onboardingCompleted: true,
      });

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock successful signup
      const mockUser = { id: 'user-' + Date.now(), email };
      setUser(mockUser);
      setIsDemoMode(false);
      setProfile({
        id: mockUser.id,
        email,
        firstName: '',
        lastName: '',
        role,
        createdAt: new Date().toISOString(),
        onboardingCompleted: false,
      });

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setProfile(null);
    setIsDemoMode(false);
    router.replace('/(auth)/welcome' as any);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { error: null };
    } catch (error) {
      return { error: error as Error };
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
