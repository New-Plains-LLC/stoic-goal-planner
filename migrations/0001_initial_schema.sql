-- Goals table (hierarchical structure)
CREATE TABLE IF NOT EXISTS goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK(goal_type IN ('long_term', 'annual', 'quarterly', 'weekly', 'daily')),
  parent_id INTEGER,
  year INTEGER,
  quarter INTEGER CHECK(quarter IS NULL OR quarter BETWEEN 1 AND 4),
  week_number INTEGER CHECK(week_number IS NULL OR week_number BETWEEN 1 AND 53),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
  progress INTEGER DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES goals(id) ON DELETE CASCADE
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  goal_id INTEGER,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date DATE,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL
);

-- Daily entries table (one per day)
CREATE TABLE IF NOT EXISTS daily_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entry_date DATE UNIQUE NOT NULL,
  stoic_quote TEXT,
  stoic_quote_meaning TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Affirmations (3 per day)
CREATE TABLE IF NOT EXISTS affirmations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_id INTEGER NOT NULL,
  affirmation_text TEXT NOT NULL,
  affirmation_order INTEGER NOT NULL CHECK(affirmation_order BETWEEN 1 AND 3),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE,
  UNIQUE(daily_entry_id, affirmation_order)
);

-- Gratitude entries (3 per day)
CREATE TABLE IF NOT EXISTS gratitude (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_id INTEGER NOT NULL,
  gratitude_text TEXT NOT NULL,
  gratitude_order INTEGER NOT NULL CHECK(gratitude_order BETWEEN 1 AND 3),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE,
  UNIQUE(daily_entry_id, gratitude_order)
);

-- Daily wins (3 wins from today + 3 planned for tomorrow)
CREATE TABLE IF NOT EXISTS wins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_id INTEGER NOT NULL,
  win_text TEXT NOT NULL,
  win_type TEXT NOT NULL CHECK(win_type IN ('today', 'tomorrow')),
  win_order INTEGER NOT NULL CHECK(win_order BETWEEN 1 AND 3),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE,
  UNIQUE(daily_entry_id, win_type, win_order)
);

-- Daily task selections (which tasks are selected for the day)
CREATE TABLE IF NOT EXISTS daily_task_selections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  daily_entry_id INTEGER NOT NULL,
  task_id INTEGER NOT NULL,
  completed BOOLEAN DEFAULT 0,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (daily_entry_id) REFERENCES daily_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE(daily_entry_id, task_id)
);

-- Schedule/calendar events
CREATE TABLE IF NOT EXISTS schedule_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  location TEXT,
  calendar_source TEXT,
  external_event_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Weekly evaluations
CREATE TABLE IF NOT EXISTS weekly_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL CHECK(week_number BETWEEN 1 AND 53),
  evaluation_text TEXT,
  achievements TEXT,
  challenges TEXT,
  next_week_plan TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, week_number)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_goals_year_quarter ON goals(year, quarter);
CREATE INDEX IF NOT EXISTS idx_goals_week ON goals(week_number);
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_daily_entries_date ON daily_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_schedule_start ON schedule_events(start_time);
CREATE INDEX IF NOT EXISTS idx_weekly_eval ON weekly_evaluations(year, week_number);
