'use client';

import { useMockWearableData } from '@/hooks/useMockWearableData';
import BottomNav from '@/components/BottomNav';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

export default function Dashboard() {
  const data = useMockWearableData();
  const router = useRouter();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('chronotype')
        .eq('user_id', session.user.id)
        .single();
      if (!profile || !profile.chronotype) {
        router.replace('/onboarding');
      }
      setCheckingOnboarding(false);
    };
    checkOnboarding();
  }, [router]);

  if (checkingOnboarding) {
    return null;
  }

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Sleep Dashboard</h1>
        
        <div className="grid grid-cols-1 gap-3">
          {/* Sleep Score Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700">Sleep Score</h3>
              <span className="text-xl">😴</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{data.sleepScore}</div>
            <p className="text-xs text-gray-500 mt-1">out of 100</p>
          </div>

          {/* HRV Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700">HRV</h3>
              <span className="text-xl">💓</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{data.hrv}</div>
            <p className="text-xs text-gray-500 mt-1">milliseconds</p>
          </div>

          {/* Resting Heart Rate Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-semibold text-gray-700">Resting Heart Rate</h3>
              <span className="text-xl">❤️</span>
            </div>
            <div className="text-2xl font-bold text-indigo-600">{data.heartRate}</div>
            <p className="text-xs text-gray-500 mt-1">beats per minute</p>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-right">
          Last synced: {data.lastSync}
        </div>
    </div>
      <BottomNav />
    </>
  );
}
