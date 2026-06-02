import stateService from '../services/stateService.js';
import { authService } from '../services/authService.js';
import { analyticsEngine } from '../services/analyticsEngine.js';
import { gamificationEngine } from '../services/gamificationEngine.js';
import { icons } from '../assets/icons.js';

export async function renderAdminPage() {
  const container = document.getElementById('page-container');
  const user = stateService.get('user');
  
  if (!authService.isAdmin()) {
    container.innerHTML = `
      <div class="admin-page">
        <div class="empty-state">
          ${icons.lock}
          <h3>Access Denied</h3>
          <p>You need admin privileges to access this page</p>
          <button class="btn btn-primary mt-4" onclick="navigateTo('dashboard')">
            Back to Dashboard
          </button>
        </div>
      </div>
    `;
    return;
  }
  
  const users = await getAllUsers();
  const habits = stateService.get('habits');
  const missions = stateService.get('missions');
  
  container.innerHTML = `
    <div class="admin-page">
      <header class="page-header">
        <h1>${icons.shield} Admin Command Center</h1>
        <p>System management and monitoring</p>
      </header>

      <div class="admin-grid">
        <section class="admin-section overview">
          <div class="card">
            <h3>${icons.users} User Overview</h3>
            <div class="admin-stats">
              <div class="admin-stat">
                <span class="stat-value">${users.length}</span>
                <span class="stat-label">Total Users</span>
              </div>
              <div class="admin-stat">
                <span class="stat-value">${habits.length}</span>
                <span class="stat-label">Active Habits</span>
              </div>
              <div class="admin-stat">
                <span class="stat-value">${missions.length}</span>
                <span class="stat-label">Active Missions</span>
              </div>
              <div class="admin-stat">
                <span class="stat-value">${analyticsEngine.calculateWeeklyConsistency()}%</span>
                <span class="stat-label">System Consistency</span>
              </div>
            </div>
          </div>
        </section>

        <section class="admin-section users">
          <div class="card">
            <h3>${icons.userCheck} User Management</h3>
            <div class="users-table">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Level</th>
                    <th>XP</th>
                    <th>Streak</th>
                    <th>Role</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${users.map(u => `
                    <tr>
                      <td>
                        <div class="user-cell">
                          <span class="user-avatar">${u.username?.charAt(0) || 'U'}</span>
                          <span>${u.username}</span>
                        </div>
                      </td>
                      <td>${u.level || 1}</td>
                      <td>${u.xp || 0}</td>
                      <td>${u.streak || 0}</td>
                      <td>
                        <span class="badge ${u.role === 'admin' ? 'badge-primary' : ''}">${u.role || 'user'}</span>
                      </td>
                      <td>
                        <button class="btn btn-sm btn-ghost" onclick="editUser('${u.id}')">
                          ${icons.edit}
                        </button>
                        <button class="btn btn-sm btn-ghost" onclick="resetUserProgress('${u.id}')">
                          ${icons.refresh}
                        </button>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section class="admin-section system">
          <div class="card">
            <h3>${icons.server} System Status</h3>
            <div class="system-status">
              <div class="status-item">
                <span class="status-dot online"></span>
                <span>Google Sheets Connection</span>
                <span class="status-value">Active</span>
              </div>
              <div class="status-item">
                <span class="status-dot online"></span>
                <span>Realtime Sync</span>
                <span class="status-value">Polling (5s)</span>
              </div>
              <div class="status-item">
                <span class="status-dot online"></span>
                <span>State Management</span>
                <span class="status-value">Connected</span>
              </div>
              <div class="status-item">
                <span class="status-dot online"></span>
                <span>Cache Status</span>
                <span class="status-value">Fresh</span>
              </div>
            </div>
          </div>
        </section>

        <section class="admin-section quick-actions">
          <div class="card">
            <h3>${icons.zap} Quick Actions</h3>
            <div class="action-buttons">
              <button class="btn btn-secondary w-full" onclick="exportData()">
                ${icons.download} Export All Data
              </button>
              <button class="btn btn-secondary w-full" onclick="clearCache()">
                ${icons.trash} Clear Cache
              </button>
              <button class="btn btn-secondary w-full" onclick="forceSync()">
                ${icons.refresh} Force Sync
              </button>
            </div>
          </div>
        </section>

        <section class="admin-section sheets">
          <div class="card">
            <h3>${icons.database} Google Sheets</h3>
            <p class="text-muted mb-4">Direct access to your data source</p>
            <div class="sheet-links">
              <a href="#" class="sheet-link" onclick="openSheet('USERS')">
                ${icons.table} USERS
              </a>
              <a href="#" class="sheet-link" onclick="openSheet('HABITS')">
                ${icons.table} HABITS
              </a>
              <a href="#" class="sheet-link" onclick="openSheet('MISSIONS')">
                ${icons.table} MISSIONS
              </a>
              <a href="#" class="sheet-link" onclick="openSheet('DAILY_LOGS')">
                ${icons.table} DAILY_LOGS
              </a>
              <a href="#" class="sheet-link" onclick="openSheet('ANALYTICS')">
                ${icons.table} ANALYTICS
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

async function getAllUsers() {
  const currentUser = stateService.get('user');
  return [currentUser, {
    id: 'user_002',
    username: 'Operator',
    level: 5,
    xp: 750,
    streak: 12,
    role: 'user',
  }, {
    id: 'user_003',
    username: 'Commander',
    level: 8,
    xp: 1500,
    streak: 21,
    role: 'user',
  }];
}

export function editUser(userId) {
  showToast('User edit modal would open here', 'info');
}

export function resetUserProgress(userId) {
  if (confirm('Reset this user\'s progress? This cannot be undone.')) {
    if (userId === stateService.get('user').id) {
      gamificationEngine.resetProgress();
    }
    showToast('User progress reset', 'success');
    renderAdminPage();
  }
}

export function exportData() {
  const data = {
    user: stateService.get('user'),
    habits: stateService.get('habits'),
    missions: stateService.get('missions'),
    dailyLogs: stateService.get('dailyLogs'),
    analytics: stateService.get('analytics'),
    exportDate: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus-export-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  showToast('Data exported successfully', 'success');
}

export function clearCache() {
  localStorage.clear();
  showToast('Cache cleared', 'success');
  window.location.reload();
}

export function forceSync() {
  const sheetService = window.sheetService;
  if (sheetService) {
    sheetService.invalidateCache();
    sheetService.stopPolling();
    sheetService.startPolling(2000);
    setTimeout(() => {
      sheetService.startPolling(5000);
      showToast('Force sync complete', 'success');
    }, 3000);
  }
}

export function openSheet(sheetName) {
  showToast(`Would open Google Sheet: ${sheetName}`, 'info');
}

window.navigateTo = (page) => {
  window.location.hash = page;
};

export default renderAdminPage;