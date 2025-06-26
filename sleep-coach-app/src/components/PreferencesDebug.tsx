'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { formatPreferencesForAI, calculateSleepDuration, getCaffeineAdvice } from '@/lib/preferencesHelper';

export default function PreferencesDebug() {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPreferences = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        setError(error.message);
      } else {
        setPreferences(data);
      }
      
      setLoading(false);
    };

    fetchPreferences();
  }, []);

  if (loading) return <div className="p-4">Loading preferences...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 rounded-lg space-y-4">
      <h3 className="text-lg font-bold">🔍 Preferences Debug</h3>
      
      {preferences ? (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Raw Preferences Data:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(preferences, null, 2)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">AI Context Format:</h4>
            <pre className="text-xs bg-gray-100 p-2 rounded whitespace-pre-wrap">
              {formatPreferencesForAI(preferences)}
            </pre>
          </div>

          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Calculated Insights:</h4>
            <ul className="text-sm space-y-1">
              <li>• Sleep duration: {calculateSleepDuration(preferences).toFixed(1)} hours</li>
              <li>• Caffeine advice: {getCaffeineAdvice(preferences)}</li>
            </ul>
          </div>

          <div className="bg-green-100 p-3 rounded text-sm">
            ✅ <strong>Integration Status:</strong> Your preferences are ready to be used by the AI chat! 
            The AI will now provide personalized recommendations based on your sleep schedule, chronotype, 
            age, sex, and melatonin preferences.
          </div>
        </div>
      ) : (
        <div className="bg-yellow-100 p-3 rounded text-sm">
          ⚠️ <strong>No preferences found.</strong> Complete the preferences setup in the Shift Manager 
          or Profile page to enable personalized AI recommendations.
        </div>
      )}
    </div>
  );
} 