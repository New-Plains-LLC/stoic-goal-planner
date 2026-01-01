-- Clear existing data
DELETE FROM daily_task_selections;
DELETE FROM tasks;
DELETE FROM goals;

-- ============= LONG-TERM GOALS =============

-- Spiritual/Faith
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (1, 'Develop deep spiritual connection', 'Build a consistent spiritual practice and connection with my faith', 'long_term', 'spiritual', 'active');

-- Financial/Career
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (2, 'Achieve financial independence', 'Build wealth and create multiple income streams for financial freedom', 'long_term', 'financial', 'active');

-- Health/Fitness
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (3, 'Maintain optimal health and fitness', 'Stay physically fit, mentally sharp, and emotionally balanced throughout life', 'long_term', 'health', 'active');

-- Family/Friends
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (4, 'Build strong family bonds and friendships', 'Nurture deep, meaningful relationships with family and close friends', 'long_term', 'family', 'active');

-- Learning
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (5, 'Become a lifelong learner', 'Continuously grow knowledge and skills in diverse areas', 'long_term', 'learning', 'active');

-- Fun/Travel
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (6, 'Experience the world and embrace adventure', 'Travel to new places, try new experiences, and enjoy life''s pleasures', 'long_term', 'fun', 'active');

-- Other
INSERT INTO goals (id, title, description, goal_type, category, status) VALUES 
  (7, 'Live a life of purpose and impact', 'Make a positive difference in the world and leave a legacy', 'long_term', 'other', 'active');

-- ============= ANNUAL GOALS (2025) =============

-- Spiritual (parent: 1)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (11, 'Establish daily prayer/meditation practice', 'Pray or meditate for 20 minutes every morning', 'annual', 'spiritual', 1, 2025, 'active'),
  (12, 'Read 4 spiritual books this year', 'Deepen understanding through spiritual literature', 'annual', 'spiritual', 1, 2025, 'active');

-- Financial (parent: 2)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (13, 'Launch profitable side business', 'Start and grow a business generating $5K/month', 'annual', 'financial', 2, 2025, 'active'),
  (14, 'Save $25,000 this year', 'Build emergency fund and investment portfolio', 'annual', 'financial', 2, 2025, 'active');

-- Health (parent: 3)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (15, 'Exercise 5 days per week', 'Build consistent workout routine for strength and cardio', 'annual', 'health', 3, 2025, 'active'),
  (16, 'Reach ideal weight and body composition', 'Lose 20 lbs and build muscle through diet and exercise', 'annual', 'health', 3, 2025, 'active');

-- Family (parent: 4)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (17, 'Weekly family quality time', 'Dedicate every Sunday to family activities', 'annual', 'family', 4, 2025, 'active'),
  (18, 'Reconnect with 12 old friends', 'Reach out to one friend per month for meaningful conversation', 'annual', 'family', 4, 2025, 'active');

-- Learning (parent: 5)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (19, 'Learn Spanish to conversational level', 'Complete language course and practice with native speakers', 'annual', 'learning', 5, 2025, 'active'),
  (20, 'Complete professional certification', 'Earn certification in my field to advance career', 'annual', 'learning', 5, 2025, 'active');

-- Fun/Travel (parent: 6)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (21, 'Visit 3 new countries or states', 'Explore new destinations and cultures', 'annual', 'fun', 6, 2025, 'active'),
  (22, 'Try 12 new experiences', 'Do something new and exciting each month', 'annual', 'fun', 6, 2025, 'active');

-- Other (parent: 7)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, status) VALUES 
  (23, 'Volunteer 50 hours this year', 'Give back to community through regular volunteering', 'annual', 'other', 7, 2025, 'active');

-- ============= QUARTERLY GOALS (Q1 2025) =============

-- Spiritual (parent: 11)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (31, 'Complete first spiritual book', 'Finish reading and reflecting on spiritual text', 'quarterly', 'spiritual', 12, 2025, 1, 'active');

-- Financial (parent: 13)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (32, 'Complete business plan and MVP', 'Finish planning and build minimum viable product', 'quarterly', 'financial', 13, 2025, 1, 'active'),
  (33, 'Save $6,000 this quarter', 'Hit quarterly savings target', 'quarterly', 'financial', 14, 2025, 1, 'active');

-- Health (parent: 15)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (34, 'Establish workout routine', 'Complete 60 workouts this quarter (5/week)', 'quarterly', 'health', 15, 2025, 1, 'active'),
  (35, 'Lose 6 lbs through clean eating', 'Track calories and eat whole foods', 'quarterly', 'health', 16, 2025, 1, 'active');

-- Family (parent: 17)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (36, 'Plan and execute family activities', 'Complete 12 Sunday family activities', 'quarterly', 'family', 17, 2025, 1, 'active');

-- Learning (parent: 19)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (37, 'Complete Spanish basics', 'Finish first 3 modules of Spanish course', 'quarterly', 'learning', 19, 2025, 1, 'active');

-- Fun/Travel (parent: 21)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (38, 'Plan spring break trip', 'Research and book destination for Q2', 'quarterly', 'fun', 21, 2025, 1, 'active'),
  (39, 'Try 3 new activities', 'Experience new hobbies or adventures', 'quarterly', 'fun', 22, 2025, 1, 'active');

