class EffectsEngine {
  showXPBurst(xp, element) {
    const rect = element?.getBoundingClientRect() || { top: window.innerHeight / 2, left: window.innerWidth / 2 };
    const burst = document.createElement('div');
    burst.className = 'xp-burst';
    burst.textContent = `+${xp} XP`;
    burst.style.left = `${rect.left + (rect.width || 0) / 2 - 30}px`;
    burst.style.top = `${rect.top - 10}px`;
    document.body.appendChild(burst);
    setTimeout(() => burst.remove(), 1200);
  }

  showParticles(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'];
    for (let i = 0; i < 12; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const angle = (i / 12) * Math.PI * 2;
      const dist = 60 + Math.random() * 60;
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      p.style.background = colors[i % colors.length];
      p.style.left = `${x}px`;
      p.style.top = `${y}px`;
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 800);
    }
  }

  showLevelUpCeremony(level, rank) {
    const overlay = document.createElement('div');
    overlay.className = 'level-up-ceremony';
    overlay.innerHTML = `
      <div class="level-up-card">
        <div class="level-up-glow"></div>
        <div class="level-up-content">
          <div class="level-up-icon">⬆</div>
          <div class="level-up-title">LEVEL UP!</div>
          <div class="level-up-level">Level ${level}</div>
          <div class="level-up-rank">${rank}</div>
          <div class="level-up-sparkles"></div>
        </div>
        <button class="btn btn-primary" onclick="this.closest('.level-up-ceremony').remove()">Continue</button>
      </div>
    `;
    document.body.appendChild(overlay);
    this.showParticles(window.innerWidth / 2, window.innerHeight / 2);

    setTimeout(() => {
      const card = overlay.querySelector('.level-up-card');
      if (card) card.classList.add('visible');
    }, 100);
  }

  showCelebrationAnimation(message, emoji = '🎉') {
    const el = document.createElement('div');
    el.className = 'celebration-flash';
    el.innerHTML = `<span>${emoji} ${message}</span>`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }

  animateCounter(element, target, duration = 800) {
    const start = parseInt(element.textContent) || 0;
    const diff = target - start;
    const startTime = performance.now();
    
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      element.textContent = Math.round(start + diff * eased);
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  flashElement(element) {
    if (!element) return;
    element.classList.remove('animate-data-update');
    void element.offsetWidth;
    element.classList.add('animate-data-update');
  }
}

export const effectsEngine = new EffectsEngine();
export default effectsEngine;