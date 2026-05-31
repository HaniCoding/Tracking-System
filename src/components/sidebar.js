import stateService from '../services/stateService.js';
import { icons } from '../assets/icons.js';

const NAV_ITEMS = [
  { page: 'dashboard', label: 'Dashboard', icon: 'home' },
  { page: 'habits', label: 'Habits', icon: 'target' },
  { page: 'missions', label: 'Missions', icon: 'flag' },
  { page: 'focus', label: 'Focus', icon: 'clock' },
  { page: 'analytics', label: 'Analytics', icon: 'barChart' },
  { page: 'admin', label: 'Admin', icon: 'shield' },
];

export function renderSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  const user = stateService.get('user');
  const currentPage = stateService.get('ui.currentPage');

  sidebar.innerHTML = `
    <div class="sidebar-inner">
      <div class="sidebar-header" data-toggle-sidebar>
        <div class="sidebar-logo">
          <svg viewBox="0 0 32 32" width="28" height="28">
            <defs>
              <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#logo-grad)"/>
            <path d="M16 6l8 4.8v9.6L16 26l-8-5.6V10.8z" fill="none" stroke="white" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="4" fill="white"/>
          </svg>
          <span class="sidebar-brand">NEXUS</span>
        </div>
        <button class="sidebar-toggle btn-icon btn-ghost">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
      </div>

      <nav class="sidebar-nav">
        ${NAV_ITEMS.map(item => `
          <a class="sidebar-link ${currentPage === item.page ? 'active' : ''}" 
             href="#${item.page}"
             data-nav="${item.page}">
            <span class="sidebar-icon">${icons[item.icon]}</span>
            <span class="sidebar-label">${item.label}</span>
          </a>
        `).join('')}
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-actions">
          <button class="sidebar-action-btn" id="sound-toggle-btn" onclick="window.toggleSound()" data-tooltip="Toggle sound">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
          </button>
        </div>
        <div class="sidebar-user">
          <div class="user-avatar">${user?.username?.charAt(0) || 'U'}</div>
          <div class="user-info">
            <span class="user-name">${user?.username || 'User'}</span>
            <span class="user-level">Level ${user?.level || 1}</span>
          </div>
        </div>
      </div>
    </div>
  `;

  attachSidebarListeners();
}

function attachSidebarListeners() {
  const sidebar = document.getElementById('sidebar');

  sidebar.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      sidebar.classList.remove('expanded');
    });
  });

  sidebar.querySelector('[data-toggle-sidebar]')?.addEventListener('click', () => {
    sidebar.classList.toggle('expanded');
  });

  stateService.subscribe('ui.currentPage', (page) => {
    sidebar.querySelectorAll('.sidebar-link').forEach(link => {
      link.classList.toggle('active', link.dataset.nav === page);
    });
  });
}

export default renderSidebar;