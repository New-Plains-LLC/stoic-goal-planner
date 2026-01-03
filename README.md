# Goal Planner - Your Path to Success

## Project Overview
A comprehensive goal planning and tracking application that helps you manage your long-term vision through structured daily, weekly, quarterly, and annual goals. **Every goal is organized by life categories** (Spiritual/Faith, Financial/Career, Health/Fitness, Family/Friends, Learning, Fun/Travel, Other) to ensure balanced progress across all important areas of your life.

The app includes daily affirmations, gratitude tracking, task management, daily wins reflection, and weekly reviews.

**Live Application**: https://3000-it4k2jghikjq8k7pi5xo6-0e616f0a.sandbox.novita.ai

## 🎨 Design Philosophy
- **Elegant & Subdued**: Minimalist design with carefully chosen neutral colors
- **Dark Mode Support**: Full light/dark mode toggle with refined color palette
- **No Distracting Icons**: Clean, text-focused interface for better concentration
- **Professional Aesthetics**: Sophisticated gray tones instead of bright accent colors
- **Responsive Layout**: Side-by-side sections on desktop for maximum above-the-fold visibility, stacked on mobile
- **Scrollable Modals**: All modals adapt to screen size with scrolling for smaller screens (max-h-[90vh])

## ✅ Currently Completed Features

### 🌓 Dark Mode
- **Light/Dark Toggle**: Seamless switching between light and dark themes
- **Persistent State**: Dark mode preference saved across sessions
- **Refined Colors**: Subdued gray palette instead of bright indigo accents
- **All Components**: Full dark mode support for modals, inputs, buttons, and cards

### 🎯 Goal Management System with Life Categories
- **7 Life Categories**: Every goal belongs to one category:
  - 🙏 **Spiritual/Faith**: Prayer, meditation, spiritual growth
  - 💰 **Financial/Career**: Business, income, career advancement
  - ❤️ **Health/Fitness**: Exercise, nutrition, mental health
  - 👨‍👩‍👧 **Family/Friends**: Relationships, quality time, connections
  - 📚 **Learning**: Education, skills, personal development
  - ✈️ **Fun/Travel**: Adventures, travel, hobbies, entertainment
  - ⭐ **Other**: Miscellaneous goals and personal projects
  
- **Hierarchical Goal Structure**: Long-term → Annual → Quarterly → Weekly → Daily goals (all categorized)
- **Category-Based Organization**: Goals displayed grouped by category with color-coding
- **Goal Management**:
  - **Create goals** at any level with category selection
  - **Edit goals** - Click "Edit" on any goal to modify details, progress, or status
  - **Delete goals** - Remove goals with confirmation (at any level: long-term, annual, quarterly, weekly)
  - **Drag-and-drop reordering** - Grab the ⋮⋮ handle to reorder goals within each category
  - Works across all goal types: Long-term, Annual, Quarterly, Weekly
- **Repeating Weekly Goals** 🔄:
  - **Set as Repeating**: When creating/editing weekly goals, check "Repeat every week" to mark them as recurring
  - **Visual Indicator**: Repeating goals show a 🔄 Repeating badge
  - **One-Click Copy**: Use the "🔄 Copy Repeating Goals" button on the Weekly goals page to copy all repeating goals from last week to this week
  - **Smart Duplication**: System prevents duplicates - won't copy if this week already has goals
  - **Progress Reset**: Copied goals start with 0% progress for the new week
  - **Perfect for Routines**: Ideal for recurring weekly objectives like "Meal prep Sunday", "Weekly team meeting", "Review finances", etc.
- **Goal Relationships**: Link child goals to parent goals for clear progression tracking
- **Progress Tracking**: Visual progress bars showing completion percentage for each goal
- **Goal Status Management**: Track goals as active, completed, or archived
- **Custom Order**: Goals display in your preferred order within each category

### 📅 Daily Planner
- **Optimized Desktop Layout**: On larger screens (desktop/laptop), sections are arranged side-by-side to maximize visible content above the fold:
  - **Row 1**: Affirmations & Gratitude | Tasks
  - **Row 2**: Schedule | Habits
  - **Row 3**: Daily Reflection (Today's Wins & Tomorrow's Wins side-by-side)
  - Full-width sections: Header, Stoic Quote
