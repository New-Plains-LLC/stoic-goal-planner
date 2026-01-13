// Global state
let currentGoalType = 'long_term';

// Timezone management
let userTimezone = localStorage.getItem('user_timezone') || 'America/Chicago';

// Get current date in user's timezone
let currentDate = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone }); // en-CA gives YYYY-MM-DD format

// ========== TIMEZONE MANAGEMENT ==========

/**
 * Get user's selected timezone
 */
function getUserTimezone() {
    return localStorage.getItem('user_timezone') || userTimezone;
}

/**
 * Set user's timezone preference
 */
function setUserTimezone(timezone) {
    localStorage.setItem('user_timezone', timezone);
    userTimezone = timezone;
    // Update current date with new timezone
    currentDate = new Date().toLocaleDateString('en-CA', { timeZone: userTimezone });
}

/**
 * Get timezone abbreviation for display
 */
function getTimezoneAbbr() {
    const tz = getUserTimezone();
    const abbrs = {
        'America/New_York': 'ET',
        'America/Chicago': 'CT',
        'America/Denver': 'MT',
        'America/Los_Angeles': 'PT',
        'America/Anchorage': 'AKT',
        'America/Phoenix': 'MST',
        'Pacific/Honolulu': 'HST',
        'Europe/London': 'GMT',
        'Europe/Paris': 'CET',
        'Asia/Tokyo': 'JST',
        'Asia/Shanghai': 'CST',
        'Australia/Sydney': 'AEDT'
    };
    return abbrs[tz] || tz.split('/').pop();
}

/**
 * Update timezone from selector
 */
function updateTimezone() {
    const selector = document.getElementById('timezone-selector');
    if (selector) {
        const newTimezone = selector.value;
        setUserTimezone(newTimezone);
        
        // Reload current page to apply new timezone
        loadDailyData(currentDate);
        
        alert(`Timezone updated to ${newTimezone}\n\nAll times will now display in this timezone.`);
    }
}

/**
 * Update timezone from settings page
 */
function updateTimezoneFromSettings() {
    const selector = document.getElementById('settings-timezone-selector');
    if (selector) {
        const newTimezone = selector.value;
        setUserTimezone(newTimezone);
        
        // Update the display
        updateCurrentTimezoneDisplay();
        
        // Show success message
        const display = document.getElementById('current-timezone-display');
        const originalText = display.textContent;
        display.textContent = '✓ Timezone updated successfully!';
        display.classList.add('text-green-600', 'dark:text-green-400', 'font-medium');
        
        setTimeout(() => {
            updateCurrentTimezoneDisplay();
            display.classList.remove('text-green-600', 'dark:text-green-400', 'font-medium');
        }, 2000);
    }
}

/**
 * Update the current timezone display
 */
function updateCurrentTimezoneDisplay() {
    const display = document.getElementById('current-timezone-display');
    if (display) {
        const tz = getUserTimezone();
        const tzName = getTimezoneName(tz);
        display.textContent = `${tz} (${tzName})`;
    }
}

/**
 * Get friendly timezone name
 */
function getTimezoneName(tz) {
    const names = {
        'America/New_York': 'Eastern Time',
        'America/Chicago': 'Central Time',
        'America/Denver': 'Mountain Time',
        'America/Los_Angeles': 'Pacific Time',
        'America/Anchorage': 'Alaska Time',
        'America/Phoenix': 'Mountain Standard Time (No DST)',
        'Pacific/Honolulu': 'Hawaii Standard Time',
        'Europe/London': 'Greenwich Mean Time',
        'Europe/Paris': 'Central European Time',
        'Asia/Tokyo': 'Japan Standard Time',
        'Asia/Shanghai': 'China Standard Time',
        'Australia/Sydney': 'Australian Eastern Time'
    };
    return names[tz] || tz.split('/').pop().replace(/_/g, ' ');
}

/**
 * Initialize settings page
 */
function initializeSettingsPage() {
    const selector = document.getElementById('settings-timezone-selector');
    if (selector) {
        selector.value = getUserTimezone();
    }
    updateCurrentTimezoneDisplay();
}

// ========== TIMEZONE HELPERS ==========

/**
 * Convert a date/time string in CST to ISO string (UTC)
 * @param {string} dateTimeStr - Format: "YYYY-MM-DD HH:MM"
 * @returns {string} ISO string in UTC
 */
/**
 * Convert a date/time string in user's timezone to ISO string (UTC)
 * @param {string} dateTimeStr - Format: "YYYY-MM-DD HH:MM"
 * @returns {string} ISO string in UTC
 */
function convertLocalToUTC(dateTimeStr) {
    // Parse the input string
    const [datePart, timePart] = dateTimeStr.split(' ');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Create a date string that represents the local time in the user's timezone
    const dateString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    // Create a date as if it's in the user's timezone
    // We'll create it in UTC first, then adjust
    const utcDate = new Date(dateString + 'Z');
    
    // Get what time it would be in the user's timezone
    const tzDate = new Date(utcDate.toLocaleString('en-US', { timeZone: getUserTimezone() }));
    const localDate = new Date(dateString);
    
    // Calculate the difference and adjust
    const diff = localDate - tzDate;
    const adjustedDate = new Date(utcDate.getTime() - diff);
    
    return adjustedDate.toISOString();
}

// Alias for backward compatibility
const convertCSTToUTC = convertLocalToUTC;

/**
 * Convert a UTC ISO string to user's timezone date/time string
 * @param {string} isoString - ISO string in UTC
 * @returns {string} Format: "YYYY-MM-DD HH:MM"
 */
function convertUTCToLocal(isoString) {
    const date = new Date(isoString);
    
    // Format date in user's timezone
    const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: userTimezone });
    const month = date.toLocaleString('en-US', { month: '2-digit', timeZone: userTimezone });
    const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: userTimezone });
    const hour = date.toLocaleString('en-US', { hour: '2-digit', hour12: false, timeZone: userTimezone });
    const minute = date.toLocaleString('en-US', { minute: '2-digit', timeZone: userTimezone });
    
    return `${year}-${month}-${day} ${hour}:${minute}`;
}

// Alias for backward compatibility
const convertUTCToCST = convertUTCToLocal;

/**
 * Convert a UTC ISO string to user-friendly CST format with AM/PM
 * @param {string} isoString - ISO string in UTC
 * @returns {string} Format: "MM/DD/YYYY h:MM AM/PM"
 */
function convertUTCToCSTUserFriendly(isoString) {
    const date = new Date(isoString);
    
    // Format date in CST timezone with 12-hour format
    const month = date.toLocaleString('en-US', { month: '2-digit', timeZone: userTimezone });
    const day = date.toLocaleString('en-US', { day: '2-digit', timeZone: userTimezone });
    const year = date.toLocaleString('en-US', { year: 'numeric', timeZone: userTimezone });
    const time = date.toLocaleString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true,
        timeZone: userTimezone 
    });
    
    return `${month}/${day}/${year} ${time}`;
}

/**
 * Convert user-friendly format to 24-hour format
 * @param {string} userInput - Format: "MM/DD/YYYY h:MM AM/PM" or "MM/DD/YYYY HH:MM"
 * @returns {string} Format: "YYYY-MM-DD HH:MM"
 */
function convertTo24Hour(userInput) {
    // Handle both "01/06/2026 2:30 PM" and "2026-01-06 14:30" formats
    userInput = userInput.trim();
    
    // Check if it's already in 24-hour format (YYYY-MM-DD HH:MM)
    if (/^\d{4}-\d{2}-\d{2}\s+\d{1,2}:\d{2}$/.test(userInput)) {
        return userInput;
    }
    
    // Parse MM/DD/YYYY h:MM AM/PM format
    const match = userInput.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) {
        throw new Error('Invalid time format. Use: MM/DD/YYYY h:MM AM/PM');
    }
    
    const [, month, day, year, hour, minute, ampm] = match;
    let hour24 = parseInt(hour);
    
    // Convert to 24-hour format
    if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
    } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')} ${String(hour24).padStart(2, '0')}:${minute}`;
}

/**
 * Format a date string for user input (MM/DD/YYYY)
 * @param {string} dateStr - Format: "YYYY-MM-DD"
 * @returns {string} Format: "MM/DD/YYYY"
 */
function formatDateForInput(dateStr) {
    const [year, month, day] = dateStr.split('-');
    return `${month}/${day}/${year}`;
}

// Week tracking for weekly goals
let currentViewWeek = null;
let currentViewYear = null;

// Dark mode
function toggleDarkMode() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('darkMode', html.classList.contains('dark') ? 'true' : 'false');
}

// Initialize dark mode from localStorage
if (localStorage.getItem('darkMode') === 'true') {
    document.documentElement.classList.add('dark');
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date
    document.getElementById('daily-date').value = currentDate;
    
    // Load today's data
    loadDailyData(currentDate);
    
    // Check if we should prompt for task rollover
    checkForTaskRollover();
    
    // Auto-sync calendar subscriptions if needed
    autoSyncCalendarSubscriptions();
    
    // Event listeners
    document.getElementById('daily-date').addEventListener('change', (e) => {
        currentDate = e.target.value;
        loadDailyData(currentDate);
    });
    
    // Load weekly date
    const now = new Date();
    const weekInput = document.getElementById('weekly-week');
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    weekInput.value = `${year}-W${week.toString().padStart(2, '0')}`;
    
    weekInput.addEventListener('change', (e) => {
        loadWeeklyData();
    });
    
    // Load initial weekly data
    loadWeeklyData();
});

// Check if user wants to roll over tasks from previous day
async function checkForTaskRollover() {
    const lastCheckDate = localStorage.getItem('last_rollover_check');
    const today = currentDate;
    
    // Only check once per day
    if (lastCheckDate === today) {
        return;
    }
    
    try {
        const yesterday = getPreviousDate(today);
        
        // Check if yesterday has incomplete tasks
        const response = await axios.get(`/api/daily/${yesterday}`);
        const incompleteTasks = response.data.selectedTasks?.filter(t => !t.completed) || [];
        
        if (incompleteTasks.length > 0) {
            // Wait a bit for the page to load, then ask
            setTimeout(() => {
                if (confirm(`You have ${incompleteTasks.length} incomplete task(s) from yesterday.\n\nWould you like to roll them over to today?`)) {
                    rolloverIncompleteTasks();
                }
            }, 1000);
        }
        
        // Mark that we checked today
        localStorage.setItem('last_rollover_check', today);
    } catch (error) {
        // Silently fail - yesterday might not exist
        console.log('No previous day data found');
    }
}

// Page navigation
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    if (page === 'goals') {
        loadGoals(currentGoalType);
    } else if (page === 'settings') {
        initializeSettingsPage();
    }
}

// ========== DAILY PAGE ==========

async function loadDailyData(date) {
    try {
        const response = await axios.get(`/api/daily/${date}`);
        const data = response.data;
        
        // Load stoic quote
        if (!data.stoic_quote) {
            await loadStoicQuote(date);
        } else {
            document.getElementById('stoic-quote').textContent = data.stoic_quote;
            document.getElementById('stoic-author').textContent = '— Author';
            document.getElementById('stoic-meaning').textContent = data.stoic_quote_meaning || '';
        }
        
        // Load affirmations
        for (let i = 1; i <= 3; i++) {
            const affirmation = data.affirmations.find(a => a.affirmation_order === i);
            document.getElementById(`affirmation-${i}`).value = affirmation ? affirmation.affirmation_text : '';
        }
        
        // Load gratitude
        for (let i = 1; i <= 3; i++) {
            const gratitude = data.gratitude.find(g => g.gratitude_order === i);
            document.getElementById(`gratitude-${i}`).value = gratitude ? gratitude.gratitude_text : '';
        }
        
        // Load wins
        const todayWins = data.wins.filter(w => w.win_type === 'today');
        const tomorrowWins = data.wins.filter(w => w.win_type === 'tomorrow');
        
        for (let i = 1; i <= 3; i++) {
            const todayWin = todayWins.find(w => w.win_order === i);
            const tomorrowWin = tomorrowWins.find(w => w.win_order === i);
            
            document.getElementById(`win-today-${i}`).value = todayWin ? todayWin.win_text : '';
            document.getElementById(`win-tomorrow-${i}`).value = tomorrowWin ? tomorrowWin.win_text : '';
        }
        
        // Load tasks
        renderDailyTasks(data.selectedTasks);
        
        // Load schedule
        renderSchedule(data.schedule);
        
        // Load habits
        loadHabits(date);
        
    } catch (error) {
        console.error('Error loading daily data:', error);
        alert('Failed to load daily data');
    }
}

