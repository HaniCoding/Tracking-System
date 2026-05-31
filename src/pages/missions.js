import stateService from '../services/stateService.js';
import { gamificationEngine } from '../services/gamificationEngine.js';
import { icons } from '../assets/icons.js';
import { showConfirm, editMissionProgressModal } from '../utils/helpers.js';

export async function renderMissionsPage() {
  const container = document.getElementById('page-container');
  const missions = stateService.get('missions');
  
  const groupedMissions = {
    critical: missions.filter(m => m.priority === 'P1' && m.status !== 'completed'),
    high: missions.filter(m => m.priority === 'P2' && m.status !== 'completed'),
    medium: missions.filter(m => m.priority === 'P3' && m.status !== 'completed'),
    low: missions.filter(m => m.priority === 'P4' && m.status !== 'completed'),
    completed: missions.filter(m => m.status === 'completed'),
  };

  container.innerHTML = `
    <div class="missions-page">
      <header class="page-header">
        <h1>${icons.flag} Mission Control</h1>
        <p>Track your high-priority missions and goals</p>
      </header>

      <div class="missions-toolbar">
        <div class="mission-stats">
          <div class="mission-stat">
            <span class="stat-number">${groupedMissions.critical.length}</span>
            <span class="stat-label critical">Critical</span>
          </div>
          <div class="mission-stat">
            <span class="stat-number">${groupedMissions.high.length}</span>
            <span class="stat-label warning">High</span>
          </div>
          <div class="mission-stat">
            <span class="stat-number">${groupedMissions.completed.length}</span>
            <span class="stat-label success">Completed</span>
          </div>
        </div>
        <button class="btn btn-primary" onclick="openCreateMissionModal()">
          ${icons.plus} New Mission
        </button>
      </div>

      <div class="missions-grid">
        ${renderMissionGroup('Critical Missions', groupedMissions.critical, 'p1')}
        ${renderMissionGroup('High Priority', groupedMissions.high, 'p2')}
        ${renderMissionGroup('Medium Priority', groupedMissions.medium, 'p3')}
        ${renderMissionGroup('Low Priority', groupedMissions.low, 'p4')}
        ${groupedMissions.completed.length > 0 ? renderMissionGroup('Completed', groupedMissions.completed, 'completed') : ''}
      </div>
    </div>
  `;

  attachMissionListeners();
}

function renderMissionGroup(title, missions, priorityClass) {
  if (missions.length === 0) return '';
  
  return `
    <div class="mission-group">
      <h2 class="mission-group-title ${priorityClass}">${title}</h2>
      <div class="mission-list stagger-children">
        ${missions.map(mission => renderMissionCard(mission)).join('')}
      </div>
    </div>
  `;
}

