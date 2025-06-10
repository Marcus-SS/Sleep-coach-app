import ChatTest from '@/components/ChatTest';
import BottomNav from '@/components/BottomNav';
import { getChatMessages } from '@/app/actions';

export default async function CoachPage() {
  // Fetch initial messages server-side
  const initialMessages = await getChatMessages();

  return (
    <>
      <div className="max-w-md mx-auto p-4 pb-20">
        <h1 className="text-xl font-bold mb-4">Sleep Coach</h1>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
          <ChatTest initialMessages={initialMessages} />
        </div>
      </div>
      <BottomNav />
    </>
  );
} 