# Stoic Planner

A personal goal-planning and daily productivity app built on Cloudflare Pages + D1. Structured around Stoic philosophy, it connects your long-term vision to your daily actions through a hierarchy of goals, daily habits, and a weekly review practice.

![License](https://img.shields.io/badge/license-MIT-gold) ![Platform](https://img.shields.io/badge/platform-Cloudflare%20Pages-orange)

---

## Features

### Daily Planner
- Stoic quote of the day with author and philosophical context (rotates daily)
- Daily affirmations and gratitude entries
- Task management with priority-based sections (high priority surfaced separately)
- Daily schedule with calendar integration
- End-of-day wins reflection + tomorrow planning

### Goal Management
Goals are organized across five time horizons — long-term, annual, quarterly, weekly, and daily — and across seven life categories:

| Category | Focus |
|---|---|
| Spiritual / Faith | Prayer, meditation, spiritual growth |
| Financial / Career | Business, income, career advancement |
| Health / Fitness | Exercise, nutrition, mental health |
| Family / Friends | Relationships, quality time |
| Learning | Education, skills, personal development |
| Fun / Travel | Adventures, hobbies, entertainment |
| Other | Miscellaneous personal projects |

- Hierarchical goal structure with parent-child linking
- Progress tracking (0–100%) with visual progress bars
- Drag-and-drop reordering within categories
- Repeating weekly goals with automatic Monday reset
- Smart carry-forward prompt for incomplete non-repeating goals

### Habit Tracker
- Daily and weekly habits with a simple check-off interface
- Category organization matching the 7 life categories
- Automatic scheduling (weekly habits only appear on their target days)
- Drag-and-drop reordering
- Completion history persisted in D1

### Weekly Review
- Structured weekly evaluation form
- Tracks achievements, challenges, and next-week planning
- Four strategic leadership/business reflection prompts
- Historical reviews accessible by week

### Calendar Integration
- **iCal/ICS subscriptions** — subscribe to any calendar URL (Google, Outlook, Apple) with no OAuth required; auto-syncs every 4 hours
- **Google Calendar sync** — import events via access token (OAuth Playground for testing; full OAuth setup via Google Cloud Console for production)
- **Microsoft/Outlook sync** — import events via access token
- User-selectable timezone with automatic conversion for all calendar times
- Duplicate prevention via `external_event_id` unique constraint
- 120-day sync window (30 days past + 90 days future)

### Task Management
- Create tasks standalone or linked to goals
- Priority levels: high, medium, low
- Due date tracking and rescheduling
- Daily selection modal — pick which tasks to tackle today
- Automatic rollover prompt for incomplete tasks from the previous day

---

## Security

- **`APP_TOKEN` authentication** — set the `APP_TOKEN` Worker secret to protect your deployment with Bearer token auth. All `/api/*` routes are gated. Leave unset for open local development.
- **XSS protection** — all user-sourced data is HTML-escaped before DOM insertion
- **SSRF protection** — URL scheme validated before any outbound iCal fetch
- **No internal error details** exposed in API responses (errors logged server-side only)

See [`.env.example`](.env.example) for all required secrets.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | [Hono](https://hono.dev/) — lightweight TypeScript web framework |
| Database | [Cloudflare D1](https://developers.cloudflare.com/d1/) — SQLite at the edge |
| Frontend | Vanilla JavaScript + Tailwind CSS (CDN) |
| Deployment | Cloudflare Pages |
| HTTP client | Axios |

---

## Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) 18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- A Cloudflare account (free tier works)

### Local Development

```bash
# Clone the repo
git clone https://github.com/New-Plains-LLC/stoic-goal-planner.git
cd stoic-goal-planner

# Install dependencies
npm install

# Apply database migrations locally
npx wrangler d1 migrations apply webapp-production --local

# Seed sample data
npx wrangler d1 execute webapp-production --local --file=./seed.sql

# Start the dev server (Vite + Miniflare)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Environment / Secrets

Copy `.env.example` to `.dev.vars` for local development:

```bash
cp .env.example .dev.vars
```

Edit `.dev.vars` with your values. This file is gitignored — never commit it.

| Variable | Required | Description |
|---|---|---|
| `APP_TOKEN` | Optional | Bearer token to protect the app. Generate with `openssl rand -hex 32`. Leave blank to disable auth. |
| `GOOGLE_CLIENT_ID` | Optional | For full Google Calendar OAuth (not needed for OAuth Playground testing) |
| `GOOGLE_CLIENT_SECRET` | Optional | For full Google Calendar OAuth |
| `ANTHROPIC_API_KEY` | Optional | For AI-powered stoic quote generation |

---

## Production Deployment

```bash
# Authenticate with Cloudflare
npx wrangler login

# Create the production D1 database
npx wrangler d1 create webapp-production

# Update wrangler.jsonc with the returned database_id

# Apply migrations to production
npx wrangler d1 migrations apply webapp-production --remote

# Deploy to Cloudflare Pages
npm run deploy
```

Set secrets in the Cloudflare dashboard under **Workers & Pages → your project → Settings → Environment Variables**, or via CLI:

```bash
npx wrangler secret put APP_TOKEN
```

---

## Project Structure

```
stoic-goal-planner/
├── src/
│   └── index.tsx          # Hono server — all API routes + HTML template
├── public/
│   └── static/
│       ├── app.js         # Vanilla JS frontend
│       └── style.css      # Minimal style overrides
├── migrations/            # D1 SQL migration files
├── seed.sql               # Sample data
├── wrangler.jsonc         # Cloudflare configuration
├── .env.example           # Secret keys reference (safe to commit)
└── package.json
```

---

## API Reference

### Goals
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/goals` | List goals (filter: `type`, `category`, `parent_id`) |
| `GET` | `/api/goals/:id` | Get single goal |
| `POST` | `/api/goals` | Create goal |
| `PUT` | `/api/goals/:id` | Update goal |
| `DELETE` | `/api/goals/:id` | Delete goal |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tasks` | List tasks (filter: `goal_id`, `due_date`, `status`, `category`) |
| `POST` | `/api/tasks` | Create task |
| `PUT` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Daily Entries
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/daily/:date` | Full daily entry (affirmations, gratitude, tasks, schedule) |
| `PUT` | `/api/daily/:date` | Update daily entry |
| `POST` | `/api/daily/:date/tasks/:taskId` | Add task to daily selection |
| `DELETE` | `/api/daily/:date/tasks/:taskId` | Remove task from daily selection |
| `PUT` | `/api/daily/:date/tasks/:taskId/complete` | Mark daily task complete |

### Calendar
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/schedule` | Get events (filter: `start_date`, `end_date`) |
| `POST` | `/api/schedule` | Create event |
| `POST` | `/api/calendar/sync` | Sync from Google Calendar |
| `POST` | `/api/calendar/sync/microsoft` | Sync from Microsoft Calendar |
| `POST` | `/api/calendar/sync/ical` | Sync from iCal URL |

### Other
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/quote/daily` | Daily stoic quote with author and context |
| `GET` | `/api/weekly/:year/:week` | Weekly evaluation |
| `PUT` | `/api/weekly/:year/:week` | Create or update weekly evaluation |

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.
