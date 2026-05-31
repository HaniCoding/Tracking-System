import stateService from '../services/stateService.js';
import { gamificationEngine } from '../services/gamificationEngine.js';
import { soundEngine } from '../services/soundEngine.js';
import { effectsEngine } from '../services/effectsEngine.js';
import { icons } from '../assets/icons.js';

let timerInterval = null;
let timerState = {
  isRunning: false,
  isPaused: false,
  seconds: 25 * 60,
  totalSeconds: 25 * 60,
  sessionType: 'deep_work',
  distractions: 0,
  sessionStart: null,
};

const SESSION_TYPES = [
  { id: 'deep_work', label: 'Deep Work', icon: 'brain', color: '#6366f1' },
  { id: 'creative', label: 'Creative', icon: 'lightbulb', color: '#f59e0b' },
  { id: 'learning', label: 'Learning', icon: 'book-open', color: '#06b6d4' },
  { id: 'admin', label: 'Admin', icon: 'clipboard', color: '#8b5cf6' },
];

export async function renderFocusPage() {
  const container = document.getElementById('page-container');
  
  container.innerHTML = `
    <div class="focus-page">
      <header class="page-header">
        <h1>${icons.clock} Deep Work Session</h1>
        <p>Enter your focused state</p>
      </header>

      <div class="focus-container">
        <div class="timer-card card-glow">
          <div class="session-type-selector">
            ${SESSION_TYPES.map(type => `
              <button class="session-type-btn ${timerState.sessionType === type.id ? 'active' : ''}"
                      data-type="${type.id}"
                      style="--type-color: ${type.color}">
                ${icons[type.icon]} ${type.label}
              </button>
            `).join('')}
          </div>

          <div class="timer-display-large">
            <svg class="timer-ring" viewBox="0 0 200 200">
              <circle class="timer-ring-bg" cx="100" cy="100" r="90" />
              <circle class="timer-ring-progress" cx="100" cy="100" r="90" 
                stroke="var(--accent-primary)"
                stroke-dasharray="${2 * Math.PI * 90}"
                stroke-dashoffset="0" />
            </svg>
            <div class="timer-text" id="timer-display">
              ${formatTime(timerState.seconds)}
            </div>
          </div>

          <div class="timer-controls">
            ${timerState.isRunning && !timerState.isPaused ? `
              <button class="btn btn-secondary btn-lg" onclick="pauseTimer()">
                ${icons.pause} Pause
              </button>
              <button class="btn btn-danger btn-lg" onclick="stopTimer()">
                ${icons.square} Stop
              </button>
            ` : timerState.isPaused ? `
              <button class="btn btn-primary btn-lg" onclick="resumeTimer()">
                ${icons.play} Resume
              </button>
              <button class="btn btn-danger btn-lg" onclick="stopTimer()">
                ${icons.square} Stop
              </button>
            ` : `
              <button class="btn btn-primary btn-lg" onclick="startTimer()">
                ${icons.play} Start Focus
              </button>
            `}
          </div>

          <div class="timer-presets">
            <button class="preset-btn ${timerState.totalSeconds === 25 * 60 ? 'active' : ''}" 
                    onclick="setTimerPreset(25)">25 min</button>
            <button class="preset-btn ${timerState.totalSeconds === 50 * 60 ? 'active' : ''}"
                    onclick="setTimerPreset(50)">50 min</button>
            <button class="preset-btn ${timerState.totalSeconds === 90 * 60 ? 'active' : ''}"
                    onclick="setTimerPreset(90)">90 min</button>
          </div>
          <button class="btn btn-sm btn-ghost mt-4" onclick="toggleFocusMode()">
            ${icons.maximize} ${document.body.classList.contains('focus-mode-active') ? 'Exit' : 'Enter'} Focus Mode
          </button>
        </div>

        <div class="focus-sidebar">
          <div class="distraction-counter card">
            <h3>${icons.alertCircle} Distraction Counter</h3>
            <div class="distraction-display">
              <span class="distraction-number" id="distraction-count">${timerState.distractions}</span>
              <span class="distraction-label">distractions</span>
            </div>
            <button class="btn btn-secondary w-full mt-4" onclick="incrementDistraction()">
              ${icons.plus} Log Distraction
            </button>
          </div>

          <div class="focus-stats card">
            <h3>${icons.barChart} Session Stats</h3>
            <div class="stat-row">
              <span>Type</span>
              <span id="session-type-display">${SESSION_TYPES.find(t => t.id === timerState.sessionType)?.label}</span>
            </div>
            <div class="stat-row">
              <span>Goal</span>
              <span>${Math.floor(timerState.totalSeconds / 60)} minutes</span>
            </div>
            <div class="stat-row">
              <span>Focus Score</span>
              <span id="focus-score-display">--</span>
            </div>
          </div>

          <div class="focus-history card">
            <h3>${icons.history} Recent Sessions</h3>
            <div class="history-list" id="session-history">
              ${renderSessionHistory()}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  attachFocusListeners();
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function renderSessionHistory() {
  const focusSessions = stateService.get('focusSessions') || [];
  
  if (focusSessions.length === 0) {
    return '<p class="text-muted">No sessions yet today</p>';
  }

  return focusSessions.slice(0, 5).map(session => `
    <div class="history-item">
      <div class="history-type">${session.type}</div>
      <div class="history-duration">${Math.floor(session.duration / 60)}m</div>
    </div>
  `).join('');
}

function attachFocusListeners() {
  document.querySelectorAll('.session-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (timerState.isRunning) return;
      document.querySelectorAll('.session-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      timerState.sessionType = btn.dataset.type;
      renderFocusPage();
    });
  });
}

export function startTimer() {
  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.sessionStart = Date.now();
  timerState.distractions = 0;
  
  updateTimerDisplay();
  
  timerInterval = setInterval(() => {
    if (timerState.seconds > 0) {
      timerState.seconds--;
      updateTimerDisplay();
    } else {
      completeSession();
    }
  }, 1000);
  
  renderFocusPage();
}

export function pauseTimer() {
  timerState.isPaused = true;
  clearInterval(timerInterval);
  renderFocusPage();
}

export function resumeTimer() {
  timerState.isPaused = false;
  timerInterval = setInterval(() => {
    if (timerState.seconds > 0) {
      timerState.seconds--;
      updateTimerDisplay();
    } else {
      completeSession();
    }
  }, 1000);
  renderFocusPage();
}

export function stopTimer() {
  clearInterval(timerInterval);
  document.title = 'NEXUS | Life Command Center';
  
  if (timerState.sessionStart) {
    const elapsed = timerState.totalSeconds - timerState.seconds;
    if (elapsed > 60) {
      logSession(elapsed);
      soundEngine.notification();
      showToast(`Session logged: ${Math.floor(elapsed / 60)} min`, 'info', 'Session Saved');
    }
  }
  
  resetTimer();
  renderFocusPage();
}

function completeSession() {
  clearInterval(timerInterval);
  document.title = 'NEXUS | Life Command Center';
  
  const duration = timerState.totalSeconds;
  logSession(duration);
  
  window.dispatchEvent(new CustomEvent('timer-complete'));
  showToast('Session complete! Great focus!', 'success', '🎯 Deep Work Done');
  effectsEngine?.showCelebrationAnimation?.('Focus session complete!', '🎯');
  
  resetTimer();
  renderFocusPage();
}

export function toggleFocusMode() {
  document.body.classList.toggle('focus-mode-active');
  renderFocusPage();
}

function logSession(durationMinutes) {
  const user = stateService.get('user');
  const xpEarned = gamificationEngine.calculateFocusXP(durationMinutes / 60);
  
  stateService.update('user', u => ({
    ...u,
    xp: u.xp + xpEarned,
    total_focus_hours: (u.total_focus_hours || 0) + (durationMinutes / 3600),
  }));
  
  const session = {
    id: `session_${Date.now()}`,
    user_id: user.id,
    type: timerState.sessionType,
    duration: durationMinutes,
    distractions: timerState.distractions,
    focus_score: calculateFocusScore(),
    date: new Date().toISOString().split('T')[0],
  };
  
  stateService.update('focusSessions', sessions => [session, ...sessions]);
  
  stateService.update('analytics', analytics => ({
    ...analytics,
    deep_work_today: (analytics.deep_work_today || 0) + (durationMinutes / 3600),
  }));
}

function calculateFocusScore() {
  const distractionPenalty = timerState.distractions * 5;
  const baseScore = 100 - distractionPenalty;
  return Math.max(0, Math.min(100, baseScore));
}

function resetTimer() {
  timerState = {
    isRunning: false,
    isPaused: false,
    seconds: timerState.totalSeconds,
    totalSeconds: timerState.totalSeconds,
    sessionType: timerState.sessionType,
    distractions: 0,
    sessionStart: null,
  };
}

function updateTimerDisplay() {
  const display = document.getElementById('timer-display');
  const ringProgress = document.querySelector('.timer-ring-progress');
  
  if (display) {
    display.textContent = formatTime(timerState.seconds);
  }
  
  document.title = `${formatTime(timerState.seconds)} — NEXUS Focus`;
  
  if (ringProgress) {
    const progress = 1 - (timerState.seconds / timerState.totalSeconds);
    const offset = (2 * Math.PI * 90) * progress;
    ringProgress.style.strokeDashoffset = offset;
  }
}

export function setTimerPreset(minutes) {
  if (timerState.isRunning) return;
  timerState.totalSeconds = minutes * 60;
  timerState.seconds = minutes * 60;
  renderFocusPage();
}

export function incrementDistraction() {
  timerState.distractions++;
  const countEl = document.getElementById('distraction-count');
  if (countEl) countEl.textContent = timerState.distractions;
}

window.startTimer = startTimer;
window.pauseTimer = pauseTimer;
window.resumeTimer = resumeTimer;
window.stopTimer = stopTimer;
window.setTimerPreset = setTimerPreset;
window.incrementDistraction = incrementDistraction;

export default renderFocusPage;