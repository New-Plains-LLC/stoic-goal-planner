-- Add category column to tasks table
ALTER TABLE tasks ADD COLUMN category TEXT DEFAULT 'other' CHECK(category IN ('spiritual', 'financial', 'health', 'family', 'learning', 'other'));

-- Create index for category queries
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