async function loadStoicQuote(date) {
    try {
        // Check if we already have a quote for this date
        const cachedQuoteDate = localStorage.getItem('stoic_quote_date');
        const cachedQuote = localStorage.getItem('stoic_quote');
        const cachedAuthor = localStorage.getItem('stoic_author');
        const cachedMeaning = localStorage.getItem('stoic_meaning');
        
        if (cachedQuoteDate === date && cachedQuote && cachedAuthor) {
            // Use cached quote for today
            document.getElementById('stoic-quote').textContent = cachedQuote;
            document.getElementById('stoic-author').textContent = `— ${cachedAuthor}`;
            document.getElementById('stoic-meaning').textContent = cachedMeaning || '';
            return;
        }
        
        // Fetch new quote
        const response = await axios.get('/api/quote/daily');
        const quote = response.data;
        
        if (!quote.quote || !quote.author) {
            console.error('Invalid quote data:', quote);
            return;
        }
        
        // Display quote
        document.getElementById('stoic-quote').textContent = quote.quote;
        document.getElementById('stoic-author').textContent = `— ${quote.author}`;
        document.getElementById('stoic-meaning').textContent = quote.meaning;
        
        // Cache quote for today
        localStorage.setItem('stoic_quote_date', date);
        localStorage.setItem('stoic_quote', quote.quote);
        localStorage.setItem('stoic_author', quote.author);
        localStorage.setItem('stoic_meaning', quote.meaning);
        
        // Save quote to daily entry
        await axios.put(`/api/daily/${date}`, {
            stoic_quote: quote.quote,
            stoic_quote_meaning: `${quote.author}: ${quote.meaning}`
        });
    } catch (error) {
        console.error('Error loading stoic quote:', error);
        // Show fallback
        document.getElementById('stoic-quote').textContent = 'The obstacle is the way.';
        document.getElementById('stoic-author').textContent = '— Marcus Aurelius';
        document.getElementById('stoic-meaning').textContent = 'What stands in the way becomes the way.';
    }
}

async function saveDailyEntry() {
    const affirmations = [
        document.getElementById('affirmation-1').value,
        document.getElementById('affirmation-2').value,
        document.getElementById('affirmation-3').value
    ].filter(a => a.trim() !== '');
    
    const gratitude = [
        document.getElementById('gratitude-1').value,
        document.getElementById('gratitude-2').value,
        document.getElementById('gratitude-3').value
    ].filter(g => g.trim() !== '');
    
    try {
        await axios.put(`/api/daily/${currentDate}`, {
            affirmations,
            gratitude
        });
        
        alert('Daily entry saved successfully!');
    } catch (error) {
        console.error('Error saving daily entry:', error);
        alert('Failed to save daily entry');
    }
}

async function saveWins() {
    const todayWins = [
        document.getElementById('win-today-1').value,
        document.getElementById('win-today-2').value,
        document.getElementById('win-today-3').value
    ].filter(w => w.trim() !== '');
    
    const tomorrowWins = [
        document.getElementById('win-tomorrow-1').value,
        document.getElementById('win-tomorrow-2').value,
        document.getElementById('win-tomorrow-3').value
    ].filter(w => w.trim() !== '');
    
    try {
        await axios.put(`/api/daily/${currentDate}`, {
            wins: {
                today: todayWins,
                tomorrow: tomorrowWins
            }
        });
        
        alert('Wins saved successfully!');
    } catch (error) {
        console.error('Error saving wins:', error);
        alert('Failed to save wins');
    }
}

function renderDailyTasks(tasks) {
    const highContainer = document.getElementById('daily-tasks-high');
    const otherContainer = document.getElementById('daily-tasks-other');
    
    if (!tasks || tasks.length === 0) {
        highContainer.innerHTML = '<p class="text-gray-500">No high priority tasks.</p>';
        otherContainer.innerHTML = '<p class="text-gray-500">No other tasks. Click "New Task" or "Add from List" to get started.</p>';
        return;
    }
    
    // Split tasks by priority
    const highPriorityTasks = tasks.filter(t => t.priority === 'high');
    const otherTasks = tasks.filter(t => t.priority !== 'high');
    
    // Render task card
    const renderTaskCard = (task) => `
        <div class="flex items-center justify-between p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 ${task.completed ? 'bg-green-50 dark:bg-green-900/20' : ''}">
            <div class="flex items-center space-x-3">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="toggleTaskComplete(${task.id}, this.checked)"
                       class="w-5 h-5 text-indigo-600 rounded">
                <div>
                    <div class="flex items-center space-x-2">
                        <p class="font-semibold ${task.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}">${task.title}</p>
                        ${task.category ? `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(task.category)}">${getCategoryName(task.category)}</span>` : ''}
                    </div>
                    ${task.description ? `<p class="text-sm text-gray-600 dark:text-gray-400">${task.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}">
                    ${task.priority}
                </span>
                <button onclick="rescheduleTask(${task.id}, '${task.title}')" class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300" title="Reschedule to another day">
                    📅
                </button>
                <button onclick="removeDailyTask(${task.id})" class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300" title="Remove from today">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `;
    
    // Render high priority tasks
    highContainer.innerHTML = highPriorityTasks.length > 0 
        ? highPriorityTasks.map(renderTaskCard).join('')
        : '<p class="text-gray-500">No high priority tasks.</p>';
    
    // Render other tasks
    otherContainer.innerHTML = otherTasks.length > 0 
        ? otherTasks.map(renderTaskCard).join('')
        : '<p class="text-gray-500">No other tasks.</p>';
}

function getCategoryName(category) {
    const names = {
        spiritual: 'Spiritual',
        financial: 'Financial',
        health: 'Health',
        family: 'Family',
        learning: 'Learning',
        fun: 'Fun/Travel',
        other: 'Other'
    };
    return names[category] || 'Other';
}

function getCategoryBadgeColor(category) {
    switch(category) {
        case 'spiritual': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
        case 'financial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
        case 'health': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
        case 'family': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
        case 'learning': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200';
        case 'fun': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
        case 'other': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
        default: return 'bg-gray-100 text-gray-800';
    }
}

function getPriorityColor(priority) {
    switch(priority) {
        case 'high': return 'bg-red-100 text-red-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

async function toggleTaskComplete(taskId, completed) {
    try {
        await axios.put(`/api/daily/${currentDate}/tasks/${taskId}/complete`, { completed });
        loadDailyData(currentDate);
    } catch (error) {
        console.error('Error toggling task:', error);
        alert('Failed to update task');
    }
}

async function removeDailyTask(taskId) {
    if (!confirm('Remove this task from today?')) return;
    
    try {
        await axios.delete(`/api/daily/${currentDate}/tasks/${taskId}`);
        loadDailyData(currentDate);
    } catch (error) {
        console.error('Error removing task:', error);
        alert('Failed to remove task');
    }
}

// Reschedule a task to a different date
async function rescheduleTask(taskId, taskTitle) {
    const newDate = prompt(`Reschedule "${taskTitle}" to which date?\n\nEnter date in YYYY-MM-DD format (e.g., ${getNextDate(currentDate)}):`, getNextDate(currentDate));
    
    if (!newDate) return;
    
    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(newDate)) {
        alert('Invalid date format. Please use YYYY-MM-DD format.');
        return;
    }
    
    try {
        // Remove from current date
        await axios.delete(`/api/daily/${currentDate}/tasks/${taskId}`);
        
        // Add to new date
        await axios.post(`/api/daily/${newDate}/tasks/${taskId}`);
        
        loadDailyData(currentDate);
        alert(`Task rescheduled to ${newDate}!`);
    } catch (error) {
        console.error('Error rescheduling task:', error);
        alert('Failed to reschedule task');
    }
}

// Helper function to get next date
function getNextDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() + 1);
    return date.toISOString().split('T')[0];
}

// Rollover incomplete tasks from previous day
async function rolloverIncompleteTasks() {
    const yesterday = getPreviousDate(currentDate);
    
    if (!confirm(`Roll over incomplete tasks from ${yesterday} to today?\n\nThis will move all uncompleted tasks from yesterday to today.`)) {
        return;
    }
    
    try {
        const response = await axios.post(`/api/daily/${currentDate}/rollover`, {
            fromDate: yesterday
        });
        
        if (response.data.rolledOver > 0) {
            alert(`✅ Successfully rolled over ${response.data.rolledOver} incomplete task(s) from yesterday!`);
            loadDailyData(currentDate);
        } else {
            alert('No incomplete tasks to roll over from yesterday.');
        }
    } catch (error) {
        console.error('Error rolling over tasks:', error);
        alert('Failed to roll over tasks: ' + (error.response?.data?.details || error.message));
    }
}

// Helper function to get previous date
function getPreviousDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
}

