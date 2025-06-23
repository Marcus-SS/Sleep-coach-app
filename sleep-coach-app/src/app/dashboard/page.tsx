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
    return (
      <div className="min-h-screen flex items-center justify-center" style={{
        background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
      }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
    }}>
      <div className="max-w-md mx-auto px-4 pt-6">
        <ProgressStepper currentStep={1} totalSteps={5} />
        
        {/* Welcome Header */}
        <div className="mt-6 mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            Good Evening! 🌙
          </h1>
          <p className="text-purple-200 text-lg">
            How are you feeling today?
          </p>
        </div>

        {/* Sleep Last Night Section */}
        <div className="bg-white rounded-2xl p-4 shadow-lg mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-1">
                <h2 className="text-lg font-semibold text-gray-800 mr-2">
                  How Did You Sleep?
                </h2>
                <button 
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Track your sleep quality to get personalized insights"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
                    <rect x="11" y="11" width="2" height="6" rx="1" fill="currentColor"/>
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                Record how you slept last night
              </p>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full shadow-md transition-all duration-200 hover:transform hover:-translate-y-0.5 hover:shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #5d905c, #8cc455)',
                  color: 'white'
                }}
                onClick={() => router.push('/sleep-log/last-night')}
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                  <rect x="3" y="11" width="18" height="2" rx="1" fill="white"/>
                  <rect x="11" y="3" width="2" height="18" rx="1" fill="white"/>
                </svg>
                Start
              </button>
            </div>
            <div className="ml-4 flex-shrink-0">
              {/* Enhanced Owl illustration */}
              <div className="relative">
                <svg width="70" height="70" viewBox="0 0 70 70" fill="none" className="drop-shadow-sm">
                  {/* Owl shadow */}
                  <ellipse cx="35" cy="60" rx="25" ry="6" fill="rgba(132, 52, 132, 0.1)" />
                  
                  {/* Owl body */}
                  <circle cx="35" cy="35" r="23" fill="#843484" opacity="0.1" />
                  <circle cx="35" cy="33" r="20" fill="#843484" />
                  
                  {/* Owl belly */}
                  <ellipse cx="35" cy="38" rx="13" ry="12" fill="white" />
                  
                  {/* Eyes */}
                  <circle cx="29" cy="30" r="5" fill="white" />
                  <circle cx="41" cy="30" r="5" fill="white" />
                  <circle cx="29" cy="30" r="2.5" fill="#47154f" />
                  <circle cx="41" cy="30" r="2.5" fill="#47154f" />
                  <circle cx="30" cy="29" r="0.8" fill="white" />
                  <circle cx="42" cy="29" r="0.8" fill="white" />
                  
                  {/* Beak */}
                  <path d="M35 36 L38 42 L32 42 Z" fill="#8cc455" />
                  
                  {/* Sleep cap */}
                  <path d="M15 20 Q35 8 55 20 Q50 28 35 25 Q20 28 15 20 Z" fill="#5d905c" />
                  <circle cx="50" cy="16" r="3" fill="#8cc455" />
                  
                  {/* Wings */}
                  <ellipse cx="18" cy="38" rx="6" ry="12" fill="#6a1b5a" transform="rotate(-20 18 38)" />
                  <ellipse cx="52" cy="38" rx="6" ry="12" fill="#6a1b5a" transform="rotate(20 52 38)" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Sleep Score</span>
              <span className="text-lg">😴</span>
            </div>
            <div className="text-xl font-bold text-gray-800">--</div>
            <div className="text-xs text-gray-500">Log sleep to see</div>
          </div>
          
          <div className="bg-white rounded-xl p-3 shadow-md">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-600">Streak</span>
              <span className="text-lg">🔥</span>
            </div>
            <div className="text-xl font-bold text-gray-800">0</div>
            <div className="text-xs text-gray-500">Days tracked</div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 border border-white border-opacity-30">
          <h3 className="text-base font-semibold text-white mb-1">
            More Features Coming Soon! ✨
          </h3>
          <p className="text-purple-100 text-xs leading-relaxed">
            Sleep insights and personalized recommendations are on their way.
          </p>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}