import ChatTest from '@/components/ChatTest';
import BottomNav from '@/components/BottomNav';
import { getChatMessages } from '@/app/actions';

export default async function CoachPage() {
  // Fetch initial messages server-side
  const initialMessages = await getChatMessages();

  return (
    <div className="min-h-screen pb-20" style={{
      background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)'
    }}>
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)'
            }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path 
                  d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5C14.8 7.5 14.6 7.4 14.5 7.2L13.6 5.5C13.3 4.9 12.7 4.5 12 4.5S10.7 4.9 10.4 5.5L9.5 7.2C9.4 7.4 9.2 7.5 9 7.5L3 7V9L9 8.5C9.2 8.5 9.4 8.6 9.5 8.8L10.4 10.5C10.7 11.1 11.3 11.5 12 11.5S13.3 11.1 13.6 10.5L14.5 8.8C14.6 8.6 14.8 8.5 15 8.5L21 9ZM8 16V22H16V16H8Z" 
                  fill="white"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Sleep Coach</h1>
              <p className="text-purple-200 text-sm">Your personal sleep advisor</p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2 bg-white bg-opacity-20 backdrop-blur-sm rounded-full px-3 py-1 w-fit">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-white text-xs font-medium">Online</span>
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
          <div className="p-4">
            <ChatTest initialMessages={initialMessages} />
          </div>
        </div>

        {/* Coach Tips */}
        <div className="mt-4 bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-3 border border-white border-opacity-20">
          <div className="flex items-start gap-2">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-white text-xs font-medium mb-1">Quick Tip</p>
              <p className="text-purple-100 text-xs leading-relaxed">
                Ask me about your sleep schedule, bedtime routine, or any sleep concerns you have!
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}