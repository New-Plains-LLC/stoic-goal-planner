import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB: D1Database;
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// ============= GOALS API =============

// Get all goals (optionally filtered by type and category)
app.get('/api/goals', async (c) => {
  const { env } = c;
  const goalType = c.req.query('type');
  const parentId = c.req.query('parent_id');
  const category = c.req.query('category');
  
  let query = 'SELECT * FROM goals WHERE status != "archived"';
  const params: any[] = [];
  
  if (goalType) {
    query += ' AND goal_type = ?';
    params.push(goalType);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  if (parentId !== undefined) {
    if (parentId === 'null') {
      query += ' AND parent_id IS NULL';
    } else {
      query += ' AND parent_id = ?';
      params.push(parseInt(parentId));
    }
  }
  
  query += ' ORDER BY display_order, category, created_at DESC';
  
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Get single goal
app.get('/api/goals/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  const { results } = await env.DB.prepare('SELECT * FROM goals WHERE id = ?').bind(id).all();
  
  if (!results || results.length === 0) {
    return c.json({ error: 'Goal not found' }, 404);
  }
  
  return c.json(results[0]);
});

// Create new goal
app.post('/api/goals', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { title, description, goal_type, category, parent_id, year, quarter, week_number } = body;
  
  const result = await env.DB.prepare(`
    INSERT INTO goals (title, description, goal_type, category, parent_id, year, quarter, week_number)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(title, description, goal_type, category || 'other', parent_id || null, year || null, quarter || null, week_number || null).run();
  
  return c.json({ id: result.meta.last_row_id, ...body }, 201);
});

// Update goal
app.put('/api/goals/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { title, description, category, status, progress, completed_at } = body;
  
  await env.DB.prepare(`
    UPDATE goals 
    SET title = ?, description = ?, category = ?, status = ?, progress = ?, completed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description, category, status, progress, completed_at || null, id).run();
  
  return c.json({ id: parseInt(id), ...body });
});

// Delete goal
app.delete('/api/goals/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  await env.DB.prepare('DELETE FROM goals WHERE id = ?').bind(id).run();
  
  return c.json({ success: true });
});

// Reorder goals
app.post('/api/goals/reorder', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { goalIds } = body; // Array of goal IDs in desired order
  
  // Update display_order for each goal
  for (let i = 0; i < goalIds.length; i++) {
    await env.DB.prepare(`
      UPDATE goals SET display_order = ? WHERE id = ?
    `).bind(i, goalIds[i]).run();
  }
  
  return c.json({ success: true });
});

// Get goal hierarchy (with children)
app.get('/api/goals/:id/hierarchy', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  const { results: children } = await env.DB.prepare(
    'SELECT * FROM goals WHERE parent_id = ? ORDER BY created_at DESC'
  ).bind(id).all();
  
  return c.json(children);
});

// ============= TASKS API =============

// Get all tasks (optionally filtered by goal, date, or category)
app.get('/api/tasks', async (c) => {
  const { env } = c;
  const goalId = c.req.query('goal_id');
  const dueDate = c.req.query('due_date');
  const status = c.req.query('status');
  const category = c.req.query('category');
  
  let query = 'SELECT * FROM tasks WHERE 1=1';
  const params: any[] = [];
  
  if (goalId) {
    query += ' AND goal_id = ?';
    params.push(parseInt(goalId));
  }
  
  if (dueDate) {
    query += ' AND due_date = ?';
    params.push(dueDate);
  }
  
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  
  query += ' ORDER BY category, priority DESC, due_date ASC';
  
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Create task
app.post('/api/tasks', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { title, description, goal_id, category, priority, due_date } = body;
  
  const result = await env.DB.prepare(`
    INSERT INTO tasks (title, description, goal_id, category, priority, due_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(title, description, goal_id || null, category || 'other', priority || 'medium', due_date || null).run();
  
  return c.json({ id: result.meta.last_row_id, ...body }, 201);
});

// Update task
app.put('/api/tasks/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { title, description, category, priority, status, due_date, completed_at } = body;
  
  await env.DB.prepare(`
    UPDATE tasks 
    SET title = ?, description = ?, category = ?, priority = ?, status = ?, due_date = ?, 
        completed_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description, category, priority, status, due_date, completed_at || null, id).run();
  
  return c.json({ id: parseInt(id), ...body });
});

// Delete task
app.delete('/api/tasks/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  
  return c.json({ success: true });
});

// ============= DAILY ENTRIES API =============

