import { NextResponse } from 'next/server';

export async function GET() {
  // Mock Whoop data
  const data = {
    device: 'Whoop',
    sleepScore: 87,
    heartRate: 60,
    hrv: 105,
    lastSync: '2025-05-27 11:00',
  };
  return NextResponse.json(data);
}
