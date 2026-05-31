import stateService from '../services/stateService.js';
import { habitEngine } from '../services/habitEngine.js';
import { analyticsEngine } from '../services/analyticsEngine.js';
import { gamificationEngine } from '../services/gamificationEngine.js';
import { effectsEngine } from '../services/effectsEngine.js';
import { insightsEngine } from '../services/insightsEngine.js';
import { soundEngine } from '../services/soundEngine.js';
import { icons } from '../assets/icons.js';

export async function renderDashboard() {
  const container = document.getElementById('page-container');
  const user = stateService.get('user');
  const analytics = stateService.get('analytics');
  
  const disciplineScore = analyticsEngine.calculateDisciplineScore();
  const productivityScore = analyticsEngine.calculateProductivityScore();
  const weeklyData = analyticsEngine.getWeeklyData();
  const habitStats = habitEngine.getCompletionStats();
  const levelProgress = gamificationEngine.getProgressToNextLevel();
  const momentum = analyticsEngine.calculateMomentum();
  const streakMilestone = insightsEngine.getStreakMilestone(user?.streak || 0);

  const today = new Date().toISOString().split('T')[0];
  const todayLogs = stateService.get('dailyLogs').filter(l => l.date === today && l.completed);
  const xpToday = todayLogs.reduce((sum, log) => {
    const habit = stateService.get('habits').find(h => h.id === log.habit_id);
    return sum + (habit?.reward_xp || 0);
  }, 0);

  const last7Days = analyticsEngine.getWeeklyData();
  const sparkline = last7Days.map(d => d.percentage).join(',');

  container.innerHTML = `
    <div class="dashboard-page">
      <header class="command-header" data-animate="fade-in-up">
        <div class="greeting">
          <h1>Welcome back, <span class="text-gradient">${user?.username || 'Commander'}</span></h1>
          <p class="text-secondary">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
        <div class="header-actions">
          <div class="level-badge rank-${getRankClass(user?.level || 1)}">
            <span>LVL ${user?.level || 1}</span>
            <span class="rank-name">${levelProgress?.currentRank || 'Rookie'}</span>
          </div>
        </div>
      </header>

      <section class="stats-grid" data-animate="fade-in-up" data-animate-delay="1">
        ${renderStatCard('Focus Today', `${analytics?.deep_work_today || 0}h`, 'clock', 'primary', analytics?.deep_work_today ? 'tracked today' : 'start a session')}
        ${renderStatCard('Discipline Score', `${disciplineScore}`, 'target', disciplineScore >= 80 ? 'success' : disciplineScore >= 50 ? 'warning' : 'danger')}
        ${renderStatCard('Current Streak', `${user?.streak || 0}`, 'flame', 'warning', streakMilestone ? `${streakMilestone.remaining} to ${streakMilestone.next}` : 'max streak')}
        ${renderStatCard('Total XP', `${user?.xp || 0}`, 'zap', 'primary', `Today: +${xpToday}`)}
        ${renderStatCard('Habits Today', `${habitStats.completed}/${habitStats.total}`, 'check-circle', 'success')}
        ${renderStatCard('Momentum', momentum.label, momentum.icon || 'trending-up', momentum.color)}
      </section>

      <section class="level-progress-section" data-animate="fade-in-up" data-animate-delay="2">
        <div class="card">
          <div class="level-header">
            <div class="level-info">
              <span class="level-number">Level ${user?.level || 1}</span>
              <span class="level-rank">${levelProgress?.currentRank}</span>
            </div>
            <span class="xp-text">${levelProgress?.currentXP || 0} / ${levelProgress?.xpRequired || 100} XP</span>
          </div>
          <div class="progress-bar" style="height: 12px;">
            <div class="progress-bar-fill" style="width: ${levelProgress?.progress || 0}%"></div>
          </div>
          <div class="level-footer">
            <span class="next-rank-text">Next: ${levelProgress?.nextRank} (Level ${levelProgress?.nextRankLevel})</span>
          </div>
        </div>
      </section>

      <section class="insights-section" data-animate="fade-in-up" data-animate-delay="3">
        <h2 class="section-title">${icons.lightbulb} Smart Insights</h2>
        <div class="insights-grid stagger-children" id="insights-container">
          ${renderInsights()}
        </div>
      </section>

      <section class="main-grid" data-animate="fade-in-up" data-animate-delay="4">
        <div class="habits-section">
          <div class="section-header">
            <h2 class="section-title">${icons.list} Today's Habits</h2>
            <div class="habit-stats">
              <span class="completion-badge ${habitStats.percentage >= 80 ? 'success' : habitStats.percentage >= 50 ? 'warning' : 'danger'}">
                ${habitStats.percentage}% Complete
              </span>
            </div>
          </div>
          <div class="habits-list stagger-children" id="habits-list">
            ${renderHabitsList()}
          </div>
        </div>

        <div class="sidebar-widgets">
          <div class="widget-card">
            <h3 class="widget-title">${icons.activity} Weekly Progress</h3>
            <div class="mini-chart" id="weekly-chart">
              ${renderWeeklyChart(weeklyData)}
            </div>
            <div class="sparkline-container" style="margin-top:12px">
              <div class="sparkline">
                ${last7Days.map((d, i) => `
                  <div class="sparkline-bar" style="height:${Math.max(d.percentage, 4)}%;opacity:${0.4 + (i / last7Days.length) * 0.6}" title="${d.label}: ${d.percentage}%"></div>
                `).join('')}
              </div>
            </div>
          </div>

          <div class="widget-card">
            <h3 class="widget-title">${icons.target} Quick Stats</h3>
            <div class="quick-stats">
              <div class="quick-stat">
                <span class="stat-label">Productivity Score</span>
                <span class="stat-value">${productivityScore}</span>
              </div>
              <div class="quick-stat">
                <span class="stat-label">Weekly Consistency</span>
                <span class="stat-value">${analyticsEngine.calculateWeeklyConsistency()}%</span>
              </div>
              <div class="quick-stat">
                <span class="stat-label">Total Focus Hours</span>
                <span class="stat-value">${user?.total_focus_hours?.toFixed(1) || 0}h</span>
              </div>
            </div>
          </div>

          <div class="widget-card">
            <h3 class="widget-title">${icons.zap} Quick Actions</h3>
            <div class="quick-actions">
              <button class="btn btn-primary w-full" onclick="navigateTo('focus')">
                ${icons.play} Start Focus Session
              </button>
              <button class="btn btn-secondary w-full" onclick="navigateTo('habits')">
                ${icons.plus} Add New Habit
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;

  attachDashboardListeners();
}

function renderStatCard(label, value, icon, color = 'primary', subtext = '') {
  const iconSvg = icons[icon] || icons.chart;
  const colorClass = `stat-${color}`;
  
  return `
    <div class="stat-card ${colorClass}">
      <div class="stat-card-icon" style="color: var(--accent-${color})">
        ${iconSvg}
      </div>
      <div class="stat-card-content">
        <div class="stat-card-value">${value}</div>
        <div class="stat-card-label">${label}</div>
        ${subtext ? `<div class="stat-card-trend up">${subtext}</div>` : ''}
      </div>
    </div>
  `;
}

function renderHabitsList() {
  const habits = habitEngine.getTodayHabits();
  
  if (habits.length === 0) {
    return `
      <div class="empty-state">
        ${icons.inbox}
        <h3>No habits yet</h3>
        <p>Create your first habit to start tracking</p>
        <button class="btn btn-primary mt-4" onclick="openCreateHabitModal()">
          ${icons.plus} Create Habit
        </button>
      </div>
    `;
  }

  return habits.map(habit => {
    const categoryInfo = habitEngine.getCategoryInfo(habit.category);
    const streakDisplay = habit.streak > 0 ? `${habit.streak}🔥` : '';
    
    return `
      <div class="habit-item ${habit.completed ? 'completed' : ''}" data-habit-id="${habit.id}">
        <div class="habit-checkbox ${habit.completed ? 'checked' : ''}" onclick="toggleHabit('${habit.id}')">
          ${habit.completed ? icons.check : ''}
        </div>
        <div class="habit-content">
          <div class="habit-title">${habit.title}</div>
          <div class="habit-meta">
            <span class="habit-category" style="background: ${categoryInfo.color}20; color: ${categoryInfo.color}">
              ${categoryInfo.label}
            </span>
            <span>${habit.reward_xp} XP</span>
          </div>
        </div>
        ${streakDisplay ? `<div class="habit-streak">${streakDisplay}</div>` : ''}
        ${renderDifficultyStars(habit.difficulty)}
      </div>
    `;
  }).join('');
}

function renderDifficultyStars(difficulty) {
  let stars = '';
  for (let i = 1; i <= 5; i++) {
    stars += i <= difficulty ? '★' : '☆';
  }
  return `<div class="difficulty-stars" style="color: var(--accent-warning); font-size: 12px;">${stars}</div>`;
}

function renderWeeklyChart(data) {
  const maxVal = Math.max(...data.map(d => d.percentage), 1);
  const barHeight = 100;
  
  return `
    <div class="weekly-chart">
      ${data.map((day, i) => {
        const height = (day.percentage / maxVal) * barHeight;
        const isToday = i === data.length - 1;
        return `
          <div class="chart-bar-container">
            <div class="chart-bar-wrapper">
              <div class="chart-bar ${isToday ? 'today' : ''}" 
                   style="height: ${Math.max(height, 4)}px; 
                          opacity: ${day.percentage === 0 ? 0.3 : 1}">
              </div>
            </div>
            <span class="chart-label ${isToday ? 'today' : ''}">${day.label}</span>
            <span class="chart-value">${day.percentage}%</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getRankClass(level) {
  if (level >= 50) return 'apex';
  if (level >= 35) return 'titan';
  if (level >= 20) return 'beast';
  if (level >= 10) return 'commander';
  if (level >= 5) return 'operator';
  return 'rookie';
}

function renderInsights() {
  const insights = insightsEngine.generateInsights();
  return insights.map(insight => `
    <div class="insight-card ${insight.type}">
      <span class="insight-icon">${insight.icon}</span>
      <span class="insight-text">${insight.message}</span>
    </div>
  `).join('');
}

function attachDashboardListeners() {
  stateService.subscribe('dailyLogs', () => {
    const habitsList = document.getElementById('habits-list');
    if (habitsList) {
      habitsList.innerHTML = renderHabitsList();
    }
  });
}

export async function toggleHabit(habitId) {
  const habitsList = document.getElementById('habits-list');
  const habitEl = habitsList?.querySelector(`[data-habit-id="${habitId}"]`);
  
  const habits = habitEngine.getTodayHabits();
  const habit = habits.find(h => h.id === habitId);
  
  if (!habit) return;
  
  if (habit.completed) {
    await habitEngine.uncompleteHabit(habitId);
  } else {
    const result = await habitEngine.completeHabit(habitId);
    if (result.success) {
      showToast(`+${result.xpEarned} XP earned!`, 'success', 'Habit Complete');
      soundEngine.habitComplete();
      effectsEngine.showXPBurst(result.xpEarned, habitEl);
      effectsEngine.showParticles(
        (habitEl?.getBoundingClientRect()?.left || window.innerWidth / 2) + 30,
        (habitEl?.getBoundingClientRect()?.top || window.innerHeight / 2)
      );
      if (habitEl) {
        habitEl.classList.add('habit-complete-effect');
      }
      const milestone = insightsEngine.getStreakMilestone(result.streak);
      if (milestone && milestone.remaining === 1) {
        showToast(`1 more day to a ${milestone.next}-day streak! 🔥`, 'warning', 'Streak Alert');
        soundEngine.notification();
      }
    }
  }
  
  renderDashboard();
}

window.toggleHabit = toggleHabit;

export default renderDashboard;