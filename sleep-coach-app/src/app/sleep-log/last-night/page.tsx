"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SleepEvent {
  type: 'fall_asleep' | 'wake_up';
  time: string; // ISO time string
}

export default function LastNightSleepLog() {
  const [events, setEvents] = useState<SleepEvent[]>([]);
  const [addType, setAddType] = useState<'fall_asleep' | 'wake_up'>('fall_asleep');
  const [addTime, setAddTime] = useState('');
  const router = useRouter();

  const addEvent = () => {
    if (!addTime) return;
    setEvents([...events, { type: addType, time: addTime }]);
    setAddTime('');
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <button className="mb-4 text-blue-500" onClick={() => router.back()}>&larr; Back</button>
      <h1 className="text-xl font-bold mb-2">Your Sleep Last Night</h1>
      <p className="text-gray-500 mb-4">Add the times you fell asleep and woke up during the night.</p>
      <div className="flex items-center gap-2 mb-4">
        <select
          value={addType}
          onChange={e => setAddType(e.target.value as 'fall_asleep' | 'wake_up')}
          className="rounded border px-2 py-1"
        >
          <option value="fall_asleep">Fall Asleep</option>
          <option value="wake_up">Wake Up</option>
        </select>
        <input
          type="time"
          value={addTime}
          onChange={e => setAddTime(e.target.value)}
          className="rounded border px-2 py-1"
        />
        <button
          onClick={addEvent}
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>
      <div className="mt-6">
        <h2 className="font-semibold mb-2">Timeline</h2>
        <ul className="border-l-2 border-blue-300 pl-4">
          {events.length === 0 && <li className="text-gray-400">No events yet.</li>}
          {events.map((event, idx) => (
            <li key={idx} className="mb-4 flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${event.type === 'fall_asleep' ? 'bg-blue-500' : 'bg-yellow-400'}`}></span>
              <span className="font-medium">{event.type === 'fall_asleep' ? 'Fell Asleep' : 'Woke Up'}</span>
              <span className="ml-2 text-gray-600">{event.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
} 