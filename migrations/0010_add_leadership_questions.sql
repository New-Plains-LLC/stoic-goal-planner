-- Add leadership reflection columns to weekly_evaluations table
ALTER TABLE weekly_evaluations ADD COLUMN decision_bottleneck TEXT;
ALTER TABLE weekly_evaluations ADD COLUMN process_gaps TEXT;
ALTER TABLE weekly_evaluations ADD COLUMN motion_vs_progress TEXT;
ALTER TABLE weekly_evaluations ADD COLUMN quiet_comfort TEXT;
