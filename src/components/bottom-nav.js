import stateService from '../services/stateService.js';
import { icons } from '../assets/icons.js';

const NAV_ITEMS = [
  { page: 'dashboard', label: 'Home', icon: 'home' },
  { page: 'habits', label: 'Habits', icon: 'target' },
  { page: 'missions', label: 'Missions', icon: 'flag' },
  { page: 'focus', label: 'Focus', icon: 'clock' },
  { page: 'analytics', label: 'Stats', icon: 'barChart' },
];

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