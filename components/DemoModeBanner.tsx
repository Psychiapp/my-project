import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { PsychiColors, Spacing } from '@/constants/theme';

export default function DemoModeBanner() {
  const { isDemoMode } = useAuth();

  if (!isDemoMode) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🎭</Text>
      <Text style={styles.text}>Demo Mode - App Store Review</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    fontSize: 12,
    marginRight: Spacing.xs,
  },
  text: {
    color: PsychiColors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
