-- Create tables for CalorieCounter app

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    username TEXT,
    weight NUMERIC,
    height NUMERIC,
    age INTEGER,
    gender TEXT CHECK (gender IN ('male', 'female')),
    activity_level NUMERIC,
    goal_offset INTEGER,
    target_calories INTEGER,
    target_protein INTEGER,
    target_carbs INTEGER,
    target_fat INTEGER
);

-- Meals table
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    meal_name TEXT NOT NULL,
    ingredients TEXT[] DEFAULT '{}',
    calories INTEGER NOT NULL,
    protein INTEGER NOT NULL,
    carbs INTEGER NOT NULL,
    fat INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_url TEXT
);

-- Weight history table
CREATE TABLE IF NOT EXISTS weight_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight NUMERIC NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up Row Level Security policies
-- Users can only read/write their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_entries ENABLE ROW LEVEL SECURITY;

-- Policy for users
CREATE POLICY "Users can read their own data" ON users
    FOR SELECT USING (auth.uid() = id);
    
CREATE POLICY "Users can update their own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Policy for meals
CREATE POLICY "Users can read their own meals" ON meals
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own meals" ON meals
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own meals" ON meals
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own meals" ON meals
    FOR DELETE USING (auth.uid() = user_id);

-- Policy for weight entries
CREATE POLICY "Users can read their own weight entries" ON weight_entries
    FOR SELECT USING (auth.uid() = user_id);
    
CREATE POLICY "Users can insert their own weight entries" ON weight_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);
    
CREATE POLICY "Users can update their own weight entries" ON weight_entries
    FOR UPDATE USING (auth.uid() = user_id);
    
CREATE POLICY "Users can delete their own weight entries" ON weight_entries
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_meals_user_id ON meals(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_entries_user_id ON weight_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_meals_created_at ON meals(created_at);
CREATE INDEX IF NOT EXISTS idx_weight_entries_created_at ON weight_entries(created_at);