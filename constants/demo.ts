// Demo Mode Configuration for App Store Review
// Use these credentials to access the app in demo mode:
// Email: demo@psychi.app
// Password: Demo2024!

export const DEMO_CREDENTIALS = {
  email: 'demo@psychi.app',
  password: 'Demo2024!',
  // Alternative reviewer accounts
  clientEmail: 'client@psychi.app',
  supporterEmail: 'supporter@psychi.app',
  adminEmail: 'admin@psychi.app',
};

export const DEMO_MODE_ENABLED = false;

// Demo Client Profile
export const DEMO_CLIENT_PROFILE = {
  id: 'demo-client-001',
  email: 'demo@psychi.app',
  full_name: 'Alex Demo',
  avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
  role: 'client' as const,
  created_at: '2024-01-15T10:00:00Z',
  subscription_tier: 'premium' as const,
  subscription_status: 'active' as const,
  favorite_supporters: ['demo-supporter-001', 'demo-supporter-002'],
  sessions_remaining: {
    chat: 4,
    phone: 2,
    video: 2,
  },
  total_sessions_completed: 12,
};

// Demo Supporter Profile
export const DEMO_SUPPORTER_PROFILE = {
  id: 'demo-supporter-001',
  email: 'supporter@psychi.app',
  full_name: 'Sarah Chen',
  avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
  role: 'supporter' as const,
  created_at: '2023-06-01T10:00:00Z',
  bio: 'Certified peer support specialist with 5+ years of experience helping individuals navigate anxiety, depression, and life transitions. I believe in a compassionate, non-judgmental approach that empowers you to find your own path forward.',
  specialties: ['Anxiety', 'Depression', 'Life Transitions', 'Stress Management'],
  education: 'M.A. Psychology, Stanford University',
  total_sessions: 247,
  hourly_rate: 45,
  is_verified: true,
  is_available: true,
  availability: {
    monday: ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    tuesday: ['9:00', '10:00', '11:00', '14:00', '15:00'],
    wednesday: ['9:00', '10:00', '11:00', '14:00', '15:00', '16:00'],
    thursday: ['9:00', '10:00', '14:00', '15:00'],
    friday: ['9:00', '10:00', '11:00', '14:00'],
    saturday: [],
    sunday: [],
  },
  session_types: ['chat', 'phone', 'video'],
  total_earnings: 8450,
  pending_payout: 540,
};

// Demo Admin Profile
export const DEMO_ADMIN_PROFILE = {
  id: 'demo-admin-001',
  email: 'admin@psychi.app',
  full_name: 'Admin User',
  avatar_url: null,
  role: 'admin' as const,
  created_at: '2023-01-01T10:00:00Z',
};

// Demo Supporters List (for browsing)
export const DEMO_SUPPORTERS = [
  {
    id: 'demo-supporter-001',
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    specialties: ['Anxiety', 'Depression', 'Life Transitions'],
    sessions: 247,
    available: true,
    price: 45,
    bio: 'Certified peer support specialist with 5+ years of experience.',
  },
  {
    id: 'demo-supporter-002',
    name: 'Michael Torres',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    specialties: ['Stress', 'Work/Career', 'Relationships'],
    sessions: 312,
    available: true,
    price: 50,
    bio: 'Former corporate executive turned wellness coach. I understand the pressures of modern work life.',
  },
  {
    id: 'demo-supporter-003',
    name: 'Emily Watson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    specialties: ['Grief', 'Trauma', 'Self-Esteem'],
    sessions: 189,
    available: false,
    price: 55,
    bio: 'Trauma-informed peer supporter specializing in grief and loss.',
  },
  {
    id: 'demo-supporter-004',
    name: 'James Kim',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    specialties: ['LGBTQ+', 'Identity', 'Family Issues'],
    sessions: 276,
    available: true,
    price: 45,
    bio: 'Creating safe spaces for LGBTQ+ individuals and allies.',
  },
  {
    id: 'demo-supporter-005',
    name: 'Priya Sharma',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    specialties: ['Anxiety', 'Academic', 'Motivation'],
    sessions: 154,
    available: true,
    price: 40,
    bio: 'Helping students and young professionals find balance and purpose.',
  },
];

