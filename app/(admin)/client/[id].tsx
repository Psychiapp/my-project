/**
 * Admin Dashboard - Client Detail View
 * View client info and delete account
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { PsychiColors, Shadows, Typography } from '@/constants/theme';
import {
  ChevronLeftIcon,
  UserCircleIcon,
  MailIcon,
  CalendarIcon,
} from '@/components/icons';
import { supabase } from '@/lib/supabase';
import { deleteUser } from '@/lib/database';

interface ClientInfo {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  subscription_tier?: string;
  total_sessions?: number;
}

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  const loadClient = useCallback(async () => {
    if (!id || !supabase) return;

    try {
      // Get client profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url, created_at')
        .eq('id', id)
        .eq('role', 'client')
        .single();

      if (profileError || !profile) {
        console.error('Error loading client:', profileError);
        setClient(null);
        return;
      }

      // Get session count
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('client_id', id);

      setClient({
        ...profile,
        total_sessions: sessionCount || 0,
      });
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadClient();
  }, [loadClient]);

  const handleDelete = async () => {
    if (!client) return;

    Alert.alert(
      'Delete Client Account',
      `This action is permanent. Are you sure you want to delete ${client.full_name}'s account? All their data will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Permanently',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const result = await deleteUser(client.id);
              if (result.success) {
                Alert.alert('Success', 'Client account has been permanently deleted.', [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              } else {
                Alert.alert('Error', `Failed to delete account: ${result.error || 'Unknown error'}`);
              }
            } catch (error: any) {
              console.error('Error deleting client:', error);
              Alert.alert('Error', `Failed to delete account: ${error.message || 'Unknown error'}`);
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Client Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PsychiColors.royalBlue} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!client) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Client Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Client not found</Text>
            <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
              <Text style={styles.backLinkText}>Go back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Client Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {client.avatar_url ? (
                <Image source={{ uri: client.avatar_url }} style={styles.avatar} />
              ) : (
                <UserCircleIcon size={80} color={PsychiColors.textMuted} />
              )}
            </View>
            <Text style={styles.name}>{client.full_name}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${client.email}`)}>
              <Text style={styles.email}>{client.email}</Text>
            </TouchableOpacity>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>Client</Text>
            </View>
          </View>

          {/* Account Info */}
          <Text style={styles.sectionTitle}>Account Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <CalendarIcon size={18} color={PsychiColors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {new Date(client.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <MailIcon size={18} color={PsychiColors.textMuted} />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Total Sessions</Text>
                <Text style={styles.infoValue}>{client.total_sessions || 0}</Text>
              </View>
            </View>
          </View>

          {/* Delete Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator size="small" color={PsychiColors.white} />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Account</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: PsychiColors.divider,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Typography.fontSize.lg,
    color: PsychiColors.textSecondary,
    marginBottom: 16,
  },
  backLink: {
    padding: 12,
  },
  backLinkText: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.royalBlue,
    fontWeight: Typography.fontWeight.medium,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  profileCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...Shadows.soft,
  },
  avatarContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: PsychiColors.frost,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 16,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  name: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  email: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.royalBlue,
    marginBottom: 12,
  },
  roleBadge: {
    backgroundColor: PsychiColors.frost,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.textMuted,
    fontWeight: Typography.fontWeight.medium,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.midnight,
    marginTop: 24,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: 12,
    padding: 16,
    ...Shadows.soft,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoContent: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: Typography.fontSize.xs,
    color: PsychiColors.textMuted,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: Typography.fontSize.base,
    color: PsychiColors.textPrimary,
  },
  infoDivider: {
    height: 1,
    backgroundColor: PsychiColors.divider,
    marginVertical: 4,
  },
  actionContainer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: PsychiColors.divider,
  },
  deleteButton: {
    backgroundColor: PsychiColors.error,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: PsychiColors.white,
  },
});
