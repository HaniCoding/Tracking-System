export function showToast(message, type = 'info', title = '') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  if (container.children.length >= 5) {
    container.firstChild.remove();
  }

  const icons = {
    success: '<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>',
    error: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    warning: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
  };

  const titleText = title || type.charAt(0).toUpperCase() + type.slice(1);
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${icons[type] || icons.info}
      </svg>
    </div>
    <div class="toast-content">
      <div class="toast-title">${titleText}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease-in';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRelativeDate(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return formatDate(dateString);
}

export function getDaysUntil(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diff = date - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (days < 0) return `${Math.abs(days)} days overdue`;
  if (days === 0) return 'Due today';
  if (days === 1) return 'Due tomorrow';
  return `${days} days left`;
}

export function debounce(fn, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

export function throttle(fn, limit = 300) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function pluralize(count, singular, plural) {
  return count === 1 ? singular : plural || singular + 's';
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getInitials(name) {
  return name
    ?.split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export function showConfirm(title, message) {
  return new Promise((resolve) => {
    const modalRoot = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
        </div>
        <div class="modal-body">
          <p style="color:var(--text-secondary)">${message}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" id="confirm-cancel">Cancel</button>
          <button class="btn btn-danger" id="confirm-ok">Delete</button>
        </div>
      </div>
    `;
    modalRoot.appendChild(overlay);

    overlay.querySelector('#confirm-cancel').onclick = () => { overlay.remove(); resolve(false); };
    overlay.querySelector('#confirm-ok').onclick = () => { overlay.remove(); resolve(true); };
    overlay.onclick = (e) => { if (e.target === overlay) { overlay.remove(); resolve(false); } };
  });
}

export function editMissionProgressModal(currentProgress) {
  return new Promise((resolve) => {
    const modalRoot = document.getElementById('modal-root');
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay active';
    overlay.innerHTML = `
      <div class="modal" style="max-width:400px">
        <div class="modal-header">
          <h3 class="modal-title">Edit Progress</h3>
          <button class="btn btn-icon btn-ghost" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Progress (0-100%)</label>
            <input type="range" class="form-input" id="progress-slider" value="${currentProgress}" min="0" max="100" style="accent-color: var(--accent-primary)">
            <div style="text-align:center;margin-top:8px;font-family:var(--font-mono);font-size:24px;font-weight:600" id="progress-value">${currentProgress}%</div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-ghost" onclick="this.closest('.modal-overlay').remove(); window.__progressResolve(null)">Cancel</button>
          <button class="btn btn-primary" id="progress-save">Save</button>
        </div>
      </div>
    `;
    modalRoot.appendChild(overlay);
    window.__progressResolve = resolve;

    const slider = overlay.querySelector('#progress-slider');
    const display = overlay.querySelector('#progress-value');
    slider.oninput = () => { display.textContent = `${slider.value}%`; };
    overlay.querySelector('#progress-save').onclick = () => { overlay.remove(); resolve(parseInt(slider.value)); };
  });
}

window.showToast = showToast;