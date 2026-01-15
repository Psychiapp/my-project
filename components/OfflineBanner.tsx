import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNetwork } from '@/contexts/NetworkContext';
import { PsychiColors, Spacing } from '@/constants/theme';

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetwork();
  const isOffline = isConnected === false || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <Text style={styles.text}>No internet connection</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  icon: {
    fontSize: 14,
    marginRight: Spacing.xs,
  },
  text: {
    color: PsychiColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
