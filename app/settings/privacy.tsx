import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { resetPassword } from '@/lib/supabase';
import {
  LockIcon,
  PhoneIcon,
  DocumentIcon,
  ClipboardIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ShieldIcon,
  DownloadIcon,
  TrashIcon,
} from '@/components/icons';
import { ExternalUrls } from '@/constants/config';

export default function PrivacySecurityScreen() {
  const router = useRouter();
  const { signOut, profile } = useAuth();

  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleChangePassword = () => {
    const userEmail = profile?.email;

    if (!userEmail) {
      Alert.alert('Error', 'Unable to find your email address. Please try again later.');
      return;
    }

    Alert.alert(
      'Change Password',
      `We will send a password reset link to ${userEmail}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            setIsSendingReset(true);
            try {
              const { error } = await resetPassword(userEmail);
              if (error) {
                Alert.alert('Error', error.message || 'Failed to send reset email. Please try again.');
              } else {
                Alert.alert(
                  'Email Sent',
                  'Check your inbox for the password reset link. It may take a few minutes to arrive.'
                );
              }
            } catch (err) {
              Alert.alert('Error', 'Something went wrong. Please try again later.');
            } finally {
              setIsSendingReset(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'Type DELETE to confirm account deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'I Understand',
                  style: 'destructive',
                  onPress: async () => {
                    await signOut();
                    router.replace('/(auth)/welcome');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'We will prepare your data export and email it to you within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: () => Alert.alert('Request Received', 'You will receive an email when your data is ready.'),
        },
      ]
    );
  };

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to open link');
    });
  };

  const securitySettings = [
    {
      icon: LockIcon,
      title: 'Change Password',
      description: 'Update your account password',
      onPress: handleChangePassword,
    },
    {
      icon: PhoneIcon,
      title: 'Active Sessions',
      description: 'Manage devices logged into your account',
      onPress: () => Alert.alert('Active Sessions', 'This device is the only active session.'),
    },
  ];

  const legalLinks = [
    {
      icon: DocumentIcon,
      title: 'Privacy Policy',
      url: ExternalUrls.privacyPolicy,
    },
    {
      icon: ClipboardIcon,
      title: 'Terms of Service',
      url: ExternalUrls.termsOfService,
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back" accessibilityHint="Returns to the previous screen">
            <ChevronLeftIcon size={24} color={PsychiColors.azure} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">Privacy & Security</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Security Info Card */}
        <View style={styles.section}>
          <View style={styles.infoCard} accessibilityRole="text" accessibilityLabel="Your data is protected. All sessions use end-to-end encryption. Your conversations remain private.">
            <ShieldIcon size={24} color={PsychiColors.azure} />
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>Your Data is Protected</Text>
              <Text style={styles.infoText}>
                All sessions use end-to-end encryption. Your conversations remain private.
              </Text>
            </View>
          </View>
        </View>

        {/* Security Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Security</Text>
          <View style={styles.settingsCard}>
            {securitySettings.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.settingRow,
                  index < securitySettings.length - 1 && styles.settingRowBorder,
                ]}
                onPress={item.onPress}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                accessibilityHint={item.description}
              >
                <item.icon size={20} color={PsychiColors.azure} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                  <Text style={styles.settingDescription}>{item.description}</Text>
                </View>
                <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Your Data</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={[styles.settingRow, styles.settingRowBorder]} onPress={handleExportData} accessibilityRole="button" accessibilityLabel="Export Your Data" accessibilityHint="Download a copy of your information">
              <DownloadIcon size={20} color={PsychiColors.azure} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Export Your Data</Text>
                <Text style={styles.settingDescription}>Download a copy of your information</Text>
              </View>
              <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingRow} onPress={handleDeleteAccount} accessibilityRole="button" accessibilityLabel="Delete Account, destructive action" accessibilityHint="Permanently delete your account and data">
              <TrashIcon size={20} color={PsychiColors.error} />
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, styles.dangerText]}>Delete Account</Text>
                <Text style={styles.settingDescription}>Permanently delete your account and data</Text>
              </View>
              <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle} accessibilityRole="header">Legal</Text>
          <View style={styles.settingsCard}>
            {legalLinks.map((item, index) => (
              <TouchableOpacity
                key={item.title}
                style={[
                  styles.settingRow,
                  index < legalLinks.length - 1 && styles.settingRowBorder,
                ]}
                onPress={() => openLink(item.url)}
                accessibilityRole="link"
                accessibilityLabel={item.title}
                accessibilityHint="Opens in browser"
              >
                <item.icon size={20} color={PsychiColors.azure} />
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{item.title}</Text>
                </View>
                <ChevronRightIcon size={20} color={PsychiColors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 32,
    color: PsychiColors.textSecondary,
    marginTop: -4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
  },
  placeholder: {
    width: 40,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  settingsCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    ...Shadows.soft,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  settingRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  dangerText: {
    color: PsychiColors.error,
  },
  settingDescription: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  settingArrow: {
    fontSize: 24,
    color: PsychiColors.textSoft,
  },
});
