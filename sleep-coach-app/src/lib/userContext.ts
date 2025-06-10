import { createClient } from '@supabase/supabase-js';

// You may already have a Supabase client elsewhere; adjust import as needed
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function getUserOnboardingContext(userId: string, accessToken?: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {} }
  });
  const { data, error } = await supabase
    .from('user_profiles')
    .select('chronotype, work_schedule, stress_level, social_life, hobbies')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data;
} 