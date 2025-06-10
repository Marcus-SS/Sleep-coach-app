'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const SessionContext = createContext<any>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    // Listen for changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  return (
    <SessionContext.Provider value={user}>
      {children}
    </SessionContext.Provider>
  );
}

export function useUser() {
  return useContext(SessionContext);
}
