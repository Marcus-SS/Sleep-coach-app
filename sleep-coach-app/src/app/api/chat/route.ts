import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { generateChatResponse } from '@/lib/gemini';
import { getUserOnboardingContext } from '@/lib/userContext';

// Custom error types
class ChatError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code: string = 'INTERNAL_ERROR',
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'ChatError';
  }
}

// Types for chat messages
export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
};

// Helper function to handle retries
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<T> {
  let lastError: Error = new Error('Operation failed after all retries');
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's not a retryable error
      if (error instanceof ChatError && !error.retryable) {
        throw error;
      }
      
      // Wait before retrying
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
      }
    }
  }
  
  throw lastError;
}

export async function POST(request: Request) {
  try {
    // Check if API key is configured
    if (!process.env.GOOGLE_AI_API_KEY) {
      throw new ChatError(
        'API key not configured',
        500,
        'CONFIGURATION_ERROR',
        false
      );
    }

    const body = await request.json();
    
    // Validate request format
    if (!body.messages || !Array.isArray(body.messages)) {
      throw new ChatError(
        'Invalid request format: messages array is required',
        400,
        'INVALID_REQUEST',
        false
      );
    }

    // Validate message content
    const lastUserMessage = body.messages.find((msg: any) => msg.role === 'user');
    if (!lastUserMessage) {
      throw new ChatError(
        'No user message found in the conversation',
        400,
        'INVALID_REQUEST',
        false
      );
    }

    if (!lastUserMessage.content?.trim()) {
      throw new ChatError(
        'Message content cannot be empty',
        400,
        'INVALID_REQUEST',
        false
      );
    }

    // Rate limiting check (basic implementation)
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
    if (!session) {
      throw new ChatError(
        'User not authenticated',
        401,
        'UNAUTHORIZED',
        false
      );
    }

    // Fetch onboarding context for the user
    let onboardingContext = null;
    try {
      onboardingContext = await getUserOnboardingContext(session.user.id, session.access_token);
      console.log('DEBUG: onboardingContext for user', session.user.id, onboardingContext);
    } catch (e) {
      onboardingContext = null;
      console.log('DEBUG: Failed to fetch onboardingContext for user', session.user.id, e);
    }

    // Build onboarding context string
    let onboardingContextString = '';
    if (onboardingContext) {
      // Format sleep logs data
      const sleepLogsString = onboardingContext.sleep_logs?.length > 0
        ? `\n\n# Recent Sleep Logs\n${onboardingContext.sleep_logs.map(log => 
            `- Date: ${log.date}\n  Events: ${log.events.map((event: { type: 'fall_asleep' | 'wake_up'; time: string }) => 
              `${event.type === 'fall_asleep' ? 'Fell asleep' : 'Woke up'} at ${event.time}`
            ).join(', ')}`
          ).join('\n')}`
        : '\n\n# Sleep Logs\nNo recent sleep logs available';

      onboardingContextString = `\n\n# User Onboarding Profile\n- Chronotype: ${onboardingContext.chronotype || 'Unknown'}\n- Work schedule: ${onboardingContext.work_schedule || 'Unknown'}\n- Stress level: ${onboardingContext.stress_level || 'Unknown'}\n- Social life: ${onboardingContext.social_life || 'Unknown'}\n- Hobbies: ${onboardingContext.hobbies || 'Unknown'}\n- Insomnia Severity: ${onboardingContext.insomnia_severity || 'Unknown'}${sleepLogsString}`;
    }
    console.log('DEBUG: onboardingContextString:', onboardingContextString);

    // Patch: inject onboarding context into the first message (PREPROMPT)
    const patchedMessages = [...body.messages];
    if (patchedMessages.length > 0 && patchedMessages[0].role === 'user' && patchedMessages[0].content.includes('Sleep Coach AI System Prompt')) {
      patchedMessages[0] = {
        ...patchedMessages[0],
        content: patchedMessages[0].content + onboardingContextString,
      };
    }

    // Get recent message count for rate limiting
    const { count } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id)
      .gte('timestamp', new Date(Date.now() - 60000).toISOString()); // Last minute

    if (count && count > 10) { // Limit to 10 messages per minute
      throw new ChatError(
        'Rate limit exceeded. Please wait a moment before sending more messages.',
        429,
        'RATE_LIMIT_EXCEEDED',
        true
      );
    }

    try {
      // Send the entire conversation history to Gemini with retry logic
      const response = await withRetry(async () => {
        return await generateChatResponse(patchedMessages, onboardingContextString);
      });

      return NextResponse.json({
        message: {
          role: 'assistant',
          content: response,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      // Handle specific Gemini API errors
      if (error.message?.includes('API key')) {
        throw new ChatError(
          'Invalid API key configuration',
          500,
          'API_KEY_ERROR',
          false
        );
      }

      if (error.message?.includes('quota')) {
        throw new ChatError(
          'API quota exceeded. Please try again later.',
          429,
          'QUOTA_EXCEEDED',
          true
        );
      }

      if (error.message?.includes('timeout')) {
        throw new ChatError(
          'Request timed out. Please try again.',
          504,
          'TIMEOUT',
          true
        );
      }

      // Log the error for debugging
      console.error('Gemini API Error:', {
        message: error.message,
        stack: error.stack,
        details: error.details || 'No additional details'
      });

      throw new ChatError(
        `Gemini API Error: ${error.message}`,
        500,
        'API_ERROR',
        true
      );
    }
  } catch (error: any) {
    // Handle all errors and return appropriate response
    console.error('Chat Error:', {
      message: error.message,
      code: error.code,
      status: error.status,
      stack: error.stack
    });

    return NextResponse.json(
      { 
        error: error.message,
        code: error.code || 'INTERNAL_ERROR',
        retryable: error.retryable || false
      },
      { status: error.status || 500 }
    );
  }
} 