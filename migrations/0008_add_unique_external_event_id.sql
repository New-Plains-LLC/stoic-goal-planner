-- Clean up duplicate events and add unique constraint
-- First, delete duplicate events keeping only the most recent one

DELETE FROM schedule_events 
WHERE id NOT IN (
  SELECT MAX(id) 
  FROM schedule_events 
  WHERE external_event_id IS NOT NULL
  GROUP BY external_event_id
);

-- Now add the unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_external_event_id ON schedule_events(external_event_id) WHERE external_event_id IS NOT NULL;
