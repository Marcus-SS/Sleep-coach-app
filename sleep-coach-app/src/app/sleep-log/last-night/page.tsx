"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import BottomNav from '@/components/BottomNav';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingEvents, setPendingEvents] = useState<SleepEvent[]>([]);
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
      // Check if a sleep log already exists for this date
      const { data: existingLogs, error: checkError } = await supabase
        .from('sleep_logs')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('date', selectedDate);

      if (checkError) {
        alert(`Failed to check existing sleep logs: ${checkError.message}`);
        return;
      }

      // If a log exists for this date, ask for confirmation
      if (existingLogs && existingLogs.length > 0) {
        setPendingEvents(sortedEvents);
        setShowConfirmModal(true);
        return;
      }

      // Insert the new sleep log (no existing log found)
      await insertSleepLog(sortedEvents, supabase, session.user.id);
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const insertSleepLog = async (sortedEvents: SleepEvent[], supabase: any, userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sleep_logs')
        .insert({
          user_id: userId,
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

  const handleConfirmReplace = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    try {
      // First check what records exist for this date
      const { data: existingLogs, error: checkError } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('date', selectedDate)
        .order('created_at', { ascending: false });

      if (checkError) {
        alert(`Failed to check existing logs: ${checkError.message}`);
        return;
      }

      console.log('All existing logs for date:', existingLogs);
      console.log('Selected date:', selectedDate);
      console.log('Trying to update with events:', pendingEvents);

      if (!existingLogs || existingLogs.length === 0) {
        alert('No existing logs found to update.');
        return;
      }

      // Get the most recent log for this date
      const mostRecentLog = existingLogs[0];
      console.log('Most recent log to update:', mostRecentLog);

      // Try to update the most recent sleep log by ID
      console.log('Attempting to update record with ID:', mostRecentLog.id);
      
      const { data, error } = await supabase
        .from('sleep_logs')
        .update({
          events: pendingEvents,
          created_at: new Date().toISOString()
        })
        .eq('id', mostRecentLog.id)
        .select();

      console.log('Update error:', error);
      console.log('Update result:', data);

      if (error) {
        alert(`Failed to update sleep log: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        // If update didn't work, delete ALL records for this date and insert one new one
        console.log('Update failed, deleting all records for this date...');
        
        // Delete ALL records for this user and date
        const deletePromises = existingLogs.map(log => 
          supabase
            .from('sleep_logs')
            .delete()
            .eq('id', log.id)
        );

        const deleteResults = await Promise.all(deletePromises);
        
        // Check if any deletes failed
        const deleteErrors = deleteResults.filter(result => result.error);
        if (deleteErrors.length > 0) {
          console.log('Some deletes failed:', deleteErrors);
          alert(`Failed to delete some existing sleep logs: ${deleteErrors[0].error?.message || 'Unknown error'}`);
          return;
        }

        console.log('All records deleted, inserting new one...');

        // Insert new record
        const { data: insertData, error: insertError } = await supabase
          .from('sleep_logs')
          .insert({
            user_id: session.user.id,
            date: selectedDate,
            events: pendingEvents,
            created_at: new Date().toISOString()
          })
          .select();

        if (insertError) {
          alert(`Failed to insert new sleep log: ${insertError.message}`);
          return;
        }

        console.log('Delete all + Insert successful:', insertData);
      }

      router.push('/sleep-log');
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setShowConfirmModal(false);
      setPendingEvents([]);
    }
  };

  const handleCancelReplace = () => {
    setShowConfirmModal(false);
    setPendingEvents([]);
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

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-sm w-full p-6">
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Sleep Log Already Exists</h3>
              <p className="text-gray-600 mb-6">
                You already have a sleep log for {selectedDate}. Do you want to replace the existing one?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelReplace}
                  className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReplace}
                  className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, #843484, #47154f)'
                  }}
                >
                  Replace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
