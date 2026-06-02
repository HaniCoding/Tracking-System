import { authService } from '../services/authService.js';
import { showToast } from '../utils/helpers.js';

let currentMode = 'login';

export async function renderAuthPage() {
  const container = document.getElementById('page-container');
  const sidebar = document.getElementById('sidebar');
  const bottomNav = document.getElementById('bottom-nav');

  if (sidebar) sidebar.style.display = 'none';
  if (bottomNav) bottomNav.style.display = 'none';

  document.getElementById('main-content').style.marginLeft = '0';

  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-header">
          <svg viewBox="0 0 32 32" width="48" height="48">
            <defs>
              <linearGradient id="auth-logo" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#6366f1"/>
                <stop offset="100%" stop-color="#06b6d4"/>
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#auth-logo)"/>
            <path d="M16 6l8 4.8v9.6L16 26l-8-5.6V10.8z" fill="none" stroke="white" stroke-width="1.5"/>
            <circle cx="16" cy="16" r="4" fill="white"/>
          </svg>
          <h1 class="auth-brand">NEXUS</h1>
          <p class="auth-subtitle">Life Command Center</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab ${currentMode === 'login' ? 'active' : ''}" data-auth-tab="login">Sign In</button>
          <button class="auth-tab ${currentMode === 'signup' ? 'active' : ''}" data-auth-tab="signup">Create Account</button>
        </div>

        <form id="auth-form" class="auth-form" novalidate>
          <div id="auth-form-fields">
            ${currentMode === 'signup' ? `
            <div class="form-group">
              <label class="form-label" for="auth-username">Username</label>
              <input type="text" id="auth-username" class="form-input" placeholder="Your display name" required autocomplete="username">
            </div>
            ` : ''}
            <div class="form-group">
              <label class="form-label" for="auth-email">Email</label>
              <input type="email" id="auth-email" class="form-input" placeholder="you@example.com" required autocomplete="email">
            </div>
            <div class="form-group">
              <label class="form-label" for="auth-password">Password</label>
              <input type="password" id="auth-password" class="form-input" placeholder="Enter password" required autocomplete="${currentMode === 'signup' ? 'new-password' : 'current-password'}">
            </div>
            ${currentMode === 'signup' ? `
            <div class="form-group">
              <label class="form-label" for="auth-confirm">Confirm Password</label>
              <input type="password" id="auth-confirm" class="form-input" placeholder="Confirm password" required autocomplete="new-password">
            </div>
            ` : ''}
          </div>

          <button type="submit" class="btn btn-primary auth-submit" id="auth-submit-btn">
            <span class="btn-text">${currentMode === 'login' ? 'Sign In' : 'Create Account'}</span>
          </button>
        </form>

        <div class="auth-error" id="auth-error"></div>

        <div class="auth-footer">
          ${currentMode === 'login'
            ? "Don't have an account? <button class='auth-link-btn' data-auth-tab='signup'>Sign up</button>"
            : "Already have an account? <button class='auth-link-btn' data-auth-tab='login'>Sign in</button>"
          }
        </div>
      </div>
    </div>
  `;

  attachAuthListeners();
}

function attachAuthListeners() {
  const tabs = document.querySelectorAll('[data-auth-tab]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      currentMode = tab.dataset.authTab;
      renderAuthPage();
    });
  });

  const form = document.getElementById('auth-form');
  form.addEventListener('submit', handleAuthSubmit);
}

async function handleAuthSubmit(e) {
  e.preventDefault();

  const btn = document.getElementById('auth-submit-btn');
  const errorEl = document.getElementById('auth-error');
  errorEl.textContent = '';
  errorEl.style.display = 'none';

  btn.classList.add('loading');
  btn.disabled = true;

  const email = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;

  if (currentMode === 'signup') {
    const username = document.getElementById('auth-username').value.trim();
    const confirm = document.getElementById('auth-confirm').value;

    if (!username) {
      showError('Username is required');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    if (password !== confirm) {
      showError('Passwords do not match');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    try {
      await authService.register({ username, email, password, role: 'user' });
      await completeAuth();
    } catch (err) {
      showError(err.message || 'Registration failed. Please try again.');
    }
  } else {
    if (!email || !password) {
      showError('Email and password are required');
      btn.classList.remove('loading');
      btn.disabled = false;
      return;
    }

    try {
      await authService.login(email, password);
      await completeAuth();
    } catch (err) {
      showError(err.message || 'Invalid email or password');
    }
  }

  btn.classList.remove('loading');
  btn.disabled = false;

  function showError(msg) {
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
  }
}

async function completeAuth() {
  const mainContent = document.getElementById('main-content');
  mainContent.style.marginLeft = '';
  mainContent.style.padding = '';

  const { initAfterAuth } = await import('../main.js');
  await initAfterAuth();

  showToast('Welcome to NEXUS', 'success', 'Authenticated');
}

export default renderAuthPage;
