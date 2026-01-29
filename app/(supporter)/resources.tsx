import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BookIcon, AlertTriangleIcon, ShieldIcon, PhoneIcon, DocumentIcon, LightbulbIcon, HelpIcon, ArrowLeftIcon, LockIcon, ClipboardIcon } from '@/components/icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PDFResource {
  id: string;
  title: string;
  description: string;
  filename: string;
  category: 'handbook' | 'crisis' | 'conduct' | 'legal';
  Icon: React.FC<{ size?: number; color?: string }>;
  route?: string; // Optional route for in-app screens
}

const pdfResources: PDFResource[] = [
  {
    id: 'handbook',
    title: 'Supporter Handbook',
    description: 'Your comprehensive guide to being a Psychi Supporter. Covers session protocols, communication techniques, and professional boundaries.',
    filename: 'Supporter Handbook.pdf',
    category: 'handbook',
    Icon: BookIcon,
  },
  {
    id: 'diversion',
    title: 'Diversion Advice',
    description: 'Essential guidance for crisis situations. Learn how to recognize warning signs and safely redirect clients to professional resources.',
    filename: 'Supporter Diversion Advice.pdf',
    category: 'crisis',
    Icon: AlertTriangleIcon,
  },
  {
    id: 'conduct',
    title: 'Code of Conduct',
    description: 'Professional and ethical standards for all Psychi Supporters. Outlines expected behaviors and confidentiality requirements.',
    filename: 'Supporter Code of Conduct.pdf',
    category: 'conduct',
    Icon: ShieldIcon,
  },
  {
    id: 'confidentiality',
    title: 'Confidentiality Agreement',
    description: 'Your commitment to protecting client privacy. Review the terms you agreed to regarding confidential information.',
    filename: 'Confidentiality Agreement',
    category: 'legal',
    Icon: LockIcon,
    route: '/legal/confidentiality-agreement',
  },
  {
    id: 'terms',
    title: 'Terms of Service',
    description: 'The terms and conditions governing your use of the Psychi platform as a supporter.',
    filename: 'Terms of Service',
    category: 'legal',
    Icon: ClipboardIcon,
    route: '/legal/terms-of-service',
  },
  {
    id: 'privacy',
    title: 'Privacy Policy',
    description: 'How Psychi collects, uses, and protects your personal information and client data.',
    filename: 'Privacy Policy',
    category: 'legal',
    Icon: ShieldIcon,
    route: '/legal/privacy-policy',
  },
];

const crisisHotlines = [
  { label: '988', description: 'Suicide & Crisis Lifeline' },
  { label: 'Text HOME to 741741', description: 'Crisis Text Line' },
  { label: '911', description: 'Emergency' },
];

const getCategoryColors = (category: PDFResource['category']) => {
  switch (category) {
    case 'handbook':
      return {
        bg: 'rgba(74, 144, 226, 0.1)',
        border: 'rgba(74, 144, 226, 0.3)',
        color: '#4A90E2',
        gradient: ['#4A90E2', '#2E5C8A'] as const,
      };
    case 'crisis':
      return {
        bg: 'rgba(239, 68, 68, 0.1)',
        border: 'rgba(239, 68, 68, 0.3)',
        color: '#ef4444',
        gradient: ['#ef4444', '#dc2626'] as const,
      };
    case 'conduct':
      return {
        bg: 'rgba(139, 107, 150, 0.1)',
        border: 'rgba(139, 107, 150, 0.3)',
        color: '#8B6B96',
        gradient: ['#8B6B96', '#6B4F7A'] as const,
      };
    case 'legal':
      return {
        bg: 'rgba(107, 114, 128, 0.1)',
        border: 'rgba(107, 114, 128, 0.3)',
        color: '#6B7280',
        gradient: ['#6B7280', '#4B5563'] as const,
      };
  }
};

