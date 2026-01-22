import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { BlockIcon } from '@/components/icons';
import { blockUser } from '@/lib/database';
import { useAuth } from '@/contexts/AuthContext';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  blockedUserId: string;
  blockedUserName: string;
  onBlocked?: () => void;
}

export default function BlockUserModal({
  visible,
  onClose,
  blockedUserId,
  blockedUserName,
  onBlocked,
}: BlockUserModalProps) {
  const { user } = useAuth();
  const [isBlocking, setIsBlocking] = useState(false);

  const handleBlock = async () => {
    if (!user?.id) return;

    setIsBlocking(true);

    try {
      const success = await blockUser(user.id, blockedUserId);

      if (success) {
        Alert.alert(
          'User Blocked',
          `You have blocked ${blockedUserName}. They will no longer be able to contact you.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onBlocked?.();
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to block user. Please try again.');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      Alert.alert('Error', 'Failed to block user. Please try again.');
    } finally {
      setIsBlocking(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <BlockIcon size={48} color={PsychiColors.error} />
          </View>

          <Text style={styles.title}>Block {blockedUserName}?</Text>

          <Text style={styles.description}>
            When you block someone:
          </Text>

          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                They won't be able to message you
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                They won't appear in your supporter list
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                They won't be notified that you blocked them
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.bulletText}>
                You can unblock them anytime in Settings
              </Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
              disabled={isBlocking}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.blockButton, isBlocking && styles.blockButtonDisabled]}
              onPress={handleBlock}
              disabled={isBlocking}
            >
              {isBlocking ? (
                <ActivityIndicator color={PsychiColors.white} size="small" />
              ) : (
                <Text style={styles.blockButtonText}>Block</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  container: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    ...Shadows.medium,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: PsychiColors.midnight,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    fontSize: 15,
    color: PsychiColors.textSecondary,
    marginBottom: Spacing.sm,
  },
  bulletList: {
    marginBottom: Spacing.lg,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  bullet: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.textSecondary,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: PsychiColors.cream,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.textSecondary,
  },
  blockButton: {
    flex: 1,
    backgroundColor: PsychiColors.error,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  blockButtonDisabled: {
    opacity: 0.6,
  },
  blockButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
