-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_timestamp ON chat_messages(timestamp);

-- Add RLS (Row Level Security) policies
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own messages
CREATE POLICY "Users can view their own messages"
    ON chat_messages
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own messages
CREATE POLICY "Users can insert their own messages"
    ON chat_messages
    FOR INSERT
    WITH CHECK (auth.uid() = user_id); 