// Global state
let currentGoalType = 'long_term';
let currentDate = new Date().toISOString().split('T')[0];

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

// Page navigation
function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    document.getElementById(`${page}-page`).classList.remove('hidden');
    
    if (page === 'goals') {
        loadGoals(currentGoalType);
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
        <div class="flex items-center justify-between p-4 border rounded-lg ${task.completed ? 'bg-green-50' : 'bg-white'}">
            <div class="flex items-center space-x-3">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="toggleTaskComplete(${task.id}, this.checked)"
                       class="w-5 h-5 text-indigo-600 rounded">
                <div>
                    <div class="flex items-center space-x-2">
                        <p class="font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}">${task.title}</p>
                        ${task.category ? `<span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getCategoryBadgeColor(task.category)}">${getCategoryName(task.category)}</span>` : ''}
                    </div>
                    ${task.description ? `<p class="text-sm text-gray-600">${task.description}</p>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <span class="px-3 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}">
                    ${task.priority}
                </span>
                <button onclick="removeDailyTask(${task.id})" class="text-red-500 hover:text-red-700">
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

async function showTaskSelector() {
    try {
        const response = await axios.get('/api/tasks?status=pending');
        const tasks = response.data;
        
        if (tasks.length === 0) {
            alert('No pending tasks available. Create a new task using the "New Task" button!');
            return;
        }
        
        // Show modal
        const modal = document.getElementById('task-selector-modal');
        const taskList = document.getElementById('task-selector-list');
        
        // Group tasks by category
        const categories = {
            spiritual: { name: 'Spiritual/Faith', icon: 'fa-pray', color: 'purple', tasks: [] },
            financial: { name: 'Financial/Career', icon: 'fa-dollar-sign', color: 'green', tasks: [] },
            health: { name: 'Health/Fitness', icon: 'fa-heartbeat', color: 'red', tasks: [] },
            family: { name: 'Family/Friends', icon: 'fa-users', color: 'blue', tasks: [] },
            learning: { name: 'Learning', icon: 'fa-book', color: 'indigo', tasks: [] },
            other: { name: 'Other', icon: 'fa-star', color: 'gray', tasks: [] }
        };
        
        tasks.forEach(task => {
            const category = task.category || 'other';
            if (categories[category]) {
                categories[category].tasks.push(task);
            }
        });
        
        // Render tasks grouped by category
        let html = '';
        Object.keys(categories).forEach(catKey => {
            const cat = categories[catKey];
            if (cat.tasks.length > 0) {
                html += `
                    <div class="mb-4">
                        <h4 class="text-sm font-bold text-${cat.color}-600 mb-2 flex items-center">
                            <i class="fas ${cat.icon} mr-2"></i>
                            ${cat.name}
                        </h4>
                        <div class="space-y-2">
                            ${cat.tasks.map(task => `
                                <label class="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer">
                                    <input type="checkbox" class="task-checkbox w-5 h-5 text-indigo-600 rounded mr-3" data-task-id="${task.id}" />
                                    <div class="flex-1">
                                        <div class="flex items-center space-x-2">
                                            <p class="font-semibold text-gray-800">${task.title}</p>
                                            <span class="px-2 py-0.5 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}">
                                                ${task.priority}
                                            </span>
                                        </div>
                                        ${task.description ? `<p class="text-sm text-gray-600 mt-1">${task.description}</p>` : ''}
                                    </div>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        });
        
        taskList.innerHTML = html || '<p class="text-gray-500">No tasks available.</p>';
        modal.classList.remove('hidden');
        
    } catch (error) {
        console.error('Error showing task selector:', error);
        alert('Failed to load tasks');
    }
}

function closeTaskSelectorModal() {
    document.getElementById('task-selector-modal').classList.add('hidden');
}

async function addSelectedTasks() {
    const checkboxes = document.querySelectorAll('.task-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Please select at least one task');
        return;
    }
    
    try {
        for (const checkbox of checkboxes) {
            const taskId = checkbox.getAttribute('data-task-id');
            await axios.post(`/api/daily/${currentDate}/tasks/${taskId}`);
        }
        
        closeTaskSelectorModal();
        loadDailyData(currentDate);
        
    } catch (error) {
        console.error('Error adding tasks:', error);
        alert('Failed to add some tasks');
    }
}

function renderSchedule(events) {
    const container = document.getElementById('schedule-list');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No events scheduled for today.</p>';
        return;
    }
    
    container.innerHTML = events.map(event => {
        const startTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="p-4 border-l-4 border-gray-400 dark:border-gray-500 bg-gray-50 dark:bg-gray-750 rounded-lg">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="font-medium text-gray-900 dark:text-gray-100">${event.title}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${startTime} - ${endTime}</p>
                        ${event.location ? `<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${event.location}</p>` : ''}
                        ${event.description ? `<p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${event.description}</p>` : ''}
                    </div>
                    <div class="flex gap-2 ml-4">
                        <button onclick="editScheduleEvent(${event.id})" class="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 text-sm">
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
    
    loadGoals(type);
}

async function loadGoals(type) {
    try {
        const response = await axios.get(`/api/goals?type=${type}`);
        const goals = response.data;
        
        renderGoals(goals);
    } catch (error) {
        console.error('Error loading goals:', error);
        alert('Failed to load goals');
    }
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
                    <div class="space-y-4">
                        ${cat.goals.map(goal => `
                            <div class="card border-l-4 border-${cat.color}-500 rounded-lg p-6 bg-white">
                                <div class="flex items-start justify-between mb-4">
                                    <div class="flex-1">
                                        <h4 class="text-lg font-bold text-gray-800 mb-2">${goal.title}</h4>
                                        ${goal.description ? `<p class="text-gray-600 mb-3 text-sm">${goal.description}</p>` : ''}
                                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                                            ${goal.year ? `<span><i class="fas fa-calendar mr-1"></i>${goal.year}</span>` : ''}
                                            ${goal.quarter ? `<span><i class="fas fa-chart-pie mr-1"></i>Q${goal.quarter}</span>` : ''}
                                            ${goal.week_number ? `<span><i class="fas fa-calendar-week mr-1"></i>Week ${goal.week_number}</span>` : ''}
                                        </div>
                                    </div>
                                    <span class="px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(goal.status)}">
                                        ${goal.status}
                                    </span>
                                </div>
                                
                                <!-- Progress bar -->
                                <div class="mb-4">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-xs text-gray-600">Progress</span>
                                        <span class="text-xs font-semibold text-gray-700">${goal.progress}%</span>
                                    </div>
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-${cat.color}-600 h-2 rounded-full" style="width: ${goal.progress}%"></div>
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <button onclick="viewGoalDetails(${goal.id})" class="text-${cat.color}-600 hover:text-${cat.color}-800 text-sm">
                                        <i class="fas fa-eye mr-1"></i> View Details
                                    </button>
                                    <div class="space-x-2">
                                        <button onclick="editGoal(${goal.id})" class="text-blue-600 hover:text-blue-800">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button onclick="deleteGoal(${goal.id})" class="text-red-600 hover:text-red-800">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });
    
    container.innerHTML = html || '<p class="text-gray-500">No goals yet. Click "Add New Goal" to create one.</p>';
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
        const categoryNames = ['spiritual', 'financial', 'health', 'family', 'learning', 'other'];
        const currentCategoryIndex = categoryNames.indexOf(goal.category) + 1;
        const categoryChoice = prompt(`Category:\n1. Spiritual/Faith\n2. Financial/Career\n3. Health/Fitness\n4. Family/Friends\n5. Learning\n6. Other\n\nEnter number (1-6):`, currentCategoryIndex);
        const category = categoryNames[parseInt(categoryChoice) - 1] || goal.category;
        
        const progress = prompt('Progress (0-100):', goal.progress);
        const status = prompt('Status (active/completed/archived):', goal.status);
        
        await axios.put(`/api/goals/${id}`, {
            title,
            description,
            category,
            status,
            progress: parseInt(progress),
            completed_at: status === 'completed' ? new Date().toISOString() : null
        });
        
        loadGoals(currentGoalType);
        alert('Goal updated successfully!');
    } catch (error) {
        console.error('Error editing goal:', error);
        alert('Failed to edit goal');
    }
}

