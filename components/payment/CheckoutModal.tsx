import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PsychiColors, Spacing, BorderRadius, Shadows } from '@/constants/theme';
import { ChatIcon, PhoneIcon, VideoIcon, LockIcon, CheckIcon, CalendarIcon, ClockIcon, CloseIcon } from '@/components/icons';
import { createPaymentIntent, confirmPayment } from '@/lib/stripe';

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sessionType: 'chat' | 'phone' | 'video';
  supporterName: string;
  amount: number; // in cents
  date: string;
  time: string;
}

type CheckoutStep = 'review' | 'payment' | 'processing' | 'success';

export default function CheckoutModal({
  visible,
  onClose,
  onSuccess,
  sessionType,
  supporterName,
  amount,
  date,
  time,
}: CheckoutModalProps) {
  const [step, setStep] = useState<CheckoutStep>('review');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const formatted = cleaned.replace(/(\d{4})/g, '$1 ').trim();
    return formatted.substring(0, 19);
  };

  const formatExpiry = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc) {
      setError('Please fill in all card details');
      return;
    }

    setError(null);
    setStep('processing');

    try {
      // Create payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        metadata: {
          sessionType,
          supporterName,
          date,
          time,
        },
      });

      if (!paymentIntent?.clientSecret) {
        setError('Failed to initialize payment. Please try again.');
        setStep('payment');
        return;
      }

      // Confirm payment
      const result = await confirmPayment(paymentIntent.clientSecret);

      if (result?.success) {
        setStep('success');
        setTimeout(() => {
          onSuccess();
        }, 2000);
      } else {
        setError(result?.error || 'Payment failed');
        setStep('payment');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('An error occurred. Please try again.');
      setStep('payment');
    }
  };

  const resetAndClose = () => {
    setStep('review');
    setCardNumber('');
    setExpiry('');
    setCvc('');
    setError(null);
    onClose();
  };

  const renderReview = () => (
    <View style={styles.stepContent}>
      <View style={styles.iconWrapper}>
        {sessionType === 'chat' ? (
          <ChatIcon size={40} color={PsychiColors.azure} />
        ) : sessionType === 'phone' ? (
          <PhoneIcon size={40} color={PsychiColors.azure} />
        ) : (
          <VideoIcon size={40} color={PsychiColors.azure} />
        )}
      </View>
      <Text style={styles.title}>Confirm Booking</Text>
      <Text style={styles.subtitle}>Review your session details</Text>

      <View style={styles.detailsCard}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Session Type</Text>
          <Text style={styles.detailValue}>
            {sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Supporter</Text>
          <Text style={styles.detailValue}>{supporterName}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date</Text>
          <Text style={styles.detailValue}>{date}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Time</Text>
          <Text style={styles.detailValue}>{time}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.detailLabelBold}>Total</Text>
          <Text style={styles.detailValueBold}>{formatAmount(amount)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={() => setStep('payment')}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Continue to Payment</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPayment = () => (
    <View style={styles.stepContent}>
      <Text style={styles.title}>Payment Details</Text>
      <Text style={styles.subtitle}>Enter your card information</Text>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(v) => setCardNumber(formatCardNumber(v))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={PsychiColors.textSoft}
            keyboardType="numeric"
            maxLength={19}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>Expiry</Text>
            <TextInput
              style={styles.input}
              value={expiry}
              onChangeText={(v) => setExpiry(formatExpiry(v))}
              placeholder="MM/YY"
              placeholderTextColor={PsychiColors.textSoft}
              keyboardType="numeric"
              maxLength={5}
            />
          </View>
          <View style={{ width: Spacing.md }} />
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.inputLabel}>CVC</Text>
            <TextInput
              style={styles.input}
              value={cvc}
              onChangeText={setCvc}
              placeholder="123"
              placeholderTextColor={PsychiColors.textSoft}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>
      </View>

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalAmount}>{formatAmount(amount)}</Text>
      </View>

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handlePayment}
        activeOpacity={0.8}
      >
        <Text style={styles.primaryButtonText}>Pay {formatAmount(amount)}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => setStep('review')}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.secureNotice}>
        <LockIcon size={14} color={PsychiColors.textMuted} />
        <Text style={styles.secureText}>Payments are secure and encrypted</Text>
      </View>
    </View>
  );

  const renderProcessing = () => (
    <View style={styles.processingContent}>
      <ActivityIndicator size="large" color={PsychiColors.azure} />
      <Text style={styles.processingText}>Processing payment...</Text>
      <Text style={styles.processingSubtext}>Please don't close this screen</Text>
    </View>
  );

  const renderSuccess = () => (
    <View style={styles.successContent}>
      <View style={styles.successIcon}>
        <CheckIcon size={50} color={PsychiColors.success} />
      </View>
      <Text style={styles.successTitle}>Booking Confirmed!</Text>
      <Text style={styles.successSubtitle}>
        Your session with {supporterName} has been scheduled.
      </Text>
      <View style={styles.successDetails}>
        <View style={styles.successDetailRow}>
          <CalendarIcon size={16} color="#2A2A2A" />
          <Text style={styles.successDetail}>{date}</Text>
        </View>
        <View style={styles.successDetailRow}>
          <ClockIcon size={16} color="#2A2A2A" />
          <Text style={styles.successDetail}>{time}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={resetAndClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={resetAndClose} style={styles.closeButton}>
            <CloseIcon size={20} color={PsychiColors.textMuted} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {step === 'review' ? 'Checkout' : step === 'payment' ? 'Payment' : ''}
          </Text>
          <View style={styles.closeButton} />
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {step === 'review' && renderReview()}
          {step === 'payment' && renderPayment()}
          {step === 'processing' && renderProcessing()}
          {step === 'success' && renderSuccess()}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    backgroundColor: PsychiColors.white,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
  },
  stepContent: {
    alignItems: 'center',
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.lg,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
  },
  detailLabel: {
    fontSize: 15,
    color: PsychiColors.textMuted,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#2A2A2A',
  },
  detailLabelBold: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  detailValueBold: {
    fontSize: 18,
    fontWeight: '700',
    color: PsychiColors.azure,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.05)',
    marginVertical: Spacing.xs,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: PsychiColors.royalBlue,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: PsychiColors.white,
  },
  secondaryButton: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: PsychiColors.textMuted,
  },
  formContainer: {
    width: '100%',
    marginBottom: Spacing.lg,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2A2A2A',
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 16,
    color: '#2A2A2A',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  inputRow: {
    flexDirection: 'row',
  },
  errorContainer: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 14,
    color: PsychiColors.error,
    textAlign: 'center',
  },
  totalContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.soft,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2A2A2A',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: PsychiColors.azure,
  },
  secureNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  secureIconContainer: {
    marginRight: Spacing.xs,
  },
  secureText: {
    fontSize: 13,
    color: PsychiColors.textMuted,
  },
  processingContent: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2A2A2A',
    marginTop: Spacing.lg,
  },
  processingSubtext: {
    fontSize: 14,
    color: PsychiColors.textMuted,
    marginTop: Spacing.xs,
  },
  successContent: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  successIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2A2A2A',
    fontFamily: 'Georgia',
    marginBottom: Spacing.xs,
  },
  successSubtitle: {
    fontSize: 15,
    color: PsychiColors.textMuted,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  successDetails: {
    gap: Spacing.sm,
  },
  successDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  successDetail: {
    fontSize: 16,
    color: '#2A2A2A',
    fontWeight: '500',
  },
});
