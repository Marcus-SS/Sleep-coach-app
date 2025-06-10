'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type ChatMessage } from '@/lib/chat';
import { type CookieOptions } from '@supabase/ssr';

export async function saveChatMessage(message: ChatMessage) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: session.user.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp,
    });

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }
}

export async function getChatMessages(): Promise<ChatMessage[]> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.delete({ name, ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', session.user.id)
    .order('timestamp', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data.map(msg => ({
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
  }));
} 