function renderMissionCard(mission) {
  const deadline = new Date(mission.deadline);
  const now = new Date();
  const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
  
  let deadlineClass = '';
  let deadlineText = '';
  
  if (mission.status === 'completed') {
    deadlineClass = 'success';
    deadlineText = 'Completed';
  } else if (daysLeft < 0) {
    deadlineClass = 'danger';
    deadlineText = `${Math.abs(daysLeft)} days overdue`;
  } else if (daysLeft === 0) {
    deadlineClass = 'danger';
    deadlineText = 'Due today';
  } else if (daysLeft <= 3) {
    deadlineClass = 'warning';
    deadlineText = `${daysLeft} days left`;
  } else {
    deadlineText = deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  return `
    <div class="mission-card ${mission.priority.toLowerCase()}" data-mission-id="${mission.id}">
      <div class="mission-header">
        <h3 class="mission-title">${mission.title}</h3>
        <span class="mission-priority ${mission.priority.toLowerCase()}">${mission.priority}</span>
      </div>
      
      <div class="mission-progress">
        <div class="progress-info">
          <span>Progress</span>
          <span>${mission.completion_percentage}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: ${mission.completion_percentage}%"></div>
        </div>
      </div>

      <div class="mission-meta">
        <div class="mission-deadline ${deadlineClass}">
          ${icons.calendar} ${deadlineText}
        </div>
        <div class="mission-reward">
          ${icons.zap} ${gamificationEngine.calculateMissionXP(mission)} XP
        </div>
      </div>

      <div class="mission-status-tabs">
        <button class="status-tab ${mission.status === 'not_started' ? 'active' : ''}" 
                onclick="updateMissionStatus('${mission.id}', 'not_started')">
          Not Started
        </button>
        <button class="status-tab ${mission.status === 'in_progress' ? 'active' : ''}"
                onclick="updateMissionStatus('${mission.id}', 'in_progress')">
          In Progress
        </button>
        <button class="status-tab ${mission.status === 'blocked' ? 'active' : ''}"
                onclick="updateMissionStatus('${mission.id}', 'blocked')">
          Blocked
        </button>
        <button class="status-tab ${mission.status === 'completed' ? 'active' : ''}"
                onclick="updateMissionStatus('${mission.id}', 'completed')">
          Done
        </button>
      </div>

      <div class="mission-actions">
        <button class="btn btn-sm btn-ghost" onclick="editMissionProgress('${mission.id}', ${mission.completion_percentage})">
          ${icons.edit} Edit Progress
        </button>
        <button class="btn btn-sm btn-ghost" onclick="deleteMission('${mission.id}')">
          ${icons.trash}
        </button>
      </div>
    </div>
  `;
}

function attachMissionListeners() {
  // Status tab click handlers are inline
}

export async function updateMissionStatus(missionId, status) {
  stateService.update('missions', missions =>
    missions.map(m => m.id === missionId ? { ...m, status } : m)
  );
  
  if (status === 'completed') {
    const mission = stateService.get('missions').find(m => m.id === missionId);
    const xpEarned = gamificationEngine.calculateMissionXP(mission);
    stateService.update('user', user => ({ ...user, xp: user.xp + xpEarned }));
    showToast(`Mission completed! +${xpEarned} XP`, 'success');
  }
  
  renderMissionsPage();
}

export function openCreateMissionModal() {
  const modalRoot = document.getElementById('modal-root');
  
  modalRoot.innerHTML = `
    <div class="modal-overlay active" id="create-mission-modal">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">${icons.plus} Create New Mission</h3>
          <button class="btn btn-icon btn-ghost" onclick="closeMissionModal()">${icons.x}</button>
        </div>
        <div class="modal-body">
          <form id="create-mission-form">
            <div class="form-group">
              <label class="form-label">Mission Title</label>
              <input type="text" class="form-input" name="title" placeholder="e.g., Launch MVP" required>
            </div>
            
            <div class="form-group">
              <label class="form-label">Priority</label>
              <select class="form-input" name="priority">
                <option value="P1">P1 - Critical</option>
                <option value="P2" selected>P2 - High</option>
                <option value="P3">P3 - Medium</option>
                <option value="P4">P4 - Low</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Deadline</label>
              <input type="date" class="form-input" name="deadline" required>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="closeMissionModal()">Cancel</button>
          <button class="btn btn-primary" onclick="submitCreateMission()">${icons.check} Create Mission</button>
        </div>
      </div>
    </div>
  `;

  const deadlineInput = document.querySelector('input[name="deadline"]');
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 14);
  deadlineInput.value = defaultDate.toISOString().split('T')[0];
}

export async function submitCreateMission() {
  const form = document.getElementById('create-mission-form');
  const formData = new FormData(form);
  
  const user = stateService.get('user');
  const newMission = {
    id: `mission_${Date.now()}`,
    user_id: user.id,
    title: formData.get('title'),
    priority: formData.get('priority'),
    deadline: formData.get('deadline'),
    reward: gamificationEngine.calculateMissionXP({ priority: formData.get('priority') }),
    status: 'not_started',
    completion_percentage: 0,
    created_at: new Date().toISOString(),
  };
  
  stateService.update('missions', missions => [...missions, newMission]);
  closeMissionModal();
  showToast('Mission created!', 'success');
  renderMissionsPage();
}

export async function editMissionProgress(missionId, currentProgress) {
  const result = await editMissionProgressModal(currentProgress);
  if (result !== null && result !== undefined) {
    const progress = Math.min(100, Math.max(0, result));
    stateService.update('missions', missions =>
      missions.map(m => m.id === missionId ? { ...m, completion_percentage: progress } : m)
    );
    renderMissionsPage();
  }
}

export async function deleteMission(missionId) {
  const confirmed = await showConfirm('Delete Mission', 'Are you sure you want to delete this mission? This action cannot be undone.');
  if (confirmed) {
    stateService.update('missions', missions => missions.filter(m => m.id !== missionId));
    showToast('Mission deleted', 'success');
    renderMissionsPage();
  }
}

export function closeMissionModal() {
  const modal = document.getElementById('create-mission-modal');
  if (modal) modal.remove();
}

window.openCreateMissionModal = openCreateMissionModal;
window.closeMissionModal = closeMissionModal;
window.submitCreateMission = submitCreateMission;
window.updateMissionStatus = updateMissionStatus;
window.editMissionProgress = editMissionProgress;
window.deleteMission = deleteMission;

export default renderMissionsPage;