// Demo Mode Configuration
// Enabled automatically in development, or when EXPO_PUBLIC_DEMO_MODE=true
// For App Store review, set EXPO_PUBLIC_DEMO_MODE=true in your build configuration
const APP_ENV = process.env.EXPO_PUBLIC_APP_ENV || 'development';
const DEMO_MODE_OVERRIDE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

export const DEMO_MODE_ENABLED = APP_ENV === 'development' || DEMO_MODE_OVERRIDE;

// Demo account credentials
const DEMO_ACCOUNTS = {
  client: {
    email: 'demo@psychi.app',
    password: 'demo123',
  },
  supporter: {
    email: 'supporter@psychi.app',
    password: 'demo123',
  },
};

// Demo profiles with realistic data
const DEMO_PROFILES = {
  client: {
    id: 'demo-client-001',
    email: 'demo@psychi.app',
    full_name: 'Alex Demo',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  supporter: {
    id: 'demo-supporter-001',
    email: 'supporter@psychi.app',
    full_name: 'Sam Supporter',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
};

// Check if demo mode is active
export function isDemoModeActive(): boolean {
  return DEMO_MODE_ENABLED;
}

// Check if credentials match demo accounts
export function isDemoLogin(email: string, password: string): boolean {
  if (!DEMO_MODE_ENABLED) return false;

  const normalizedEmail = email.toLowerCase().trim();

  return Object.values(DEMO_ACCOUNTS).some(
    account => account.email === normalizedEmail && account.password === password
  );
}

// Get demo profile based on email
export function getDemoProfile(email: string): { profile: any; role: 'client' | 'supporter' | 'admin' } | null {
  if (!DEMO_MODE_ENABLED) return null;

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === DEMO_ACCOUNTS.client.email) {
    return { profile: DEMO_PROFILES.client, role: 'client' };
  }
  if (normalizedEmail === DEMO_ACCOUNTS.supporter.email) {
    return { profile: DEMO_PROFILES.supporter, role: 'supporter' };
  }

  return null;
}
