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
  
  query += ' ORDER BY category, created_at DESC';
  
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

// ============= STOIC QUOTE API =============

// Get daily stoic quote (using free API)
app.get('/api/quote/daily', async (c) => {
  try {
    // Using Stoic Quotes API (free, no auth required)
    const response = await fetch('https://stoic.tekloon.net/stoic-quote');
    const result = await response.json();
    
    // The API returns data nested in a 'data' object
    const data = result.data || result;
    
    return c.json({
      quote: data.quote,
      author: data.author,
      meaning: `This quote by ${data.author} reminds us to focus on what we can control and accept what we cannot. Stoic philosophy teaches us to find peace through wisdom, courage, and self-discipline.`
    });
  } catch (error) {
    // Fallback quotes if API fails
    const fallbackQuotes = [
      {
        quote: "The obstacle is the way.",
        author: "Marcus Aurelius",
        meaning: "What stands in the way becomes the way. Every obstacle is an opportunity to practice virtue and grow stronger."
      },
      {
        quote: "He who fears death will never do anything worth of a man who is alive.",
        author: "Seneca",
        meaning: "Living in fear prevents us from truly living. Embrace life fully by accepting its temporary nature."
      },
      {
        quote: "No man is free who is not master of himself.",
        author: "Epictetus",
        meaning: "True freedom comes from self-control and mastery over our reactions, not from external circumstances."
      }
    ];
    
    const randomQuote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    return c.json(randomQuote);
  }
});

