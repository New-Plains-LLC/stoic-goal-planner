-- Add repeating flag for weekly goals
ALTER TABLE goals ADD COLUMN is_repeating BOOLEAN DEFAULT 0;

-- Create index for repeating goals queries
CREATE INDEX IF NOT EXISTS idx_goals_repeating ON goals(is_repeating, goal_type);
