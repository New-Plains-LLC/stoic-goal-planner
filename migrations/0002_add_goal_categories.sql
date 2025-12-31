-- Add category column to goals table
ALTER TABLE goals ADD COLUMN category TEXT DEFAULT 'other' CHECK(category IN ('spiritual', 'financial', 'health', 'family', 'learning', 'other'));

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
