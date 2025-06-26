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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [logToDelete, setLogToDelete] = useState<SleepLog | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [logToEdit, setLogToEdit] = useState<SleepLog | null>(null);
  const [editEvents, setEditEvents] = useState<SleepEvent[]>([]);
  const [addType, setAddType] = useState<'fall_asleep' | 'wake_up'>('fall_asleep');
  const [addTime, setAddTime] = useState('');
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

  const handleDeleteClick = (log: SleepLog, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the log when clicking delete
    setLogToDelete(log);
    setShowDeleteModal(true);
  };

  const handleEditClick = (log: SleepLog, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent selecting the log when clicking edit
    setLogToEdit(log);
    setEditEvents([...log.events]);
    setShowEditModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!logToDelete) return;

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
      const { error } = await supabase
        .from('sleep_logs')
        .delete()
        .eq('id', logToDelete.id);

      if (error) {
        alert(`Failed to delete sleep log: ${error.message}`);
        return;
      }

      // Remove the deleted log from the state
      setSleepLogs(prevLogs => prevLogs.filter(log => log.id !== logToDelete.id));
      
      // If the deleted log was selected, clear the selection
      if (selectedDate === logToDelete.date) {
        setSelectedDate(() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        });
      }
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setShowDeleteModal(false);
      setLogToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setLogToDelete(null);
  };

  const addEditEvent = () => {
    if (!addTime) return;
    setEditEvents([...editEvents, { type: addType, time: addTime }]);
    setAddTime('');
  };

  const removeEditEvent = (index: number) => {
    setEditEvents(editEvents.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newEvents = [...editEvents];
    const draggedEvent = newEvents[dragIndex];
    
    // Remove the dragged item
    newEvents.splice(dragIndex, 1);
    
    // Insert it at the new position
    newEvents.splice(dropIndex, 0, draggedEvent);
    
    setEditEvents(newEvents);
  };

  const handleConfirmEdit = async () => {
    if (!logToEdit || editEvents.length === 0) return;

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
      // Keep the user's custom order instead of auto-sorting
      const eventsToSave = [...editEvents];

      const { data, error } = await supabase
        .from('sleep_logs')
        .update({
          events: eventsToSave,
          created_at: new Date().toISOString()
        })
        .eq('id', logToEdit.id)
        .select();

      if (error) {
        alert(`Failed to update sleep log: ${error.message}`);
        return;
      }

      if (!data || data.length === 0) {
        alert('No records were updated.');
        return;
      }

      // Update the log in the state
      setSleepLogs(prevLogs => 
        prevLogs.map(log => 
          log.id === logToEdit.id 
            ? { ...log, events: eventsToSave, created_at: new Date().toISOString() }
            : log
        )
      );
    } catch (err) {
      alert(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setShowEditModal(false);
      setLogToEdit(null);
      setEditEvents([]);
      setAddTime('');
    }
  };

  const handleCancelEdit = () => {
    setShowEditModal(false);
    setLogToEdit(null);
    setEditEvents([]);
    setAddTime('');
  };

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
                  <div className="flex-1">
                    <span className="text-gray-800 font-medium">
                      {new Date(log.date).toLocaleDateString()}
                    </span>
                    <div className="text-sm text-gray-500">
                      {log.events.length} events
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => handleEditClick(log, e)}
                      className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                      title="Edit sleep log"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(log, e)}
                      className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete sleep log"
                    >
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                        <path 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14ZM10 11v6M14 11v6"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && logToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-sm w-full p-6">
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">🗑️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Sleep Log</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete the sleep log for{' '}
                <strong>{new Date(logToDelete.date).toLocaleDateString()}</strong>?
                <br />
                <span className="text-sm text-gray-500">This action cannot be undone.</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleCancelDelete}
                  className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors"
                  style={{
                    background: 'linear-gradient(90deg, #dc2626, #b91c1c)'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Edit Modal */}
      {showEditModal && logToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-[20px] shadow-[0_20px_40px_rgba(0,0,0,0.3)] max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="mb-4">
                <span className="text-4xl">✏️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Edit Sleep Log</h3>
              <p className="text-gray-600">
                Editing sleep log for{' '}
                <strong>{new Date(logToEdit.date).toLocaleDateString()}</strong>
              </p>
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
                onClick={addEditEvent}
                className="px-4 py-2 rounded-full text-white"
                style={{
                  background: 'linear-gradient(90deg, #5d905c, #8cc455)'
                }}
              >
                Add
              </button>
            </div>

            {/* Timeline */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">🕒 Timeline</h4>
              <p className="text-sm text-gray-500 mb-3">Drag events to reorder them</p>
              <ul className="border-l-2 border-[#843484] pl-4 space-y-3">
                {editEvents.length === 0 && <li className="text-gray-400">No events yet.</li>}
                {editEvents.map((event, idx) => (
                  <li 
                    key={idx} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 cursor-move transition-colors group"
                    style={{ cursor: 'grab' }}
                    onMouseDown={(e) => e.currentTarget.style.cursor = 'grabbing'}
                    onMouseUp={(e) => e.currentTarget.style.cursor = 'grab'}
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag handle */}
                      <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                          <path 
                            stroke="currentColor" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            d="M9 5h.01M9 12h.01M9 19h.01M15 5h.01M15 12h.01M15 19h.01"
                          />
                        </svg>
                      </div>
                      
                      <span className={`w-3 h-3 rounded-full ${event.type === 'fall_asleep' ? 'bg-blue-500' : 'bg-yellow-400'}`}></span>
                      <span className="font-medium text-gray-800">
                        {event.type === 'fall_asleep' ? 'Fell Asleep' : 'Woke Up'}
                      </span>
                      <span className="ml-2 text-gray-500">{event.time}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeEditEvent(idx);
                      }}
                      className="p-1 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Remove event"
                    >
                      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
                        <path 
                          stroke="currentColor" 
                          strokeWidth="2" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M18 6L6 18M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 px-4 rounded-full border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmEdit}
                disabled={editEvents.length === 0}
                className="flex-1 py-3 px-4 rounded-full text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: editEvents.length > 0 ? 'linear-gradient(90deg, #5d905c, #8cc455)' : '#ccc'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
