import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export async function saveMessage(message: ChatMessage) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        user_id: session.user.id,
        role: message.role,
        content: message.content,
        timestamp: message.timestamp,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error saving message:', error);
    throw error;
  }

  return data;
}

export async function getRecentMessages(limit = 10) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.user?.id) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', session.user.id)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }

  return data;
} 