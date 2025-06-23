"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '@/components/BottomNav';

interface SleepEvent {
  type: 'fall_asleep' | 'wake_up';
  time: string;
}

interface SleepLog {
  id: string;
  date: string;
  events: SleepEvent[];
  created_at: string;
}

export default function SleepLogPage() {
  const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const router = useRouter();

  useEffect(() => {
    const fetchSleepLogs = async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching sleep logs:', error);
        return;
      }

      setSleepLogs(data || []);
    };

    fetchSleepLogs();
  }, [router]);

  const selectedLog = sleepLogs.find(log => log.date === selectedDate);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-28 pt-10"
         style={{
           background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
           fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
         }}>
      <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🛌 Sleep Log</h1>
          <button
            onClick={() => router.push('/sleep-log/last-night')}
            className="px-4 py-2 rounded-full text-white"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)'
            }}
          >
            + Add
          </button>
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border-2 border-[#e0e0e0] px-4 py-2 focus:outline-none focus:border-[#843484]"
          />
        </div>

        {/* Selected Log */}
        {selectedLog ? (
          <div className="bg-[#fafafa] rounded-xl p-4 border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">🕒 Sleep Timeline</h2>
            <ul className="border-l-2 border-[#843484] pl-4 space-y-3">
              {selectedLog.events.map((event, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${event.type === 'fall_asleep' ? 'bg-blue-500' : 'bg-yellow-400'}`}></span>
                  <span className="font-medium text-gray-800">
                    {event.type === 'fall_asleep' ? 'Fell Asleep' : 'Woke Up'}
                  </span>
                  <span className="ml-2 text-gray-500">{event.time}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No sleep log found for this date
          </div>
        )}

        {/* Recent Logs */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">📅 Recent Sleep Logs</h2>
          <div className="space-y-4">
            {sleepLogs.slice(0, 5).map((log) => (
              <div
                key={log.id}
                className={`rounded-xl p-4 border-2 transition-colors cursor-pointer ${
                  log.date === selectedDate
                    ? 'border-[#843484] bg-[#faf7fa]'
                    : 'border-[#e0e0e0] hover:border-[#843484]'
                }`}
                onClick={() => setSelectedDate(log.date)}
              >
                <div className="flex justify-between items-center">
                  <span className="text-gray-800 font-medium">
                    {new Date(log.date).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {log.events.length} events
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