- **Mobile-Friendly**: All sections stack vertically on smaller screens
- **Daily Entry System**: One entry per day with automatic date selection
- **Stoic Quote of the Day**: Curated collection of 14 authentic Stoic quotes from Marcus Aurelius, Seneca, and Epictetus
  - **Daily Rotation**: Quote changes every day based on date (consistent throughout the day)
  - **Proper Attribution**: Each quote includes correct author and detailed historical context
  - **Meaningful Descriptions**: In-depth explanations of Stoic philosophy and practical wisdom
- **3 Daily Affirmations**: Space to write personal affirmations to start the day positively
- **3 Gratitude Entries**: Track what you're grateful for each day
- **Enhanced Task Management**:
  - **Two buttons**: "New Task" (create fresh) + "Add from List" (select existing)
  - **Split by Priority**: High priority tasks shown separately from others
  - **Task Creation Modal**: Professional form with all fields (category, priority, description, due date, goal link)
  - **Task Selector Modal**: Checkbox-based selection grouped by category
  - **Automatic Addition**: Newly created tasks automatically added to today
- **Task Completion Tracking**: Check off tasks as you complete them with category badges
- **Daily Schedule with Google Calendar**: 
  - View and manage your calendar events
  - **Google Calendar Sync**: Import events from Google Calendar with persistent token storage
    - ⚠️ **Important**: OAuth Playground tokens expire after 1 hour
    - Clear step-by-step instructions provided in the sync dialog
    - Automatic token validation and helpful error messages
    - Option to use stored token or enter a new one
  - **Add Events**: Create calendar events directly in the app
  - **Edit Events**: Update event details (title, time, location, description)
  - **Delete Events**: Remove events with confirmation
  - **Auto Token Storage**: Access token saved in localStorage for convenience
  - Schedule integration with real-time updates
- **Daily Wins Reflection**: 
  - Record 3 wins from today at end of day
  - Plan 3 wins for tomorrow
- **Quick Access to Goals**: Navigate to goals page from daily view
- **Mobile Responsive**: Fully responsive design for mobile devices

### ✅ Habit Tracker
- **Daily Habits**: Track habits that repeat every day
- **Weekly Habits**: Track habits for specific days of the week
- **Check-off System**: Simple checkbox interface to mark habits complete
- **Category Organization**: Habits organized by the same 7 life categories
- **Habit Management**:
  - **Create new habits** with name, description, category, and frequency
  - **Edit habits** - Click "Edit" to modify any habit details
  - **Delete habits** (with confirmation)
  - **Drag-and-drop reordering** - Grab the ⋮⋮ handle to reorder habits
  - View only habits scheduled for today
- **Automatic Scheduling**: Weekly habits only show on their target days
- **Sample Habits Included**:
  - Daily: Morning prayer, Read 30 min, Exercise, Drink water, Track expenses, Family time, Evening gratitude, Plan tomorrow
  - Weekly: Meal prep (Sunday), Review finances (Sunday), Family game night (Friday), Deep work (Mon/Wed/Fri)
- **Persistence**: Completion history tracked in database
- **Visual Feedback**: Completed habits show with green background and strikethrough
- **Custom Order**: Habits display in your preferred order every day

### 📊 Weekly Review System
- **Week Selection**: Choose any week for review or planning
- **Evaluation Form**:
  - Overall weekly evaluation
  - Achievement documentation
  - Challenges faced
  - Next week planning
- **Historical Reviews**: Access past weekly evaluations

### 🔄 Task Management
- **Create New Tasks**: Create tasks directly from daily page (not just from goal list)
- **Two Creation Methods**:
  - **"New Task" button**: Create standalone task with full form (title, description, category, priority, due date)
  - **"Add from List" button**: Select existing tasks with checkbox modal
- **Task Creation Modal**: Professional form with dropdowns for category and priority
- **Category Badges**: Visual category indicators on every task (color-coded)
- **Priority-Based Sections**: 
  - **High Priority Tasks**: Dedicated section with fire icon
  - **Other Tasks**: Medium and low priority tasks in separate section
- **Priority Levels**: High, medium, low priority tasks
- **Due Date Tracking**: Set and track task deadlines
- **Task Status**: Pending, in progress, completed, cancelled
- **Daily Task Selection**: Choose which tasks to tackle each day with checkbox modal
- **Task Completion**: Mark tasks complete with timestamp
- **Category Filtering**: Filter tasks by life category
- **Link to Goals**: Optionally link tasks to specific goals
- **Automatic Task Rollover** 🔄:
  - **Smart Prompt**: When you open the app each day, automatically checks for incomplete tasks from yesterday
  - **One-Click Rollover**: Click "🔄 Rollover" button to move all incomplete tasks from yesterday to today
  - **Manual Rollover**: Works any time, not just for yesterday
  - **No Duplicates**: Won't add tasks that already exist on the target date
  - **Fresh Start**: Incomplete tasks carry forward, completed tasks stay archived
  - **Automatic Prompt**: Opens once per day asking if you want to roll over yesterday's incomplete tasks