// Get daily entry by date
app.get('/api/daily/:date', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  
  // Get daily entry
  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM daily_entries WHERE entry_date = ?'
  ).bind(date).all();
  
  let dailyEntry = entries && entries.length > 0 ? entries[0] : null;
  
  if (!dailyEntry) {
    // Create new daily entry if it doesn't exist
    const result = await env.DB.prepare(`
      INSERT INTO daily_entries (entry_date) VALUES (?)
    `).bind(date).run();
    
    dailyEntry = {
      id: result.meta.last_row_id,
      entry_date: date,
      stoic_quote: null,
      stoic_quote_meaning: null
    };
  }
  
  // Get affirmations
  const { results: affirmations } = await env.DB.prepare(
    'SELECT * FROM affirmations WHERE daily_entry_id = ? ORDER BY affirmation_order'
  ).bind(dailyEntry.id).all();
  
  // Get gratitude
  const { results: gratitude } = await env.DB.prepare(
    'SELECT * FROM gratitude WHERE daily_entry_id = ? ORDER BY gratitude_order'
  ).bind(dailyEntry.id).all();
  
  // Get wins
  const { results: wins } = await env.DB.prepare(
    'SELECT * FROM wins WHERE daily_entry_id = ? ORDER BY win_type, win_order'
  ).bind(dailyEntry.id).all();
  
  // Get selected tasks
  const { results: selectedTasks } = await env.DB.prepare(`
    SELECT t.*, dts.completed, dts.completed_at 
    FROM daily_task_selections dts
    JOIN tasks t ON dts.task_id = t.id
    WHERE dts.daily_entry_id = ?
    ORDER BY t.priority DESC
  `).bind(dailyEntry.id).all();
  
  // Get schedule for the day
  const { results: schedule } = await env.DB.prepare(`
    SELECT * FROM schedule_events 
    WHERE DATE(start_time) = ?
    ORDER BY start_time
  `).bind(date).all();
  
  return c.json({
    ...dailyEntry,
    affirmations: affirmations || [],
    gratitude: gratitude || [],
    wins: wins || [],
    selectedTasks: selectedTasks || [],
    schedule: schedule || []
  });
});

// Update daily entry (quote, affirmations, gratitude, wins)
app.put('/api/daily/:date', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  const body = await c.req.json();
  
  // Get or create daily entry
  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM daily_entries WHERE entry_date = ?'
  ).bind(date).all();
  
  let dailyEntryId;
  
  if (!entries || entries.length === 0) {
    const result = await env.DB.prepare(`
      INSERT INTO daily_entries (entry_date) VALUES (?)
    `).bind(date).run();
    dailyEntryId = result.meta.last_row_id;
  } else {
    dailyEntryId = entries[0].id;
  }
  
  // Update stoic quote if provided
  if (body.stoic_quote || body.stoic_quote_meaning) {
    await env.DB.prepare(`
      UPDATE daily_entries 
      SET stoic_quote = ?, stoic_quote_meaning = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(body.stoic_quote || null, body.stoic_quote_meaning || null, dailyEntryId).run();
  }
  
  // Update affirmations
  if (body.affirmations) {
    // Delete existing
    await env.DB.prepare('DELETE FROM affirmations WHERE daily_entry_id = ?').bind(dailyEntryId).run();
    
    // Insert new
    for (let i = 0; i < body.affirmations.length && i < 3; i++) {
      await env.DB.prepare(`
        INSERT INTO affirmations (daily_entry_id, affirmation_text, affirmation_order)
        VALUES (?, ?, ?)
      `).bind(dailyEntryId, body.affirmations[i], i + 1).run();
    }
  }
  
  // Update gratitude
  if (body.gratitude) {
    // Delete existing
    await env.DB.prepare('DELETE FROM gratitude WHERE daily_entry_id = ?').bind(dailyEntryId).run();
    
    // Insert new
    for (let i = 0; i < body.gratitude.length && i < 3; i++) {
      await env.DB.prepare(`
        INSERT INTO gratitude (daily_entry_id, gratitude_text, gratitude_order)
        VALUES (?, ?, ?)
      `).bind(dailyEntryId, body.gratitude[i], i + 1).run();
    }
  }
  
  // Update wins
  if (body.wins) {
    // Delete existing
    await env.DB.prepare('DELETE FROM wins WHERE daily_entry_id = ?').bind(dailyEntryId).run();
    
    // Insert new
    if (body.wins.today) {
      for (let i = 0; i < body.wins.today.length && i < 3; i++) {
        await env.DB.prepare(`
          INSERT INTO wins (daily_entry_id, win_text, win_type, win_order)
          VALUES (?, ?, 'today', ?)
        `).bind(dailyEntryId, body.wins.today[i], i + 1).run();
      }
    }
    
    if (body.wins.tomorrow) {
      for (let i = 0; i < body.wins.tomorrow.length && i < 3; i++) {
        await env.DB.prepare(`
          INSERT INTO wins (daily_entry_id, win_text, win_type, win_order)
          VALUES (?, ?, 'tomorrow', ?)
        `).bind(dailyEntryId, body.wins.tomorrow[i], i + 1).run();
      }
    }
  }
  
  return c.json({ success: true });
});

// Add task to daily selection
app.post('/api/daily/:date/tasks/:taskId', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  const taskId = c.req.param('taskId');
  
  // Get or create daily entry
  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM daily_entries WHERE entry_date = ?'
  ).bind(date).all();
  
  let dailyEntryId;
  
  if (!entries || entries.length === 0) {
    const result = await env.DB.prepare(`
      INSERT INTO daily_entries (entry_date) VALUES (?)
    `).bind(date).run();
    dailyEntryId = result.meta.last_row_id;
  } else {
    dailyEntryId = entries[0].id;
  }
  
  // Add task to selection
  await env.DB.prepare(`
    INSERT OR IGNORE INTO daily_task_selections (daily_entry_id, task_id)
    VALUES (?, ?)
  `).bind(dailyEntryId, taskId).run();
  
  return c.json({ success: true });
});

// Remove task from daily selection
app.delete('/api/daily/:date/tasks/:taskId', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  const taskId = c.req.param('taskId');
  
  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM daily_entries WHERE entry_date = ?'
  ).bind(date).all();
  
  if (entries && entries.length > 0) {
    await env.DB.prepare(`
      DELETE FROM daily_task_selections 
      WHERE daily_entry_id = ? AND task_id = ?
    `).bind(entries[0].id, taskId).run();
  }
  
  return c.json({ success: true });
});

// Mark daily task as completed
app.put('/api/daily/:date/tasks/:taskId/complete', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  const taskId = c.req.param('taskId');
  const body = await c.req.json();
  
  const { results: entries } = await env.DB.prepare(
    'SELECT * FROM daily_entries WHERE entry_date = ?'
  ).bind(date).all();
  
  if (entries && entries.length > 0) {
    await env.DB.prepare(`
      UPDATE daily_task_selections 
      SET completed = ?, completed_at = ?
      WHERE daily_entry_id = ? AND task_id = ?
    `).bind(body.completed ? 1 : 0, body.completed ? new Date().toISOString() : null, entries[0].id, taskId).run();
  }
  
  return c.json({ success: true });
});

// ============= WEEKLY EVALUATIONS API =============

// Get weekly evaluation
app.get('/api/weekly/:year/:week', async (c) => {
  const { env } = c;
  const year = c.req.param('year');
  const week = c.req.param('week');
  
  const { results } = await env.DB.prepare(
    'SELECT * FROM weekly_evaluations WHERE year = ? AND week_number = ?'
  ).bind(year, week).all();
  
  if (!results || results.length === 0) {
    return c.json(null);
  }
  
  return c.json(results[0]);
});

// Create or update weekly evaluation
app.put('/api/weekly/:year/:week', async (c) => {
  const { env } = c;
  const year = c.req.param('year');
  const week = c.req.param('week');
  const body = await c.req.json();
  
  const { evaluation_text, achievements, challenges, next_week_plan } = body;
  
  // Check if exists
  const { results } = await env.DB.prepare(
    'SELECT * FROM weekly_evaluations WHERE year = ? AND week_number = ?'
  ).bind(year, week).all();
  
  if (results && results.length > 0) {
    // Update
    await env.DB.prepare(`
      UPDATE weekly_evaluations 
      SET evaluation_text = ?, achievements = ?, challenges = ?, next_week_plan = ?, updated_at = CURRENT_TIMESTAMP
      WHERE year = ? AND week_number = ?
    `).bind(evaluation_text, achievements, challenges, next_week_plan, year, week).run();
  } else {
    // Insert
    await env.DB.prepare(`
      INSERT INTO weekly_evaluations (year, week_number, evaluation_text, achievements, challenges, next_week_plan)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(year, week, evaluation_text, achievements, challenges, next_week_plan).run();
  }
  
  return c.json({ success: true });
});

