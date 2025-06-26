'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import OnboardingForm from '@/components/OnboardingForm';
import UserPreferences from '@/components/UserPreferences';
import BottomNav from '@/components/BottomNav';
import { Settings, User } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'preferences'>('profile');
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('No session found, redirecting to signin');
          router.push('/signin');
        } else {
          console.log('Session found:', session.user.id);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push('/signin');
      }
    };
    checkSession();
  }, [router, supabase]);

  const containerStyles = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
  };

  const boxShadow = {
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5 pb-20" style={containerStyles}>
        <div className="bg-white rounded-[20px] p-10 text-center max-w-md w-full" style={boxShadow}>
          <div className="mx-auto mb-6 w-12 h-12 rounded-full border-4 border-gray-200 border-t-4"
               style={{
                 borderTopColor: '#843484',
                 animation: 'spin 1s linear infinite'
               }}></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading your profile...</h2>
          <p className="text-gray-600 text-base">Setting up your sleep journey</p>
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-5 pb-20" style={containerStyles}>
      <div className="bg-white rounded-[20px] max-w-xl w-full p-10" style={boxShadow}>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[#f0f0f0] rounded-full mb-8 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)',
              width: activeTab === 'profile' ? '50%' : '100%'
            }}
          ></div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            👤 Your Sleep Profile
          </h1>
          <p className="text-gray-600 text-base leading-relaxed">
            Update your sleep preferences and settings.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <User size={18} />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'preferences'
                ? 'bg-white text-gray-800 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings size={18} />
            Sleep Preferences
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'profile' ? (
          <OnboardingForm />
        ) : (
          <UserPreferences 
            showAsModal={false}
            title="Sleep Preferences"
          />
        )}
      </div>
      <BottomNav />
    </div>
  );
} 