async function showTaskSelector() {
    try {
        // Get current week's goals
        const now = new Date();
        const year = now.getFullYear();
        const week = getWeekNumber(now);
        
        const response = await axios.get(`/api/goals?type=weekly&week=${week}&year=${year}`);
        const weeklyGoals = response.data;
        
        if (!weeklyGoals || weeklyGoals.length === 0) {
            alert('No weekly goals available for this week!\n\nGo to the Goals page and add some weekly goals first.');
            return;
        }
        
        // Show modal
        const modal = document.getElementById('task-selector-modal');
        const taskList = document.getElementById('task-selector-list');
        
        // Group goals by category
        const categories = {
            spiritual: { name: 'Spiritual/Faith', icon: 'fa-pray', color: 'purple', goals: [] },
            financial: { name: 'Financial/Career', icon: 'fa-dollar-sign', color: 'green', goals: [] },
            health: { name: 'Health/Fitness', icon: 'fa-heartbeat', color: 'red', goals: [] },
            family: { name: 'Family/Friends', icon: 'fa-users', color: 'blue', goals: [] },
            learning: { name: 'Learning', icon: 'fa-book', color: 'indigo', goals: [] },
            fun: { name: 'Fun/Travel', icon: 'fa-plane', color: 'orange', goals: [] },
            other: { name: 'Other', icon: 'fa-star', color: 'gray', goals: [] }
        };
        
        weeklyGoals.forEach(goal => {
            const category = goal.category || 'other';
            if (categories[category]) {
                categories[category].goals.push(goal);
            }
        });
        
        // Render goals grouped by category
        let html = '';
        Object.keys(categories).forEach(catKey => {
            const cat = categories[catKey];
            if (cat.goals.length > 0) {
                html += `
                    <div class="mb-4">
                        <h4 class="text-sm font-bold text-${cat.color}-600 dark:text-${cat.color}-400 mb-2 flex items-center">
                            <i class="fas ${cat.icon} mr-2"></i>
                            ${cat.name}
                        </h4>
                        <div class="space-y-2">
                            ${cat.goals.map(goal => `
                                <label class="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer">
                                    <input type="checkbox" class="task-checkbox w-5 h-5 text-indigo-600 rounded mr-3" data-goal-id="${goal.id}" />
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2">
                                            <p class="font-semibold text-gray-900 dark:text-white">${goal.title}</p>
                                            <span class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                                ${goal.progress}%
                                            </span>
                                            ${goal.is_repeating ? `<span class="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">🔄</span>` : ''}
                                        </div>
                                        ${goal.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${goal.description}</p>` : ''}
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        taskList.innerHTML = html || '<p class="text-gray-500 dark:text-gray-400">No weekly goals available.</p>';
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error showing task selector:', error);
        alert('Failed to load weekly goals');
    }
}

function closeTaskSelectorModal() {
    document.getElementById('task-selector-modal').classList.add('hidden');
}

async function addSelectedTasks() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one goal');
        return;
    }
    
    try {
        for (const checkbox of checkboxes) {
            const goalId = checkbox.getAttribute('data-goal-id');
            await axios.post(`/api/daily/${currentDate}/goals/${goalId}`);
        }
        
        closeTaskSelectorModal();
        loadDailyData(currentDate);
        alert(`Added ${checkboxes.length} goal(s) to today's tasks!`);
        
    } catch (error) {
        console.error('Error adding goals:', error);
        alert('Failed to add some goals');
    }
}

function renderSchedule(events) {
    const container = document.getElementById('schedule-list');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No events scheduled for today.</p>';
        return;
    }
    
    container.innerHTML = events.map(event => {
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        
        // Check if this is an all-day event
        // All-day events typically have times at midnight and span multiple days or same day
        const startHour = startDate.getUTCHours();
        const startMinute = startDate.getUTCMinutes();
        const endHour = endDate.getUTCHours();
        const endMinute = endDate.getUTCMinutes();
        
        const isAllDay = (startHour === 0 && startMinute === 0 && endHour === 0 && endMinute === 0);
        
        let timeDisplay;
        if (isAllDay) {
            // For all-day events, just show the date(s)
            const startDateStr = startDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'  // Use UTC for all-day events
            });
            const endDateStr = endDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                timeZone: 'UTC'
            });
            
            if (startDateStr === endDateStr) {
                timeDisplay = `All day - ${startDateStr}`;
            } else {
                timeDisplay = `${startDateStr} - ${endDateStr}`;
            }
        } else {
            // Regular timed events - convert to user's timezone
            const startTime = startDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true,
                timeZone: userTimezone
            });
            const endTime = endDate.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true,
                timeZone: userTimezone
            });
            
            timeDisplay = `${startTime} - ${endTime}`;
        }
        
        return `
            <div class="p-4 border-l-4 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="font-medium text-gray-900 dark:text-white">${event.title}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${timeDisplay}</p>
                        ${event.location ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">📍 ${event.location}</p>` : ''}
                        ${event.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-1">${event.description}</p>` : ''}
                        ${event.calendar_source && event.calendar_source !== 'manual' ? `<p class="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 ${event.calendar_source}</p>` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="editScheduleEvent(${event.id})" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm">
                            Edit
                        </button>
                        <button onclick="deleteScheduleEvent(${event.id})" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ========== GOALS PAGE ==========

function showGoalType(type) {
    currentGoalType = type;
    
    // Update tabs
    document.querySelectorAll('.goal-tab').forEach(tab => {
        tab.classList.remove('border-gray-700', 'dark:border-gray-400', 'text-gray-700', 'dark:text-gray-300', 'bg-gray-100', 'dark:bg-gray-700');
        tab.classList.add('border-transparent', 'text-gray-600', 'dark:text-gray-400');
    });
    
    event.target.classList.remove('border-transparent', 'text-gray-600', 'dark:text-gray-400');
    event.target.classList.add('border-gray-700', 'dark:border-gray-400', 'text-gray-700', 'dark:text-gray-300', 'bg-gray-100', 'dark:bg-gray-700');
    
    // Show/hide copy repeating button and week navigation for weekly goals
    const copyBtn = document.getElementById('copy-repeating-btn');
    const weekNav = document.getElementById('week-navigation');
    
    if (copyBtn && weekNav) {
        if (type === 'weekly') {
            copyBtn.classList.remove('hidden');
            weekNav.classList.remove('hidden');
            
            // Initialize to current week
            const now = new Date();
            currentViewYear = now.getFullYear();
            currentViewWeek = getWeekNumber(now);
            updateWeekDisplay();
            
            // Check if weekly reset is needed
            checkWeeklyReset();
        } else {
            copyBtn.classList.add('hidden');
            weekNav.classList.add('hidden');
        }
    }
    
    // Update repeating option visibility
    updateRepeatingOptionVisibility();
    
    loadGoals(type);
}

async function loadGoals(type) {
    try {
        let url = `/api/goals?type=${type}`;
        
        // Add week/year filters for weekly goals
        if (type === 'weekly' && currentViewWeek !== null && currentViewYear !== null) {
            url += `&week=${currentViewWeek}&year=${currentViewYear}`;
        }
        
        const response = await axios.get(url);
        const goals = response.data;
        
        renderGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
        alert('Failed to load goals');
    }
}

// Week navigation functions
function navigateWeek(direction) {
    // direction: -1 for previous, +1 for next
    currentViewWeek += direction;
    
    // Handle year boundaries
    if (currentViewWeek < 1) {
        currentViewWeek = 52;
        currentViewYear--;
    } else if (currentViewWeek > 52) {
        currentViewWeek = 1;
        currentViewYear++;
    }
    
    updateWeekDisplay();
    loadGoals('weekly');
}

function updateWeekDisplay() {
    // Calculate week date range
    const weekStart = getDateOfISOWeek(currentViewWeek, currentViewYear);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date) => {
        const month = date.toLocaleDateString('en-US', { month: 'short' });
        const day = date.getDate();
        return `${month} ${day}`;
    };
    
    const weekRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    
    document.getElementById('current-week-display').textContent = weekRange;
    document.getElementById('current-week-number').textContent = currentViewWeek;
    document.getElementById('current-week-year').textContent = currentViewYear;
}

// Helper function to get the Monday of an ISO week
function getDateOfISOWeek(week, year) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    return ISOweekStart;
}

