import stateService from './services/stateService.js';
import { authService } from './services/authService.js';
import { sheetService } from './services/sheetService.js';
import { renderSidebar } from './components/sidebar.js';
import { renderBottomNav } from './components/bottom-nav.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderHabitsPage } from './pages/habits.js';
import { renderMissionsPage } from './pages/missions.js';
import { renderFocusPage } from './pages/focus.js';
import { renderAnalyticsPage } from './pages/analytics.js';
import { renderAdminPage } from './pages/admin.js';
import { showToast } from './utils/helpers.js';
import { effectsEngine } from './services/effectsEngine.js';
import { soundEngine } from './services/soundEngine.js';
import { pwaService } from './services/pwaService.js';

const PAGES = {
  dashboard: renderDashboard,
  habits: renderHabitsPage,
  missions: renderMissionsPage,
  focus: renderFocusPage,
  analytics: renderAnalyticsPage,
  admin: renderAdminPage,
};

let currentPage = 'dashboard';

async function init() {
  try {
    await authService.init();
    await stateService.init();

    renderSidebar();
    renderBottomNav();
    showOnboarding();
    setupRouter();
    setupEventListeners();

    pwaService.init();

    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  } catch (error) {
    console.error('Init failed:', error);
    document.getElementById('page-container').innerHTML = `
      <div class="empty-state" style="padding-top:80px">
        <h3>Something went wrong</h3>
        <p class="text-muted mb-4">${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Reload App</button>
      </div>
    `;
  }
}

function setupRouter() {
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  });
}

function setupEventListeners() {
  window.addEventListener('achievement-unlocked', (e) => {
    showToast(`Achievement Unlocked: ${e.detail.name}`, 'success', '🏆 Achievement');
    soundEngine.achievement();
    effectsEngine.showParticles(window.innerWidth / 2, window.innerHeight / 3);
  });

  window.addEventListener('level-up', (e) => {
    showToast(`Level Up! You're now level ${e.detail.level} - ${e.detail.rank.name}`, 'success', '⬆ Level Up');
    soundEngine.levelUp();
    effectsEngine.showLevelUpCeremony(e.detail.level, e.detail.rank.name);
  });

  window.addEventListener('timer-complete', () => {
    soundEngine.timerComplete();
  });

  document.addEventListener('click', (e) => {
    const sidebarToggle = e.target.closest('[data-toggle-sidebar]');
    if (sidebarToggle) {
      stateService.toggleSidebar();
      document.getElementById('sidebar')?.classList.toggle('expanded');
      document.querySelector('.main-content')?.classList.toggle('sidebar-expanded');
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modals = document.querySelectorAll('.modal-overlay');
      modals.forEach(m => m.remove());
    }
    if (e.key === 'Enter') {
      const modal = document.querySelector('.modal-overlay.active');
      if (modal) {
        const submitBtn = modal.querySelector('.btn-primary');
        if (submitBtn) submitBtn.click();
      }
    }
  });

  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const modal = e.target.closest('.modal-overlay');
    if (modal) {
      const submitBtn = modal.querySelector('.btn-primary');
      if (submitBtn) submitBtn.click();
    }
  });

  stateService.subscribe('ui.currentPage', (page) => {
    if (page !== currentPage) {
      currentPage = page;
    }
  });

  window.showToast = showToast;
  window.sheetService = sheetService;
  window.soundEngine = soundEngine;

  window.toggleSound = () => {
    const enabled = soundEngine.toggle();
    showToast(enabled ? 'Sound ON' : 'Sound OFF', 'info', '🔊');
    const btn = document.getElementById('sound-toggle-btn');
    if (btn) btn.style.opacity = enabled ? '1' : '0.5';
  };
}

async function navigateTo(page) {
  if (page === currentPage && document.getElementById('page-container')?.children.length > 0) {
    return;
  }

  currentPage = page;
  stateService.setPage(page);

  const container = document.getElementById('page-container');
  container.innerHTML = '<div class="loading-skeleton"><div class="skeleton animate-shimmer" style="height:400px;border-radius:16px"></div></div>';

  const renderFn = PAGES[page];
  if (renderFn) {
    const start = performance.now();
    await renderFn();
    const end = performance.now();
    console.debug(`Page ${page} rendered in ${(end - start).toFixed(0)}ms`);
  }

  document.querySelectorAll('[data-nav]').forEach(el => {
    el.classList.toggle('active', el.dataset.nav === page);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showOnboarding() {
  if (localStorage.getItem('nexus_onboarding_done')) return;

  const steps = [
    { icon: '🚀', title: 'Welcome to NEXUS', desc: 'Your personal life command center. Track habits, complete missions, and level up your life.' },
    { icon: '🎯', title: 'Track Your Habits', desc: 'Build powerful routines with smart habit tracking. Complete daily and watch your streak grow.' },
    { icon: '⚡', title: 'Earn XP & Level Up', desc: 'Every habit completed earns XP. Rise through 6 elite ranks from Rookie to Apex Architect.' },
    { icon: '📊', title: 'Live Analytics', desc: 'Real-time insights into your productivity, discipline score, and life momentum.' },
  ];

  let currentStep = 0;
  const overlay = document.createElement('div');
  overlay.className = 'onboarding-overlay';

  function renderStep() {
    const step = steps[currentStep];
    const isLast = currentStep === steps.length - 1;
    overlay.innerHTML = `
      <div class="onboarding-card">
        <div class="onboarding-step-indicator">
          ${steps.map((_, i) => `<div class="onboarding-dot ${i === currentStep ? 'active' : ''}"></div>`).join('')}
        </div>
        <div class="onboarding-icon">${step.icon}</div>
        <h2 class="onboarding-title">${step.title}</h2>
        <p class="onboarding-description">${step.desc}</p>
        <div class="onboarding-buttons">
          <button class="btn btn-ghost" onclick="this.closest('.onboarding-overlay').remove(); localStorage.setItem('nexus_onboarding_done','1')">
            Skip
          </button>
          <button class="btn btn-primary" onclick="window.nextOnboardingStep()">
            ${isLast ? '🚀 Get Started' : 'Next →'}
          </button>
        </div>
      </div>
    `;
  }

  window.nextOnboardingStep = () => {
    currentStep++;
    if (currentStep >= steps.length) {
      overlay.remove();
      localStorage.setItem('nexus_onboarding_done', '1');
      delete window.nextOnboardingStep;
    } else {
      renderStep();
    }
  };

  renderStep();
  document.body.appendChild(overlay);
}

document.addEventListener('DOMContentLoaded', init);

export { navigateTo };