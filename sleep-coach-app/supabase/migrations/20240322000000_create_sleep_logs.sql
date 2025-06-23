-- Create sleep_logs table
CREATE TABLE IF NOT EXISTS sleep_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    events JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_id ON sleep_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sleep_logs_date ON sleep_logs(date);

-- Add RLS (Row Level Security) policies
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own sleep logs
CREATE POLICY "Users can view their own sleep logs"
    ON sleep_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own sleep logs
CREATE POLICY "Users can insert their own sleep logs"
    ON sleep_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own sleep logs
CREATE POLICY "Users can update their own sleep logs"
    ON sleep_logs
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own sleep logs
CREATE POLICY "Users can delete their own sleep logs"
    ON sleep_logs
    FOR DELETE
    USING (auth.uid() = user_id); 