import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { DocumentIcon, ChevronLeftIcon } from '@/components/icons';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';

export default function ClientDisclaimerScreen() {
  const [isLoading, setIsLoading] = useState(false);

  const handleViewPDF = async () => {
    setIsLoading(true);
    try {
      const pdfAsset = require('@/assets/documents/Client Disclaimer.pdf');
      const asset = Asset.fromModule(pdfAsset);
      await asset.downloadAsync();

      if (!asset.localUri) {
        throw new Error('Failed to load document');
      }

      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Not Available',
          'Document viewing is not available on this device.',
          [{ text: 'OK' }]
        );
        return;
      }

      await Sharing.shareAsync(asset.localUri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Client Disclaimer',
        UTI: 'com.adobe.pdf',
      });
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', 'Failed to open document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Client Disclaimer',
          headerShown: true,
        }}
      />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <DocumentIcon size={48} color={PsychiColors.azure} />
          </View>
          <Text style={styles.title}>Client Disclaimer</Text>
          <Text style={styles.description}>
            This document outlines important information about the peer support services
            provided through Psychi. Please read it carefully before using our services.
          </Text>

          <Text style={styles.sectionTitle}>Key Points:</Text>
          <View style={styles.bulletList}>
            <Text style={styles.bulletPoint}>
              {'\u2022'} Psychi provides peer support, not professional therapy or medical treatment
            </Text>
            <Text style={styles.bulletPoint}>
              {'\u2022'} Peer supporters are trained but are not licensed mental health professionals
            </Text>
            <Text style={styles.bulletPoint}>
              {'\u2022'} If you are experiencing a crisis, please contact emergency services
            </Text>
            <Text style={styles.bulletPoint}>
              {'\u2022'} Your use of this service is voluntary and at your own discretion
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.viewButton, isLoading && styles.viewButtonDisabled]}
            onPress={handleViewPDF}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={PsychiColors.white} />
            ) : (
              <Text style={styles.viewButtonText}>View Full Document</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.contactText}>
            Questions? Contact us at{' '}
            <Text
              style={styles.emailLink}
              onPress={() => Linking.openURL('mailto:support@psychi.app')}
            >
              support@psychi.app
            </Text>
          </Text>
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
  contentContainer: {
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: PsychiColors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    alignSelf: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bulletList: {
    alignSelf: 'stretch',
    marginBottom: Spacing.lg,
  },
  bulletPoint: {
    fontSize: 14,
    lineHeight: 22,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.xs,
    paddingLeft: Spacing.sm,
  },
  viewButton: {
    backgroundColor: PsychiColors.azure,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  viewButtonDisabled: {
    opacity: 0.7,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  contactText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    textAlign: 'center',
  },
  emailLink: {
    color: PsychiColors.azure,
    fontWeight: '500',
  },
});
