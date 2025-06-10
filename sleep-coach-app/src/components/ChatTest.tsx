'use client';

import { useState, useRef, useEffect } from 'react';
import { type ChatMessage } from '@/lib/chat';
import { saveChatMessage, getChatMessages } from '@/app/actions';

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  return date.toISOString().split('T')[1].slice(0, 5); // Returns HH:mm format
}

function MessageList({ messages, isLoading, onJumpToMessage }: { 
  messages: ChatMessage[], 
  isLoading?: boolean,
  onJumpToMessage?: (message: ChatMessage) => void 
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="mb-4 space-y-4 max-h-[400px] overflow-y-auto">
      {messages.map((msg, index) => (
        <div
          key={`${msg.timestamp}-${index}`}
          id={`message-${msg.timestamp}`}
          data-message-id={msg.timestamp}
          className={`p-3 rounded-lg ${
            msg.role === 'user' 
              ? 'bg-blue-100 ml-4' 
              : 'bg-gray-100 mr-4'
          } whitespace-pre-wrap`}
        >
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm whitespace-pre-wrap break-words flex-1">{msg.content}</p>
            {onJumpToMessage && (
              <button
                onClick={() => onJumpToMessage(msg)}
                className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Jump
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatTimestamp(msg.timestamp)}
          </p>
        </div>
      ))}
      {isLoading && (
        <div className="p-3 rounded-lg bg-gray-100 mr-4 animate-pulse">
          <p className="text-sm text-gray-400">Thinking...</p>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}

export default function ChatTest({ initialMessages = [] }: { initialMessages?: ChatMessage[] }) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const retryCountRef = useRef(0);
  const lastMessageRef = useRef<ChatMessage | null>(null);
  const MAX_RETRIES = 3;

  // Filter messages based on search term
  const filteredMessages = messages.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleJumpToMessage = (message: ChatMessage) => {
    setIsSearching(false);
    setSearchTerm('');
    
    // Wait for the next render cycle to ensure the full conversation is shown
    setTimeout(() => {
      const messageElement = document.getElementById(`message-${message.timestamp}`);
      if (messageElement) {
        messageElement.scrollIntoView({ 
          behavior: "smooth", 
          block: "center"
        });
        // Add a highlight effect
        messageElement.classList.add('bg-yellow-100');
        setTimeout(() => {
          messageElement.classList.remove('bg-yellow-100');
        }, 2000);
      }
    }, 100);
  };

  // Sync messages state with initialMessages prop (for SSR hydration and refresh)
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  // Countdown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setInterval(() => {
        setCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldown]);

  // Focus input after messages update
  useEffect(() => {
    if (!isLoading) {
      // Small delay to ensure component has re-rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [messages, isLoading]);

  const retryLastMessage = async () => {
    if (!lastMessageRef.current) return;
    
    try {
      setIsLoading(true);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, lastMessageRef.current],
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        if (data.retryable && retryCountRef.current < MAX_RETRIES && data.code !== 'RATE_LIMIT_EXCEEDED') {
          retryCountRef.current += 1;
          setError(`${data.error} (Code: ${data.code}, Retryable: ${data.retryable}, Retry ${retryCountRef.current}/${MAX_RETRIES})`);
          setTimeout(retryLastMessage, 2000);
        } else {
          setError(`${data.error} (Code: ${data.code}, Retryable: ${data.retryable})`);
          retryCountRef.current = 0;
          lastMessageRef.current = null;
          // Set cooldown when rate limited
          if (data.code === 'RATE_LIMIT_EXCEEDED') {
            setCooldown(60); // 60 seconds cooldown
          }
        }
      } else {
        // Reset retry count on success
        retryCountRef.current = 0;
        lastMessageRef.current = null;
        // Save assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content,
          timestamp: data.message.timestamp,
        };
        await saveChatMessage(assistantMessage);
        setMessage('');
        // Update messages locally instead of reloading
        setMessages(prev => [...prev, lastMessageRef.current!, assistantMessage]);
      }
    } catch (err) {
      console.error('Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send message');
      }
      retryCountRef.current = 0;
      lastMessageRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0) return; // Don't allow sending during cooldown
    if (!message.trim()) return; // Don't allow empty messages
    setError('');
    
    // Create and save user message immediately
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    };
    
    // Update UI with user message immediately
    setMessages(prev => [...prev, userMessage]);
    setMessage(''); // Clear input
    setIsLoading(true); // Start loading state for AI response
    
    try {
      // Save user message to database
      await saveChatMessage(userMessage);
      lastMessageRef.current = userMessage;

      // Get AI response
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      const data = await res.json();
      
      if (data.error) {
        if (data.retryable && retryCountRef.current < MAX_RETRIES && data.code !== 'RATE_LIMIT_EXCEEDED') {
          retryCountRef.current += 1;
          setError(`${data.error} (Code: ${data.code}, Retryable: ${data.retryable}, Retry ${retryCountRef.current}/${MAX_RETRIES})`);
          setTimeout(retryLastMessage, 2000);
        } else {
          setError(`${data.error} (Code: ${data.code}, Retryable: ${data.retryable})`);
          retryCountRef.current = 0;
          lastMessageRef.current = null;
          // Set cooldown when rate limited
          if (data.code === 'RATE_LIMIT_EXCEEDED') {
            setCooldown(60); // 60 seconds cooldown
          }
        }
      } else {
        // Reset retry count on success
        retryCountRef.current = 0;
        lastMessageRef.current = null;
        // Save assistant message
        const assistantMessage: ChatMessage = {
          role: 'assistant',
          content: data.message.content,
          timestamp: data.message.timestamp,
        };
        await saveChatMessage(assistantMessage);
        // Update messages with AI response
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error('Error:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to send message');
      }
      retryCountRef.current = 0;
      lastMessageRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      {/* Search Bar */}
      <div className="mb-4 relative">
        <div className="relative">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsSearching(e.target.value.length > 0);
            }}
            className="w-full p-2 pl-10 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            🔍
          </span>
        </div>
      </div>

      {/* Message History */}
      <MessageList 
        messages={isSearching ? filteredMessages : messages} 
        isLoading={isLoading}
        onJumpToMessage={isSearching ? handleJumpToMessage : undefined}
      />

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          placeholder={cooldown > 0 ? `Please wait ${cooldown}s...` : "Type your message..."}
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y min-h-[48px] max-h-40"
          style={{ whiteSpace: 'pre-wrap' }}
          disabled={isLoading || cooldown > 0}
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          disabled={isLoading || cooldown > 0 || !message.trim()}
        >
          {isLoading ? 'Sending...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Send'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}
    </div>
  );
} 