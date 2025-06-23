"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';

interface SleepEvent {
  type: 'fall_asleep' | 'wake_up';
  time: string; // ISO time string
}

export default function LastNightSleepLog() {
  const [events, setEvents] = useState<SleepEvent[]>([]);
  const [addType, setAddType] = useState<'fall_asleep' | 'wake_up'>('fall_asleep');
  const [addTime, setAddTime] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const router = useRouter();

  const addEvent = () => {
    if (!addTime) return;
    setEvents([...events, { type: addType, time: addTime }]);
    setAddTime('');
  };

  const saveToSleepLog = async () => {
    if (events.length === 0) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));

    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({
          user_id: session.user.id,
          date: selectedDate,
          events: sortedEvents,
          created_at: new Date().toISOString()
        })
        .select();

      if (error) {
        alert(`Failed to save sleep log: ${error.message}`);
        return;
      }

      router.push('/sleep-log');
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pb-24 pt-10"
         style={{
           background: 'linear-gradient(135deg, #843484 0%, #47154f 100%)',
           fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
         }}>
      <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] max-w-md w-full p-6">
        
        {/* Back Button */}
        <button className="mb-4 text-[#843484] font-medium hover:underline" onClick={() => router.back()}>
          &larr; Back
        </button>

        {/* Header */}
        <h1 className="text-2xl font-bold text-gray-800 mb-2">🛏️ Your Sleep Last Night</h1>
        <p className="text-gray-600 mb-6">Add when you fell asleep and woke up.</p>

        {/* Date Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-lg border-2 border-[#e0e0e0] px-4 py-2 focus:outline-none focus:border-[#843484]"
          />
        </div>

        {/* Add Entry */}
        <div className="flex items-center gap-2 mb-6">
          <select
            value={addType}
            onChange={e => setAddType(e.target.value as 'fall_asleep' | 'wake_up')}
            className="rounded-lg border-2 border-[#e0e0e0] px-3 py-2 focus:outline-none focus:border-[#843484]"
          >
            <option value="fall_asleep">Fall Asleep</option>
            <option value="wake_up">Wake Up</option>
          </select>
          <input
            type="time"
            value={addTime}
            onChange={e => setAddTime(e.target.value)}
            className="rounded-lg border-2 border-[#e0e0e0] px-3 py-2 focus:outline-none focus:border-[#843484]"
          />
          <button
            onClick={addEvent}
            className="px-4 py-2 rounded-full text-white"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)'
            }}
          >
            Add
          </button>
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">🕒 Timeline</h2>
          <ul className="border-l-2 border-[#843484] pl-4 space-y-3">
            {events.length === 0 && <li className="text-gray-400">No events yet.</li>}
            {events.map((event, idx) => (
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

        {/* Save Button */}
        {events.length > 0 && (
          <button
            onClick={saveToSleepLog}
            className="mt-8 w-full py-3 rounded-full text-white font-semibold"
            style={{
              background: 'linear-gradient(90deg, #5d905c, #8cc455)'
            }}
          >
            Save to Sleep Log
          </button>
        )}
      </div>
    </div>
  );
}
