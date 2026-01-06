-- Add unique constraint on external_event_id to prevent duplicate calendar events
-- First, clean up any potential duplicates (keeping the most recent one)

DELETE FROM schedule_events 
WHERE rowid NOT IN (
  SELECT MAX(rowid) 
  FROM schedule_events 
  WHERE external_event_id IS NOT NULL
  GROUP BY external_event_id
);

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_event_id ON schedule_events(external_event_id) WHERE external_event_id IS NOT NULL;
