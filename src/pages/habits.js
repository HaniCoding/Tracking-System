import stateService from '../services/stateService.js';
import { habitEngine, CATEGORIES } from '../services/habitEngine.js';
import { icons } from '../assets/icons.js';
import { showConfirm } from '../utils/helpers.js';

export async function renderHabitsPage() {
  const container = document.getElementById('page-container');
  
  container.innerHTML = `
    <div class="habits-page">
      <header class="page-header">
        <h1>${icons.target} Habit Command Center</h1>
        <p>Master your habits, master your life</p>
      </header>

      <div class="habits-toolbar">
        <div class="filter-tabs">
          <button class="filter-tab active" data-filter="all">All</button>
          <button class="filter-tab" data-filter="health">Health</button>
          <button class="filter-tab" data-filter="fitness">Fitness</button>
          <button class="filter-tab" data-filter="learning">Learning</button>
          <button class="filter-tab" data-filter="mind">Mind</button>
        </div>
        <button class="btn btn-primary" onclick="openCreateHabitModal()">
          ${icons.plus} New Habit
        </button>
      </div>

      <div class="habits-grid stagger-children" id="habits-grid">
        ${renderHabitsGrid()}
      </div>

      <section class="suggestions-section" data-animate="fade-in">
        <h2 class="section-title">${icons.lightbulb} Suggestions</h2>
        <div class="suggestions-grid">
          ${renderSuggestions()}
        </div>
      </section>
    </div>
  `;

  attachHabitsListeners();
}

