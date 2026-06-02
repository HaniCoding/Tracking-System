import stateService from '../services/stateService.js';
import { icons } from '../assets/icons.js';

const NAV_ITEMS = [
  { page: 'dashboard', label: 'Home', icon: 'home' },
  { page: 'habits', label: 'Habits', icon: 'target' },
  { page: 'missions', label: 'Missions', icon: 'flag' },
  { page: 'focus', label: 'Focus', icon: 'clock' },
  { page: 'analytics', label: 'Stats', icon: 'barChart' },
];

function getLogoutIcon() {
  return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>';
}

export function renderBottomNav() {
  const nav = document.getElementById('bottom-nav');
  if (!nav) return;

  const currentPage = stateService.get('ui.currentPage');

  nav.innerHTML = `
    <div class="bottom-nav-inner">
      ${NAV_ITEMS.map(item => `
        <a class="bottom-nav-item ${currentPage === item.page ? 'active' : ''}" 
           href="#${item.page}"
           data-nav="${item.page}">
          <span class="bottom-nav-icon">${icons[item.icon]}</span>
          <span class="bottom-nav-label">${item.label}</span>
          ${item.page === 'focus' ? '<span class="nav-badge" id="focus-indicator"></span>' : ''}
        </a>
      `).join('')}
      <button class="bottom-nav-item bottom-nav-logout" data-logout aria-label="Sign out">
        <span class="bottom-nav-icon">${getLogoutIcon()}</span>
        <span class="bottom-nav-label">Logout</span>
      </button>
    </div>
  `;

  nav.classList.remove('hidden');

  nav.querySelectorAll('.bottom-nav-item').forEach(link => {
    link.addEventListener('click', () => {
      nav.querySelectorAll('.bottom-nav-item').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  stateService.subscribe('ui.currentPage', (page) => {
    nav.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.nav === page);
    });
  });
}

export default renderBottomNav;