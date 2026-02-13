/**
 * Footer - Exact match to web app Footer.tsx
 * Includes crisis banner and navigation links
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { PsychiColors, Gradients, Spacing, BorderRadius, Typography } from '@/constants/theme';
import { ExternalUrls } from '@/constants/config';

interface FooterProps {
  onNavigate?: (screen: string) => void;
  onScrollToSection?: (section: string) => void;
}

// Footer link sections matching web app exactly
const footerLinks = {
  support: {
    title: 'Support',
    links: [
      { label: 'Get Support Now', action: 'signup' },
      { label: 'How It Works', action: 'scroll:how-it-works' },
      { label: 'Pricing', action: 'scroll:pricing' },
      { label: 'FAQ', action: 'scroll:faq' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', action: 'scroll:about' },
      { label: 'Contact', action: `email:${ExternalUrls.supportEmail}` },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Terms of Service', action: 'route:/legal/terms-of-service' },
      { label: 'Privacy Policy', action: 'route:/legal/privacy-policy' },
      { label: 'Code of Conduct', action: 'route:/legal/code-of-conduct' },
      { label: 'Safety Resources', action: 'route:/legal/diversion-advice' },
    ],
  },
};

export default function Footer({ onNavigate, onScrollToSection }: FooterProps) {
  const handleCrisisCall = () => {
    Linking.openURL('tel:988');
  };

  const handleCrisisText = () => {
    Linking.openURL('sms:741741?body=HOME');
  };

  const handleLinkPress = async (action: string) => {
    const [type, ...rest] = action.split(':');
    const value = rest.join(':'); // Rejoin in case URL contains colons

    switch (type) {
      case 'signup':
        router.push('/(auth)/sign-up');
        break;
      case 'scroll':
        // Scroll to section on the landing page
        onScrollToSection?.(value);
        break;
      case 'navigate':
        onNavigate?.(value);
        break;
      case 'email':
        Linking.openURL(`mailto:${value}`);
        break;
      case 'url':
        // Open in in-app browser for better UX (especially for PDFs)
        await WebBrowser.openBrowserAsync(value, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        });
        break;
      case 'route':
        // Navigate to in-app route
        router.push(value as any);
        break;
      default:
        router.push('/(auth)/sign-up');
    }
  };

  return (
    <View style={styles.container}>
      {/* Crisis Banner */}
      <LinearGradient
        colors={Gradients.crisisBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.crisisBanner}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel="Crisis resources available"
      >
        <Text style={styles.crisisText}>
          <Text style={styles.crisisLabel}>Need immediate help? </Text>
          Call or text{' '}
          <Text
            style={styles.crisisNumber}
            onPress={handleCrisisCall}
            accessibilityRole="link"
            accessibilityLabel="Call 988 Suicide and Crisis Lifeline"
            accessibilityHint="Opens phone dialer to call 988"
          >988</Text>
          {' '}(Suicide & Crisis Lifeline) or text{' '}
          <Text
            style={styles.crisisNumber}
            onPress={handleCrisisText}
            accessibilityRole="link"
            accessibilityLabel="Text HOME to Crisis Text Line"
            accessibilityHint="Opens messaging app"
          >HOME</Text>
          {' '}to{' '}
          <Text
            style={styles.crisisNumber}
            onPress={handleCrisisText}
            accessibilityRole="link"
            accessibilityLabel="Text 741741 Crisis Text Line"
            accessibilityHint="Opens messaging app"
          >741741</Text>
          {' '}(Crisis Text Line)
        </Text>
      </LinearGradient>

      {/* Main Footer */}
      <LinearGradient
        colors={Gradients.footer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.footer}
      >
        {/* Logo */}
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Psychi logo"
            accessibilityRole="image"
          />
          <Text style={styles.tagline} accessibilityRole="text">
            Peer support for everyone
          </Text>
        </View>

        {/* Links Grid - matches web app exactly */}
        <View style={styles.linksContainer}>
          {/* Row 1: Support & Company */}
          <View style={styles.linksRow}>
            {/* Support Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkHeader} accessibilityRole="header">{footerLinks.support.title}</Text>
              {footerLinks.support.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLinkPress(link.action)}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}
                >
                  <Text style={styles.link}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Company Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkHeader} accessibilityRole="header">{footerLinks.company.title}</Text>
              {footerLinks.company.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLinkPress(link.action)}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}
                >
                  <Text style={styles.link}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Row 2: Legal */}
          <View style={styles.linksRow}>
            {/* Legal Links */}
            <View style={styles.linkColumn}>
              <Text style={styles.linkHeader} accessibilityRole="header">{footerLinks.legal.title}</Text>
              {footerLinks.legal.links.map((link, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleLinkPress(link.action)}
                  accessibilityRole="link"
                  accessibilityLabel={link.label}
                  accessibilityHint="Opens in browser"
                >
                  <Text style={styles.link}>{link.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          <View style={styles.divider} />
          <Text style={styles.copyright}>
            © 2026 Psychi. All rights reserved.
          </Text>
          <Text style={styles.disclaimer}>
            Psychi is not a replacement for professional mental health care.
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },

  // Crisis Banner
  crisisBanner: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  crisisText: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: PsychiColors.white,
    textAlign: 'center',
    lineHeight: 22,
  },
  crisisLabel: {
    fontWeight: '600',
  },
  crisisNumber: {
    fontWeight: '700',
    textDecorationLine: 'underline',
  },

  // Main Footer
  footer: {
    paddingVertical: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
  },

  // Logo section
  logoSection: {
    marginBottom: Spacing['2xl'],
    alignItems: 'flex-start',
  },
  logo: {
    width: 160,
    height: 60,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(165, 180, 252, 0.8)',
  },

  // Links container
  linksContainer: {
    marginBottom: Spacing['2xl'],
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  linkColumn: {
    flex: 1,
  },
  linkHeader: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: PsychiColors.white,
    marginBottom: Spacing.md,
  },
  link: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(165, 180, 252, 0.6)',
    marginBottom: Spacing.sm,
  },

  // Bottom section
  bottomSection: {
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    marginBottom: Spacing.lg,
  },
  copyright: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.sm,
    color: 'rgba(165, 180, 252, 0.6)',
    marginBottom: Spacing.xs,
  },
  disclaimer: {
    fontFamily: Typography.fontFamily.sans,
    fontSize: Typography.fontSize.xs,
    color: 'rgba(165, 180, 252, 0.4)',
    textAlign: 'center',
  },
});