export default function ResourcesScreen() {
  const handleViewDocument = (resource: PDFResource) => {
    // If the resource has an in-app route, navigate there
    if (resource.route) {
      router.push(resource.route as any);
      return;
    }

    // For PDF documents, navigate to in-app document viewer
    router.push(`/document/${resource.id}` as any);
  };

  const handleCallHotline = (number: string) => {
    if (number === 'Text HOME to 741741') {
      Linking.openURL('sms:741741&body=HOME');
    } else {
      Linking.openURL(`tel:${number}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ArrowLeftIcon size={16} color={PsychiColors.azure} />
              <Text style={styles.backButtonText}> Back</Text>
            </View>
          </TouchableOpacity>
          <LinearGradient
            colors={['#87CEEB', '#4A90E2', '#2E5C8A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <Text style={styles.headerTitle}>Resources</Text>
            <Text style={styles.headerSubtitle}>
              Essential documents and guides to support your work as a Psychi Supporter
            </Text>
          </LinearGradient>
        </View>

        {/* Crisis Hotlines Quick Access */}
        <View style={styles.section}>
          <View style={styles.crisisCard}>
            <View style={styles.crisisHeader}>
              <View style={styles.crisisIconContainer}>
                <PhoneIcon size={22} color="#b91c1c" />
              </View>
              <View style={styles.crisisHeaderText}>
                <Text style={styles.crisisTitle}>Crisis Hotlines - Quick Reference</Text>
                <Text style={styles.crisisSubtitle}>
                  If a client is in immediate danger, direct them to these resources:
                </Text>
              </View>
            </View>
            <View style={styles.hotlinesContainer}>
              {crisisHotlines.map((hotline, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.hotlineChip}
                  onPress={() => handleCallHotline(hotline.label)}
                >
                  <Text style={styles.hotlineLabel}>{hotline.label}</Text>
                  <Text style={styles.hotlineDescription}>{hotline.description}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Required Documents - Training Materials */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <DocumentIcon size={20} color={PsychiColors.azure} />
            </View>
            <Text style={styles.sectionTitle}>Training Materials</Text>
          </View>

          {pdfResources.filter(r => r.category !== 'legal').map((resource) => {
            const colors = getCategoryColors(resource.category);
            return (
              <View
                key={resource.id}
                style={[
                  styles.documentCard,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <View style={styles.documentHeader}>
                  <View style={[styles.documentIconContainer, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                    <resource.Icon size={26} color={colors.color} />
                  </View>
                  <View style={styles.documentTitleContainer}>
                    <Text style={styles.documentTitle}>{resource.title}</Text>
                    <View style={[styles.pdfBadge, { backgroundColor: colors.color + '20' }]}>
                      <Text style={[styles.pdfBadgeText, { color: colors.color }]}>PDF</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.documentDescription}>{resource.description}</Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewDocument(resource)}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View Document</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Legal Documents */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <ShieldIcon size={20} color={PsychiColors.textSecondary} />
            </View>
            <Text style={styles.sectionTitle}>Legal & Policies</Text>
          </View>

          {pdfResources.filter(r => r.category === 'legal').map((resource) => {
            const colors = getCategoryColors(resource.category);
            return (
              <View
                key={resource.id}
                style={[
                  styles.documentCard,
                  { backgroundColor: colors.bg, borderColor: colors.border },
                ]}
              >
                <View style={styles.documentHeader}>
                  <View style={[styles.documentIconContainer, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                    <resource.Icon size={26} color={colors.color} />
                  </View>
                  <View style={styles.documentTitleContainer}>
                    <Text style={styles.documentTitle}>{resource.title}</Text>
                  </View>
                </View>
                <Text style={styles.documentDescription}>{resource.description}</Text>
                <TouchableOpacity
                  style={styles.viewButton}
                  onPress={() => handleViewDocument(resource)}
                >
                  <LinearGradient
                    colors={colors.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.viewButtonGradient}
                  >
                    <Text style={styles.viewButtonText}>View Document</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Getting Started Tips */}
        <View style={styles.section}>
          <View style={styles.tipsCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <LightbulbIcon size={20} color={PsychiColors.azure} />
              </View>
              <Text style={styles.sectionTitle}>Getting Started</Text>
            </View>
            <View style={styles.tipsContainer}>
              {[
                { num: '1', title: 'Start with the Handbook', desc: 'Your complete guide to being a supporter' },
                { num: '2', title: 'Review Code of Conduct', desc: 'Understand professional standards' },
                { num: '3', title: 'Learn Diversion Advice', desc: 'Critical crisis response skills' },
              ].map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <LinearGradient
                    colors={['#4A90E2', '#2E5C8A']}
                    style={styles.tipNumber}
                  >
                    <Text style={styles.tipNumberText}>{tip.num}</Text>
                  </LinearGradient>
                  <View style={styles.tipContent}>
                    <Text style={styles.tipTitle}>{tip.title}</Text>
                    <Text style={styles.tipDescription}>{tip.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Contact Support */}
        <View style={styles.section}>
          <View style={styles.contactCard}>
            <View style={styles.contactIconContainer}>
              <HelpIcon size={28} color={PsychiColors.azure} />
            </View>
            <Text style={styles.contactTitle}>Need Help?</Text>
            <Text style={styles.contactDescription}>
              Have questions about these documents? Contact the Psychi support team.
            </Text>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:psychiapp@outlook.com')}
            >
              <LinearGradient
                colors={['#4A90E2', '#2E5C8A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.contactButtonGradient}
              >
                <Text style={styles.contactButtonText}>Contact Support</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  header: {
    paddingHorizontal: Spacing.md,
  },
  backButton: {
    paddingVertical: Spacing.sm,
  },
  backButtonText: {
    fontSize: 16,
    color: PsychiColors.azure,
    fontWeight: '500',
  },
  headerBanner: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.xs,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: PsychiColors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 22,
  },
  section: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionIconContainer: {
    marginRight: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  // Crisis Card
  crisisCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  crisisHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  crisisIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  crisisHeaderText: {
    flex: 1,
  },
  crisisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#b91c1c',
    marginBottom: 4,
  },
  crisisSubtitle: {
    fontSize: 13,
    color: '#dc2626',
    lineHeight: 18,
  },
  hotlinesContainer: {
    gap: Spacing.sm,
  },
  hotlineChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    ...Shadows.soft,
  },
  hotlineLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b91c1c',
  },
  hotlineDescription: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  // Document Card
  documentCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    ...Shadows.soft,
  },
  documentTitleContainer: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  pdfBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  pdfBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  documentDescription: {
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  viewButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  viewButtonGradient: {
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
  },
  viewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  // Tips Card
  tipsCard: {
    backgroundColor: 'rgba(135, 206, 235, 0.15)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  tipsContainer: {
    gap: Spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipNumber: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  tipNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: PsychiColors.white,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.midnight,
  },
  tipDescription: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginTop: 2,
  },
  // Contact Card
  contactCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(176, 224, 230, 0.4)',
  },
  contactIconContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  contactTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.xs,
  },
  contactDescription: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  contactButton: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  contactButtonGradient: {
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.lg,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