- **Task Rescheduling** 📅:
  - **Reschedule Button**: Click the 📅 icon on any task to move it to a different date
  - **Date Picker**: Enter target date in YYYY-MM-DD format (e.g., 2026-01-10)
  - **Future Planning**: Schedule tasks for any future date
  - **Flexible Workflow**: Move tasks forward if you're not ready to tackle them today
  - **One-Click Operation**: Reschedule with confirmation, task moves instantly

### 💾 Data Persistence
- **Cloudflare D1 Database**: SQLite-based persistent storage
- **Automatic Daily Entries**: Entries created automatically when accessing a new date
- **Data Relationships**: Properly linked goals, tasks, and daily entries

### 🎨 User Interface
- **Elegant Design**: Subdued, sophisticated color palette with refined aesthetics
- **Dark Mode**: Full dark mode support with automatic persistence (toggle in nav bar)
- **Clean Interface**: Removed decorative icons for a more professional, minimalist look
- **Border-Based Cards**: Subtle borders instead of heavy shadows for elegance
- **Refined Typography**: Balanced font sizes and weights for readability
- **Modal-Based Forms**: Professional modals for creating tasks and goals
- **Task Selector Modal**: Checkbox-based selection with category grouping
- **Color-Coded Elements**: Subtle visual indicators for priority, status, and category
- **Smooth Transitions**: Seamless dark/light mode switching
- **Priority Sections**: Clean separation of high vs other priority tasks
- **Category Grouping**: Goals and tasks organized by life category
- **Responsive Design**: Fully optimized for mobile and desktop

## 📋 API Endpoints Summary

### Goals API
- `GET /api/goals` - Get all goals (filter by type, category, parent_id)
- `GET /api/goals/:id` - Get single goal
- `POST /api/goals` - Create new goal (requires category)
- `PUT /api/goals/:id` - Update goal (can update category)
- `DELETE /api/goals/:id` - Delete goal
- `GET /api/goals/:id/hierarchy` - Get child goals

### Tasks API
- `GET /api/tasks` - Get all tasks (filter by goal_id, due_date, status, category)
- `POST /api/tasks` - Create new task (with category)
- `PUT /api/tasks/:id` - Update task (can update category)
- `DELETE /api/tasks/:id` - Delete task

### Daily Entries API
- `GET /api/daily/:date` - Get complete daily entry (affirmations, gratitude, wins, tasks, schedule)
- `PUT /api/daily/:date` - Update daily entry (quote, affirmations, gratitude, wins)
- `POST /api/daily/:date/tasks/:taskId` - Add task to daily selection
- `DELETE /api/daily/:date/tasks/:taskId` - Remove task from daily selection
- `PUT /api/daily/:date/tasks/:taskId/complete` - Mark daily task as completed

### Weekly Evaluations API
- `GET /api/weekly/:year/:week` - Get weekly evaluation
- `PUT /api/weekly/:year/:week` - Create or update weekly evaluation

### Schedule API
- `GET /api/schedule` - Get schedule events (filter by start_date, end_date)
- `POST /api/schedule` - Create schedule event
- `POST /api/calendar/sync` - Sync events from Google Calendar (requires access token)
- `GET /api/calendar/auth-url` - Get instructions for Google Calendar OAuth setup

### Stoic Quote API
- `GET /api/quote/daily` - Get daily stoic quote with author and meaning (fixed and working)

## 🚧 Features Not Yet Implemented

### Enhanced Calendar Features
- **Full OAuth Flow**: Automatic Google Calendar OAuth authentication (foundation built, needs client ID setup)
- **Two-way Sync**: Push events from app to Google Calendar
- **Multiple Calendar Support**: Connect multiple Google calendars
- **Outlook Calendar**: Microsoft Outlook/Office 365 integration
- **iCal Import/Export**: Import/export calendar files
- **Recurring Events**: Support for repeating calendar events

