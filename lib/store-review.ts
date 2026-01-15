import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  SESSIONS_COMPLETED: '@psychi:sessions_completed',
  LAST_REVIEW_PROMPT: '@psychi:last_review_prompt',
  HAS_REVIEWED: '@psychi:has_reviewed',
};

// Conditions for showing review prompt
const REVIEW_CONFIG = {
  MIN_SESSIONS: 3, // Minimum completed sessions before prompting
  MIN_DAYS_BETWEEN_PROMPTS: 30, // Days between prompts if dismissed
};

/**
 * Track a completed session and potentially prompt for review
 */
export async function trackSessionCompleted(): Promise<void> {
  try {
    const sessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS_COMPLETED);
    const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS_COMPLETED, String(sessions + 1));
  } catch (error) {
    console.error('Error tracking session:', error);
  }
}

/**
 * Check if we should show the review prompt
 */
export async function shouldPromptReview(): Promise<boolean> {
  try {
    // Check if user has already reviewed
    const hasReviewed = await AsyncStorage.getItem(STORAGE_KEYS.HAS_REVIEWED);
    if (hasReviewed === 'true') return false;

    // Check minimum sessions
    const sessionsStr = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS_COMPLETED);
    const sessions = sessionsStr ? parseInt(sessionsStr, 10) : 0;
    if (sessions < REVIEW_CONFIG.MIN_SESSIONS) return false;

    // Check time since last prompt
    const lastPromptStr = await AsyncStorage.getItem(STORAGE_KEYS.LAST_REVIEW_PROMPT);
    if (lastPromptStr) {
      const lastPrompt = new Date(lastPromptStr);
      const daysSince = (Date.now() - lastPrompt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < REVIEW_CONFIG.MIN_DAYS_BETWEEN_PROMPTS) return false;
    }

    // Check if review is available on this platform
    const isAvailable = await StoreReview.isAvailableAsync();
    return isAvailable;
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    return false;
  }
}

/**
 * Request app store review
 */
export async function requestReview(): Promise<boolean> {
  try {
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      console.log('Store review not available');
      return false;
    }

    await StoreReview.requestReview();

    // Mark that we prompted
    await AsyncStorage.setItem(STORAGE_KEYS.LAST_REVIEW_PROMPT, new Date().toISOString());

    return true;
  } catch (error) {
    console.error('Error requesting review:', error);
    return false;
  }
}

/**
 * Mark that user has reviewed (call after successful review flow)
 */
export async function markAsReviewed(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HAS_REVIEWED, 'true');
  } catch (error) {
    console.error('Error marking as reviewed:', error);
  }
}

/**
 * Prompt for review if conditions are met
 */
export async function maybePromptReview(): Promise<boolean> {
  const shouldPrompt = await shouldPromptReview();
  if (shouldPrompt) {
    return await requestReview();
  }
  return false;
}

/**
 * Get the store URL for manual review link
 */
export function getStoreUrl(): string {
  // Replace with your actual App Store / Play Store URLs
  const IOS_APP_ID = 'your-app-id'; // e.g., '1234567890'
  const ANDROID_PACKAGE = 'com.psychi.app';

  if (typeof window !== 'undefined') {
    // Web - can't determine platform
    return '';
  }

  // This will be resolved at runtime based on Platform
  return `https://apps.apple.com/app/id${IOS_APP_ID}`;
}

export default {
  trackSessionCompleted,
  shouldPromptReview,
  requestReview,
  markAsReviewed,
  maybePromptReview,
  getStoreUrl,
};
