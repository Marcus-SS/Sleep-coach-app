'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function OnboardingForm() {
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    chronotype: '',
    work_schedule: '',
    stress_level: '',
    social_life: '',
    hobbies: '',
    insomnia_severity: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (data) {
        setFormData({
          chronotype: data.chronotype || '',
          work_schedule: data.work_schedule || '',
          stress_level: data.stress_level?.toString() || '',
          social_life: data.social_life || '',
          hobbies: data.hobbies || '',
          insomnia_severity: data.insomnia_severity || '',
        });
      }
      setIsLoading(false);
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw new Error(`Failed to get session: ${sessionError.message}`);
      }
      
      if (!session) {
        throw new Error('No active session');
      }

      const data = {
        user_id: session.user.id,
        chronotype: formData.chronotype,
        work_schedule: formData.work_schedule,
        stress_level: parseInt(formData.stress_level),
        social_life: formData.social_life,
        hobbies: formData.hobbies,
        insomnia_severity: formData.insomnia_severity,
      };

      console.log('Attempting to save form data:', data);

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert([data], { 
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (upsertError) {
        console.error('Supabase upsert error details:', {
          message: upsertError.message,
          details: upsertError.details,
          hint: upsertError.hint,
          code: upsertError.code
        });
        throw new Error(`Failed to save profile: ${upsertError.message}`);
      }

      console.log('Successfully saved profile data');
      router.push('/dashboard');
    } catch (err) {
      console.error('Form submission error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while saving your profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload(); // or redirect to login page
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
      {error && (
        <div className="bg-red-50 text-red-500 p-3 rounded">
          {error}
        </div>
      )}
      <div className="space-y-8">
        <div>
          <label htmlFor="chronotype" className="block text-sm font-medium text-gray-700 mb-2">
            Chronotype
          </label>
          <div className="flex items-center gap-2 w-full">
            <select
              name="chronotype"
              id="chronotype"
              required
              value={formData.chronotype}
              onChange={e => setFormData({ ...formData, chronotype: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">Select your chronotype</option>
              <option value="Definitely morning type">Definitely morning type</option>
              <option value="Moderately morning type">Moderately morning type</option>
              <option value="Neither type">Neither type</option>
              <option value="Moderately evening type">Moderately evening type</option>
              <option value="Definitely evening type">Definitely evening type</option>
            </select>
            <button
              type="button"
              onClick={() => window.location.href = '/chronotype-quiz'}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs whitespace-nowrap"
            >
              Find out
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="work_schedule" className="block text-sm font-medium text-gray-700 mb-2">
            Work Schedule
          </label>
          <textarea
            name="work_schedule"
            id="work_schedule"
            required
            placeholder="e.g. 9am-5pm, Night shift, Flexible, etc."
            value={formData.work_schedule}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="stress_level" className="block text-sm font-medium text-gray-700 mb-2">
            Stress Level (1-10)
          </label>
          <input
            type="number"
            name="stress_level"
            id="stress_level"
            required
            min="1"
            max="10"
            value={formData.stress_level}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 max-w-xs"
          />
        </div>

        <div>
          <label htmlFor="social_life" className="block text-sm font-medium text-gray-700 mb-2">
            Social Life
          </label>
          <textarea
            name="social_life"
            id="social_life"
            required
            placeholder="Describe your social life"
            value={formData.social_life}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="hobbies" className="block text-sm font-medium text-gray-700 mb-2">
            Hobbies
          </label>
          <textarea
            name="hobbies"
            id="hobbies"
            required
            placeholder="List your hobbies"
            value={formData.hobbies}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="insomnia_severity" className="block text-sm font-medium text-gray-700 mb-2">
            How severe is your insomnia?
          </label>
          <div className="flex items-center gap-2 w-full">
            <select
              name="insomnia_severity"
              id="insomnia_severity"
              required
              value={formData.insomnia_severity}
              onChange={e => setFormData({ ...formData, insomnia_severity: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 max-w-xs"
            >
              <option value="">Select severity</option>
              <option value="none">None</option>
              <option value="mild">Mild</option>
              <option value="moderate">Moderate</option>
              <option value="severe">Severe</option>
            </select>
            <button
              type="button"
              onClick={() => window.location.href = '/insomnia-assessment'}
              className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs whitespace-nowrap"
            >
              Find out
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-6">
        <button
          onClick={handleLogout}
          type="button"
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Logout
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-6 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Complete Onboarding'}
        </button>
      </div>
    </form>
  );
} 