function renderHabitsGrid() {
  const habits = stateService.get('habits').filter(h => h.status === 'active');
  const todayHabits = habitEngine.getTodayHabits();
  
  if (habits.length === 0) {
    return `
      <div class="empty-state" style="grid-column: 1 / -1;">
        ${icons.target}
        <h3>No habits created yet</h3>
        <p>Start building your routine by creating your first habit</p>
        <button class="btn btn-primary mt-4" onclick="openCreateHabitModal()">
          ${icons.plus} Create Your First Habit
        </button>
      </div>
    `;
  }

  return habits.map(habit => {
    const todayData = todayHabits.find(t => t.id === habit.id);
    const categoryInfo = habitEngine.getCategoryInfo(habit.category);
    
    return `
      <div class="habit-card card-glow" data-habit-id="${habit.id}">
        <div class="habit-card-header">
          <div class="habit-category-badge" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color}">
            ${categoryInfo.label}
          </div>
          <div class="habit-difficulty">
            ${'★'.repeat(habit.difficulty)}${'☆'.repeat(5 - habit.difficulty)}
          </div>
        </div>
        
        <h3 class="habit-card-title">${habit.title}</h3>
        
        <div class="habit-card-stats">
          <div class="stat">
            <span class="stat-icon">🔥</span>
            <span class="stat-value">${habit.streak || 0}</span>
            <span class="stat-label">streak</span>
          </div>
          <div class="stat">
            <span class="stat-icon">⚡</span>
            <span class="stat-value">${habit.reward_xp}</span>
            <span class="stat-label">XP</span>
          </div>
          <div class="stat">
            <span class="stat-icon">🎯</span>
            <span class="stat-value">${habit.target}</span>
            <span class="stat-label">daily</span>
          </div>
        </div>

        <div class="habit-card-progress">
          <div class="progress-ring small">
            <svg width="60" height="60" viewBox="0 0 60 60">
              <circle class="progress-ring-bg" cx="30" cy="30" r="26" />
              <circle class="progress-ring-fill" cx="30" cy="30" r="26" 
                stroke-dasharray="${2 * Math.PI * 26}"
                stroke-dashoffset="${2 * Math.PI * 26 * (1 - (todayData?.completed ? 1 : 0))}"
                style="transform: rotate(-90deg); transform-origin: center;" />
            </svg>
            <div class="progress-ring-text">
              <span class="progress-ring-value" style="font-size: 14px;">
                ${todayData?.completed ? '✓' : '○'}
              </span>
            </div>
          </div>
          <span class="progress-label">
            ${todayData?.completed ? 'Completed' : 'Pending'}
          </span>
        </div>

        <div class="habit-card-actions">
          <button class="btn btn-sm ${todayData?.completed ? 'btn-secondary' : 'btn-success'}" 
                  onclick="toggleHabitFromPage('${habit.id}')">
            ${todayData?.completed ? icons.x : icons.check} 
            ${todayData?.completed ? 'Undo' : 'Complete'}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="editHabit('${habit.id}')">
            ${icons.edit}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="deleteHabit('${habit.id}')">
            ${icons.trash}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSuggestions() {
  const suggestions = habitEngine.getHabitSuggestions();
  
  if (suggestions.length === 0) {
    return `
      <div class="suggestion-card card">
        <div class="suggestion-icon">✨</div>
        <div class="suggestion-content">
          <h4>Great portfolio!</h4>
          <p>You've covered all essential habit categories.</p>
        </div>
      </div>
    `;
  }

  return suggestions.map(s => `
    <div class="suggestion-card card">
      <div class="suggestion-icon">💡</div>
      <div class="suggestion-content">
        <h4>Add ${CATEGORIES[s.category]?.label || s.category} habit</h4>
        <p>${s.message}</p>
        <button class="btn btn-sm btn-secondary mt-2" onclick="openCreateHabitModal('${s.category}')">
          ${icons.plus} Add Now
        </button>
      </div>
    </div>
  `).join('');
}

function attachHabitsListeners() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      filterHabits(e.target.dataset.filter);
    });
  });
}

function filterHabits(category) {
  const grid = document.getElementById('habits-grid');
  const habits = stateService.get('habits').filter(h => h.status === 'active');
  
  const filtered = category === 'all' 
    ? habits 
    : habits.filter(h => h.category === category);
  
  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <p>No habits in this category</p>
      </div>
    `;
    return;
  }
  
  // Re-render with filtered habits
  const todayHabits = habitEngine.getTodayHabits();
  grid.innerHTML = filtered.map(habit => {
    const todayData = todayHabits.find(t => t.id === habit.id);
    const categoryInfo = habitEngine.getCategoryInfo(habit.category);
    
    return `
      <div class="habit-card card-glow" data-habit-id="${habit.id}">
        <div class="habit-card-header">
          <div class="habit-category-badge" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color}">
            ${categoryInfo.label}
          </div>
        </div>
        <h3 class="habit-card-title">${habit.title}</h3>
        <div class="habit-card-stats">
          <div class="stat"><span class="stat-icon">🔥</span><span class="stat-value">${habit.streak || 0}</span></div>
          <div class="stat"><span class="stat-icon">⚡</span><span class="stat-value">${habit.reward_xp}</span></div>
        </div>
        <div class="habit-card-actions">
          <button class="btn btn-sm ${todayData?.completed ? 'btn-secondary' : 'btn-success'}" 
                  onclick="toggleHabitFromPage('${habit.id}')">
            ${todayData?.completed ? 'Undo' : 'Complete'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

export async function toggleHabitFromPage(habitId) {
  const todayHabits = habitEngine.getTodayHabits();
  const habit = todayHabits.find(h => h.id === habitId);
  
  if (habit?.completed) {
    await habitEngine.uncompleteHabit(habitId);
  } else {
    const result = await habitEngine.completeHabit(habitId);
    if (result.success) {
      showToast(`+${result.xpEarned} XP earned!`, 'success');
    }
  }
  
  renderHabitsPage();
}

export function openCreateHabitModal(defaultCategory = 'health') {
  const modalRoot = document.getElementById('modal-root');
  
  modalRoot.innerHTML = `
    <div class="modal-overlay active" id="create-habit-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${icons.plus} Create New Habit</h3>
          <button class="btn btn-icon btn-ghost" onclick="closeModal()">${icons.x}</button>
        </div>
        <div class="modal-body">
          <form id="create-habit-form">
            <div class="form-group">
              <label class="form-label">Habit Title</label>
              <input type="text" class="form-input" name="title" placeholder="e.g., Morning Meditation" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" name="category" id="category-select">
                ${Object.entries(CATEGORIES).map(([key, val]) => 
                  `<option value="${key}" ${key === defaultCategory ? 'selected' : ''}>${val.label}</option>`
                ).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Difficulty (1-5)</label>
              <div class="difficulty-selector">
                ${[1,2,3,4,5].map(n => `
                  <button type="button" class="difficulty-btn ${n === 3 ? 'active' : ''}" data-difficulty="${n}">
                    ${'★'.repeat(n)}${'☆'.repeat(5-n)}
                  </button>
                `).join('')}
              </div>
              <input type="hidden" name="difficulty" value="3">
            </div>
            
            <div class="form-group">
              <label class="form-label">Daily Target</label>
              <input type="number" class="form-input" name="target" value="1" min="1" max="10">
            </div>
            
            <div class="form-group">
              <label class="form-label">Frequency</label>
              <select class="form-input" name="frequency">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitCreateHabit()">${icons.check} Create Habit</button>
        </div>
      </div>
    </div>
  `;

  document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      document.querySelector('input[name="difficulty"]').value = e.target.dataset.difficulty;
    });
  });
}

export async function submitCreateHabit() {
  const form = document.getElementById('create-habit-form');
  const formData = new FormData(form);
  
  const habitData = {
    title: formData.get('title'),
    category: formData.get('category'),
    difficulty: parseInt(formData.get('difficulty')),
    target: parseInt(formData.get('target')),
    frequency: formData.get('frequency'),
  };
  
  try {
    await habitEngine.createHabit(habitData);
    closeModal();
    showToast('Habit created successfully!', 'success');
    renderHabitsPage();
  } catch (error) {
    showToast('Failed to create habit', 'error');
  }
}

export async function deleteHabit(habitId) {
  const confirmed = await showConfirm('Delete Habit', 'Are you sure you want to delete this habit?');
  if (confirmed) {
    await habitEngine.deleteHabit(habitId);
    showToast('Habit deleted', 'success');
    renderHabitsPage();
  }
}

export async function editHabit(habitId) {
  const habits = stateService.get('habits');
  const habit = habits.find(h => h.id === habitId);
  if (!habit) return;

  const modalRoot = document.getElementById('modal-root');
  modalRoot.innerHTML = `
    <div class="modal-overlay active" id="edit-habit-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">Edit Habit</h3>
          <button class="btn btn-icon btn-ghost" onclick="closeModal()">✕</button>
        </div>
        <div class="modal-body">
          <form id="edit-habit-form">
            <div class="form-group">
              <label class="form-label">Habit Title</label>
              <input type="text" class="form-input" name="title" value="${habit.title}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select class="form-input" name="category">
                ${Object.entries(CATEGORIES).map(([key, val]) => 
                  `<option value="${key}" ${key === habit.category ? 'selected' : ''}>${val.label}</option>`
                ).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Difficulty (1-5)</label>
              <input type="number" class="form-input" name="difficulty" value="${habit.difficulty}" min="1" max="5">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitEditHabit('${habitId}')">Save Changes</button>
        </div>
      </div>
    </div>
  `;
}

export async function submitEditHabit(habitId) {
  const form = document.getElementById('edit-habit-form');
  const formData = new FormData(form);
  
  await habitEngine.updateHabit(habitId, {
    title: formData.get('title'),
    category: formData.get('category'),
    difficulty: parseInt(formData.get('difficulty')),
  });
  
  closeModal();
  showToast('Habit updated!', 'success');
  renderHabitsPage();
}

export function closeModal() {
  const modals = document.querySelectorAll('.modal-overlay');
  modals.forEach(m => m.remove());
}

window.openCreateHabitModal = openCreateHabitModal;
window.closeModal = closeModal;
window.submitCreateHabit = submitCreateHabit;
window.submitEditHabit = submitEditHabit;
window.toggleHabitFromPage = toggleHabitFromPage;
window.deleteHabit = deleteHabit;
window.editHabit = editHabit;

export default renderHabitsPage;