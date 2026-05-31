class PWAService {
  constructor() {
    this.deferredPrompt = null;
  }

  init() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      });
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      const el = document.getElementById('install-pwa-btn');
      if (el) el.remove();
    });
  }

  showInstallButton() {
    const existing = document.getElementById('install-pwa-btn');
    if (existing) return;

    const btn = document.createElement('button');
    btn.id = 'install-pwa-btn';
    btn.className = 'pwa-install-btn';
    btn.innerHTML = '📲 Install App';
    btn.onclick = () => this.install();
    document.body.appendChild(btn);
  }

  async install() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    const result = await this.deferredPrompt.userChoice;
    this.deferredPrompt = null;
    const btn = document.getElementById('install-pwa-btn');
    if (btn) btn.remove();
  }
}

export const pwaService = new PWAService();
export default pwaService;