// Demo Mode Configuration
// Set to true only for App Store review testing
export const DEMO_MODE_ENABLED = false;

// Check if demo mode is active
export function isDemoModeActive(): boolean {
  return DEMO_MODE_ENABLED;
}

// Check if credentials match demo accounts (always false when demo mode disabled)
export function isDemoLogin(email: string, password: string): boolean {
  return false;
}

// Get demo profile based on email (returns null when demo mode disabled)
export function getDemoProfile(email: string): { profile: any; role: 'client' | 'supporter' | 'admin' } | null {
  return null;
}
