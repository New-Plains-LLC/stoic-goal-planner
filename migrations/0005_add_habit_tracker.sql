-- Add habit tracker tables

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other' CHECK(category IN ('spiritual', 'financial', 'health', 'family', 'learning', 'fun', 'other')),
  frequency TEXT DEFAULT 'daily' CHECK(frequency IN ('daily', 'weekly')),
  target_days TEXT, -- For weekly habits: comma-separated days (e.g., "Monday,Wednesday,Friday")
  is_active INTEGER DEFAULT 1, -- 0 = archived, 1 = active
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Habit completions table (tracks daily check-offs)
CREATE TABLE IF NOT EXISTS habit_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  habit_id INTEGER NOT NULL,
  completion_date DATE NOT NULL,
  completed INTEGER DEFAULT 1, -- 1 = completed, 0 = missed/unchecked
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
  UNIQUE(habit_id, completion_date)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits(is_active);
CREATE INDEX IF NOT EXISTS idx_habits_category ON habits(category);
CREATE INDEX IF NOT EXISTS idx_habit_completions_date ON habit_completions(completion_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit ON habit_completions(habit_id);
