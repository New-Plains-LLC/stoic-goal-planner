-- Add display_order columns for custom sorting

-- Add display_order to habits table
ALTER TABLE habits ADD COLUMN display_order INTEGER DEFAULT 0;

-- Add display_order to goals table  
ALTER TABLE goals ADD COLUMN display_order INTEGER DEFAULT 0;

-- Create indexes for ordering
CREATE INDEX IF NOT EXISTS idx_habits_order ON habits(display_order, category);
CREATE INDEX IF NOT EXISTS idx_goals_order ON goals(display_order, goal_type);

-- Update existing habits with sequential order
UPDATE habits SET display_order = id WHERE display_order = 0;

-- Update existing goals with sequential order
UPDATE goals SET display_order = id WHERE display_order = 0;
