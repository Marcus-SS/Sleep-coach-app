// Helper functions for user preferences

export interface UserPreferences {
  id?: string;
  user_id: string;
  sleep_start_time_days_off: string;
  sleep_end_time_days_off: string;
  ready_time_minutes: number;
  chronotype: 'morning' | 'evening' | 'neither';
  sex: 'male' | 'female' | 'other';
  age: number;
  use_melatonin: boolean;
  created_at?: string;
  updated_at?: string;
}

export function formatPreferencesForAI(preferences: UserPreferences | null): string {
  if (!preferences) {
    return 'No sleep preferences configured yet - encourage user to set them up for personalized recommendations';
  }

  return `
# User Sleep Preferences
- Natural sleep schedule (days off): ${preferences.sleep_start_time_days_off} to ${preferences.sleep_end_time_days_off}
- Time needed to get ready for work: ${preferences.ready_time_minutes} minutes
- Chronotype: ${preferences.chronotype} person
- Sex: ${preferences.sex} (affects caffeine metabolism)
- Age: ${preferences.age} years old
- Melatonin preference: ${preferences.use_melatonin ? 'Yes, willing to use melatonin for sleep optimization' : 'No, prefers not to use melatonin'}
`.trim();
}

export function calculateSleepDuration(preferences: UserPreferences): number {
  const [startHour, startMinute] = preferences.sleep_start_time_days_off.split(':').map(Number);
  const [endHour, endMinute] = preferences.sleep_end_time_days_off.split(':').map(Number);
  
  const startMinutes = startHour * 60 + startMinute;
  let endMinutes = endHour * 60 + endMinute;
  
  // Handle overnight sleep (end time is next day)
  if (endMinutes <= startMinutes) {
    endMinutes += 24 * 60; // Add 24 hours
  }
  
  return (endMinutes - startMinutes) / 60; // Return hours
}

export function getChronotypeDescription(chronotype: string): string {
  switch (chronotype) {
    case 'morning':
      return 'feels most alert and energetic in the morning';
    case 'evening':
      return 'feels most alert and energetic in the evening';
    case 'neither':
      return 'adapts to different schedules easily';
    default:
      return 'chronotype not specified';
  }
}

export function getCaffeineAdvice(preferences: UserPreferences): string {
  const baseAdvice = preferences.sex === 'female' 
    ? 'Women typically metabolize caffeine slower than men, so consider stopping caffeine earlier in the day'
    : 'Men typically metabolize caffeine faster than women, but individual sensitivity varies';
    
  const ageAdvice = preferences.age > 50 
    ? 'As we age, caffeine sensitivity often increases, so you may need to limit afternoon caffeine more strictly'
    : preferences.age < 25 
    ? 'Younger adults often tolerate caffeine better, but it can still disrupt sleep if consumed too late'
    : 'Most adults should avoid caffeine 6-8 hours before bedtime';
    
  return `${baseAdvice}. ${ageAdvice}`;
} 