async function deleteGoal(id) {
    if (!confirm('Are you sure you want to delete this goal?')) return;
    
    try {
        await axios.delete(`/api/goals/${id}`);
        loadGoals(currentGoalType);
        alert('Goal deleted successfully!');
    } catch (error) {
        console.error('Error deleting goal:', error);
        alert('Failed to delete goal');
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
        } else {
            // Clear form for new entry
            document.getElementById('weekly-evaluation').value = '';
            document.getElementById('weekly-achievements').value = '';
            document.getElementById('weekly-challenges').value = '';
            document.getElementById('weekly-next-plan').value = '';
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
        next_week_plan: document.getElementById('weekly-next-plan').value
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
    
    const startTimeStr = prompt('Start Time (YYYY-MM-DD HH:MM):', `${currentDate} 09:00`);
    if (!startTimeStr) return;
    
    const endTimeStr = prompt('End Time (YYYY-MM-DD HH:MM):', `${currentDate} 10:00`);
    if (!endTimeStr) return;
    
    try {
        const startTime = new Date(startTimeStr).toISOString();
        const endTime = new Date(endTimeStr).toISOString();
        
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
        accessToken = prompt(
            'Enter your Google Calendar Access Token:\n\n' +
            'To get your access token:\n' +
            '1. Go to https://developers.google.com/oauthplayground/\n' +
            '2. Select "Google Calendar API v3"\n' +
            '3. Select "https://www.googleapis.com/auth/calendar.readonly"\n' +
            '4. Click "Authorize APIs"\n' +
            '5. Click "Exchange authorization code for tokens"\n' +
            '6. Copy the "Access token" value\n\n' +
            'Paste your access token here:'
        );
        
        if (!accessToken) {
            alert('Access token is required to sync Google Calendar');
            return;
        }
        
        // Save token for future use
        saveGoogleAccessToken(accessToken);
    }
    
    try {
        // Sync events for next 7 days
        const startDate = new Date().toISOString();
        const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
        
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
        if (error.response && error.response.data) {
            // Token might be expired, clear it
            if (error.response.status === 401 || error.response.data.error?.includes('Failed to fetch')) {
                localStorage.removeItem('google_calendar_token');
                alert('Access token expired or invalid. Please try again with a new token.');
            } else {
                alert(`Failed to sync calendar: ${error.response.data.error || error.response.data.details || 'Unknown error'}`);
            }
        } else {
            alert('Failed to sync calendar. Please check your access token.');
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
        
        const startDate = new Date(event.start_time);
        const endDate = new Date(event.end_time);
        const startTimeStr = prompt('Start Time (YYYY-MM-DD HH:MM):', 
            `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')} ${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`);
        if (!startTimeStr) return;
        
        const endTimeStr = prompt('End Time (YYYY-MM-DD HH:MM):', 
            `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')} ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`);
        if (!endTimeStr) return;
        
        const startTime = new Date(startTimeStr).toISOString();
        const endTime = new Date(endTimeStr).toISOString();
        
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
        goalData.year = new Date().getFullYear();
    }
    
    if (currentGoalType === 'quarterly') {
        goalData.quarter = Math.ceil((new Date().getMonth() + 1) / 3);
    }
    
    if (currentGoalType === 'weekly') {
        goalData.week_number = getWeekNumber(new Date());
    }
    
    try {
        await axios.post('/api/goals', goalData);
        closeCreateGoalModal();
        loadGoals(currentGoalType);
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
    
    container.innerHTML = todayHabits.map(habit => {
        const isCompleted = habit.completed;
        const categoryBadge = getCategoryBadgeColor(habit.category);
        
        return `
            <div class="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition ${isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}">
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
                <button onclick="deleteHabit(${habit.id})" class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 text-sm">
                    Delete
                </button>
            </div>
        `;
    }).join('');
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

