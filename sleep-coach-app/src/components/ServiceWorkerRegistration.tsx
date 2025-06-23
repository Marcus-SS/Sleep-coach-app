'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(function(registration) {
          console.log('Service Worker registered successfully:', registration);
        })
        .catch(function(error) {
          console.error('Service Worker registration failed:', error);
        });
    }
  }, []);

  return null;
} 