/**
 * Tax Documents Screen
 * View and download 1099 tax forms
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import {
  ChevronLeftIcon,
  DocumentIcon,
  DownloadIcon,
  CheckIcon,
  ClockIcon,
  InfoIcon,
  AlertIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface TaxYear {
  year: number;
  status: 'available' | 'pending' | 'not_eligible' | 'processing';
  totalEarnings: number;
  formType: '1099-NEC' | '1099-K' | null;
  downloadUrl: string | null;
  availableDate: string | null;
}

const TAX_THRESHOLD = 60000; // $600 threshold for 1099 (in cents)

export default function TaxDocumentsScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [taxYears, setTaxYears] = useState<TaxYear[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  useEffect(() => {
    loadTaxData();
  }, [user?.id]);

  const loadTaxData = async () => {
    if (!user?.id || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      // Get supporter's total earnings
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_earnings')
        .eq('id', user.id)
        .single();

      const earnings = profile?.total_earnings || 0;
      setTotalEarnings(earnings);

      // Generate tax year data
      const currentYear = new Date().getFullYear();
      const years: TaxYear[] = [];

      // Previous year (forms should be available by Jan 31)
      const prevYear = currentYear - 1;
      const prevYearEarnings = earnings; // In production, calculate per-year earnings

      if (prevYearEarnings >= TAX_THRESHOLD) {
        const today = new Date();
        const formDeadline = new Date(currentYear, 0, 31); // Jan 31 of current year

        years.push({
          year: prevYear,
          status: today >= formDeadline ? 'available' : 'processing',
          totalEarnings: prevYearEarnings,
          formType: '1099-NEC',
          downloadUrl: today >= formDeadline ? `https://stripe.com/tax/${prevYear}` : null,
          availableDate: today >= formDeadline ? null : 'January 31, ' + currentYear,
        });
      } else if (prevYearEarnings > 0) {
        years.push({
          year: prevYear,
          status: 'not_eligible',
          totalEarnings: prevYearEarnings,
          formType: null,
          downloadUrl: null,
          availableDate: null,
        });
      }

      // Current year (in progress)
      years.push({
        year: currentYear,
        status: 'pending',
        totalEarnings: earnings,
        formType: earnings >= TAX_THRESHOLD ? '1099-NEC' : null,
        downloadUrl: null,
        availableDate: `January 31, ${currentYear + 1}`,
      });

      setTaxYears(years);
    } catch (error) {
      console.error('Error loading tax data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (taxYear: TaxYear) => {
    if (!taxYear.downloadUrl) {
      Alert.alert('Not Available', 'This document is not yet available for download.');
      return;
    }

    // In production, this would link to Stripe's tax document portal
    Alert.alert(
      'Download 1099-NEC',
      `This will open Stripe's secure portal to download your ${taxYear.year} tax documents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Stripe',
          onPress: () => {
            // Open Stripe Express dashboard for tax documents
            Linking.openURL('https://connect.stripe.com/express_login');
          },
        },
      ]
    );
  };

  const getStatusIcon = (status: TaxYear['status']) => {
    switch (status) {
      case 'available':
        return <CheckIcon size={16} color={PsychiColors.success} />;
      case 'processing':
        return <ClockIcon size={16} color={PsychiColors.warning} />;
      case 'pending':
        return <ClockIcon size={16} color={PsychiColors.azure} />;
      case 'not_eligible':
        return <InfoIcon size={16} color={PsychiColors.textMuted} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: TaxYear['status']) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'processing':
        return 'Processing';
      case 'pending':
        return 'In Progress';
      case 'not_eligible':
        return 'Not Required';
      default:
        return '';
    }
  };

  const getStatusColor = (status: TaxYear['status']) => {
    switch (status) {
      case 'available':
        return PsychiColors.success;
      case 'processing':
        return PsychiColors.warning;
      case 'pending':
        return PsychiColors.azure;
      case 'not_eligible':
        return PsychiColors.textMuted;
      default:
        return PsychiColors.textMuted;
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={PsychiColors.azure} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ChevronLeftIcon size={24} color={PsychiColors.midnight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tax Documents</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <InfoIcon size={20} color={PsychiColors.azure} />
          </View>
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>About 1099 Forms</Text>
            <Text style={styles.infoText}>
              If you earn $600 or more in a calendar year, you'll receive a 1099-NEC form for tax
              reporting. Forms are available by January 31st of the following year.
            </Text>
          </View>
        </View>

        {/* Current Year Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{new Date().getFullYear()} Earnings</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Earnings</Text>
              <Text style={styles.summaryValue}>${(totalEarnings / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>1099 Threshold</Text>
              <Text style={styles.summaryValue}>${(TAX_THRESHOLD / 100).toFixed(2)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>1099 Required?</Text>
              <Text style={[
                styles.summaryValue,
                { color: totalEarnings >= TAX_THRESHOLD ? PsychiColors.success : PsychiColors.textMuted }
              ]}>
                {totalEarnings >= TAX_THRESHOLD ? 'Yes' : 'Not Yet'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tax Documents List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Documents</Text>

          {taxYears.length === 0 ? (
            <View style={styles.emptyCard}>
              <DocumentIcon size={40} color={PsychiColors.textMuted} />
              <Text style={styles.emptyTitle}>No Documents Yet</Text>
              <Text style={styles.emptyText}>
                Tax documents will appear here once you've earned income through Psychi.
              </Text>
            </View>
          ) : (
            taxYears.map((taxYear) => (
              <View key={taxYear.year} style={styles.documentCard}>
                <View style={styles.documentHeader}>
                  <View style={styles.documentIcon}>
                    <DocumentIcon size={24} color={PsychiColors.azure} />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentTitle}>
                      {taxYear.year} Tax Year
                    </Text>
                    <Text style={styles.documentSubtitle}>
                      {taxYear.formType || 'No form required'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(taxYear.status)}15` }]}>
                    {getStatusIcon(taxYear.status)}
                    <Text style={[styles.statusText, { color: getStatusColor(taxYear.status) }]}>
                      {getStatusText(taxYear.status)}
                    </Text>
                  </View>
                </View>

                <View style={styles.documentDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Earnings</Text>
                    <Text style={styles.detailValue}>
                      ${(taxYear.totalEarnings / 100).toFixed(2)}
                    </Text>
                  </View>

                  {taxYear.status === 'not_eligible' && (
                    <Text style={styles.notEligibleText}>
                      Earnings below $600 threshold - no 1099 required
                    </Text>
                  )}

                  {taxYear.availableDate && taxYear.status !== 'not_eligible' && (
                    <Text style={styles.availableDateText}>
                      {taxYear.status === 'pending'
                        ? `Form will be available by ${taxYear.availableDate}`
                        : `Processing - expected by ${taxYear.availableDate}`
                      }
                    </Text>
                  )}
                </View>

                {taxYear.status === 'available' && (
                  <TouchableOpacity
                    style={styles.downloadButton}
                    onPress={() => handleDownload(taxYear)}
                    activeOpacity={0.8}
                  >
                    <DownloadIcon size={18} color={PsychiColors.white} />
                    <Text style={styles.downloadButtonText}>Download 1099-NEC</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>

        {/* Help Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Need Help?</Text>
          <View style={styles.helpCard}>
            <Text style={styles.helpText}>
              Tax documents are provided through Stripe. If you have questions about your 1099
              or need to update your tax information, you can access your Stripe dashboard.
            </Text>
            <TouchableOpacity
              style={styles.helpButton}
              onPress={() => Linking.openURL('https://connect.stripe.com/express_login')}
              activeOpacity={0.8}
            >
              <Text style={styles.helpButtonText}>Open Stripe Dashboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <AlertIcon size={16} color={PsychiColors.warning} />
          <Text style={styles.disclaimerText}>
            This information is provided for your convenience. Please consult a tax professional
            for advice specific to your situation.
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: PsychiColors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.md,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  infoIcon: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: PsychiColors.azure,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.md,
    fontFamily: Typography.fontFamily.serif,
  },
  summaryCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.sm,
  },
  emptyCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.soft,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.soft,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  documentSubtitle: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  documentDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  notEligibleText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  availableDateText: {
    fontSize: 13,
    color: PsychiColors.azure,
    marginTop: Spacing.sm,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PsychiColors.azure,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  helpCard: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    ...Shadows.soft,
  },
  helpText: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  helpButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: PsychiColors.azure,
    borderRadius: BorderRadius.md,
  },
  helpButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  disclaimerCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: PsychiColors.warning,
    lineHeight: 16,
  },
});
