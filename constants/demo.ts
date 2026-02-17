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
  admin: {
    email: 'admin@psychi.app',
    password: 'demo123',
  },
};

// Demo profiles with realistic data for App Store review
const DEMO_PROFILES = {
  client: {
    id: 'demo-client-001',
    email: 'demo@psychi.app',
    full_name: 'Alex Johnson',
    first_name: 'Alex',
    last_name: 'Johnson',
    avatar_url: null,
    role: 'client',
    created_at: new Date().toISOString(),
    // Demo client has a pre-assigned supporter for testing chat/call
    assigned_supporter_id: 'demo-supporter-001',
  },
  supporter: {
    id: 'demo-supporter-001',
    email: 'supporter@psychi.app',
    full_name: 'Sam Martinez',
    first_name: 'Sam',
    last_name: 'Martinez',
    avatar_url: null,
    role: 'supporter',
    created_at: new Date().toISOString(),
    // Demo supporter is fully onboarded and verified
    verification_status: 'approved',
    w9_completed: true,
    stripe_payouts_enabled: true,
    training_complete: true,
    onboarding_complete: true,
    accepting_clients: true,
    bio: 'Psychology graduate with a passion for helping others navigate life\'s challenges. Specializing in anxiety, stress management, and building healthy coping strategies.',
    specialties: ['Anxiety', 'Stress', 'Self-Esteem', 'Life Transitions'],
  },
  admin: {
    id: 'demo-admin-001',
    email: 'admin@psychi.app',
    full_name: 'Admin User',
    first_name: 'Admin',
    last_name: 'User',
    avatar_url: null,
    role: 'admin',
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
export function getDemoProfile(email: string): { profile: typeof DEMO_PROFILES.client | typeof DEMO_PROFILES.supporter | typeof DEMO_PROFILES.admin; role: 'client' | 'supporter' | 'admin' } | null {
  if (!DEMO_MODE_ENABLED) return null;

  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === DEMO_ACCOUNTS.client.email) {
    return { profile: DEMO_PROFILES.client, role: 'client' };
  }
  if (normalizedEmail === DEMO_ACCOUNTS.supporter.email) {
    return { profile: DEMO_PROFILES.supporter, role: 'supporter' };
  }
  if (normalizedEmail === DEMO_ACCOUNTS.admin.email) {
    return { profile: DEMO_PROFILES.admin, role: 'admin' };
  }

  return null;
}

// Get demo client's assigned supporter info (for testing chat/call in demo mode)
export function getDemoAssignedSupporter() {
  if (!DEMO_MODE_ENABLED) return null;
  return DEMO_PROFILES.supporter;
}