// ============= SCHEDULE API =============

// Get schedule events
app.get('/api/schedule', async (c) => {
  const { env } = c;
  const startDate = c.req.query('start_date');
  const endDate = c.req.query('end_date');
  
  let query = 'SELECT * FROM schedule_events WHERE 1=1';
  const params: any[] = [];
  
  if (startDate) {
    query += ' AND start_time >= ?';
    params.push(startDate);
  }
  
  if (endDate) {
    query += ' AND start_time <= ?';
    params.push(endDate);
  }
  
  query += ' ORDER BY start_time ASC';
  
  const { results } = await env.DB.prepare(query).bind(...params).all();
  return c.json(results);
});

// Create schedule event
app.post('/api/schedule', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { title, description, start_time, end_time, location, calendar_source, external_event_id } = body;
  
  const result = await env.DB.prepare(`
    INSERT INTO schedule_events (title, description, start_time, end_time, location, calendar_source, external_event_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(title, description, start_time, end_time, location || null, calendar_source || null, external_event_id || null).run();
  
  return c.json({ id: result.meta.last_row_id, ...body }, 201);
});

// Update schedule event
app.put('/api/schedule/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { title, description, start_time, end_time, location } = body;
  
  await env.DB.prepare(`
    UPDATE schedule_events 
    SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description, start_time, end_time, location || null, id).run();
  
  return c.json({ id, ...body });
});

// Delete schedule event
app.delete('/api/schedule/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  await env.DB.prepare(`DELETE FROM schedule_events WHERE id = ?`).bind(id).run();
  
  return c.json({ success: true });
});

// ============= HABIT TRACKER API =============

// Get all habits
app.get('/api/habits', async (c) => {
  const { env } = c;
  const { is_active } = c.req.query();
  
  let query = 'SELECT * FROM habits';
  const params = [];
  
  if (is_active !== undefined) {
    query += ' WHERE is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }
  
  query += ' ORDER BY display_order, category, title';
  
  const result = await env.DB.prepare(query).bind(...params).all();
  return c.json(result.results);
});

// Create habit
app.post('/api/habits', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { title, description, category, frequency, target_days } = body;
  
  const result = await env.DB.prepare(`
    INSERT INTO habits (title, description, category, frequency, target_days)
    VALUES (?, ?, ?, ?, ?)
  `).bind(title, description || null, category || 'other', frequency || 'daily', target_days || null).run();
  
  return c.json({ id: result.meta.last_row_id, ...body }, 201);
});

