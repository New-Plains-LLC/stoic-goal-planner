// Global state
let currentGoalType = 'long_term';
let currentDate = new Date().toISOString().split('T')[0];

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
        
    } catch (error) {
        console.error('Error loading daily data:', error);
        alert('Failed to load daily data');
    }
}

async function loadStoicQuote(date) {
    try {
        const response = await axios.get('/api/quote/daily');
        const quote = response.data;
        
        document.getElementById('stoic-quote').textContent = quote.quote;
        document.getElementById('stoic-author').textContent = `— ${quote.author}`;
        document.getElementById('stoic-meaning').textContent = quote.meaning;
        
        // Save quote to daily entry
        await axios.put(`/api/daily/${date}`, {
            stoic_quote: quote.quote,
            stoic_quote_meaning: quote.meaning
        });
    } catch (error) {
        console.error('Error loading stoic quote:', error);
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
    const container = document.getElementById('daily-tasks-list');
    
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No tasks selected for today. Click "Add Task" to get started.</p>';
        return;
    }
    
    container.innerHTML = tasks.map(task => `
        <div class="flex items-center justify-between p-4 border rounded-lg ${task.completed ? 'bg-green-50' : 'bg-white'}">
            <div class="flex items-center space-x-3">
                <input type="checkbox" 
                       ${task.completed ? 'checked' : ''}
                       onchange="toggleTaskComplete(${task.id}, this.checked)"
                       class="w-5 h-5 text-indigo-600 rounded">
                <div>
                    <p class="font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}">${task.title}</p>
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
    `).join('');
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
            alert('No pending tasks available. Create some tasks from the Goals page first!');
            return;
        }
        
        const taskOptions = tasks.map(task => 
            `<option value="${task.id}">${task.title} (${task.priority})</option>`
        ).join('');
        
        const taskId = prompt(`Select a task to add to today:\n\n${tasks.map((t, i) => `${i+1}. ${t.title}`).join('\n')}\n\nEnter task number:`);
        
        if (taskId) {
            const selectedTask = tasks[parseInt(taskId) - 1];
            if (selectedTask) {
                await axios.post(`/api/daily/${currentDate}/tasks/${selectedTask.id}`);
                loadDailyData(currentDate);
            }
        }
    } catch (error) {
        console.error('Error showing task selector:', error);
        alert('Failed to load tasks');
    }
}

function renderSchedule(events) {
    const container = document.getElementById('schedule-list');
    
    if (!events || events.length === 0) {
        container.innerHTML = '<p class="text-gray-500">No events scheduled for today.</p>';
        return;
    }
    
    container.innerHTML = events.map(event => {
        const startTime = new Date(event.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const endTime = new Date(event.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        return `
            <div class="p-4 border-l-4 border-orange-500 bg-white rounded">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="font-semibold text-gray-800">${event.title}</p>
                        <p class="text-sm text-gray-600">${startTime} - ${endTime}</p>
                        ${event.location ? `<p class="text-sm text-gray-500"><i class="fas fa-map-marker-alt mr-1"></i>${event.location}</p>` : ''}
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
        tab.classList.remove('border-indigo-600', 'text-indigo-600');
        tab.classList.add('text-gray-600');
    });
    
    event.target.classList.remove('text-gray-600');
    event.target.classList.add('border-indigo-600', 'text-indigo-600');
    
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
    
    container.innerHTML = goals.map(goal => `
        <div class="card border rounded-lg p-6 bg-white">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${goal.title}</h3>
                    ${goal.description ? `<p class="text-gray-600 mb-3">${goal.description}</p>` : ''}
                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                        ${goal.year ? `<span><i class="fas fa-calendar mr-1"></i>${goal.year}</span>` : ''}
                        ${goal.quarter ? `<span><i class="fas fa-chart-pie mr-1"></i>Q${goal.quarter}</span>` : ''}
                        ${goal.week_number ? `<span><i class="fas fa-calendar-week mr-1"></i>Week ${goal.week_number}</span>` : ''}
                    </div>
                </div>
                <span class="px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(goal.status)}">
                    ${goal.status}
                </span>
            </div>
            
            <!-- Progress bar -->
            <div class="mb-4">
                <div class="flex items-center justify-between mb-1">
                    <span class="text-sm text-gray-600">Progress</span>
                    <span class="text-sm font-semibold text-gray-700">${goal.progress}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                    <div class="bg-indigo-600 h-2 rounded-full" style="width: ${goal.progress}%"></div>
                </div>
            </div>
            
            <div class="flex items-center justify-between">
                <button onclick="viewGoalDetails(${goal.id})" class="text-indigo-600 hover:text-indigo-800">
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
    `).join('');
}

function getStatusColor(status) {
    switch(status) {
        case 'active': return 'bg-blue-100 text-blue-800';
        case 'completed': return 'bg-green-100 text-green-800';
        case 'archived': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

async function showAddGoalModal() {
    const title = prompt('Goal Title:');
    if (!title) return;
    
    const description = prompt('Description (optional):');
    
    const goalData = {
        title,
        description,
        goal_type: currentGoalType
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
        loadGoals(currentGoalType);
        alert('Goal created successfully!');
    } catch (error) {
        console.error('Error creating goal:', error);
        alert('Failed to create goal');
    }
}

async function editGoal(id) {
    try {
        const response = await axios.get(`/api/goals/${id}`);
        const goal = response.data;
        
        const title = prompt('Goal Title:', goal.title);
        if (!title) return;
        
        const description = prompt('Description:', goal.description || '');
        const progress = prompt('Progress (0-100):', goal.progress);
        const status = prompt('Status (active/completed/archived):', goal.status);
        
        await axios.put(`/api/goals/${id}`, {
            title,
            description,
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
