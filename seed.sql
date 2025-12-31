-- Sample long-term goal
INSERT OR IGNORE INTO goals (id, title, description, goal_type, status) VALUES 
  (1, 'Become a successful entrepreneur', 'Build a profitable business that provides value to customers and achieves financial independence', 'long_term', 'active');

-- Sample annual goals (linked to long-term goal)
INSERT OR IGNORE INTO goals (id, title, description, goal_type, parent_id, year, status) VALUES 
  (2, 'Launch MVP of my product', 'Complete and launch the minimum viable product by end of year', 'annual', 1, 2025, 'active'),
  (3, 'Grow professional network', 'Connect with 100 professionals in my industry', 'annual', 1, 2025, 'active');

-- Sample quarterly goals (Q1 2025)
INSERT OR IGNORE INTO goals (id, title, description, goal_type, parent_id, year, quarter, status) VALUES 
  (4, 'Complete product design', 'Finish all wireframes and design specs', 'quarterly', 2, 2025, 1, 'active'),
  (5, 'Attend 2 networking events', 'Participate in industry conferences or meetups', 'quarterly', 3, 2025, 1, 'active');

-- Sample weekly goals (Week 1, 2025)
INSERT OR IGNORE INTO goals (id, title, description, goal_type, parent_id, year, week_number, status) VALUES 
  (6, 'Design home page wireframe', 'Complete wireframe for landing page', 'weekly', 4, 2025, 1, 'active'),
  (7, 'Research competitors', 'Analyze top 5 competitor products', 'weekly', 4, 2025, 1, 'active');

-- Sample tasks
INSERT OR IGNORE INTO tasks (title, description, goal_id, priority, status, due_date) VALUES 
  ('Sketch landing page layout', 'Create rough sketches of key sections', 6, 'high', 'pending', '2025-01-02'),
  ('List must-have features', 'Document core features for MVP', 6, 'high', 'pending', '2025-01-02'),
  ('Create competitor spreadsheet', 'Set up comparison matrix', 7, 'medium', 'pending', '2025-01-03'),
  ('Review competitor pricing', 'Analyze pricing models', 7, 'medium', 'pending', '2025-01-03'),
  ('Morning exercise routine', ' 30 minutes workout', NULL, 'high', 'pending', '2025-01-02');

-- Sample daily entry
INSERT OR IGNORE INTO daily_entries (id, entry_date, stoic_quote, stoic_quote_meaning) VALUES 
  (1, '2025-01-01', 'The obstacle is the way.', 'What stands in the way becomes the way. Obstacles are opportunities for growth and learning.');