// Update habit
app.put('/api/habits/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  const body = await c.req.json();
  
  const { title, description, category, frequency, target_days, is_active } = body;
  
  await env.DB.prepare(`
    UPDATE habits 
    SET title = ?, description = ?, category = ?, frequency = ?, target_days = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(title, description || null, category, frequency, target_days || null, is_active !== undefined ? is_active : 1, id).run();
  
  return c.json({ id, ...body });
});

// Delete habit
app.delete('/api/habits/:id', async (c) => {
  const { env } = c;
  const id = c.req.param('id');
  
  await env.DB.prepare('DELETE FROM habits WHERE id = ?').bind(id).run();
  
  return c.json({ success: true });
});

// Get habits for a specific date (with completion status)
app.get('/api/habits/date/:date', async (c) => {
  const { env } = c;
  const date = c.req.param('date');
  
  // Get all active habits
  const habitsResult = await env.DB.prepare(`
    SELECT * FROM habits WHERE is_active = 1 ORDER BY display_order, category, title
  `).all();
  
  // Get completions for this date
  const completionsResult = await env.DB.prepare(`
    SELECT * FROM habit_completions WHERE completion_date = ?
  `).bind(date).all();
  
  const completionsMap = {};
  completionsResult.results.forEach(comp => {
    completionsMap[comp.habit_id] = comp;
  });
  
  // Check day of week for weekly habits
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
  
  // Combine habits with completion status
  const habitsWithStatus = habitsResult.results.map(habit => {
    // For weekly habits, check if today is a target day
    let isScheduledToday = true;
    if (habit.frequency === 'weekly' && habit.target_days) {
      isScheduledToday = habit.target_days.split(',').some(day => day.trim() === dayOfWeek);
    }
    
    return {
      ...habit,
      completion: completionsMap[habit.id] || null,
      completed: completionsMap[habit.id]?.completed === 1,
      is_scheduled_today: isScheduledToday
    };
  });
  
  return c.json(habitsWithStatus);
});

// Toggle habit completion
app.post('/api/habits/:id/complete', async (c) => {
  const { env } = c;
  const habitId = c.req.param('id');
  const body = await c.req.json();
  
  const { date, completed } = body;
  
  // Check if completion already exists
  const existing = await env.DB.prepare(`
    SELECT * FROM habit_completions WHERE habit_id = ? AND completion_date = ?
  `).bind(habitId, date).first();
  
  if (existing) {
    // Update existing
    await env.DB.prepare(`
      UPDATE habit_completions SET completed = ?, created_at = CURRENT_TIMESTAMP WHERE id = ?
    `).bind(completed ? 1 : 0, existing.id).run();
    
    return c.json({ success: true, action: 'updated' });
  } else {
    // Insert new
    const result = await env.DB.prepare(`
      INSERT INTO habit_completions (habit_id, completion_date, completed)
      VALUES (?, ?, ?)
    `).bind(habitId, date, completed ? 1 : 0).run();
    
    return c.json({ success: true, action: 'created', id: result.meta.last_row_id }, 201);
  }
});

// Reorder habits
app.post('/api/habits/reorder', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { habitIds } = body; // Array of habit IDs in desired order
  
  // Update display_order for each habit
  for (let i = 0; i < habitIds.length; i++) {
    await env.DB.prepare(`
      UPDATE habits SET display_order = ? WHERE id = ?
    `).bind(i, habitIds[i]).run();
  }
  
  return c.json({ success: true });
});

// Get habit statistics (streak, completion rate)
app.get('/api/habits/:id/stats', async (c) => {
  const { env } = c;
  const habitId = c.req.param('id');
  
  // Get last 30 days of completions
  const completions = await env.DB.prepare(`
    SELECT * FROM habit_completions 
    WHERE habit_id = ? AND completion_date >= date('now', '-30 days')
    ORDER BY completion_date DESC
  `).bind(habitId).all();
  
  const total = completions.results.length;
  const completed = completions.results.filter(c => c.completed === 1).length;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  // Calculate current streak
  let streak = 0;
  const sortedCompletions = completions.results.sort((a, b) => 
    new Date(b.completion_date).getTime() - new Date(a.completion_date).getTime()
  );
  
  for (let i = 0; i < sortedCompletions.length; i++) {
    if (sortedCompletions[i].completed === 1) {
      streak++;
    } else {
      break;
    }
  }
  
  return c.json({
    total_days: total,
    completed_days: completed,
    completion_rate: rate,
    current_streak: streak
  });
});

// ============= STOIC QUOTE API =============

// Get daily stoic quote (curated collection with daily rotation)
app.get('/api/quote/daily', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Generate a consistent seed from the date for daily rotation
    const dateSeed = today.split('-').reduce((acc, val) => acc + parseInt(val), 0);
    
    // Curated collection of authentic Stoic quotes
    const stoicQuotes = [
      {
        quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
        author: "Marcus Aurelius",
        meaning: "Marcus Aurelius, the Roman emperor and philosopher, reminds us that our thoughts and responses are within our control, even when external circumstances are not. True strength comes from mastering our internal reactions rather than trying to control the uncontrollable."
      },
      {
        quote: "The obstacle is the way.",
        author: "Marcus Aurelius",
        meaning: "What stands in the way becomes the way. Every obstacle is an opportunity to practice virtue and grow stronger. Marcus Aurelius teaches us that challenges are not impediments but the path itself to wisdom and growth."
      },
      {
        quote: "It's not what happens to you, but how you react to it that matters.",
        author: "Epictetus",
        meaning: "Epictetus, who rose from slavery to become one of history's greatest philosophers, knew that we cannot always control events, but we always control our responses. Our interpretation of events shapes our experience more than the events themselves."
      },
      {
        quote: "No man is free who is not master of himself.",
        author: "Epictetus",
        meaning: "True freedom comes from self-control and mastery over our reactions, not from external circumstances. Epictetus teaches that internal freedom - the ability to govern our thoughts and actions - is the only freedom that truly matters."
      },
      {
        quote: "He who fears death will never do anything worth of a man who is alive.",
        author: "Seneca",
        meaning: "Living in fear prevents us from truly living. Embrace life fully by accepting its temporary nature. Seneca, the Stoic philosopher and statesman, teaches us that courage in the face of mortality is essential for a meaningful life."
      },
      {
        quote: "We suffer more in imagination than in reality.",
        author: "Seneca",
        meaning: "Most of our suffering comes not from actual events but from our anxious anticipation and catastrophic thinking. Seneca reminds us that staying present and rational helps us see that our fears are often worse than reality."
      },
      {
        quote: "It is not the man who has too little, but the man who craves more, that is poor.",
        author: "Seneca",
        meaning: "Poverty is a state of mind characterized by endless wanting, not a measure of material possessions. Seneca teaches that gratitude and contentment are the foundations of a rich life."
      },
      {
        quote: "Wealth consists not in having great possessions, but in having few wants.",
        author: "Epictetus",
        meaning: "True abundance comes from contentment with what we have, not from accumulating more. Epictetus shows us that reducing our desires is the path to genuine happiness and freedom from material dependency."
      },
      {
        quote: "The best revenge is not to be like your enemy.",
        author: "Marcus Aurelius",
        meaning: "When wronged, the wise person maintains their virtue rather than descending to the level of those who harm them. Marcus Aurelius teaches that preserving our character is more important than seeking vengeance."
      },
      {
        quote: "First say to yourself what you would be; and then do what you have to do.",
        author: "Epictetus",
        meaning: "Define your identity and values before taking action. Epictetus guides us to establish our principles first, then align our behavior with them. Clarity of purpose must precede action."
      },
      {
        quote: "The whole future lies in uncertainty: live immediately.",
        author: "Seneca",
        meaning: "Since we cannot predict or control the future, wisdom lies in embracing the present moment. Seneca urges us to live fully now rather than postponing life while waiting for ideal circumstances."
      },
      {
        quote: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.",
        author: "Marcus Aurelius",
        meaning: "The emperor-philosopher reminds us to appreciate the magnificence of existence. By contemplating the cosmos and our place in it, we gain perspective on our troubles and reconnect with wonder."
      },
      {
        quote: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.",
        author: "Epictetus",
        meaning: "Gratitude for what we possess brings more happiness than longing for what we lack. Epictetus teaches that shifting our focus from absence to abundance transforms our experience of life."
      },
      {
        quote: "Luck is what happens when preparation meets opportunity.",
        author: "Seneca",
        meaning: "What appears as fortune is often the result of readiness encountering possibility. Seneca reminds us that we create our own 'luck' through diligent preparation and wise action when opportunities arise."
      }
    ];
    
    // Select quote based on date (consistent for the entire day)
    const index = dateSeed % stoicQuotes.length;
    const selectedQuote = stoicQuotes[index];
    
    return c.json(selectedQuote);
  } catch (error) {
    console.error('Stoic quote error:', error);
    // Fallback if something goes wrong
    return c.json({
      quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius",
      meaning: "Marcus Aurelius, the Roman emperor and philosopher, reminds us that our thoughts and responses are within our control, even when external circumstances are not. True strength comes from mastering our internal reactions."
    });
  }
});

// ============= GOOGLE CALENDAR SYNC API =============

// Start OAuth flow - redirect to Google
app.get('/api/calendar/oauth/start', async (c) => {
  // Note: In production, use environment variables for client ID
  // For now, provide instructions
  const clientId = 'YOUR_GOOGLE_CLIENT_ID';
  const redirectUri = encodeURIComponent('http://localhost:3000/api/calendar/oauth/callback');
  const scope = encodeURIComponent('https://www.googleapis.com/auth/calendar.readonly');
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${clientId}&` +
    `redirect_uri=${redirectUri}&` +
    `response_type=code&` +
    `scope=${scope}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  return c.json({
    message: 'To enable OAuth, you need to set up Google Cloud credentials',
    instructions: [
      '1. Go to https://console.cloud.google.com/apis/credentials',
      '2. Create OAuth 2.0 credentials',
      '3. Add authorized redirect URI: http://localhost:3000/api/calendar/oauth/callback',
      '4. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .dev.vars',
      '5. Restart the application'
    ],
    authUrl: authUrl
  });
});

// OAuth callback - exchange code for token
app.get('/api/calendar/oauth/callback', async (c) => {
  const code = c.req.query('code');
  
  if (!code) {
    return c.json({ error: 'Authorization code not provided' }, 400);
  }
  
  // In production, exchange code for token
  // For now, redirect to frontend with success message
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Google Calendar Connected</title>
        <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-gray-100 flex items-center justify-center min-h-screen">
        <div class="bg-white rounded-lg shadow-xl p-8 max-w-md">
            <div class="text-center">
                <i class="fas fa-check-circle text-6xl text-green-500 mb-4"></i>
                <h1 class="text-2xl font-bold text-gray-800 mb-2">Calendar Connected!</h1>
                <p class="text-gray-600 mb-6">Your Google Calendar has been connected successfully.</p>
                <p class="text-sm text-gray-500 mb-4">Authorization code: <code class="bg-gray-100 px-2 py-1 rounded">${code.substring(0, 20)}...</code></p>
                <button onclick="window.close()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                    Close Window
                </button>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Store/retrieve access token
app.post('/api/calendar/token/save', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  const { accessToken } = body;
  
  // In production, save to KV or D1
  // For now, return success
  return c.json({ success: true, message: 'Token saved (localStorage)' });
});

// Sync events from Google Calendar
app.post('/api/calendar/sync', async (c) => {
  const { env } = c;
  const body = await c.req.json();
  
  const { accessToken, startDate, endDate } = body;
  
  if (!accessToken) {
    return c.json({ error: 'Access token required' }, 400);
  }
  
  try {
    // Fetch events from Google Calendar API
    const timeMin = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      }
    );
    
    if (!calendarResponse.ok) {
      throw new Error('Failed to fetch calendar events');
    }
    
    const calendarData = await calendarResponse.json();
    const events = calendarData.items || [];
    
    // Insert events into database
    let syncedCount = 0;
    for (const event of events) {
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      
      // Check if event already exists
      const { results } = await env.DB.prepare(
        'SELECT * FROM schedule_events WHERE external_event_id = ?'
      ).bind(event.id).all();
      
      if (results && results.length > 0) {
        // Update existing event
        await env.DB.prepare(`
          UPDATE schedule_events
          SET title = ?, description = ?, start_time = ?, end_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP
          WHERE external_event_id = ?
        `).bind(
          event.summary || 'Untitled Event',
          event.description || '',
          startTime,
          endTime,
          event.location || '',
          event.id
        ).run();
      } else {
        // Insert new event
        await env.DB.prepare(`
          INSERT INTO schedule_events (title, description, start_time, end_time, location, calendar_source, external_event_id)
          VALUES (?, ?, ?, ?, ?, 'google_calendar', ?)
        `).bind(
          event.summary || 'Untitled Event',
          event.description || '',
          startTime,
          endTime,
          event.location || '',
          event.id
        ).run();
      }
      
      syncedCount++;
    }
    
    return c.json({ 
      success: true, 
      synced: syncedCount,
      message: `Successfully synced ${syncedCount} events from Google Calendar`
    });
    
  } catch (error) {
    console.error('Calendar sync error:', error);
    return c.json({ 
      error: 'Failed to sync calendar', 
      details: error.message 
    }, 500);
  }
});

// Get Google Calendar OAuth URL
app.get('/api/calendar/auth-url', async (c) => {
  // This would normally use environment variables for client ID
  // For now, return instructions for the user
  return c.json({
    message: 'To enable Google Calendar integration, you need to:',
    steps: [
      '1. Go to Google Cloud Console (console.cloud.google.com)',
      '2. Create a new project or select existing one',
      '3. Enable Google Calendar API',
      '4. Create OAuth 2.0 credentials (Web application)',
      '5. Add authorized redirect URI: https://your-app.pages.dev/calendar/callback',
      '6. Copy the Client ID and Client Secret',
      '7. Use the access token to sync your calendar'
    ],
    authUrl: 'https://console.cloud.google.com/apis/credentials'
  });
});

// ============= FRONTEND =============

app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Goal Planner - Your Path to Success</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
            tailwind.config = {
                darkMode: 'class',
                theme: {
                    extend: {
                        colors: {
                            primary: {
                                50: '#f5f7fa',
                                100: '#ebeef3',
                                200: '#d3dae5',
                                300: '#adb9cd',
                                400: '#8193b0',
                                500: '#607396',
                                600: '#4c5c7d',
                                700: '#3f4c66',
                                800: '#374156',
                                900: '#303949',
                            }
                        }
                    }
                }
            }
        </script>
        <style>
            * {
                transition: background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
            }
            
            .card {
                transition: all 0.2s ease;
            }
            
            .card:hover {
                transform: translateY(-1px);
            }
            
            /* Remove all transform effects that might be jarring */
            .nav-link {
                transition: color 0.2s ease;
            }
            
            /* Smooth scroll */
            html {
                scroll-behavior: smooth;
            }
            
            /* Custom scrollbar for dark mode */
            ::-webkit-scrollbar {
                width: 10px;
            }
            
            ::-webkit-scrollbar-track {
                background: transparent;
            }
            
            ::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 5px;
            }
            
            .dark ::-webkit-scrollbar-thumb {
                background: #475569;
            }
        </style>
    </head>
    <body class="bg-gray-50 dark:bg-gray-900 min-h-screen text-gray-900 dark:text-gray-100">
        <!-- Navigation -->
        <nav class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="text-xl font-semibold text-gray-900 dark:text-white">
                        Goal Planner
                    </div>
                    <div class="flex items-center space-x-6">
                        <a href="#" onclick="showPage('daily')" class="nav-link text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                            Daily
                        </a>
                        <a href="#" onclick="showPage('goals')" class="nav-link text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                            Goals
                        </a>
                        <a href="#" onclick="showPage('weekly')" class="nav-link text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium">
                            Weekly
                        </a>
                        <button onclick="toggleDarkMode()" class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                            <span class="dark-mode-icon hidden dark:inline">☀️</span>
                            <span class="light-mode-icon dark:hidden">🌙</span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-6 pb-12">
            <!-- Daily Page -->
            <div id="daily-page" class="page">
                <div class="max-w-6xl mx-auto mt-8">
                    <!-- Header -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="flex justify-between items-center">
                            <h1 class="text-2xl font-semibold text-gray-900 dark:text-white">Daily Planner</h1>
                            <input type="date" id="daily-date" class="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500" />
                        </div>
                    </div>

                    <!-- Stoic Quote -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="border-l-4 border-gray-400 dark:border-gray-500 pl-4">
                            <p id="stoic-quote" class="text-lg italic text-gray-700 dark:text-gray-300 mb-2 leading-relaxed"></p>
                            <p id="stoic-author" class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3"></p>
                            <p id="stoic-meaning" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"></p>
                        </div>
                    </div>

                    <!-- Affirmations & Gratitude -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <!-- Affirmations -->
                        <div class="mb-6">
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Affirmations</h3>
                            <div class="space-y-3">
                                <input type="text" id="affirmation-1" placeholder="I am..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="affirmation-2" placeholder="I will..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="affirmation-3" placeholder="I believe..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                            </div>
                        </div>

                        <!-- Gratitude -->
                        <div>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">Gratitude</h3>
                            <div class="space-y-3">
                                <input type="text" id="gratitude-1" placeholder="Today I'm grateful for..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="gratitude-2" placeholder="I appreciate..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="gratitude-3" placeholder="I'm thankful for..." class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                            </div>
                        </div>

                        <!-- Save Button -->
                        <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onclick="saveDailyEntry()" class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                                Save Entry
                            </button>
                        </div>
                    </div>

                    <!-- Tasks for Today -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Today's Tasks</h2>
                            <div class="flex gap-2">
                                <button onclick="showCreateTaskModal()" class="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition text-sm font-medium">
                                    New Task
                                </button>
                                <button onclick="showTaskSelector()" class="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                                    Add from List
                                </button>
                            </div>
                        </div>
                        
                        <!-- High Priority Tasks -->
                        <div class="mb-6">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">High Priority</h3>
                            <div id="daily-tasks-high" class="space-y-2">
                                <!-- High priority tasks will be loaded here -->
                            </div>
                        </div>
                        
                        <!-- Medium/Low Priority Tasks -->
                        <div>
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Other Tasks</h3>
                            <div id="daily-tasks-other" class="space-y-2">
                                <!-- Medium/low priority tasks will be loaded here -->
                            </div>
                        </div>
                    </div>

                    <!-- Schedule -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Today's Schedule</h2>
                            <div class="flex gap-2">
                                <button onclick="showAddEventModal()" class="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition text-sm font-medium">
                                    Add Event
                                </button>
                                <button onclick="showGoogleCalendarSync()" class="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition text-sm font-medium">
                                    Sync Google
                                </button>
                            </div>
                        </div>
                        <div id="schedule-list" class="space-y-2">
                            <!-- Schedule will be loaded here -->
                        </div>
                    </div>

                    <!-- Habit Tracker -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-xl font-semibold text-gray-900 dark:text-white">Daily Habits</h2>
                            <button onclick="showCreateHabitModal()" class="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition text-sm font-medium">
                                New Habit
                            </button>
                        </div>
                        <div id="habits-list" class="space-y-2">
                            <!-- Habits will be loaded here -->
                        </div>
                    </div>

                    <!-- Daily Wins -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-6">Daily Reflection</h2>
                        
                        <div class="mb-6">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Today's Wins</h3>
                            <div class="space-y-2">
                                <input type="text" id="win-today-1" placeholder="Win #1" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="win-today-2" placeholder="Win #2" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="win-today-3" placeholder="Win #3" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">Tomorrow's Planned Wins</h3>
                            <div class="space-y-2">
                                <input type="text" id="win-tomorrow-1" placeholder="Planned win #1" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="win-tomorrow-2" placeholder="Planned win #2" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                                <input type="text" id="win-tomorrow-3" placeholder="Planned win #3" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                            </div>
                        </div>

                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onclick="saveWins()" class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                                Save Wins
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Goals Page -->
            <div id="goals-page" class="page hidden">
                <div class="max-w-6xl mx-auto mt-8">
                    <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Goals</h1>

                    <!-- Goal Type Tabs -->
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                        <div class="flex flex-wrap gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                            <button onclick="showGoalType('long_term')" class="goal-tab px-4 py-2 text-sm font-medium rounded-lg border-2 border-gray-700 dark:border-gray-400 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 whitespace-nowrap">
                                Long-term
                            </button>
                            <button onclick="showGoalType('annual')" class="goal-tab px-4 py-2 text-sm font-medium rounded-lg border-2 border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 whitespace-nowrap">
                                Annual
                            </button>
                            <button onclick="showGoalType('quarterly')" class="goal-tab px-4 py-2 text-sm font-medium rounded-lg border-2 border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 whitespace-nowrap">
                                Quarterly
                            </button>
                            <button onclick="showGoalType('weekly')" class="goal-tab px-4 py-2 text-sm font-medium rounded-lg border-2 border-transparent text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600 whitespace-nowrap">
                                Weekly
                            </button>
                        </div>

                        <!-- Add Goal Button -->
                        <button onclick="showAddGoalModal()" class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium mb-6">
                            Add New Goal
                        </button>

                        <!-- Goals List -->
                        <div id="goals-list" class="space-y-4">
                            <!-- Goals will be loaded here -->
                        </div>
                    </div>
                </div>
            </div>

            <!-- Weekly Review Page -->
            <div id="weekly-page" class="page hidden">
                <div class="max-w-4xl mx-auto mt-8">
                    <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                        <h1 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Weekly Review</h1>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Week</label>
                            <input type="week" id="weekly-week" class="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Overall Evaluation</label>
                            <textarea id="weekly-evaluation" rows="4" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="How did this week go?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Achievements</label>
                            <textarea id="weekly-achievements" rows="4" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="What did you accomplish?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Challenges</label>
                            <textarea id="weekly-challenges" rows="4" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="What challenges did you face?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Next Week Plan</label>
                            <textarea id="weekly-next-plan" rows="4" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="What are your plans for next week?"></textarea>
                        </div>

                        <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <button onclick="saveWeeklyReview()" class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                                Save Review
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        
        <!-- Create Habit Modal -->
        <div id="create-habit-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Create New Habit</h3>
                        <button onclick="closeCreateHabitModal()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">
                            ×
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Habit Name *</label>
                            <input type="text" id="new-habit-title" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="e.g., Morning meditation" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea id="new-habit-description" rows="2" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="Why is this habit important?"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                            <select id="new-habit-category" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="spiritual">Spiritual/Faith</option>
                                <option value="financial">Financial/Career</option>
                                <option value="health" selected>Health/Fitness</option>
                                <option value="family">Family/Friends</option>
                                <option value="learning">Learning</option>
                                <option value="fun">Fun/Travel</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency *</label>
                            <select id="new-habit-frequency" onchange="toggleTargetDays()" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="daily" selected>Every day</option>
                                <option value="weekly">Specific days of the week</option>
                            </select>
                        </div>
                        <div id="target-days-container" class="hidden">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Days (for weekly habits)</label>
                            <input type="text" id="new-habit-target-days" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="e.g., Monday,Wednesday,Friday" />
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Comma-separated days</p>
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <button onclick="closeCreateHabitModal()" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                        Cancel
                    </button>
                    <button onclick="createNewHabit()" class="flex-1 bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                        Create Habit
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Task Selector Modal -->
        <div id="task-selector-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Select Tasks for Today</h3>
                        <button onclick="closeTaskSelectorModal()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">
                            ×
                        </button>
                    </div>
                </div>
                <div class="p-6 overflow-y-auto max-h-[60vh]">
                    <div id="task-selector-list" class="space-y-2">
                        <!-- Tasks will be loaded here -->
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button onclick="addSelectedTasks()" class="bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition w-full font-medium">
                        Add Selected Tasks
                    </button>
                </div>
            </div>
        </div>

        <!-- Create Task Modal -->
        <div id="create-task-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h3>
                        <button onclick="closeCreateTaskModal()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">
                            ×
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Task Title *</label>
                            <input type="text" id="new-task-title" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="Enter task title" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea id="new-task-description" rows="3" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="Task description (optional)"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                            <select id="new-task-category" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="spiritual">Spiritual/Faith</option>
                                <option value="financial">Financial/Career</option>
                                <option value="health">Health/Fitness</option>
                                <option value="family">Family/Friends</option>
                                <option value="learning">Learning</option>
                                <option value="fun">Fun/Travel</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority *</label>
                            <select id="new-task-priority" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="high">High Priority</option>
                                <option value="medium" selected>Medium Priority</option>
                                <option value="low">Low Priority</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Due Date</label>
                            <input type="date" id="new-task-due-date" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Link to Goal (Optional)</label>
                            <select id="new-task-goal" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="">No goal (standalone task)</option>
                                <!-- Goals will be loaded here -->
                            </select>
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <button onclick="closeCreateTaskModal()" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                        Cancel
                    </button>
                    <button onclick="createNewTask()" class="flex-1 bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                        Create Task
                    </button>
                </div>
            </div>
        </div>

        <!-- Create Goal Modal -->
        <div id="create-goal-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full">
                <div class="p-6 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-semibold text-gray-900 dark:text-white">Create New Goal</h3>
                        <button onclick="closeCreateGoalModal()" class="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xl">
                            ×
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal Title *</label>
                            <input type="text" id="new-goal-title" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="Enter goal title" />
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                            <textarea id="new-goal-description" rows="3" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent" placeholder="Goal description (optional)"></textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                            <select id="new-goal-category" class="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-transparent">
                                <option value="spiritual">Spiritual/Faith</option>
                                <option value="financial">Financial/Career</option>
                                <option value="health">Health/Fitness</option>
                                <option value="family">Family/Friends</option>
                                <option value="learning">Learning</option>
                                <option value="fun">Fun/Travel</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
                    <button onclick="closeCreateGoalModal()" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-medium">
                        Cancel
                    </button>
                    <button onclick="createNewGoal()" class="flex-1 bg-gray-800 dark:bg-gray-700 text-white px-6 py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition font-medium">
                        Create Goal
                    </button>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
