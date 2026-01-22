/**
 * Test script for the supporter matching algorithm
 * Run with: npx ts-node scripts/test-matching.ts
 */

import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  console.log('Make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Topic to specialty mapping (same as in database.ts)
const topicToSpecialtyMap: Record<string, string[]> = {
  'anxiety': ['Anxiety'],
  'stress': ['Stress'],
  'depression': ['Depression'],
  'relationships': ['Relationships'],
  'loneliness': ['Loneliness'],
  'work_career': ['Work-Life Balance', 'Career'],
  'academic': ['Academic Pressure'],
  'self_esteem': ['Self-Esteem'],
  'family': ['Family Issues', 'Family'],
  'grief': ['Grief/Loss', 'Grief'],
  'transitions': ['Life Transitions', 'Transitions'],
  'identity': ['LGBTQ+', 'Identity', 'Coming Out'],
};

interface ClientPreferences {
  topics: string[];
  communication_style: string;
  preferred_session_types: string[];
  preferred_times: string[];
  personality_preference: string;
  urgency: string;
}

interface MatchedSupporter {
  id: string;
  full_name: string;
  specialties: string[];
  compatibilityScore: number;
  matchReasons: string[];
}

async function testMatching() {
  console.log('='.repeat(60));
  console.log('SUPPORTER MATCHING ALGORITHM TEST');
  console.log('='.repeat(60));

  // First, let's see what supporters exist
  console.log('\n📋 Fetching available supporters...\n');

  const { data: supporters, error } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      email,
      supporter_details (
        specialties,
        is_available,
        accepting_clients,
        training_complete,
        is_verified,
        approach,
        session_types,
        availability
      )
    `)
    .eq('role', 'supporter');

  if (error) {
    console.error('Error fetching supporters:', error);
    return;
  }

  if (!supporters || supporters.length === 0) {
    console.log('❌ No supporters found in database.');
    console.log('   Please create test supporters first using the SQL in supabase/create_test_supporters.sql');
    return;
  }

  console.log(`Found ${supporters.length} supporter(s):\n`);

  for (const s of supporters) {
    // Handle both array and object responses from Supabase join
    const details = Array.isArray(s.supporter_details)
      ? s.supporter_details[0]
      : s.supporter_details;
    console.log(`  👤 ${s.full_name} (${s.email})`);
    console.log(`     Specialties: ${details?.specialties?.join(', ') || 'None'}`);
    console.log(`     Training Complete: ${details?.training_complete ? '✅' : '❌'}`);
    console.log(`     Accepting Clients: ${details?.accepting_clients ? '✅' : '❌'}`);
    console.log(`     Verified: ${details?.is_verified ? '✅' : '❌'}`);
    console.log('');
  }

  // Test Case 1: Client looking for LGBTQ+ support
  console.log('='.repeat(60));
  console.log('TEST CASE 1: Client seeking LGBTQ+/Identity support');
  console.log('='.repeat(60));

  const lgbtqPreferences: ClientPreferences = {
    topics: ['identity', 'anxiety'],
    communication_style: 'empathetic',
    preferred_session_types: ['chat', 'video'],
    preferred_times: ['morning', 'afternoon'],
    personality_preference: 'warm',
    urgency: 'within_week',
  };

  console.log('\nClient preferences:');
  console.log(`  Topics: ${lgbtqPreferences.topics.join(', ')}`);
  console.log(`  Communication: ${lgbtqPreferences.communication_style}`);
  console.log(`  Session Types: ${lgbtqPreferences.preferred_session_types.join(', ')}`);
  console.log(`  Personality: ${lgbtqPreferences.personality_preference}`);

  const lgbtqMatches = await runMatching(supporters, lgbtqPreferences);
  displayMatches(lgbtqMatches);

  // Test Case 2: Client looking for stress/work support (no LGBTQ+)
  console.log('\n' + '='.repeat(60));
  console.log('TEST CASE 2: Client seeking Stress/Work-Life Balance support');
  console.log('='.repeat(60));

  const stressPreferences: ClientPreferences = {
    topics: ['stress', 'work_career'],
    communication_style: 'direct',
    preferred_session_types: ['phone', 'video'],
    preferred_times: ['evening'],
    personality_preference: 'analytical',
    urgency: 'soon',
  };

  console.log('\nClient preferences:');
  console.log(`  Topics: ${stressPreferences.topics.join(', ')}`);
  console.log(`  Communication: ${stressPreferences.communication_style}`);
  console.log(`  Session Types: ${stressPreferences.preferred_session_types.join(', ')}`);
  console.log(`  Personality: ${stressPreferences.personality_preference}`);

  const stressMatches = await runMatching(supporters, stressPreferences);
  displayMatches(stressMatches);

  // Test Case 3: Client looking for relationships support
  console.log('\n' + '='.repeat(60));
  console.log('TEST CASE 3: Client seeking Relationships support');
  console.log('='.repeat(60));

  const relationshipPreferences: ClientPreferences = {
    topics: ['relationships', 'self_esteem'],
    communication_style: 'balanced',
    preferred_session_types: ['chat'],
    preferred_times: ['afternoon', 'evening'],
    personality_preference: 'calm',
    urgency: 'flexible',
  };

  console.log('\nClient preferences:');
  console.log(`  Topics: ${relationshipPreferences.topics.join(', ')}`);
  console.log(`  Communication: ${relationshipPreferences.communication_style}`);
  console.log(`  Session Types: ${relationshipPreferences.preferred_session_types.join(', ')}`);
  console.log(`  Personality: ${relationshipPreferences.personality_preference}`);

  const relationshipMatches = await runMatching(supporters, relationshipPreferences);
  displayMatches(relationshipMatches);

  console.log('\n' + '='.repeat(60));
  console.log('TEST COMPLETE');
  console.log('='.repeat(60));
}

async function runMatching(
  supporters: any[],
  preferences: ClientPreferences
): Promise<MatchedSupporter[]> {
  const matchedSupporters: MatchedSupporter[] = [];

  for (const supporter of supporters) {
    // Handle both array and object responses
    const details = Array.isArray(supporter.supporter_details)
      ? supporter.supporter_details[0]
      : supporter.supporter_details;

    // Skip if not fully active
    if (!details?.training_complete || !details?.accepting_clients || !details?.is_verified) {
      continue;
    }

    const supporterSpecialties = details.specialties || [];
    const supporterSessionTypes = details.session_types || ['chat', 'phone', 'video'];
    const supporterAvailability = details.availability || {};
    const supporterApproach = details.approach || '';

    let score = 0;
    const matchReasons: string[] = [];

    // 1. SPECIALTY/TOPIC MATCHING (up to 40 points)
    let specialtyMatches = 0;
    for (const topic of preferences.topics) {
      const matchingSpecialties = topicToSpecialtyMap[topic] || [topic];

      for (const specialty of matchingSpecialties) {
        if (supporterSpecialties.some((s: string) =>
          s.toLowerCase() === specialty.toLowerCase()
        )) {
          specialtyMatches++;
          matchReasons.push(`Specializes in ${specialty}`);
          break;
        }
      }
    }

    if (preferences.topics.length > 0) {
      const specialtyScore = (specialtyMatches / preferences.topics.length) * 40;
      score += specialtyScore;
    }

    // 2. SESSION TYPE COMPATIBILITY (up to 20 points)
    const sessionTypeMatches = preferences.preferred_session_types.filter(
      type => supporterSessionTypes.includes(type)
    ).length;

    if (preferences.preferred_session_types.length > 0) {
      const sessionScore = (sessionTypeMatches / preferences.preferred_session_types.length) * 20;
      score += sessionScore;

      if (sessionTypeMatches === preferences.preferred_session_types.length) {
        matchReasons.push('Offers all your preferred session types');
      }
    }

    // 3. AVAILABILITY/TIME MATCHING (up to 20 points)
    const timeMatchScore = calculateTimeMatchScore(preferences.preferred_times, supporterAvailability);
    score += timeMatchScore;
    if (timeMatchScore >= 15) {
      matchReasons.push('Available when you need');
    }

    // 4. COMMUNICATION STYLE / APPROACH MATCHING (up to 15 points)
    const approachScore = calculateApproachMatchScore(
      preferences.communication_style,
      preferences.personality_preference,
      supporterApproach
    );
    score += approachScore;
    if (approachScore >= 10) {
      matchReasons.push('Communication style match');
    }

    // 5. CURRENT AVAILABILITY BONUS (up to 5 points)
    if (details.is_available) {
      score += 5;
      if (preferences.urgency === 'soon') {
        matchReasons.push('Available now');
      }
    }

    // Only include supporters with a minimum score or specialty match
    if (score >= 15 || specialtyMatches > 0) {
      matchedSupporters.push({
        id: supporter.id,
        full_name: supporter.full_name,
        specialties: supporterSpecialties,
        compatibilityScore: Math.round(score),
        matchReasons: matchReasons.slice(0, 3),
      });
    }
  }

  // Sort by compatibility score (highest first)
  matchedSupporters.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return matchedSupporters;
}

function calculateTimeMatchScore(
  preferredTimes: string[],
  supporterAvailability: Record<string, string[]>
): number {
  if (preferredTimes.length === 0) return 10;

  const timeRanges: Record<string, { start: number; end: number }> = {
    'early_morning': { start: 6, end: 9 },
    'morning': { start: 9, end: 12 },
    'afternoon': { start: 12, end: 17 },
    'evening': { start: 17, end: 21 },
    'night': { start: 21, end: 24 },
  };

  let matchCount = 0;

  for (const prefTime of preferredTimes) {
    if (prefTime === 'weekends') {
      if (supporterAvailability['saturday'] || supporterAvailability['sunday'] ||
          supporterAvailability['Saturday'] || supporterAvailability['Sunday']) {
        matchCount++;
      }
      continue;
    }

    const range = timeRanges[prefTime];
    if (!range) continue;

    for (const slots of Object.values(supporterAvailability)) {
      if (!Array.isArray(slots)) continue;

      for (const slot of slots) {
        const hour = parseInt(slot.split(':')[0], 10);
        if (hour >= range.start && hour < range.end) {
          matchCount++;
          break;
        }
      }
    }
  }

  if (preferredTimes.length > 0) {
    return Math.min(20, (matchCount / preferredTimes.length) * 20);
  }
  return 0;
}

function calculateApproachMatchScore(
  communicationStyle: string,
  personalityPreference: string,
  supporterApproach: string
): number {
  if (!supporterApproach) return 5;

  const approachLower = supporterApproach.toLowerCase();
  let score = 0;

  const styleKeywords: Record<string, string[]> = {
    'direct': ['practical', 'actionable', 'direct', 'solution', 'goal'],
    'empathetic': ['empathy', 'listen', 'understand', 'support', 'validate', 'safe'],
    'balanced': ['balance', 'both', 'combine', 'flexible', 'adapt'],
    'exploratory': ['explore', 'reflect', 'question', 'understand', 'insight', 'discover'],
  };

  const personalityKeywords: Record<string, string[]> = {
    'warm': ['warm', 'caring', 'nurturing', 'gentle', 'compassion', 'comfort'],
    'motivating': ['motivat', 'energy', 'uplift', 'encourage', 'action', 'positive'],
    'calm': ['calm', 'peace', 'steady', 'ground', 'reassur', 'relax'],
    'analytical': ['analytic', 'logic', 'thought', 'method', 'insight', 'understand'],
  };

  const styleWords = styleKeywords[communicationStyle] || [];
  for (const keyword of styleWords) {
    if (approachLower.includes(keyword)) {
      score += 5;
      break;
    }
  }

  const personalityWords = personalityKeywords[personalityPreference] || [];
  for (const keyword of personalityWords) {
    if (approachLower.includes(keyword)) {
      score += 5;
      break;
    }
  }

  if (supporterApproach.length > 50) {
    score += 5;
  }

  return Math.min(15, score);
}

function displayMatches(matches: MatchedSupporter[]) {
  console.log('\n📊 MATCHING RESULTS:');
  console.log('-'.repeat(40));

  if (matches.length === 0) {
    console.log('  No matching supporters found.');
    return;
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    console.log(`\n  #${i + 1} ${match.full_name}`);
    console.log(`     Score: ${match.compatibilityScore}/100`);
    console.log(`     Specialties: ${match.specialties.join(', ')}`);
    console.log(`     Match Reasons:`);
    for (const reason of match.matchReasons) {
      console.log(`       ✓ ${reason}`);
    }
  }
}

// Run the test
testMatching().catch(console.error);
