-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_shifts_date ON shifts(date);

-- Add RLS (Row Level Security) policies
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own shifts
CREATE POLICY "Users can view their own shifts"
    ON shifts
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy to allow users to insert their own shifts
CREATE POLICY "Users can insert their own shifts"
    ON shifts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own shifts
CREATE POLICY "Users can update their own shifts"
    ON shifts
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own shifts
CREATE POLICY "Users can delete their own shifts"
    ON shifts
    FOR DELETE
    USING (auth.uid() = user_id); 