function renderGoals(goals) {
    const container = document.getElementById('goals-list');
    
    if (!goals || goals.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No goals yet. Click "Add New Goal" to create one.</p>';
        return;
    }
    
    // Group goals by category
    const categories = {
        spiritual: { name: 'Spiritual/Faith', icon: 'fa-pray', color: 'purple', goals: [] },
        financial: { name: 'Financial/Career', icon: 'fa-dollar-sign', color: 'green', goals: [] },
        health: { name: 'Health/Fitness', icon: 'fa-heartbeat', color: 'red', goals: [] },
        family: { name: 'Family/Friends', icon: 'fa-users', color: 'blue', goals: [] },
        learning: { name: 'Learning', icon: 'fa-book', color: 'indigo', goals: [] },
        fun: { name: 'Fun/Travel', icon: 'fa-plane', color: 'orange', goals: [] },
        other: { name: 'Other', icon: 'fa-star', color: 'gray', goals: [] }
    };
    
    // Sort goals into categories
    goals.forEach(goal => {
        const category = goal.category || 'other';
        if (categories[category]) {
            categories[category].goals.push(goal);
        }
    });
    
    // Render each category with its goals
    let html = '';
    Object.keys(categories).forEach(catKey => {
        const cat = categories[catKey];
        if (cat.goals.length > 0) {
            html += `
                <div class="mb-8">
                    <h3 class="text-xl font-semibold text-${cat.color}-600 dark:text-${cat.color}-400 mb-4 flex items-center">
                        ${cat.name}
                        <span class="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">(${cat.goals.length})</span>
                    </h3>
                    <div class="space-y-4" data-category="${catKey}">
                        ${cat.goals.map(goal => `
                            <div class="goal-item card border-l-4 border-${cat.color}-500 rounded-lg p-6 bg-white dark:bg-gray-800" data-goal-id="${goal.id}" draggable="true">
                                <div class="flex items-start gap-3">
                                    <button class="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-1" title="Drag to reorder">
                                        ⋮⋮
                                    </button>
                                    <div class="flex-1">
                                        <div class="flex items-start justify-between mb-4">
                                            <div class="flex-1">
                                                <h4 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">${goal.title}</h4>
                                                ${goal.description ? `<p class="text-gray-600 dark:text-gray-400 mb-3 text-sm">${goal.description}</p>` : ''}
                                                <div class="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                                                    ${goal.year ? `<span>📅 ${goal.year}</span>` : ''}
                                                    ${goal.quarter ? `<span>📊 Q${goal.quarter}</span>` : ''}
                                                    ${goal.week_number ? `<span>📆 Week ${goal.week_number}</span>` : ''}
                                                    ${goal.is_repeating ? `<span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">🔄 Repeating</span>` : ''}
                                                </div>
                                            </div>
                                            <span class="px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(goal.status)}">
                                                ${goal.status}
                                            </span>
                                        </div>
                                        
                                        <!-- Progress bar -->
                                        <div class="mb-4">
                                            <div class="flex items-center justify-between mb-1">
                                                <span class="text-xs text-gray-600 dark:text-gray-400">Progress</span>
                                                <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">${goal.progress}%</span>
                                            </div>
                                            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div class="bg-${cat.color}-600 dark:bg-${cat.color}-500 h-2 rounded-full" style="width: ${goal.progress}%"></div>
                                            </div>
                                        </div>
                                        
                                        <div class="flex items-center justify-between">
                                            <button onclick="viewGoalDetails(${goal.id})" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm">
                                                View Details
                                            </button>
                                            <div class="space-x-2">
                                                <button onclick="editGoal(${goal.id})" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                                                    Edit
                                                </button>
                                                <button onclick="deleteGoal(${goal.id})" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html || '<p class="text-gray-500 dark:text-gray-400">No goals yet. Click "Add New Goal" to create one.</p>';
    
    // Initialize drag and drop for goals
    initializeGoalDragDrop();
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'archived': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// showAddGoalModal is now at the end of the file (modal version)

async function editGoal(id) {
    try {
        const response = await axios.get(`/api/goals/${id}`);
        const goal = response.data;
        
        const title = prompt('Goal Title:', goal.title);
        if (!title) return;
        
        const description = prompt('Description:', goal.description || '');
        
        // Category selection
        const categoryNames = ['spiritual', 'financial', 'health', 'family', 'learning', 'fun', 'other'];
        const currentCategoryIndex = categoryNames.indexOf(goal.category) + 1;
        const categoryChoice = prompt(`Category:\n1. Spiritual/Faith\n2. Financial/Career\n3. Health/Fitness\n4. Family/Friends\n5. Learning\n6. Fun/Travel\n7. Other\n\nEnter number (1-7):`, currentCategoryIndex);
        const category = categoryNames[parseInt(categoryChoice) - 1] || goal.category;
        
        const progress = prompt('Progress (0-100):', goal.progress);
        
        // Status selection with dropdown-style prompt
        const statusOptions = ['active', 'completed', 'archived'];
        const currentStatusIndex = statusOptions.indexOf(goal.status) + 1;
        const statusChoice = prompt(`Status:\n1. Active\n2. Completed\n3. Archived\n\nEnter number (1-3):`, currentStatusIndex);
        const status = statusOptions[parseInt(statusChoice) - 1] || goal.status;
        
        let is_repeating = goal.is_repeating;
        
        // For weekly goals, ask about repeating
        if (goal.goal_type === 'weekly') {
            const repeatChoice = confirm('Repeat this goal every week?\n\nClick OK to repeat, Cancel to keep this goal only for this week.');
            is_repeating = repeatChoice ? 1 : 0;
        }
        
        await axios.put(`/api/goals/${id}`, {
            title,
            description,
            category,
            status,
            progress: parseInt(progress),
            completed_at: status === 'completed' ? new Date().toISOString() : null,
            is_repeating
        });
        
        loadGoals(currentGoalType);
        alert('Goal updated successfully!');
    } catch (error) {
        console.error('Error editing goal:', error);
        alert('Failed to edit goal');
    }
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?\n\nNote: All child goals (sub-goals) will also be deleted.')) {
        return;
    }
    
    try {
        const response = await axios.delete(`/api/goals/${id}`);
        
        if (response.data.success) {
            loadGoals(currentGoalType);
            alert('Goal deleted successfully!');
        } else {
            alert('Failed to delete goal: ' + (response.data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error deleting goal:', error);
        
        if (error.response && error.response.data) {
            alert('Failed to delete goal\n\nError: ' + (error.response.data.error || 'Unknown error') + 
                  '\n\nDetails: ' + (error.response.data.details || ''));
        } else {
            alert('Failed to delete goal: ' + (error.message || 'Unknown error'));
        }
    }
}

async function viewGoalDetails(id) {
    try {
        const response = await axios.get(`/api/goals/${id}`);
        const goal = response.data;
        
        const childResponse = await axios.get(`/api/goals/${id}/hierarchy`);
        const children = childResponse.data;
        
        let message = `Goal: ${goal.title}\n\nDescription: ${goal.description || 'N/A'}\nStatus: ${goal.status}\nProgress: ${goal.progress}%\n`;
        
        if (children.length > 0) {
            message += `\n--- Sub-goals (${children.length}) ---\n`;
            children.forEach((child, i) => {
                message += `${i + 1}. ${child.title} (${child.progress}%)\n`;
            });
        }
        
        alert(message);
    } catch (error) {
        console.error('Error viewing goal:', error);
        alert('Failed to load goal details');
    }
}

// ========== WEEKLY REVIEW ==========

async function loadWeeklyData() {
    const weekInput = document.getElementById('weekly-week').value;
    if (!weekInput) return;
    
    const [yearStr, weekStr] = weekInput.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    
    try {
        const response = await axios.get(`/api/weekly/${year}/${week}`);
        const data = response.data;
        
        if (data) {
            document.getElementById('weekly-evaluation').value = data.evaluation_text || '';
            document.getElementById('weekly-achievements').value = data.achievements || '';
            document.getElementById('weekly-challenges').value = data.challenges || '';
            document.getElementById('weekly-next-plan').value = data.next_week_plan || '';
            document.getElementById('weekly-decision-bottleneck').value = data.decision_bottleneck || '';
            document.getElementById('weekly-process-gaps').value = data.process_gaps || '';
            document.getElementById('weekly-motion-vs-progress').value = data.motion_vs_progress || '';
            document.getElementById('weekly-quiet-comfort').value = data.quiet_comfort || '';
        } else {
            // Clear form for new entry
            document.getElementById('weekly-evaluation').value = '';
            document.getElementById('weekly-achievements').value = '';
            document.getElementById('weekly-challenges').value = '';
            document.getElementById('weekly-next-plan').value = '';
            document.getElementById('weekly-decision-bottleneck').value = '';
            document.getElementById('weekly-process-gaps').value = '';
            document.getElementById('weekly-motion-vs-progress').value = '';
            document.getElementById('weekly-quiet-comfort').value = '';
        }
    } catch (error) {
        console.error('Error loading weekly data:', error);
    }
}

async function saveWeeklyReview() {
    const weekInput = document.getElementById('weekly-week').value;
    if (!weekInput) {
        alert('Please select a week');
        return;
    }
    
    const [yearStr, weekStr] = weekInput.split('-W');
    const year = parseInt(yearStr);
    const week = parseInt(weekStr);
    
    const data = {
        evaluation_text: document.getElementById('weekly-evaluation').value,
        achievements: document.getElementById('weekly-achievements').value,
        challenges: document.getElementById('weekly-challenges').value,
        next_week_plan: document.getElementById('weekly-next-plan').value,
        decision_bottleneck: document.getElementById('weekly-decision-bottleneck').value,
        process_gaps: document.getElementById('weekly-process-gaps').value,
        motion_vs_progress: document.getElementById('weekly-motion-vs-progress').value,
        quiet_comfort: document.getElementById('weekly-quiet-comfort').value
    };
    
    try {
        await axios.put(`/api/weekly/${year}/${week}`, data);
        alert('Weekly review saved successfully!');
    } catch (error) {
        console.error('Error saving weekly review:', error);
        alert('Failed to save weekly review');
    }
}

// ========== UTILITY FUNCTIONS ==========

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
}

// ========== CALENDAR FUNCTIONS ==========

async function showAddEventModal() {
    const title = prompt('Event Title:');
    if (!title) return;
    
    const description = prompt('Description (optional):');
    const location = prompt('Location (optional):');
    
    const startTimeStr = prompt('Start Time (MM/DD/YYYY h:MM AM/PM) [' + getTimezoneAbbr() + ']:\nExample: 01/06/2026 2:30 PM', `${formatDateForInput(currentDate)} 9:00 AM`);
    if (!startTimeStr) return;
    
    const endTimeStr = prompt('End Time (MM/DD/YYYY h:MM AM/PM) [' + getTimezoneAbbr() + ']:\nExample: 01/06/2026 3:30 PM', `${formatDateForInput(currentDate)} 10:00 AM`);
    if (!endTimeStr) return;
    
    try {
        // Convert user-friendly format to CST 24-hour format, then to UTC
        const startTime24 = convertTo24Hour(startTimeStr);
        const endTime24 = convertTo24Hour(endTimeStr);
        
        const startTime = convertCSTToUTC(startTime24);
        const endTime = convertCSTToUTC(endTime24);
        
        await axios.post('/api/schedule', {
            title,
            description,
            location,
            start_time: startTime,
            end_time: endTime
        });
        
        loadDailyData(currentDate);
        alert('Event added successfully!');
    } catch (error) {
        console.error('Error adding event:', error);
        alert('Failed to add event. Please check the date/time format.');
    }
}

async function showGoogleCalendarSync() {
    // Check for stored token
    let accessToken = getGoogleAccessToken();
    
    if (!accessToken) {
        const instructions = 
            '📅 Google Calendar Sync - Persistent Token Setup\n\n' +
            '══════════════════════════════════\n' +
            '⚠️ CRITICAL: You MUST select the correct scope!\n' +
            '══════════════════════════════════\n\n' +
            'STEP-BY-STEP INSTRUCTIONS:\n\n' +
            '1. Go to: https://developers.google.com/oauthplayground/\n\n' +
            '2. Click gear icon (⚙️) → Check "Use your own OAuth credentials"\n' +
            '   • Enter your Client ID from Google Cloud Console\n' +
            '   • Enter your Client Secret (starts with GOCSPX-)\n' +
            '   • Click Close\n\n' +
            '3. In Step 1 (Left panel):\n' +
            '   • Scroll to "Google Calendar API v3"\n' +
            '   • ⚠️ CHECK THE BOX: ✅ https://www.googleapis.com/auth/calendar.readonly\n' +
            '   • Do NOT select calendar.events (that won\'t work!)\n' +
            '   • ONLY select calendar.readonly\n\n' +
            '4. Click "Authorize APIs" → Sign in → Allow\n\n' +
            '5. In Step 2: Click "Exchange authorization code for tokens"\n\n' +
            '6. Copy the ACCESS TOKEN (starts with ya29.)\n' +
            '   • Ignore the Refresh token for now\n' +
            '   • This token will last for weeks/months\n\n' +
            '══════════════════════════════════\n\n' +
            'Paste your Access Token below:';
        
        accessToken = prompt(instructions);
        
        if (!accessToken) {
            alert('Access token is required to sync Google Calendar');
            return;
        }
        
        // Save token for future use
        saveGoogleAccessToken(accessToken);
    } else {
        // Ask if user wants to use stored token or get a new one
        const useStored = confirm('Use stored access token?\n\nClick OK to use stored token\nClick Cancel to enter a new token');
        if (!useStored) {
            localStorage.removeItem('google_calendar_token');
            return showGoogleCalendarSync(); // Recursive call to show prompt
        }
    }
    
    try {
        // Sync events: 30 days in the past to 90 days in the future
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await axios.post('/api/calendar/sync', {
            accessToken,
            startDate,
            endDate
        });
        
        if (response.data.success) {
            alert(response.data.message);
            loadDailyData(currentDate);
        }
    } catch (error) {
        console.error('Error syncing calendar:', error);
        console.error('Full error:', error.response);
        
        if (error.response && error.response.data) {
            const errorDetails = error.response.data.fullError || error.response.data.details || '';
            
            // Check if it's an API key issue
            if (errorDetails.includes('API key') || errorDetails.includes('invalid authentication credentials')) {
                localStorage.removeItem('google_calendar_token');
                alert(
                    '🔑 Authentication Error\n\n' +
                    'It looks like you may have entered an API Key instead of an OAuth Access Token.\n\n' +
                    'Google Calendar API requires OAuth for private calendar access.\n' +
                    'API Keys from Google Cloud Console won\'t work.\n\n' +
                    'You need an OAuth Access Token:\n' +
                    '1. Go to https://developers.google.com/oauthplayground/\n' +
                    '2. Select "Google Calendar API v3" → calendar.readonly\n' +
                    '3. Authorize and get the Access Token\n' +
                    '4. Try syncing again\n\n' +
                    'Technical details: ' + errorDetails
                );
            }
            // Token expired
            else if (error.response.status === 401 || error.response.data.error?.includes('token') || error.response.data.error?.includes('expired')) {
                localStorage.removeItem('google_calendar_token');
                alert(
                    '🔑 Access Token Expired or Invalid\n\n' +
                    'Your OAuth access token has expired or is invalid.\n\n' +
                    'To sync again:\n' +
                    '1. Go to https://developers.google.com/oauthplayground/\n' +
                    '2. Follow the steps to get a new access token\n' +
                    '3. Click "Sync Google" again and paste the new token\n\n' +
                    'Note: Tokens from OAuth Playground expire after 1 hour.\n\n' +
                    'Error details: ' + (error.response.data.details || errorDetails)
                );
            }
            // Other errors
            else {
                const errorMsg = error.response.data.error || 'Unknown error';
                const details = error.response.data.details || errorDetails || '';
                alert(`Failed to sync calendar\n\nError: ${errorMsg}\n\nDetails: ${details}\n\nTip: Make sure you're using an OAuth Access Token (not an API Key)`);
            }
        } else if (error.message) {
            alert(`Failed to sync calendar\n\nError: ${error.message}\n\nTip: Make sure you're using an OAuth Access Token from OAuth Playground`);
        } else {
            alert('Failed to sync calendar. Please check your access token and try again.');
        }
    }
}

async function editScheduleEvent(eventId) {
    try {
        // Get current event details
        const dailyData = await axios.get(`/api/daily/${currentDate}`);
        const event = dailyData.data.schedule.find(e => e.id === eventId);
        
        if (!event) {
            alert('Event not found');
            return;
        }
        
        const title = prompt('Event Title:', event.title);
        if (!title) return;
        
        const description = prompt('Description (optional):', event.description || '');
        const location = prompt('Location (optional):', event.location || '');
        
        // Convert existing UTC times to user-friendly CST format
        const currentStartCST = convertUTCToCSTUserFriendly(event.start_time);
        const currentEndCST = convertUTCToCSTUserFriendly(event.end_time);
        
        const startTimeStr = prompt('Start Time (MM/DD/YYYY h:MM AM/PM) [' + getTimezoneAbbr() + ']:\nExample: 01/06/2026 2:30 PM', currentStartCST);
        if (!startTimeStr) return;
        
        const endTimeStr = prompt('End Time (MM/DD/YYYY h:MM AM/PM) [' + getTimezoneAbbr() + ']:\nExample: 01/06/2026 3:30 PM', currentEndCST);
        if (!endTimeStr) return;
        
        // Convert user-friendly format to 24-hour format, then to UTC
        const startTime24 = convertTo24Hour(startTimeStr);
        const endTime24 = convertTo24Hour(endTimeStr);
        
        const startTime = convertCSTToUTC(startTime24);
        const endTime = convertCSTToUTC(endTime24);
        
        await axios.put(`/api/schedule/${eventId}`, {
            title,
            description,
            location,
            start_time: startTime,
            end_time: endTime
        });
        
        loadDailyData(currentDate);
        alert('Event updated successfully!');
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event. Please check the date/time format.');
    }
}

async function deleteScheduleEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }
    
    try {
        await axios.delete(`/api/schedule/${eventId}`);
        loadDailyData(currentDate);
        alert('Event deleted successfully!');
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event.');
    }
}

// Store access token in localStorage for convenience (optional)
function saveGoogleAccessToken(token) {
    localStorage.setItem('google_calendar_token', token);
}

function getGoogleAccessToken() {
    return localStorage.getItem('google_calendar_token');
}

// ========== MICROSOFT CALENDAR SYNC ==========

async function showMicrosoftCalendarSync() {
    // Check for stored token
    let accessToken = getMicrosoftAccessToken();
    
    if (!accessToken) {
        const instructions = 
            '📅 Microsoft Calendar Sync - OAuth Token Setup\n\n' +
            '══════════════════════════════════\n' +
            '⚠️ IMPORTANT: You need an OAuth Access Token\n' +
            '══════════════════════════════════\n\n' +
            'QUICK SETUP INSTRUCTIONS:\n\n' +
            '1. Go to: https://developer.microsoft.com/en-us/graph/graph-explorer\n\n' +
            '2. Click "Sign in to Graph Explorer" (top right)\n' +
            '   • Sign in with your Microsoft/Outlook account\n\n' +
            '3. After signing in, click your profile icon → "Consent to permissions"\n' +
            '   • Find and consent to: Calendars.Read\n' +
            '   • Click "Consent"\n\n' +
            '4. Click "Access token" tab (middle of screen)\n' +
            '   • Copy the entire access token\n\n' +
            'ALTERNATIVE METHOD (Azure Portal):\n' +
            '1. Go to: https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade\n' +
            '2. Register a new app\n' +
            '3. Add Microsoft Graph API permissions: Calendars.Read\n' +
            '4. Use OAuth flow to get access token\n\n' +
            '══════════════════════════════════\n\n' +
            'Paste your Microsoft Access Token below:';
        
        accessToken = prompt(instructions);
        
        if (!accessToken) {
            alert('Access token is required to sync Microsoft Calendar');
            return;
        }
        
        // Save token for future use
        saveMicrosoftAccessToken(accessToken);
    } else {
        // Ask if user wants to use stored token or get a new one
        const useStored = confirm('Use stored Microsoft access token?\n\nClick OK to use stored token\nClick Cancel to enter a new token');
        if (!useStored) {
            localStorage.removeItem('microsoft_calendar_token');
            return showMicrosoftCalendarSync(); // Recursive call to show prompt
        }
    }
    
    try {
        // Sync events for next 7 days
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
        const response = await axios.post('/api/calendar/sync/microsoft', {
            accessToken,
            startDate,
            endDate
        });
        
        if (response.data.success) {
            alert(response.data.message);
            loadDailyData(currentDate);
        }
    } catch (error) {
        console.error('Error syncing Microsoft Calendar:', error);
        console.error('Full error:', error.response);
        
        if (error.response && error.response.data) {
            const errorDetails = error.response.data.fullError || error.response.data.details || '';
            
            // Token expired or invalid
            if (error.response.status === 401 || error.response.data.error?.includes('token') || error.response.data.error?.includes('expired')) {
                localStorage.removeItem('microsoft_calendar_token');
                alert(
                    '🔑 Access Token Expired or Invalid\n\n' +
                    'Your Microsoft access token has expired or is invalid.\n\n' +
                    'To sync again:\n' +
                    '1. Go to https://developer.microsoft.com/en-us/graph/graph-explorer\n' +
                    '2. Sign in and consent to Calendars.Read permission\n' +
                    '3. Copy the access token\n' +
                    '4. Click "Microsoft" button again and paste the new token\n\n' +
                    'Error details: ' + (error.response.data.details || errorDetails)
                );
            }
            // Permission error
            else if (error.response.status === 403 || errorDetails.includes('permission')) {
                alert(
                    '🔒 Permission Error\n\n' +
                    'The access token doesn\'t have Calendars.Read permission.\n\n' +
                    'Make sure you:\n' +
                    '1. Consented to Calendars.Read in Graph Explorer\n' +
                    '2. Or added Calendars.Read permission in Azure Portal\n\n' +
                    'Error details: ' + errorDetails
                );
            }
            // Other errors
            else {
                const errorMsg = error.response.data.error || 'Unknown error';
                const details = error.response.data.details || errorDetails || '';
                alert(`Failed to sync Microsoft Calendar\n\nError: ${errorMsg}\n\nDetails: ${details}`);
            }
        } else if (error.message) {
            alert(`Failed to sync Microsoft Calendar\n\nError: ${error.message}`);
        } else {
            alert('Failed to sync Microsoft Calendar. Please check your access token and try again.');
        }
    }
}

function saveMicrosoftAccessToken(token) {
    localStorage.setItem('microsoft_calendar_token', token);
}

function getMicrosoftAccessToken() {
    return localStorage.getItem('microsoft_calendar_token');
}

// ========== ICAL SUBSCRIPTION ==========

async function showICalSubscribeModal() {
    const instructions = 
        '📅 Calendar Subscription (iCal/ICS)\n\n' +
        '✅ NO OAuth tokens needed!\n' +
        '✅ Works with Google, Outlook, Apple Calendar, and any iCal feed\n\n' +
        '══════════════════════════════════\n' +
        'HOW TO GET YOUR CALENDAR URL:\n' +
        '══════════════════════════════════\n\n' +
        '📗 GOOGLE CALENDAR:\n' +
        '1. Go to calendar.google.com\n' +
        '2. Click the 3 dots next to your calendar → Settings\n' +
        '3. Scroll to "Integrate calendar"\n' +
        '4. Copy the "Secret address in iCal format" URL\n' +
        '   (looks like: https://calendar.google.com/calendar/ical/...)\n\n' +
        '📘 OUTLOOK/MICROSOFT:\n' +
        '1. Go to outlook.com\n' +
        '2. Click Settings (gear icon) → View all settings\n' +
        '3. Go to Calendar → Shared calendars\n' +
        '4. Under "Publish a calendar", select your calendar\n' +
        '5. Copy the ICS link\n\n' +
        '🍎 APPLE CALENDAR:\n' +
        '1. Go to iCloud.com → Calendar\n' +
        '2. Click the share icon next to calendar name\n' +
        '3. Check "Public Calendar"\n' +
        '4. Copy the webcal:// URL (change webcal to https)\n\n' +
        '══════════════════════════════════\n\n' +
        'Paste your calendar subscription URL below:';
    
    const icalUrl = prompt(instructions);
    
    if (!icalUrl) {
        return;
    }
    
    // Validate URL format
    if (!icalUrl.startsWith('http://') && !icalUrl.startsWith('https://') && !icalUrl.startsWith('webcal://')) {
        alert('Invalid URL format. Please enter a valid iCal/ICS URL starting with http://, https://, or webcal://');
        return;
    }
    
    // Convert webcal:// to https://
    let cleanUrl = icalUrl;
    if (icalUrl.startsWith('webcal://')) {
        cleanUrl = icalUrl.replace('webcal://', 'https://');
    }
    
    // Ask for calendar name
    const calendarName = prompt('Give this calendar a name (optional):', 'My Calendar') || 'Subscribed Calendar';
    
    try {
        const response = await axios.post('/api/calendar/sync/ical', {
            icalUrl: cleanUrl,
            calendarName: calendarName
        });
        
        if (response.data.success) {
            // Save the subscription URL for future syncs
            saveCalendarSubscription(cleanUrl, calendarName);
            alert(response.data.message + '\n\n✅ Calendar subscription saved!\nIt will auto-sync when you refresh the page.');
            loadDailyData(currentDate);
        }
    } catch (error) {
        console.error('Error syncing iCal subscription:', error);
        
        if (error.response && error.response.data) {
            alert('Failed to sync calendar subscription\n\nError: ' + (error.response.data.error || 'Unknown error') + 
                  '\n\nDetails: ' + (error.response.data.details || ''));
        } else {
            alert('Failed to sync calendar subscription: ' + (error.message || 'Unknown error'));
        }
    }
}

function saveCalendarSubscription(url, name) {
    const subscriptions = JSON.parse(localStorage.getItem('calendar_subscriptions') || '[]');
    
    // Check if already exists
    const exists = subscriptions.find(sub => sub.url === url);
    if (!exists) {
        subscriptions.push({ url, name, addedAt: new Date().toISOString() });
        localStorage.setItem('calendar_subscriptions', JSON.stringify(subscriptions));
    }
}

function getCalendarSubscriptions() {
    return JSON.parse(localStorage.getItem('calendar_subscriptions') || '[]');
}

/**
 * Auto-sync calendar subscriptions if they haven't been synced recently
 * Syncs every 4 hours automatically in the background
 */
async function autoSyncCalendarSubscriptions() {
    const subscriptions = getCalendarSubscriptions();
    if (subscriptions.length === 0) {
        return; // No subscriptions to sync
    }
    
    const lastSyncTime = localStorage.getItem('last_calendar_auto_sync');
    const now = Date.now();
    const fourHours = 4 * 60 * 60 * 1000; // 4 hours in milliseconds
    
    // Check if we need to sync (first time or more than 4 hours ago)
    if (!lastSyncTime || (now - parseInt(lastSyncTime)) > fourHours) {
        console.log('Auto-syncing calendar subscriptions...');
        
        // Sync each subscription silently in the background
        for (const sub of subscriptions) {
            try {
                await axios.post('/api/calendar/sync/ical', {
                    icalUrl: sub.url,
                    calendarName: sub.name
                });
                console.log(`✓ Auto-synced: ${sub.name}`);
            } catch (error) {
                console.error(`✗ Failed to auto-sync: ${sub.name}`, error);
                // Continue with next subscription even if one fails
            }
        }
        
        // Update last sync time
        localStorage.setItem('last_calendar_auto_sync', now.toString());
        console.log('Calendar auto-sync complete');
        
        // Reload daily data to show updated events
        loadDailyData(currentDate);
    } else {
        const timeUntilNextSync = fourHours - (now - parseInt(lastSyncTime));
        const hoursRemaining = Math.floor(timeUntilNextSync / (60 * 60 * 1000));
        const minutesRemaining = Math.floor((timeUntilNextSync % (60 * 60 * 1000)) / (60 * 1000));
        console.log(`Next calendar auto-sync in ${hoursRemaining}h ${minutesRemaining}m`);
    }
}

async function showManageSubscriptionsModal() {
    const modal = document.getElementById('manage-subscriptions-modal');
    const list = document.getElementById('subscriptions-list');
    const noSubs = document.getElementById('no-subscriptions');
    
    const subscriptions = getCalendarSubscriptions();
    
    // Fetch calendar sources from database to show what's actually synced
    try {
        const response = await axios.get('/api/schedule/sources');
        const dbSources = response.data.sources || [];
        
        console.log('Database sources:', dbSources);
        console.log('LocalStorage subscriptions:', subscriptions);
        console.log('Response data:', response.data);
        
        // Create a map of database sources for matching
        const sourceMap = new Map();
        for (const source of dbSources) {
            if (source !== 'manual') {
                sourceMap.set(source.toLowerCase(), source);
            }
        }
        
        console.log('Source map:', sourceMap);
        
        // First, add all localStorage subscriptions and mark if they're in database
        const allSubs = subscriptions.map(sub => {
            const inDatabase = sourceMap.has(sub.name.toLowerCase());
            if (inDatabase) {
                sourceMap.delete(sub.name.toLowerCase()); // Remove from map so we don't add duplicate
            }
            return {
                ...sub,
                inDatabase: inDatabase
            };
        });
        
        console.log('All subs after localStorage:', allSubs);
        console.log('Remaining source map:', sourceMap);
        
        // Then add any remaining database sources that weren't matched (calendars that were synced but not in localStorage)
        for (const [lowerName, originalName] of sourceMap.entries()) {
            console.log('Adding database-only source:', originalName);
            allSubs.push({
                name: originalName,
                url: '(Calendar has events but no saved subscription)',
                addedAt: null,
                inDatabase: true,
                readOnly: true
            });
        }
        
        console.log('Final allSubs:', allSubs);
        
        if (allSubs.length === 0) {
            list.classList.add('hidden');
            noSubs.classList.remove('hidden');
        } else {
            noSubs.classList.add('hidden');
            list.classList.remove('hidden');
            
            list.innerHTML = allSubs.map((sub, index) => {
                // For read-only entries (from database only), we need to encode the name properly for onclick
                const escapedName = sub.readOnly ? sub.name.replace(/'/g, "\\'") : '';
                
                return `
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-gray-900 dark:text-white mb-1">
                                ${sub.name}
                                ${sub.inDatabase ? '<span class="ml-2 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">✓ Has Events</span>' : '<span class="ml-2 text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">No Events</span>'}
                            </h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400 break-all mb-2">${sub.url}</p>
                            ${sub.addedAt ? `<p class="text-xs text-gray-500 dark:text-gray-500">Subscribed: ${new Date(sub.addedAt).toLocaleDateString()}</p>` : ''}
                            ${sub.readOnly ? `<p class="text-xs text-blue-600 dark:text-blue-400 mt-1">ℹ️ This calendar has events in the database</p>` : ''}
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                            ${!sub.readOnly ? `
                                <button onclick="resyncSubscription(${index})" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap">
                                    Sync Now
                                </button>
                                <button onclick="deleteSubscription(${index})" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium whitespace-nowrap">
                                    Delete
                                </button>
                            ` : `
                                <button onclick="deleteCalendarEvents('${escapedName}')" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium whitespace-nowrap">
                                    Clear Events
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `}).join('');
        }
    } catch (error) {
        console.error('Error loading calendar sources:', error);
        alert('Failed to load calendar sources: ' + error.message);
        
        // Fall back to just showing localStorage subscriptions
        if (subscriptions.length === 0) {
            list.classList.add('hidden');
            noSubs.classList.remove('hidden');
        } else {
            noSubs.classList.add('hidden');
            list.classList.remove('hidden');
            
            list.innerHTML = subscriptions.map((sub, index) => `
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                    <div class="flex items-start justify-between gap-4">
                        <div class="flex-1 min-w-0">
                            <h4 class="font-medium text-gray-900 dark:text-white mb-1">${sub.name}</h4>
                            <p class="text-sm text-gray-600 dark:text-gray-400 break-all mb-2">${sub.url}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-500">Added: ${new Date(sub.addedAt).toLocaleDateString()}</p>
                        </div>
                        <div class="flex gap-2 flex-shrink-0">
                            <button onclick="resyncSubscription(${index})" class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium">
                                Sync Now
                            </button>
                            <button onclick="deleteSubscription(${index})" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium">
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }
    
    modal.classList.remove('hidden');
}

function closeManageSubscriptionsModal() {
    document.getElementById('manage-subscriptions-modal').classList.add('hidden');
}

async function resyncSubscription(index) {
    const subscriptions = getCalendarSubscriptions();
    const sub = subscriptions[index];
    
    if (!sub) {
        alert('Subscription not found');
        return;
    }
    
    try {
        const response = await axios.post('/api/calendar/sync/ical', {
            icalUrl: sub.url,
            calendarName: sub.name
        });
        
        if (response.data.success) {
            alert(`✅ ${response.data.message}`);
            loadDailyData(currentDate);
        }
    } catch (error) {
        console.error('Error resyncing subscription:', error);
        alert('Failed to sync subscription: ' + (error.response?.data?.error || error.message));
    }
}

async function deleteSubscription(index) {
    const subscriptions = getCalendarSubscriptions();
    const sub = subscriptions[index];
    
    if (!sub) {
        alert('Subscription not found');
        return;
    }
    
    if (!confirm(`Delete calendar subscription "${sub.name}"?\n\nThis will remove the subscription but keep existing events.`)) {
        return;
    }
    
    // Remove from localStorage
    subscriptions.splice(index, 1);
    localStorage.setItem('calendar_subscriptions', JSON.stringify(subscriptions));
    
    alert('Subscription deleted successfully!');
    
    // Refresh the modal
    showManageSubscriptionsModal();
}

async function deleteCalendarEvents(calendarSource) {
    if (confirm(`Delete all events from "${calendarSource}"?\n\nThis will permanently remove all synced events from this calendar.`)) {
        try {
            await axios.delete(`/api/schedule/source/${encodeURIComponent(calendarSource)}`);
            alert('✅ Calendar events deleted');
            loadDailyData(currentDate);
            showManageSubscriptionsModal();
        } catch (error) {
            console.error('Error deleting calendar events:', error);
            alert('❌ Failed to delete calendar events');
        }
    }
}

// ========== CREATE TASK MODAL ==========

async function showCreateTaskModal() {
    // Load goals for dropdown
    try {
        const response = await axios.get('/api/goals');
        const goals = response.data;
        
        const goalSelect = document.getElementById('new-task-goal');
        goalSelect.innerHTML = '<option value="">No goal (standalone task)</option>' + 
            goals.map(goal => `<option value="${goal.id}">${goal.title} (${goal.goal_type})</option>`).join('');
        
        // Set default due date to today
        document.getElementById('new-task-due-date').value = currentDate;
        
        // Show modal
        document.getElementById('create-task-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading goals:', error);
        document.getElementById('create-task-modal').classList.remove('hidden');
    }
}

function closeCreateTaskModal() {
    document.getElementById('create-task-modal').classList.add('hidden');
    // Clear form
    document.getElementById('new-task-title').value = '';
    document.getElementById('new-task-description').value = '';
    document.getElementById('new-task-category').value = 'other';
    document.getElementById('new-task-priority').value = 'medium';
    document.getElementById('new-task-due-date').value = '';
    document.getElementById('new-task-goal').value = '';
}

async function createNewTask() {
    const title = document.getElementById('new-task-title').value.trim();
    const description = document.getElementById('new-task-description').value.trim();
    const category = document.getElementById('new-task-category').value;
    const priority = document.getElementById('new-task-priority').value;
    const dueDate = document.getElementById('new-task-due-date').value;
    const goalId = document.getElementById('new-task-goal').value;
    
    if (!title) {
        alert('Please enter a task title');
        return;
    }
    
    try {
        // Create the task
        const response = await axios.post('/api/tasks', {
            title,
            description,
            category,
            priority,
            due_date: dueDate || null,
            goal_id: goalId ? parseInt(goalId) : null
        });
        
        const newTaskId = response.data.id;
        
        // Automatically add to today's task list
        await axios.post(`/api/daily/${currentDate}/tasks/${newTaskId}`);
        
        closeCreateTaskModal();
        loadDailyData(currentDate);
        alert('Task created and added to today!');
        
    } catch (error) {
        console.error('Error creating task:', error);
        alert('Failed to create task');
    }
}

// ========== CREATE GOAL MODAL ==========

function showAddGoalModal() {
    document.getElementById('create-goal-modal').classList.remove('hidden');
}

function closeCreateGoalModal() {
    document.getElementById('create-goal-modal').classList.add('hidden');
    // Clear form
    document.getElementById('new-goal-title').value = '';
    document.getElementById('new-goal-description').value = '';
    document.getElementById('new-goal-category').value = 'other';
}

async function createNewGoal() {
    const title = document.getElementById('new-goal-title').value.trim();
    const description = document.getElementById('new-goal-description').value.trim();
    const category = document.getElementById('new-goal-category').value;
    const isRepeating = document.getElementById('new-goal-repeating')?.checked || false;
    
    if (!title) {
        alert('Please enter a goal title');
        return;
    }
    
    const goalData = {
        title,
        description,
        goal_type: currentGoalType,
        category
    };
    
    // Add year/quarter/week based on type
    if (currentGoalType === 'annual' || currentGoalType === 'quarterly' || currentGoalType === 'weekly') {
        goalData.year = currentGoalType === 'weekly' && currentViewYear ? currentViewYear : new Date().getFullYear();
    }
    
    if (currentGoalType === 'quarterly') {
        goalData.quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    }
    
    if (currentGoalType === 'weekly') {
        // Use the currently viewed week, or current week if not set
        goalData.week_number = currentViewWeek || getWeekNumber(new Date());
        goalData.year = currentViewYear || new Date().getFullYear();
        goalData.is_repeating = isRepeating ? 1 : 0;
    }
    
    try {
        await axios.post('/api/goals', goalData);
        closeCreateGoalModal();
        
        // Reload appropriate view based on current page
        const currentPage = [...document.querySelectorAll('.page')].find(p => !p.classList.contains('hidden'));
        if (currentPage && currentPage.id === 'weekly-planner-page') {
            // Reload weekly planner data
            await loadWeeklyPlannerData();
        } else {
            // Reload goals list (for Goals page)
            loadGoals(currentGoalType);
        }
        
        alert('Goal created successfully!');
    } catch (error) {
        console.error('Error creating goal:', error);
        alert('Failed to create goal');
    }
}

// ========== HABIT TRACKER ==========

async function loadHabits(date) {
    try {
        const response = await axios.get(`/api/habits/date/${date}`);
        renderHabits(response.data);
    } catch (error) {
        console.error('Error loading habits:', error);
        alert('Failed to load habits');
    }
}

function renderHabits(habits) {
    const container = document.getElementById('habits-list');
    
    if (!habits || habits.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No habits yet. Click "New Habit" to create one!</p>';
        return;
    }
    
    // Filter habits that are scheduled for today
    const todayHabits = habits.filter(h => h.is_scheduled_today);
    
    if (todayHabits.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No habits scheduled for today.</p>';
        return;
    }
    
    container.innerHTML = todayHabits.map((habit, index) => {
        const isCompleted = habit.completed;
        const categoryBadge = getCategoryBadgeColor(habit.category);
        
        return `
            <div class="habit-item flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}" data-habit-id="${habit.id}" draggable="true">
                <button class="drag-handle cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" title="Drag to reorder">
                    ⋮⋮
                </button>
                <input 
                    type="checkbox" 
                    ${isCompleted ? 'checked' : ''}
                    onchange="toggleHabit(${habit.id}, this.checked)"
                    class="w-5 h-5 rounded border-gray-300 text-gray-800 focus:ring-gray-400 cursor-pointer"
                />
                <div class="flex-1">
                    <div class="flex items-center gap-2">
                        <span class="font-medium text-gray-900 dark:text-gray-100 ${isCompleted ? 'line-through opacity-60' : ''}">${habit.title}</span>
                        <span class="text-xs px-2 py-0.5 rounded-full ${categoryBadge}">${getCategoryName(habit.category)}</span>
                        ${habit.frequency === 'weekly' ? '<span class="text-xs text-gray-500 dark:text-gray-400">' + habit.target_days + '</span>' : ''}
                    </div>
                    ${habit.description ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${habit.description}</p>` : ''}
                </div>
                <button onclick="editHabit(${habit.id})" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm">
                    Edit
                </button>
                <button onclick="deleteHabit(${habit.id})" class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm">
                    Delete
                </button>
            </div>
        `;
    }).join('');
    
    // Initialize drag and drop for habits
    initializeHabitDragDrop();
}

async function toggleHabit(habitId, completed) {
    try {
        await axios.post(`/api/habits/${habitId}/complete`, {
            date: currentDate,
            completed: completed
        });
        
        // Reload habits to update UI
        loadHabits(currentDate);
    } catch (error) {
        console.error('Error toggling habit:', error);
        alert('Failed to update habit');
    }
}

async function deleteHabit(habitId) {
    if (!confirm('Are you sure you want to delete this habit? All completion history will be lost.')) {
        return;
    }
    
    try {
        await axios.delete(`/api/habits/${habitId}`);
        loadHabits(currentDate);
        alert('Habit deleted successfully!');
    } catch (error) {
        console.error('Error deleting habit:', error);
        alert('Failed to delete habit');
    }
}

function showCreateHabitModal() {
    document.getElementById('create-habit-modal').classList.remove('hidden');
    document.getElementById('new-habit-title').value = '';
    document.getElementById('new-habit-description').value = '';
    document.getElementById('new-habit-category').value = 'health';
    document.getElementById('new-habit-frequency').value = 'daily';
    document.getElementById('target-days-container').classList.add('hidden');
    document.getElementById('new-habit-target-days').value = '';
}

function closeCreateHabitModal() {
    document.getElementById('create-habit-modal').classList.add('hidden');
}

function toggleTargetDays() {
    const frequency = document.getElementById('new-habit-frequency').value;
    const container = document.getElementById('target-days-container');
    
    if (frequency === 'weekly') {
        container.classList.remove('hidden');
    } else {
        container.classList.add('hidden');
    }
}

async function createNewHabit() {
    const title = document.getElementById('new-habit-title').value.trim();
    const description = document.getElementById('new-habit-description').value.trim();
    const category = document.getElementById('new-habit-category').value;
    const frequency = document.getElementById('new-habit-frequency').value;
    const targetDays = document.getElementById('new-habit-target-days').value.trim();
    
    if (!title) {
        alert('Please enter a habit name');
        return;
    }
    
    if (frequency === 'weekly' && !targetDays) {
        alert('Please specify target days for weekly habits');
        return;
    }
    
    try {
        await axios.post('/api/habits', {
            title,
            description,
            category,
            frequency,
            target_days: frequency === 'weekly' ? targetDays : null
        });
        
        closeCreateHabitModal();
        loadHabits(currentDate);
        alert('Habit created successfully!');
    } catch (error) {
        console.error('Error creating habit:', error);
        alert('Failed to create habit');
    }
}

async function editHabit(habitId) {
    try {
        // Get all habits to find this one
        const response = await axios.get('/api/habits?is_active=true');
        const habit = response.data.find(h => h.id === habitId);
        
        if (!habit) {
            alert('Habit not found');
            return;
        }
        
        // Populate modal with existing data
        document.getElementById('new-habit-title').value = habit.title;
        document.getElementById('new-habit-description').value = habit.description || '';
        document.getElementById('new-habit-category').value = habit.category;
        document.getElementById('new-habit-frequency').value = habit.frequency;
        document.getElementById('new-habit-target-days').value = habit.target_days || '';
        
        // Show/hide target days based on frequency
        toggleTargetDays();
        
        // Show modal
        document.getElementById('create-habit-modal').classList.remove('hidden');
        
        // Change the create button to update
        const createBtn = document.querySelector('#create-habit-modal button[onclick="createNewHabit()"]');
        createBtn.textContent = 'Update Habit';
        createBtn.setAttribute('onclick', `updateHabit(${habitId})`);
    } catch (error) {
        console.error('Error loading habit:', error);
        alert('Failed to load habit for editing');
    }
}

async function updateHabit(habitId) {
    const title = document.getElementById('new-habit-title').value.trim();
    const description = document.getElementById('new-habit-description').value.trim();
    const category = document.getElementById('new-habit-category').value;
    const frequency = document.getElementById('new-habit-frequency').value;
    const targetDays = document.getElementById('new-habit-target-days').value.trim();
    
    if (!title) {
        alert('Please enter a habit name');
        return;
    }
    
    if (frequency === 'weekly' && !targetDays) {
        alert('Please specify target days for weekly habits');
        return;
    }
    
    try {
        await axios.put(`/api/habits/${habitId}`, {
            title,
            description,
            category,
            frequency,
            target_days: frequency === 'weekly' ? targetDays : null,
            is_active: 1
        });
        
        closeCreateHabitModal();
        
        // Reset the button back to "Create"
        const createBtn = document.querySelector('#create-habit-modal button[onclick^="updateHabit"]');
        if (createBtn) {
            createBtn.textContent = 'Create Habit';
            createBtn.setAttribute('onclick', 'createNewHabit()');
        }
        
        loadHabits(currentDate);
        alert('Habit updated successfully!');
    } catch (error) {
        console.error('Error updating habit:', error);
        alert('Failed to update habit');
    }
}

// Drag and drop for habits
let draggedHabitElement = null;

function initializeHabitDragDrop() {
    const habitItems = document.querySelectorAll('.habit-item');
    
    habitItems.forEach(item => {
        item.addEventListener('dragstart', handleHabitDragStart);
        item.addEventListener('dragover', handleHabitDragOver);
        item.addEventListener('drop', handleHabitDrop);
        item.addEventListener('dragend', handleHabitDragEnd);
    });
}

function handleHabitDragStart(e) {
    draggedHabitElement = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleHabitDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedHabitElement) {
        this.style.borderTop = '2px solid #4B5563';
    }
    
    return false;
}

function handleHabitDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedHabitElement !== this) {
        // Get all habit items
        const container = document.getElementById('habits-list');
        const allItems = Array.from(container.querySelectorAll('.habit-item'));
        
        // Get the dragged and target indices
        const draggedIndex = allItems.indexOf(draggedHabitElement);
        const targetIndex = allItems.indexOf(this);
        
        // Reorder in DOM
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedHabitElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedHabitElement, this);
        }
        
        // Save new order to backend
        saveHabitOrder();
    }
    
    this.style.borderTop = '';
    return false;
}

function handleHabitDragEnd(e) {
    this.style.opacity = '1';
    
    document.querySelectorAll('.habit-item').forEach(item => {
        item.style.borderTop = '';
    });
}

async function saveHabitOrder() {
    const habitItems = document.querySelectorAll('.habit-item');
    const habitIds = Array.from(habitItems).map(item => parseInt(item.getAttribute('data-habit-id')));
    
    try {
        await axios.post('/api/habits/reorder', { habitIds });
    } catch (error) {
        console.error('Error saving habit order:', error);
        alert('Failed to save habit order');
    }
}

// Drag and drop for goals
let draggedGoalElement = null;

function initializeGoalDragDrop() {
    const goalItems = document.querySelectorAll('.goal-item');
    
    goalItems.forEach(item => {
        item.addEventListener('dragstart', handleGoalDragStart);
        item.addEventListener('dragover', handleGoalDragOver);
        item.addEventListener('drop', handleGoalDrop);
        item.addEventListener('dragend', handleGoalDragEnd);
    });
}

function handleGoalDragStart(e) {
    draggedGoalElement = this;
    this.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}

function handleGoalDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    if (this !== draggedGoalElement) {
        this.style.borderTop = '2px solid #4B5563';
    }
    
    return false;
}

function handleGoalDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedGoalElement !== this) {
        // Only allow reordering within the same category
        const draggedCategory = draggedGoalElement.closest('[data-category]');
        const targetCategory = this.closest('[data-category]');
        
        if (draggedCategory === targetCategory) {
            // Get all goal items in this category
            const categoryContainer = targetCategory;
            const allItems = Array.from(categoryContainer.querySelectorAll('.goal-item'));
            
            // Get the dragged and target indices
            const draggedIndex = allItems.indexOf(draggedGoalElement);
            const targetIndex = allItems.indexOf(this);
            
            // Reorder in DOM
            if (draggedIndex < targetIndex) {
                categoryContainer.insertBefore(draggedGoalElement, this.nextSibling);
            } else {
                categoryContainer.insertBefore(draggedGoalElement, this);
            }
            
            // Save new order to backend
            saveGoalOrder();
        }
    }
    
    this.style.borderTop = '';
    return false;
}

function handleGoalDragEnd(e) {
    this.style.opacity = '1';
    
    document.querySelectorAll('.goal-item').forEach(item => {
        item.style.borderTop = '';
    });
}

async function saveGoalOrder() {
    const goalItems = document.querySelectorAll('.goal-item');
    const goalIds = Array.from(goalItems).map(item => parseInt(item.getAttribute('data-goal-id')));
    
    try {
        await axios.post('/api/goals/reorder', { goalIds });
    } catch (error) {
        console.error('Error saving goal order:', error);
        alert('Failed to save goal order');
    }
}

// Show/hide repeating checkbox based on goal type
function updateRepeatingOptionVisibility() {
    const repeatingOption = document.getElementById('repeating-goal-option');
    if (repeatingOption) {
        if (currentGoalType === 'weekly') {
            repeatingOption.classList.remove('hidden');
        } else {
            repeatingOption.classList.add('hidden');
        }
    }
}

// Copy repeating goals from previous week to current week
async function copyRepeatingGoals() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    
    if (!confirm(`Copy all repeating weekly goals to Week ${week} (${year})?\n\nThis will create copies of goals marked as "Repeat every week" from the previous week.`)) {
        return;
    }
    
    try {
        const response = await axios.post(`/api/goals/copy-repeating/${year}/${week}`);
        
        if (response.data.copied > 0) {
            alert(`✅ Successfully copied ${response.data.copied} repeating goal(s) to this week!`);
            loadGoals('weekly');
        } else {
            alert(response.data.message || 'No repeating goals to copy.');
        }
    } catch (error) {
        console.error('Error copying repeating goals:', error);
        alert('Failed to copy repeating goals: ' + (error.response?.data?.details || error.message));
    }
}

// Automatic weekly reset - archives old goals, copies repeating ones, prompts for incomplete
async function performWeeklyReset() {
    const now = new Date();
    const year = now.getFullYear();
    const week = getWeekNumber(now);
    
    try {
        const response = await axios.post(`/api/goals/weekly-reset/${year}/${week}`);
        
        if (response.data.alreadyReset) {
            console.log('Weekly goals already reset for this week');
            return;
        }
        
        const { archived, repeatingCopied, incompleteGoals } = response.data;
        
        // Show summary
        let message = `📅 Weekly Reset Complete!\n\n`;
        message += `✅ Archived ${archived} goal(s) from last week\n`;
        message += `🔄 Copied ${repeatingCopied} repeating goal(s) to this week\n`;
        
        if (incompleteGoals && incompleteGoals.length > 0) {
            message += `\n⚠️ ${incompleteGoals.length} incomplete goal(s) from last week need your attention.`;
            alert(message);
            
            // Show incomplete goals and ask which to carry forward
            await handleIncompleteGoals(incompleteGoals, year, week);
        } else {
            alert(message);
        }
        
        // Reload goals
        if (currentGoalType === 'weekly') {
            loadGoals('weekly');
        }
        
    } catch (error) {
        console.error('Error performing weekly reset:', error);
        alert('Failed to reset weekly goals: ' + (error.response?.data?.details || error.message));
    }
}

// Handle incomplete goals - let user choose which to carry forward
async function handleIncompleteGoals(incompleteGoals, year, week) {
    let message = `You have ${incompleteGoals.length} incomplete goal(s) from last week:\n\n`;
    
    incompleteGoals.forEach((goal, index) => {
        message += `${index + 1}. ${goal.title} (${goal.progress}% complete)\n`;
    });
    
    message += `\nWould you like to carry these goals forward to this week?\n\n`;
    message += `Click OK to SELECT which goals to carry forward, or Cancel to leave them archived.`;
    
    if (!confirm(message)) {
        alert('Incomplete goals have been archived. You can still view them by changing the status filter.');
        return;
    }
    
    // Let user select which goals to carry forward
    const selectedGoalIds = [];
    
    for (const goal of incompleteGoals) {
        const carry = confirm(`Carry forward: "${goal.title}" (${goal.progress}% complete)?\n\nClick OK to carry forward, Cancel to skip.`);
        if (carry) {
            selectedGoalIds.push(goal.id);
        }
    }
    
    if (selectedGoalIds.length === 0) {
        alert('No goals selected to carry forward.');
        return;
    }
    
    // Carry forward selected goals
    try {
        const response = await axios.post(`/api/goals/carry-forward/${year}/${week}`, {
            goalIds: selectedGoalIds
        });
        
        alert(`✅ Carried forward ${response.data.carried} goal(s) to this week!`);
        
        if (currentGoalType === 'weekly') {
            loadGoals('weekly');
        }
    } catch (error) {
        console.error('Error carrying forward goals:', error);
        alert('Failed to carry forward goals: ' + (error.response?.data?.details || error.message));
    }
}

// Check if weekly reset is needed when viewing weekly goals
async function checkWeeklyReset() {
    const lastResetWeek = localStorage.getItem('last_weekly_reset');
    const now = new Date();
    const currentWeekKey = `${now.getFullYear()}-W${getWeekNumber(now)}`;
    
    // Only check once per week
    if (lastResetWeek === currentWeekKey) {
        return;
    }
    
    // Mark that we checked this week
    localStorage.setItem('last_weekly_reset', currentWeekKey);
    
    // Perform the reset
    await performWeeklyReset();
}

// Call this when goal type changes
const originalSetGoalType = window.setGoalType;
window.setGoalType = function(type) {
    if (originalSetGoalType) {
        originalSetGoalType(type);
    }
    updateRepeatingOptionVisibility();
};

// Also update when modal opens
const originalCloseCreateGoalModal = window.closeCreateGoalModal;
window.closeCreateGoalModal = function() {
    if (originalCloseCreateGoalModal) {
        originalCloseCreateGoalModal();
    }
    // Reset checkbox
    const checkbox = document.getElementById('new-goal-repeating');
    if (checkbox) {
        checkbox.checked = false;
    }
};

// Update visibility when page loads
document.addEventListener('DOMContentLoaded', () => {
    updateRepeatingOptionVisibility();
});
// ========== WEEKLY PLANNER FUNCTIONS ==========

// Weekly Planner state
let currentPlannerWeek = null;
let currentPlannerYear = null;
let weeklyPlannerData = null;

/**
 * Initialize Weekly Planner when page is shown
 */
async function initializeWeeklyPlanner() {
    const now = new Date();
    currentPlannerYear = now.getFullYear();
    currentPlannerWeek = getWeekNumber(now);
    
    await loadWeeklyPlannerData();
    // Note: initializeWeeklyPlannerDragDrop() is now called in renderWeeklyPlanner()
}

/**
 * Navigate to next/previous week
 */
function navigateWeekPlanner(direction) {
    currentPlannerWeek += direction;
    
    // Handle year boundaries
    if (currentPlannerWeek > 52) {
        currentPlannerWeek = 1;
        currentPlannerYear++;
    } else if (currentPlannerWeek < 1) {
        currentPlannerWeek = 52;
        currentPlannerYear--;
    }
    
    // Update goal creation context
    currentViewWeek = currentPlannerWeek;
    currentViewYear = currentPlannerYear;
    
    loadWeeklyPlannerData();
}

/**
 * Load all weekly planner data for current week
 */
async function loadWeeklyPlannerData() {
    try {
        const response = await axios.get(`/api/week-schedule/${currentPlannerYear}/${currentPlannerWeek}`);
        weeklyPlannerData = response.data;
        
        renderWeeklyPlanner();
    } catch (error) {
        console.error('Error loading weekly planner:', error);
        alert('Failed to load weekly planner data');
    }
}

/**
 * Render the weekly planner view
 */
function renderWeeklyPlanner() {
    // Safety check
    if (!weeklyPlannerData) {
        console.log('weeklyPlannerData not loaded yet');
        return;
    }
    
    // Update week display
    const weekDates = getWeekDates(currentPlannerYear, currentPlannerWeek);
    document.getElementById('planner-week-display').textContent = 
        `${weekDates.start} - ${weekDates.end}`;
    document.getElementById('planner-week-number').textContent = currentPlannerWeek;
    document.getElementById('planner-week-year').textContent = currentPlannerYear;
    
    // Render each day's date
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dates = getWeekDatesByDay(currentPlannerYear, currentPlannerWeek);
    
    days.forEach(day => {
        const dateElement = document.getElementById(`${day}-date`);
        if (dateElement) {
            dateElement.textContent = dates[day];
        }
    });
    
    // Render scheduled items by day
    days.forEach(day => {
        const dayItems = weeklyPlannerData.schedules.filter(s => s.day_of_week === day);
        renderDayItems(day, dayItems);
    });
    
    // Render unscheduled items
    renderUnscheduledItems();
    
    // Re-attach drag-drop event listeners after rendering
    initializeWeeklyPlannerDragDrop();
}

/**
 * Render items for a specific day
 */
function renderDayItems(day, items) {
    const container = document.getElementById(`${day}-items`);
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-400 dark:text-gray-500 text-center py-4">Drop items here</p>';
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isGoal = item.goal_id !== null;
        const title = isGoal ? item.goal_title : item.task_title;
        const category = isGoal ? item.goal_category : item.task_category;
        const progress = isGoal ? item.goal_progress : null;
        const priority = isGoal ? null : item.task_priority;
        
        return `
            <div class="planner-item border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 cursor-move hover:shadow-md transition"
                 draggable="true"
                 data-schedule-id="${item.id}"
                 data-item-id="${isGoal ? item.goal_id : item.task_id}"
                 data-item-type="${isGoal ? 'goal' : 'task'}"
                 data-day="${day}">
                <div class="flex items-start gap-2">
                    <span class="text-gray-400 dark:text-gray-500 cursor-move">⋮⋮</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <span class="text-xs px-2 py-0.5 rounded ${getCategoryBadgeColor(category)}">
                                ${getCategoryName(category)}
                            </span>
                            ${priority ? `<span class="text-xs px-2 py-0.5 rounded ${getPriorityColor(priority)}">${priority}</span>` : ''}
                        </div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${title}</p>
                        ${progress !== null ? `
                            <div class="mt-1 flex items-center gap-2">
                                <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                                    <div class="bg-blue-600 h-1 rounded-full" style="width: ${progress}%"></div>
                                </div>
                                <span class="text-xs text-gray-500 dark:text-gray-400">${progress}%</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Render unscheduled items (goals and tasks)
 */
function renderUnscheduledItems() {
    const container = document.getElementById('unscheduled-items');
    if (!container) return;
    
    const goals = weeklyPlannerData.unscheduledGoals || [];
    const tasks = weeklyPlannerData.unscheduledTasks || [];
    
    if (goals.length === 0 && tasks.length === 0) {
        container.innerHTML = '<p class="text-xs text-gray-500 dark:text-gray-400 text-center py-8">All items are scheduled!<br>Drag items here to unschedule them</p>';
        return;
    }
    
    const goalsHTML = goals.map(goal => `
        <div class="planner-item border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 cursor-move hover:shadow-md transition"
             draggable="true"
             data-item-id="${goal.id}"
             data-item-type="goal"
             data-day="unscheduled">
            <div class="flex items-start gap-2">
                <span class="text-gray-400 dark:text-gray-500 cursor-move">⋮⋮</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs px-2 py-0.5 rounded ${getCategoryBadgeColor(goal.category)}">
                            ${getCategoryName(goal.category)}
                        </span>
                        <span class="text-xs text-blue-600 dark:text-blue-400">Goal</span>
                    </div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${goal.title}</p>
                    <div class="mt-1 flex items-center gap-2">
                        <div class="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                            <div class="bg-blue-600 h-1 rounded-full" style="width: ${goal.progress}%"></div>
                        </div>
                        <span class="text-xs text-gray-500 dark:text-gray-400">${goal.progress}%</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    const tasksHTML = tasks.map(task => `
        <div class="planner-item border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 cursor-move hover:shadow-md transition"
             draggable="true"
             data-item-id="${task.id}"
             data-item-type="task"
             data-day="unscheduled">
            <div class="flex items-start gap-2">
                <span class="text-gray-400 dark:text-gray-500 cursor-move">⋮⋮</span>
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="text-xs px-2 py-0.5 rounded ${getCategoryBadgeColor(task.category)}">
                            ${getCategoryName(task.category)}
                        </span>
                        <span class="text-xs px-2 py-0.5 rounded ${getPriorityColor(task.priority)}">${task.priority}</span>
                    </div>
                    <p class="text-sm font-medium text-gray-900 dark:text-white truncate">${task.title}</p>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = goalsHTML + tasksHTML;
}


/**
 * Initialize drag and drop for weekly planner
 */
function initializeWeeklyPlannerDragDrop() {
    // Get all draggable items
    const items = document.querySelectorAll('.planner-item[draggable="true"]');
    
    items.forEach(item => {
        item.addEventListener('dragstart', handlePlannerDragStart);
        item.addEventListener('dragend', handlePlannerDragEnd);
    });
    
    // Get all drop zones (day columns and unscheduled area)
    const dropZones = document.querySelectorAll('.day-column, #unscheduled-items');
    
    dropZones.forEach(zone => {
        zone.addEventListener('dragover', handlePlannerDragOver);
        zone.addEventListener('drop', handlePlannerDrop);
        zone.addEventListener('dragleave', handlePlannerDragLeave);
    });
}

let draggedPlannerItem = null;

function handlePlannerDragStart(e) {
    draggedPlannerItem = e.target;
    e.target.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
}

function handlePlannerDragEnd(e) {
    e.target.style.opacity = '1';
    // Remove all drag-over effects
    document.querySelectorAll('.day-column, #unscheduled-items').forEach(zone => {
        zone.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
    });
}

function handlePlannerDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    
    // Add visual feedback
    e.currentTarget.classList.add('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
    
    return false;
}

function handlePlannerDragLeave(e) {
    e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
}

async function handlePlannerDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    e.preventDefault();
    
    // Remove visual feedback
    e.currentTarget.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-300', 'dark:border-blue-600');
    
    if (!draggedPlannerItem) {
        console.log('No dragged item');
        return;
    }
    
    const scheduleId = draggedPlannerItem.dataset.scheduleId;
    const itemId = draggedPlannerItem.dataset.itemId;
    const itemType = draggedPlannerItem.dataset.itemType;
    const fromDay = draggedPlannerItem.dataset.day;
    const toDay = e.currentTarget.dataset.day || 'unscheduled';
    
    console.log('Drop event:', { scheduleId, itemId, itemType, fromDay, toDay, year: currentPlannerYear, week: currentPlannerWeek });
    
    // Don't do anything if dropped in same place
    if (fromDay === toDay) {
        console.log('Dropped in same place, ignoring');
        return;
    }
    
    try {
        if (toDay === 'unscheduled') {
            // Remove from schedule
            if (scheduleId) {
                console.log('Removing from schedule:', scheduleId);
                await axios.delete(`/api/week-schedule/${scheduleId}`);
                console.log('Successfully removed from schedule');
            }
        } else if (fromDay === 'unscheduled') {
            // Add to schedule
            const postData = {
                goalId: itemType === 'goal' ? parseInt(itemId) : null,
                taskId: itemType === 'task' ? parseInt(itemId) : null,
                year: currentPlannerYear,
                weekNumber: currentPlannerWeek,
                dayOfWeek: toDay,
                displayOrder: 0
            };
            console.log('Adding to schedule:', postData);
            const response = await axios.post('/api/week-schedule', postData);
            console.log('Successfully added to schedule:', response.data);
        } else {
            // Move between days
            const putData = {
                dayOfWeek: toDay,
                displayOrder: 0
            };
            console.log('Moving between days:', scheduleId, putData);
            await axios.put(`/api/week-schedule/${scheduleId}`, putData);
            console.log('Successfully moved between days');
        }
        
        // Reload data to reflect changes
        console.log('Reloading weekly planner data...');
        await loadWeeklyPlannerData();
        console.log('Data reloaded successfully');
    } catch (error) {
        console.error('Error updating schedule:', error);
        console.error('Error details:', error.response?.data);
        alert('Failed to update schedule: ' + (error.response?.data?.error || error.message));
    }
    
    draggedPlannerItem = null;
    return false;
}

/**
 * Get week dates for display
 */
function getWeekDates(year, week) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const weekStart = new Date(ISOweekStart);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const formatDate = (date) => {
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
    };
    
    return {
        start: formatDate(weekStart),
        end: formatDate(weekEnd)
    };
}

/**
 * Get dates for each day of the week
 */
function getWeekDatesByDay(year, week) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = simple;
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    
    const dates = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    days.forEach((day, index) => {
        const date = new Date(ISOweekStart);
        date.setDate(date.getDate() + index);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const dayNum = date.getDate().toString().padStart(2, '0');
        dates[day] = `${month}/${dayNum}`;
    });
    
    return dates;
}

// Update showPage function to initialize weekly planner
const originalShowPage = window.showPage;
window.showPage = function(pageName) {
    if (originalShowPage) {
        originalShowPage(pageName);
    }
    
    // Initialize weekly planner when page is shown
    if (pageName === 'weekly-planner') {
        // Set goal context to weekly for the modal
        currentGoalType = 'weekly';
        currentViewWeek = currentPlannerWeek;
        currentViewYear = currentPlannerYear;
        
        initializeWeeklyPlanner();
    }
};

