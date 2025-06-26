import { createClient } from '@supabase/supabase-js';

// You may already have a Supabase client elsewhere; adjust import as needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getUserSleepLogs(userId: string, accessToken?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
  });
  
  const { data, error } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(7); // Get last 7 days of sleep logs

  if (error) throw error;
  return data;
}

export async function getUserPreferences(userId: string, accessToken?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
  });
  
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
    throw error;
  }
  
  return data;
}

export async function getUserOnboardingContext(userId: string, accessToken?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
  });
  
  // Get user profile data
  const { data: profileData, error: profileError } = await supabase
    .from('user_profiles')
    .select('chronotype, work_schedule, stress_level, social_life, hobbies, insomnia_severity')
    .eq('user_id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError;
  }

  // Get user preferences data
  const preferencesData = await getUserPreferences(userId, accessToken);

  // Get sleep logs data
  const sleepLogs = await getUserSleepLogs(userId, accessToken);

  return {
    ...profileData,
    preferences: preferencesData,
    sleep_logs: sleepLogs
  };
} 