// Demo Sessions (upcoming and past)
export const DEMO_SESSIONS = {
  upcoming: [
    {
      id: 'session-001',
      type: 'video' as const,
      supporter: DEMO_SUPPORTERS[0],
      scheduledAt: getUpcomingDate(1, 14, 0), // Tomorrow at 2 PM
      duration: 50,
      status: 'scheduled' as const,
    },
    {
      id: 'session-002',
      type: 'chat' as const,
      supporter: DEMO_SUPPORTERS[1],
      scheduledAt: getUpcomingDate(3, 10, 0), // 3 days from now at 10 AM
      duration: 50,
      status: 'scheduled' as const,
    },
  ],
  past: [
    {
      id: 'session-past-001',
      type: 'chat' as const,
      supporter: DEMO_SUPPORTERS[0],
      scheduledAt: getPastDate(2),
      duration: 50,
      status: 'completed' as const,
      notes: 'Great session! Sarah was very helpful and understanding.',
    },
    {
      id: 'session-past-002',
      type: 'phone' as const,
      supporter: DEMO_SUPPORTERS[1],
      scheduledAt: getPastDate(5),
      duration: 50,
      status: 'completed' as const,
    },
    {
      id: 'session-past-003',
      type: 'video' as const,
      supporter: DEMO_SUPPORTERS[0],
      scheduledAt: getPastDate(10),
      duration: 50,
      status: 'completed' as const,
    },
  ],
};

// Demo Messages
export const DEMO_MESSAGES = [
  {
    id: 'conv-001',
    supporter: DEMO_SUPPORTERS[0],
    lastMessage: "Looking forward to our session tomorrow! Let me know if there's anything specific you'd like to discuss.",
    lastMessageAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    unreadCount: 1,
  },
  {
    id: 'conv-002',
    supporter: DEMO_SUPPORTERS[1],
    lastMessage: 'Great progress today! Remember to practice the breathing exercises we discussed.',
    lastMessageAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
    unreadCount: 0,
  },
];

// Demo Payment History
export const DEMO_PAYMENT_HISTORY = [
  {
    id: 'pay-001',
    date: getPastDate(0),
    description: 'Premium Subscription - Monthly',
    amount: 17500,
    status: 'completed' as const,
  },
  {
    id: 'pay-002',
    date: getPastDate(30),
    description: 'Premium Subscription - Monthly',
    amount: 17500,
    status: 'completed' as const,
  },
  {
    id: 'pay-003',
    date: getPastDate(60),
    description: 'Standard Subscription - Monthly',
    amount: 14500,
    status: 'completed' as const,
  },
];

// Demo Supporter Earnings (for supporter view)
export const DEMO_SUPPORTER_EARNINGS = {
  thisMonth: 1240,
  lastMonth: 1890,
  totalEarnings: 8450,
  pendingPayout: 540,
  nextPayoutDate: getUpcomingDate(5, 0, 0),
  recentPayouts: [
    { id: 'payout-001', date: getPastDate(14), amount: 890, status: 'completed' as const },
    { id: 'payout-002', date: getPastDate(28), amount: 1020, status: 'completed' as const },
    { id: 'payout-003', date: getPastDate(42), amount: 780, status: 'completed' as const },
  ],
  sessionBreakdown: {
    chat: { count: 18, earnings: 540 },
    phone: { count: 12, earnings: 480 },
    video: { count: 4, earnings: 220 },
  },
};

// Demo Admin Stats
export const DEMO_ADMIN_STATS = {
  totalUsers: 1247,
  activeClients: 892,
  activeSupporters: 156,
  pendingSupporters: 23,
  totalSessions: 4589,
  sessionsThisMonth: 342,
  monthlyRevenue: 48750,
  platformHealth: 98.5,
};

// Helper functions
function getUpcomingDate(daysFromNow: number, hours: number, minutes: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
}

function getPastDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
}

// Check if credentials match demo accounts
export function isDemoLogin(email: string, password: string): boolean {
  if (!DEMO_MODE_ENABLED) return false;

  const normalizedEmail = email.toLowerCase().trim();

  return (
    (normalizedEmail === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) ||
    (normalizedEmail === DEMO_CREDENTIALS.clientEmail && password === DEMO_CREDENTIALS.password) ||
    (normalizedEmail === DEMO_CREDENTIALS.supporterEmail && password === DEMO_CREDENTIALS.password) ||
    (normalizedEmail === DEMO_CREDENTIALS.adminEmail && password === DEMO_CREDENTIALS.password)
  );
}

// Get demo profile based on email
export function getDemoProfile(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  if (normalizedEmail === DEMO_CREDENTIALS.supporterEmail) {
    return { profile: DEMO_SUPPORTER_PROFILE, role: 'supporter' as const };
  }

  if (normalizedEmail === DEMO_CREDENTIALS.adminEmail) {
    return { profile: DEMO_ADMIN_PROFILE, role: 'admin' as const };
  }

  // Default to client
  return { profile: DEMO_CLIENT_PROFILE, role: 'client' as const };
}