### Advanced Task Features
- **Task Reminders**: Push notifications for upcoming tasks
- **Task Dependencies**: Link tasks that must be completed in order
- **Recurring Tasks**: Daily, weekly, monthly recurring tasks
- **Task Templates**: Pre-defined task lists for common goals

### Analytics & Insights
- **Progress Charts**: Visual charts showing goal progress over time
- **Completion Statistics**: Track completion rates for tasks and goals
- **Streak Tracking**: Track daily entry streaks
- **Goal Achievement History**: Timeline of completed goals

### Enhanced Daily Features
- **Time Blocking**: Allocate time blocks for each task
- **Pomodoro Timer**: Built-in productivity timer
- **Focus Mode**: Distraction-free daily view
- **Daily Journaling**: Free-form journal entry

### Collaboration Features
- **Goal Sharing**: Share goals with accountability partners
- **Team Goals**: Collaborative goals for teams
- **Comments**: Add notes and comments on goals/tasks

### Mobile Features
- **Mobile App**: Native iOS/Android apps
- **Push Notifications**: Mobile notifications for tasks and reviews
- **Offline Mode**: Work offline and sync later

## 🎯 Recommended Next Steps

### Priority 1 (Essential) - ✅ ALL COMPLETED!
1. ~~Improve Task Selector UI~~ ✅ Checkbox modal with category grouping
2. ~~Add Task Creation from Daily Page~~ ✅ "New Task" button with full form
3. ~~Improve Goal/Task Forms~~ ✅ Proper modals with dropdowns
4. ~~Persistent Google Calendar Token~~ ✅ localStorage storage with auto-reuse
5. ~~Calendar Event Edit/Delete~~ ✅ Edit and delete buttons on all events
6. ~~Elegant UI with Subdued Colors~~ ✅ Gray palette, no icons
7. ~~Dark Mode~~ ✅ Full light/dark theme support

### Priority 2 (Important)
1. **Complete Google Calendar OAuth**: Set up client ID/secret in Google Cloud Console
2. **Progress Auto-calculation**: Auto-calculate goal progress based on child goal completion
3. **Task Templates**: Create pre-defined task templates for common goals
4. **Task Dependencies**: Link tasks that must be completed in order

### Priority 3 (Enhancement)
1. **Add Analytics Dashboard**: Visual charts showing progress trends
2. **Implement Search**: Search across goals, tasks, and daily entries
3. **Export Functionality**: Export goals and progress reports to PDF/CSV

## 📊 Data Models

### Goals Table
- Hierarchical structure supporting 5 levels (long-term, annual, quarterly, weekly, daily)
- **Category field**: spiritual, financial, health, family, learning, or other (REQUIRED)
- Parent-child relationships via `parent_id`
- Progress tracking (0-100%)
- Status: active, completed, archived
- Time-based attributes: year, quarter, week_number

### Tasks Table
- Linked to goals via `goal_id`
- **Category field**: matches parent goal category or can be independent
- Priority: low, medium, high
- Status: pending, in_progress, completed, cancelled
- Due date tracking

### Daily Entries Table
- One entry per unique date
- Stores stoic quote and meaning
- Related tables: affirmations (3), gratitude (3), wins (6 - today/tomorrow)

### Daily Task Selections
- Links tasks to specific dates
- Tracks completion status per day

### Schedule Events
- Calendar events with start/end times
- Support for external calendar sources

### Weekly Evaluations
- One evaluation per year/week combination
- Structured review format

## 🛠️ Technology Stack

- **Backend**: Hono (lightweight web framework)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + Tailwind CSS
- **Icons**: FontAwesome
- **HTTP Client**: Axios
- **Deployment**: Cloudflare Pages

## 📝 User Guide

### Getting Started
1. **Access the App**: Open the application URL in your browser
2. **Navigate Pages**: Use the top navigation to switch between Daily, Goals, and Weekly Review

### Daily Planning Workflow
1. **Morning Routine**:
   - Read the Stoic quote for inspiration
   - Write 3 personal affirmations
   - List 3 things you're grateful for
   - Review your goals (click to Goals page)
   - Select tasks to tackle today
   - Review your schedule

2. **During the Day**:
   - Check off tasks as you complete them
   - Review goals multiple times to stay focused

3. **Evening Routine**:
   - Record 3 wins from today
   - Plan 3 wins for tomorrow
   - Review what worked and what didn't

