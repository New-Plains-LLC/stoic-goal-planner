-- Add fun/travel category to goals and tasks
-- SQLite doesn't support ALTER CHECK constraint, so we need to recreate the tables

-- Disable foreign keys temporarily
PRAGMA foreign_keys = OFF;

-- First, create a new goals table with the updated constraint
CREATE TABLE goals_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  goal_type TEXT NOT NULL CHECK(goal_type IN ('long_term', 'annual', 'quarterly', 'weekly', 'daily')),
  year INTEGER,
  quarter INTEGER,
  week_number INTEGER,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'completed', 'archived')),
  progress INTEGER DEFAULT 0,
  parent_id INTEGER,
  category TEXT DEFAULT 'other' CHECK(category IN ('spiritual', 'financial', 'health', 'family', 'learning', 'fun', 'other')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (parent_id) REFERENCES goals(id)
);

-- Copy data from old table
INSERT INTO goals_new (id, title, description, goal_type, year, quarter, week_number, status, progress, parent_id, category, created_at, updated_at, completed_at)
SELECT id, title, description, goal_type, year, quarter, week_number, status, progress, parent_id, category, created_at, updated_at, completed_at FROM goals;

-- Drop old table
DROP TABLE goals;

-- Rename new table
ALTER TABLE goals_new RENAME TO goals;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_goals_type ON goals(goal_type);
CREATE INDEX IF NOT EXISTS idx_goals_category ON goals(category);
CREATE INDEX IF NOT EXISTS idx_goals_parent ON goals(parent_id);

-- Now update tasks table
CREATE TABLE tasks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  goal_id INTEGER,
  priority TEXT DEFAULT 'medium' CHECK(priority IN ('high', 'medium', 'low')),
  due_date DATE,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  category TEXT DEFAULT 'other' CHECK(category IN ('spiritual', 'financial', 'health', 'family', 'learning', 'fun', 'other')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (goal_id) REFERENCES goals(id)
);

-- Copy data from old table
INSERT INTO tasks_new (id, title, description, goal_id, priority, due_date, status, category, created_at, updated_at, completed_at)
SELECT id, title, description, goal_id, priority, due_date, status, category, created_at, updated_at, completed_at FROM tasks;

-- Drop old table
DROP TABLE tasks;

-- Rename new table
ALTER TABLE tasks_new RENAME TO tasks;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- Re-enable foreign keys
PRAGMA foreign_keys = ON;
