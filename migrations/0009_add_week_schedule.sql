-- Create week_schedule table for weekly planner
-- This table stores which goals/tasks are assigned to which days of the week

CREATE TABLE IF NOT EXISTS week_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER,
  task_id INTEGER,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL,
  day_of_week TEXT NOT NULL CHECK(day_of_week IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')),
  display_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE CASCADE,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  CHECK ((goal_id IS NOT NULL AND task_id IS NULL) OR (goal_id IS NULL AND task_id IS NOT NULL))
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_week_schedule_week ON week_schedule(year, week_number);
CREATE INDEX IF NOT EXISTS idx_week_schedule_day ON week_schedule(year, week_number, day_of_week);
CREATE INDEX IF NOT EXISTS idx_week_schedule_goal ON week_schedule(goal_id);
CREATE INDEX IF NOT EXISTS idx_week_schedule_task ON week_schedule(task_id);
