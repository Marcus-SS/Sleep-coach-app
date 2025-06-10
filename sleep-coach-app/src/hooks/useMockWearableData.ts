'use client';

import { useState } from 'react';

export function useMockWearableData() {
  // Simulate data from wearables
  const [data] = useState({
    device: 'Whoop',
    sleepScore: 85,
    heartRate: 62,
    hrv: 110,
    lastSync: '2025-05-27 10:00',
  });

  return data;
}
