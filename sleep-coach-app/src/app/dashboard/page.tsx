'use client';

import { useMockWearableData } from '@/hooks/useMockWearableData';
import BottomNav from '@/components/BottomNav';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import ProgressStepper from '@/components/ProgressStepper';

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
      <ProgressStepper currentStep={1} totalSteps={5} />
      {/* Sleep Last Night Section */}
      <div className="max-w-md mx-auto mt-4 mb-6 p-4 rounded-xl bg-[#18323a] flex items-center justify-between shadow">
        <div>
          <div className="flex items-center mb-1">
            <h2 className="text-lg font-semibold text-white mr-2">How Did You Sleep?</h2>
            <span className="text-gray-300 cursor-pointer" title="Info">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><circle cx="12" cy="8" r="1.5" fill="currentColor"/><rect x="11" y="11" width="2" height="6" rx="1" fill="currentColor"/></svg>
            </span>
          </div>
          <p className="text-gray-300 text-sm mb-3">Record how you slept last night</p>
          <button
            className="flex items-center gap-2 px-4 py-2 bg-[#3ec6e0] text-white font-medium rounded-full shadow hover:bg-[#2ea6c0] transition-colors"
            onClick={() => router.push('/sleep-log/last-night')}
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="2" rx="1" fill="white"/><rect x="11" y="3" width="2" height="18" rx="1" fill="white"/></svg>
            Start
          </button>
        </div>
        <div className="ml-4">
          {/* Owl illustration placeholder, replace with image if available */}
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none">
            <ellipse cx="35" cy="55" rx="25" ry="10" fill="#18323a" />
            <circle cx="35" cy="35" r="22" fill="#2a4a5a" />
            <ellipse cx="35" cy="40" rx="14" ry="12" fill="#fff" />
            <ellipse cx="28" cy="38" rx="3" ry="4" fill="#fff" />
            <ellipse cx="42" cy="38" rx="3" ry="4" fill="#fff" />
            <ellipse cx="28" cy="39" rx="1.2" ry="1.5" fill="#18323a" />
            <ellipse cx="42" cy="39" rx="1.2" ry="1.5" fill="#18323a" />
            <ellipse cx="35" cy="45" rx="2.5" ry="1.2" fill="#fbbf24" />
            <rect x="25" y="18" width="20" height="10" rx="5" fill="#3ec6e0" />
            <rect x="40" y="13" width="10" height="7" rx="3.5" fill="#3ec6e0" />
            <rect x="20" y="13" width="10" height="7" rx="3.5" fill="#3ec6e0" />
            <rect x="44" y="10" width="6" height="4" rx="2" fill="#a7f3d0" />
            <rect x="20" y="10" width="6" height="4" rx="2" fill="#a7f3d0" />
          </svg>
        </div>
      </div>
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
