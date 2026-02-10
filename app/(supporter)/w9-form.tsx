/**
 * W-9 Form Screen
 * Collects taxpayer information from supporters
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { PsychiColors, Spacing, BorderRadius, Shadows, Typography } from '@/constants/theme';
import {
  ChevronLeftIcon,
  CheckIcon,
  InfoIcon,
  AlertIcon,
} from '@/components/icons';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

type TaxClassification =
  | 'individual'
  | 'c_corporation'
  | 's_corporation'
  | 'partnership'
  | 'trust_estate'
  | 'llc_c'
  | 'llc_s'
  | 'llc_p'
  | 'other';

interface W9FormData {
  legal_name: string;
  business_name: string;
  tax_classification: TaxClassification;
  other_classification: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip_code: string;
  ssn_ein: string;
  certification_agreed: boolean;
}

const TAX_CLASSIFICATIONS: { value: TaxClassification; label: string }[] = [
  { value: 'individual', label: 'Individual/Sole Proprietor' },
  { value: 'c_corporation', label: 'C Corporation' },
  { value: 's_corporation', label: 'S Corporation' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'trust_estate', label: 'Trust/Estate' },
  { value: 'llc_c', label: 'LLC (taxed as C Corp)' },
  { value: 'llc_s', label: 'LLC (taxed as S Corp)' },
  { value: 'llc_p', label: 'LLC (taxed as Partnership)' },
  { value: 'other', label: 'Other' },
];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

export default function W9FormScreen() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showClassificationPicker, setShowClassificationPicker] = useState(false);
  const [showStatePicker, setShowStatePicker] = useState(false);

  const [formData, setFormData] = useState<W9FormData>({
    legal_name: '',
    business_name: '',
    tax_classification: 'individual',
    other_classification: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    ssn_ein: '',
    certification_agreed: false,
  });

  useEffect(() => {
    loadExistingW9();
  }, [user?.id]);

  const loadExistingW9 = async () => {
    if (!user?.id || !supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, w9_completed, w9_data')
        .eq('id', user.id)
        .single();

      if (profile) {
        setIsCompleted(profile.w9_completed || false);

        if (profile.w9_data) {
          const w9Data = typeof profile.w9_data === 'string'
            ? JSON.parse(profile.w9_data)
            : profile.w9_data;

          setFormData({
            legal_name: w9Data.legal_name || profile.full_name || '',
            business_name: w9Data.business_name || '',
            tax_classification: w9Data.tax_classification || 'individual',
            other_classification: w9Data.other_classification || '',
            address_line1: w9Data.address_line1 || '',
            address_line2: w9Data.address_line2 || '',
            city: w9Data.city || '',
            state: w9Data.state || '',
            zip_code: w9Data.zip_code || '',
            ssn_ein: maskSSN(w9Data.ssn_ein || ''),
            certification_agreed: w9Data.certification_agreed || false,
          });
        } else {
          setFormData(prev => ({
            ...prev,
            legal_name: profile.full_name || '',
          }));
        }
      }
    } catch (error) {
      console.error('Error loading W9 data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const maskSSN = (ssn: string): string => {
    if (!ssn || ssn.length < 4) return ssn;
    const lastFour = ssn.slice(-4);
    return `***-**-${lastFour}`;
  };

  const formatSSN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
  };

  const formatZip = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    return digits.slice(0, 5);
  };

  const validateForm = (): string | null => {
    if (!formData.legal_name.trim()) {
      return 'Please enter your legal name';
    }
    if (!formData.address_line1.trim()) {
      return 'Please enter your street address';
    }
    if (!formData.city.trim()) {
      return 'Please enter your city';
    }
    if (!formData.state) {
      return 'Please select your state';
    }
    if (!formData.zip_code || formData.zip_code.length < 5) {
      return 'Please enter a valid ZIP code';
    }

    // SSN validation - only if entering new (not masked)
    const ssnDigits = formData.ssn_ein.replace(/\D/g, '');
    if (!formData.ssn_ein.includes('*') && ssnDigits.length !== 9) {
      return 'Please enter a valid 9-digit SSN or EIN';
    }

    if (!formData.certification_agreed) {
      return 'You must agree to the certification to submit';
    }

    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      Alert.alert('Missing Information', error);
      return;
    }

    if (!user?.id || !supabase) {
      Alert.alert('Error', 'Unable to save. Please try again.');
      return;
    }

    setIsSaving(true);

    try {
      // Prepare W9 data (excluding the full SSN from storage - will be handled by Stripe)
      const w9Data = {
        legal_name: formData.legal_name.trim(),
        business_name: formData.business_name.trim(),
        tax_classification: formData.tax_classification,
        other_classification: formData.other_classification.trim(),
        address_line1: formData.address_line1.trim(),
        address_line2: formData.address_line2.trim(),
        city: formData.city.trim(),
        state: formData.state,
        zip_code: formData.zip_code,
        // Store only last 4 digits of SSN for verification
        ssn_ein: formData.ssn_ein.includes('*')
          ? formData.ssn_ein
          : `***-**-${formData.ssn_ein.slice(-4)}`,
        certification_agreed: true,
        submitted_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          w9_completed: true,
          w9_completed_at: new Date().toISOString(),
          w9_data: w9Data,
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setIsCompleted(true);

      Alert.alert(
        'W-9 Submitted',
        'Your W-9 information has been saved. You can update it anytime if your information changes.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.error('Error saving W9:', error);
      Alert.alert('Error', 'Failed to save W-9 information. Please try again.');
    } finally {
      setIsSaving(false);
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
        <Text style={styles.headerTitle}>W-9 Form</Text>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Status Banner */}
          {isCompleted && (
            <View style={styles.completedBanner}>
              <CheckIcon size={20} color={PsychiColors.success} />
              <Text style={styles.completedText}>
                W-9 on file. You can update your information below.
              </Text>
            </View>
          )}

          {/* Info Card */}
          <View style={styles.infoCard}>
            <InfoIcon size={18} color={PsychiColors.azure} />
            <Text style={styles.infoText}>
              This form is required by the IRS to report payments. Your information is encrypted and stored securely.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Legal Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Legal Name <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.helperText}>As shown on your tax return</Text>
              <TextInput
                style={styles.input}
                value={formData.legal_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, legal_name: text }))}
                placeholder="Enter your legal name"
                placeholderTextColor={PsychiColors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Business Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Business Name</Text>
              <Text style={styles.helperText}>If different from above (optional)</Text>
              <TextInput
                style={styles.input}
                value={formData.business_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, business_name: text }))}
                placeholder="Enter business name if applicable"
                placeholderTextColor={PsychiColors.textMuted}
                autoCapitalize="words"
              />
            </View>

            {/* Tax Classification */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Tax Classification <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowClassificationPicker(!showClassificationPicker)}
              >
                <Text style={styles.pickerButtonText}>
                  {TAX_CLASSIFICATIONS.find(c => c.value === formData.tax_classification)?.label}
                </Text>
              </TouchableOpacity>

              {showClassificationPicker && (
                <View style={styles.pickerOptions}>
                  {TAX_CLASSIFICATIONS.map((classification) => (
                    <TouchableOpacity
                      key={classification.value}
                      style={[
                        styles.pickerOption,
                        formData.tax_classification === classification.value && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, tax_classification: classification.value }));
                        setShowClassificationPicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.tax_classification === classification.value && styles.pickerOptionTextSelected
                      ]}>
                        {classification.label}
                      </Text>
                      {formData.tax_classification === classification.value && (
                        <CheckIcon size={16} color={PsychiColors.azure} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {formData.tax_classification === 'other' && (
                <TextInput
                  style={[styles.input, { marginTop: Spacing.sm }]}
                  value={formData.other_classification}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, other_classification: text }))}
                  placeholder="Specify classification"
                  placeholderTextColor={PsychiColors.textMuted}
                />
              )}
            </View>

            {/* Address */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Address</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Street Address <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.address_line1}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address_line1: text }))}
                placeholder="Street address"
                placeholderTextColor={PsychiColors.textMuted}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Address Line 2</Text>
              <TextInput
                style={styles.input}
                value={formData.address_line2}
                onChangeText={(text) => setFormData(prev => ({ ...prev, address_line2: text }))}
                placeholder="Apt, suite, unit, etc. (optional)"
                placeholderTextColor={PsychiColors.textMuted}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 2, marginRight: Spacing.sm }]}>
                <Text style={styles.label}>
                  City <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.city}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, city: text }))}
                  placeholder="City"
                  placeholderTextColor={PsychiColors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>
                  State <Text style={styles.required}>*</Text>
                </Text>
                <TouchableOpacity
                  style={styles.statePickerButton}
                  onPress={() => setShowStatePicker(!showStatePicker)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Text style={[
                    styles.pickerButtonText,
                    !formData.state && { color: PsychiColors.textMuted }
                  ]}>
                    {formData.state || 'Select'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showStatePicker && (
              <View style={styles.statePickerContainer}>
                <ScrollView style={styles.statePickerScroll} nestedScrollEnabled>
                  {US_STATES.map((state) => (
                    <TouchableOpacity
                      key={state}
                      style={[
                        styles.pickerOption,
                        formData.state === state && styles.pickerOptionSelected
                      ]}
                      onPress={() => {
                        setFormData(prev => ({ ...prev, state }));
                        setShowStatePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        formData.state === state && styles.pickerOptionTextSelected
                      ]}>
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                ZIP Code <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={formData.zip_code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, zip_code: formatZip(text) }))}
                placeholder="12345"
                placeholderTextColor={PsychiColors.textMuted}
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            {/* SSN/EIN */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Taxpayer Identification</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                SSN or EIN <Text style={styles.required}>*</Text>
              </Text>
              <Text style={styles.helperText}>
                Social Security Number or Employer ID Number
              </Text>
              <TextInput
                style={styles.input}
                value={formData.ssn_ein}
                onChangeText={(text) => {
                  // If editing masked value, clear it
                  if (formData.ssn_ein.includes('*')) {
                    setFormData(prev => ({ ...prev, ssn_ein: formatSSN(text.replace(/\*/g, '')) }));
                  } else {
                    setFormData(prev => ({ ...prev, ssn_ein: formatSSN(text) }));
                  }
                }}
                placeholder="XXX-XX-XXXX"
                placeholderTextColor={PsychiColors.textMuted}
                keyboardType="number-pad"
                maxLength={11}
                secureTextEntry={!formData.ssn_ein.includes('*')}
              />
              <View style={styles.securityNote}>
                <AlertIcon size={14} color={PsychiColors.warning} />
                <Text style={styles.securityNoteText}>
                  Your SSN/EIN is encrypted and only used for tax reporting
                </Text>
              </View>
            </View>

            {/* Certification */}
            <View style={styles.certificationSection}>
              <Text style={styles.certificationTitle}>Certification</Text>
              <Text style={styles.certificationText}>
                Under penalties of perjury, I certify that:{'\n\n'}
                1. The number shown on this form is my correct taxpayer identification number{'\n\n'}
                2. I am not subject to backup withholding because: (a) I am exempt from backup withholding, or (b) I have not been notified by the IRS that I am subject to backup withholding{'\n\n'}
                3. I am a U.S. citizen or other U.S. person{'\n\n'}
                4. The FATCA code(s) entered on this form (if any) indicating that I am exempt from FATCA reporting is correct
              </Text>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData(prev => ({
                  ...prev,
                  certification_agreed: !prev.certification_agreed
                }))}
              >
                <View style={[
                  styles.checkbox,
                  formData.certification_agreed && styles.checkboxChecked
                ]}>
                  {formData.certification_agreed && (
                    <CheckIcon size={14} color={PsychiColors.white} />
                  )}
                </View>
                <Text style={styles.checkboxLabel}>
                  I agree to the certification above and confirm this information is accurate
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!formData.certification_agreed || isSaving) && styles.submitButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={isSaving}
            activeOpacity={0.8}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={PsychiColors.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {isCompleted ? 'Update W-9' : 'Submit W-9'}
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${PsychiColors.success}15`,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  completedText: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.success,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: PsychiColors.azure,
    lineHeight: 18,
  },
  form: {
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.soft,
  },
  sectionHeader: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    fontFamily: Typography.fontFamily.serif,
  },
  inputGroup: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: 4,
  },
  required: {
    color: PsychiColors.error,
  },
  helperText: {
    fontSize: 12,
    color: PsychiColors.textMuted,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    color: PsychiColors.midnight,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  inputRow: {
    flexDirection: 'row',
  },
  pickerButton: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  statePickerButton: {
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
    minHeight: 44,
    justifyContent: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: PsychiColors.midnight,
  },
  pickerOptions: {
    marginTop: Spacing.xs,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Shadows.soft,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  pickerOptionSelected: {
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  pickerOptionText: {
    fontSize: 14,
    color: PsychiColors.midnight,
  },
  pickerOptionTextSelected: {
    fontWeight: '600',
    color: PsychiColors.azure,
  },
  statePickerContainer: {
    marginTop: Spacing.xs,
    maxHeight: 200,
    backgroundColor: PsychiColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Shadows.soft,
  },
  statePickerScroll: {
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
    gap: 4,
  },
  securityNoteText: {
    fontSize: 11,
    color: PsychiColors.warning,
  },
  certificationSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  certificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.midnight,
    marginBottom: Spacing.sm,
    fontFamily: Typography.fontFamily.serif,
  },
  certificationText: {
    fontSize: 12,
    color: PsychiColors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: PsychiColors.azure,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: PsychiColors.azure,
    borderColor: PsychiColors.azure,
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 14,
    color: PsychiColors.midnight,
    lineHeight: 20,
  },
  submitButton: {
    backgroundColor: PsychiColors.azure,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: PsychiColors.white,
  },
});