-- Other (parent: 23)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, quarter, status) VALUES 
  (40, 'Volunteer 15 hours', 'Complete 15 hours of community service', 'quarterly', 'other', 23, 2025, 1, 'active');

-- ============= WEEKLY GOALS (Week 1, 2025) =============

-- Spiritual (parent: 31)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (51, 'Read 3 chapters of spiritual book', 'Daily reading and reflection', 'weekly', 'spiritual', 31, 2025, 1, 'active');

-- Financial (parent: 32)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (52, 'Complete market research', 'Research competitors and target market', 'weekly', 'financial', 32, 2025, 1, 'active');

-- Health (parent: 34)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (53, 'Work out 5 times this week', 'Mon, Tue, Wed, Fri, Sat workouts', 'weekly', 'health', 34, 2025, 1, 'active');

-- Family (parent: 36)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (54, 'Plan Sunday family game night', 'Choose games and prepare snacks', 'weekly', 'family', 36, 2025, 1, 'active');

-- Learning (parent: 37)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (55, 'Complete 5 Spanish lessons', 'Practice daily for 30 minutes', 'weekly', 'learning', 37, 2025, 1, 'active');

-- Fun/Travel (parent: 38)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (56, 'Research weekend getaway destinations', 'Find 3 potential places for spring trip', 'weekly', 'fun', 38, 2025, 1, 'active');

-- Other (parent: 40)
INSERT INTO goals (id, title, description, goal_type, category, parent_id, year, week_number, status) VALUES 
  (57, 'Sign up for volunteer opportunity', 'Research and register with local organization', 'weekly', 'other', 40, 2025, 1, 'active');

-- ============= TASKS =============

-- Spiritual tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Morning prayer/meditation', '20 minutes of quiet reflection', 51, 'spiritual', 'high', 'pending', '2025-01-02'),
  ('Read spiritual book chapter 1', 'Read and take notes', 51, 'spiritual', 'high', 'pending', '2025-01-02');

-- Financial tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Research 5 competitors', 'Analyze their products, pricing, marketing', 52, 'financial', 'high', 'pending', '2025-01-02'),
  ('Create competitor comparison spreadsheet', 'Document findings', 52, 'financial', 'medium', 'pending', '2025-01-03');

-- Health tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Morning workout - Strength training', '45 min full body workout', 53, 'health', 'high', 'pending', '2025-01-02'),
  ('Meal prep for the week', 'Prepare healthy meals for 5 days', 53, 'health', 'medium', 'pending', '2025-01-01');

-- Family tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Call Mom', 'Weekly check-in call', 54, 'family', 'high', 'pending', '2025-01-02'),
  ('Buy board games for family night', 'Get 2 new games everyone will enjoy', 54, 'family', 'medium', 'pending', '2025-01-03');

-- Learning tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Spanish lesson 1 - Greetings', 'Learn basic greetings and introductions', 55, 'learning', 'medium', 'pending', '2025-01-02'),
  ('Spanish practice with app', '30 minutes on Duolingo', 55, 'learning', 'medium', 'pending', '2025-01-02');

-- Fun/Travel tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Research beach destinations', 'Look into coastal getaways within 3 hours drive', 56, 'fun', 'medium', 'pending', '2025-01-02'),
  ('Check hotel rates for spring', 'Compare prices for March-April dates', 56, 'fun', 'low', 'pending', '2025-01-03');

-- Other tasks
INSERT INTO tasks (title, description, goal_id, category, priority, status, due_date) VALUES 
  ('Research local volunteer opportunities', 'Find organizations aligned with my values', 57, 'other', 'low', 'pending', '2025-01-03');

-- ============= HABITS =============

-- Daily habits
INSERT INTO habits (title, description, category, frequency, is_active) VALUES 
  ('Morning prayer/meditation', 'Start the day with 20 minutes of prayer or meditation', 'spiritual', 'daily', 1),
  ('Read for 30 minutes', 'Read books for learning or spiritual growth', 'learning', 'daily', 1),
  ('Exercise', 'Complete daily workout routine', 'health', 'daily', 1),
  ('Drink 8 glasses of water', 'Stay hydrated throughout the day', 'health', 'daily', 1),
  ('Track expenses', 'Log all spending in budget app', 'financial', 'daily', 1),
  ('Quality time with family', 'Spend intentional time with loved ones', 'family', 'daily', 1),
  ('Evening gratitude', 'Write down 3 things I''m grateful for', 'spiritual', 'daily', 1),
  ('Plan tomorrow', 'Review schedule and set priorities for next day', 'other', 'daily', 1);

-- Weekly habits (specific days)
INSERT INTO habits (title, description, category, frequency, target_days, is_active) VALUES 
  ('Meal prep', 'Prepare healthy meals for the week', 'health', 'weekly', 'Sunday', 1),
  ('Review finances', 'Check budget and investment accounts', 'financial', 'weekly', 'Sunday', 1),
  ('Family game night', 'Play games with family', 'family', 'weekly', 'Friday', 1),
  ('Deep work session', 'Focused work on important projects', 'learning', 'weekly', 'Monday,Wednesday,Friday', 1);