// ============= GOOGLE CALENDAR SYNC API =============

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
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            }
            .nav-link {
                transition: all 0.3s ease;
            }
            .nav-link:hover {
                transform: translateY(-2px);
            }
            .card {
                transition: all 0.3s ease;
            }
            .card:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <!-- Navigation -->
        <nav class="bg-white shadow-lg mb-8">
            <div class="container mx-auto px-6 py-4">
                <div class="flex items-center justify-between">
                    <div class="text-2xl font-bold text-indigo-600">
                        <i class="fas fa-bullseye mr-2"></i>
                        Goal Planner
                    </div>
                    <div class="flex space-x-6">
                        <a href="#" onclick="showPage('daily')" class="nav-link text-gray-700 hover:text-indigo-600">
                            <i class="fas fa-calendar-day mr-1"></i> Daily
                        </a>
                        <a href="#" onclick="showPage('goals')" class="nav-link text-gray-700 hover:text-indigo-600">
                            <i class="fas fa-trophy mr-1"></i> Goals
                        </a>
                        <a href="#" onclick="showPage('weekly')" class="nav-link text-gray-700 hover:text-indigo-600">
                            <i class="fas fa-chart-line mr-1"></i> Weekly Review
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Main Content -->
        <div class="container mx-auto px-6 pb-12">
            <!-- Daily Page -->
            <div id="daily-page" class="page">
                <div class="max-w-6xl mx-auto">
                    <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h1 class="text-3xl font-bold text-gray-800">
                                <i class="fas fa-sun text-yellow-500 mr-2"></i>
                                Daily Planner
                            </h1>
                            <input type="date" id="daily-date" class="border rounded px-4 py-2" />
                        </div>

                        <!-- Stoic Quote -->
                        <div id="stoic-quote-section" class="bg-gradient-to-r from-purple-100 to-indigo-100 rounded-lg p-6 mb-6">
                            <div class="flex items-start">
                                <i class="fas fa-quote-left text-purple-500 text-2xl mr-4 mt-1"></i>
                                <div>
                                    <p id="stoic-quote" class="text-lg italic text-gray-800 mb-2"></p>
                                    <p id="stoic-author" class="text-sm font-semibold text-purple-600 mb-3"></p>
                                    <p id="stoic-meaning" class="text-sm text-gray-700"></p>
                                </div>
                            </div>
                        </div>

                        <!-- Affirmations -->
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-3">
                                <i class="fas fa-heart text-red-500 mr-2"></i>
                                My Affirmations
                            </h3>
                            <div class="space-y-2">
                                <input type="text" id="affirmation-1" placeholder="I am..." class="w-full border rounded px-4 py-2" />
                                <input type="text" id="affirmation-2" placeholder="I will..." class="w-full border rounded px-4 py-2" />
                                <input type="text" id="affirmation-3" placeholder="I believe..." class="w-full border rounded px-4 py-2" />
                            </div>
                        </div>

                        <!-- Gratitude -->
                        <div class="mb-6">
                            <h3 class="text-xl font-semibold text-gray-800 mb-3">
                                <i class="fas fa-hands-praying text-green-500 mr-2"></i>
                                I'm Grateful For
                            </h3>
                            <div class="space-y-2">
                                <input type="text" id="gratitude-1" placeholder="Today I'm grateful for..." class="w-full border rounded px-4 py-2" />
                                <input type="text" id="gratitude-2" placeholder="I appreciate..." class="w-full border rounded px-4 py-2" />
                                <input type="text" id="gratitude-3" placeholder="I'm thankful for..." class="w-full border rounded px-4 py-2" />
                            </div>
                        </div>

                        <!-- Save Button -->
                        <button onclick="saveDailyEntry()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition">
                            <i class="fas fa-save mr-2"></i>
                            Save Daily Entry
                        </button>
                    </div>

                    <!-- Tasks for Today -->
                    <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <i class="fas fa-tasks text-blue-500 mr-2"></i>
                                Today's Tasks
                            </h2>
                            <button onclick="showTaskSelector()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                                <i class="fas fa-plus mr-2"></i>
                                Add Task
                            </button>
                        </div>
                        <div id="daily-tasks-list" class="space-y-3">
                            <!-- Tasks will be loaded here -->
                        </div>
                    </div>

                    <!-- Schedule -->
                    <div class="bg-white rounded-lg shadow-xl p-8 mb-6">
                        <div class="flex justify-between items-center mb-6">
                            <h2 class="text-2xl font-bold text-gray-800">
                                <i class="fas fa-clock text-orange-500 mr-2"></i>
                                Today's Schedule
                            </h2>
                            <div class="space-x-2">
                                <button onclick="showAddEventModal()" class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm">
                                    <i class="fas fa-plus mr-1"></i>
                                    Add Event
                                </button>
                                <button onclick="showGoogleCalendarSync()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm">
                                    <i class="fab fa-google mr-1"></i>
                                    Sync Google
                                </button>
                            </div>
                        </div>
                        <div id="schedule-list" class="space-y-3">
                            <!-- Schedule will be loaded here -->
                        </div>
                    </div>

                    <!-- Daily Wins -->
                    <div class="bg-white rounded-lg shadow-xl p-8">
                        <h2 class="text-2xl font-bold text-gray-800 mb-6">
                            <i class="fas fa-star text-yellow-500 mr-2"></i>
                            Daily Wins
                        </h2>
                        
                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-3">Today's Wins</h3>
                            <div class="space-y-2">
                                <input type="text" id="win-today-1" placeholder="Win #1" class="w-full border rounded px-4 py-2" />
                                <input type="text" id="win-today-2" placeholder="Win #2" class="w-full border rounded px-4 py-2" />
                                <input type="text" id="win-today-3" placeholder="Win #3" class="w-full border rounded px-4 py-2" />
                            </div>
                        </div>

                        <div class="mb-6">
                            <h3 class="text-lg font-semibold text-gray-700 mb-3">Tomorrow's Planned Wins</h3>
                            <div class="space-y-2">
                                <input type="text" id="win-tomorrow-1" placeholder="Planned win #1" class="w-full border rounded px-4 py-2" />
                                <input type="text" id="win-tomorrow-2" placeholder="Planned win #2" class="w-full border rounded px-4 py-2" />
                                <input type="text" id="win-tomorrow-3" placeholder="Planned win #3" class="w-full border rounded px-4 py-2" />
                            </div>
                        </div>

                        <button onclick="saveWins()" class="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 transition">
                            <i class="fas fa-save mr-2"></i>
                            Save Wins
                        </button>
                    </div>
                </div>
            </div>

            <!-- Goals Page -->
            <div id="goals-page" class="page hidden">
                <div class="max-w-6xl mx-auto">
                    <h1 class="text-3xl font-bold text-gray-800 mb-6">
                        <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                        Goal Management
                    </h1>

                    <!-- Goal Type Tabs -->
                    <div class="bg-white rounded-lg shadow-xl p-6 mb-6">
                        <div class="flex flex-wrap gap-2 mb-6 border-b pb-2">
                            <button onclick="showGoalType('long_term')" class="goal-tab px-3 py-2 text-sm font-semibold border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">
                                Long-term
                            </button>
                            <button onclick="showGoalType('annual')" class="goal-tab px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 whitespace-nowrap">
                                Annual
                            </button>
                            <button onclick="showGoalType('quarterly')" class="goal-tab px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 whitespace-nowrap">
                                Quarterly
                            </button>
                            <button onclick="showGoalType('weekly')" class="goal-tab px-3 py-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 whitespace-nowrap">
                                Weekly
                            </button>
                        </div>

                        <!-- Add Goal Button -->
                        <button onclick="showAddGoalModal()" class="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition mb-6">
                            <i class="fas fa-plus mr-2"></i>
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
                <div class="max-w-4xl mx-auto">
                    <div class="bg-white rounded-lg shadow-xl p-8">
                        <h1 class="text-3xl font-bold text-gray-800 mb-6">
                            <i class="fas fa-chart-line text-green-500 mr-2"></i>
                            Weekly Review
                        </h1>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Select Week</label>
                            <input type="week" id="weekly-week" class="border rounded px-4 py-2" />
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Overall Evaluation</label>
                            <textarea id="weekly-evaluation" rows="4" class="w-full border rounded px-4 py-2" placeholder="How did this week go?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Achievements</label>
                            <textarea id="weekly-achievements" rows="4" class="w-full border rounded px-4 py-2" placeholder="What did you accomplish?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Challenges</label>
                            <textarea id="weekly-challenges" rows="4" class="w-full border rounded px-4 py-2" placeholder="What challenges did you face?"></textarea>
                        </div>

                        <div class="mb-6">
                            <label class="block text-sm font-semibold text-gray-700 mb-2">Next Week Plan</label>
                            <textarea id="weekly-next-plan" rows="4" class="w-full border rounded px-4 py-2" placeholder="What are your plans for next week?"></textarea>
                        </div>

                        <button onclick="saveWeeklyReview()" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition">
                            <i class="fas fa-save mr-2"></i>
                            Save Weekly Review
                        </button>
                    </div>
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