### Goal Management
1. **Create Long-term Goals**: Start with your big picture vision in each life category:
   - Spiritual/Faith: What's your spiritual journey?
   - Financial/Career: What's your career/business vision?
   - Health/Fitness: What's your health ideal?
   - Family/Friends: What relationships do you want to nurture?
   - Learning: What do you want to master?
   - Other: What else matters to you?

2. **Break Down to Annual**: What can you achieve this year in each category?
3. **Define Quarterly Milestones**: 3-month chunks for each category
4. **Plan Weekly Objectives**: Weekly focus areas across categories
5. **Track Progress**: Update progress percentages regularly
6. **Balance Check**: Ensure you have goals in multiple categories for life balance

### Weekly Review
1. **End of Week**: Fill out the weekly evaluation form
2. **Reflect**: What worked? What didn't?
3. **Plan**: Set up next week's goals and tasks

### Google Calendar Integration
1. **Get Access Token**:
   - Go to [Google OAuth Playground](https://developers.google.com/oauthplayground/)
   - Click the gear icon (⚙️) in top right
   - Optionally check "Use your own OAuth credentials" (or leave unchecked to use default)
   - In Step 1: Scroll to "Google Calendar API v3"
   - Check the box for `calendar.readonly`
   - Click "Authorize APIs" and sign in with your Google account
   - Click "Allow" to grant permissions
   - In Step 2: Click "Exchange authorization code for tokens"
   - Copy the "Access token" value (NOT the refresh token)

2. **Sync Calendar**:
   - Click "Sync Google" button on Daily page
   - Paste your access token when prompted
   - Events from the next 7 days will be imported
   - **Token is automatically saved** in localStorage for future syncs
   
3. **Token Management**:
   - ⚠️ **Important**: OAuth Playground tokens expire after 1 hour
   - When expired, the app will show a clear error message with instructions
   - Click "Cancel" when asked to use stored token, then enter a new one
   - Token persists between sessions until expiration
   - If you see "Invalid or expired access token", follow the steps above to get a new token

4. **Troubleshooting**:
   - Make sure you authorized the `calendar.readonly` scope
   - Tokens from OAuth Playground are for testing only (1 hour expiration)
   - For production use, set up OAuth credentials in Google Cloud Console

## 🚀 Deployment

### Current Status
- **Platform**: Cloudflare Pages (Local Development)
- **Status**: ✅ Active and Running
- **Database**: D1 Local SQLite (for development)
- **Last Updated**: December 31, 2025

### Local Development
```bash
# Install dependencies
npm install

# Apply database migrations
npm run db:migrate:local

# Seed sample data
npm run db:seed

# Build the application
npm run build

# Start development server
npm run dev:sandbox
# OR use PM2
pm2 start ecosystem.config.cjs

# Access at http://localhost:3000
```

### Production Deployment
```bash
# Set up Cloudflare API token
# (Guide user to Deploy tab to configure API key)

# Create production D1 database
npx wrangler d1 create webapp-production
# Update wrangler.jsonc with database_id

# Apply migrations to production
npm run db:migrate:prod

# Deploy to Cloudflare Pages
npm run deploy:prod
```

## 📂 Project Structure

```
webapp/
├── src/
│   └── index.tsx              # Main Hono backend with all API routes
├── public/
│   └── static/
│       └── app.js             # Frontend JavaScript application
├── migrations/
│   └── 0001_initial_schema.sql # Database schema
├── seed.sql                   # Sample data for testing
├── ecosystem.config.cjs       # PM2 configuration
├── wrangler.jsonc            # Cloudflare configuration
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## 🔐 Data Privacy

- All data stored locally in D1 database
- No third-party analytics or tracking
- Calendar integration requires user authorization
- All data remains under user control

## 🐛 Known Issues

1. ~~Task selector uses browser prompt~~ (FIXED ✅ - Now uses checkbox modal)
2. ~~Goal creation uses browser prompts~~ (FIXED ✅ - Now uses proper form modal)
3. Google Calendar OAuth needs client ID/secret setup in Google Cloud Console (instructions provided)
4. No offline support yet
5. Mobile navigation could be improved with hamburger menu
6. ~~Stoic quote API showing undefined author~~ (FIXED ✅)
7. ~~Tasks not split by priority~~ (FIXED ✅ - High priority separate section)
8. ~~Can't create tasks from daily page~~ (FIXED ✅ - "New Task" button added)

## 📄 License

This project is for personal use. Modify and extend as needed for your goal tracking needs.

---

**Start your journey to success today! Set your goals, track your progress, and celebrate your wins!** 🎯✨
