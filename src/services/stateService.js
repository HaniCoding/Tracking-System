import sheetService from './sheetService.js';

class StateService {
  constructor() {
    this.state = {
      user: null,
      habits: [],
      missions: [],
      dailyLogs: [],
      analytics: {},
      focusSessions: [],
      achievements: [],
      ui: {
        sidebarExpanded: false,
        currentPage: 'dashboard',
        loading: false,
        theme: 'dark',
      },
    };
    
    this.listeners = new Map();
    this.subscriberId = 0;
  }

  getState() {
    return this.state;
  }

  get(path) {
    const keys = path.split('.');
    let value = this.state;
    
    for (const key of keys) {
      if (value === undefined) return undefined;
      value = value[key];
    }
    
    return value;
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let target = this.state;
    
    for (const key of keys) {
      if (target[key] === undefined) {
        target[key] = {};
      }
      target = target[key];
    }
    
    target[lastKey] = value;
    this.notify(path);
  }

  update(path, updater) {
    const current = this.get(path);
    const newValue = typeof updater === 'function' ? updater(current) : updater;
    this.set(path, newValue);
  }

  subscribe(path, callback) {
    const id = ++this.subscriberId;
    
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Map());
    }
    
    this.listeners.get(path).set(id, callback);
    
    return () => {
      const pathListeners = this.listeners.get(path);
      if (pathListeners) {
        pathListeners.delete(id);
      }
    };
  }

  subscribeAll(callback) {
    return this.subscribe('*', callback);
  }

  notify(path) {
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      const value = this.get(path);
      pathListeners.forEach(callback => callback(value, path));
    }

    const wildcardListeners = this.listeners.get('*');
    if (wildcardListeners) {
      wildcardListeners.forEach(callback => callback(this.state));
    }
  }

  async init() {
    this.set('ui.loading', true);
    
    try {
      const { authService } = await import('./authService.js');
      const user = await authService.init();
      this.set('user', user);

      const [habits, missions] = await Promise.all([
        sheetService.getHabits(user.id),
        sheetService.getMissions(user.id),
      ]);
      
      this.set('habits', habits);
      this.set('missions', missions);

      const today = new Date().toISOString().split('T')[0];
      const dailyLogs = await sheetService.getDailyLogs(user.id, today);
      this.set('dailyLogs', dailyLogs);

      const analytics = await sheetService.getAnalytics(user.id);
      this.set('analytics', analytics);

      this.setupRealtimeSync();
    } catch (error) {
      console.error('State initialization failed:', error);
      this.loadMockData();
    } finally {
      this.set('ui.loading', false);
    }
  }

  loadMockData() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    
    this.set('habits', [
      { id: 'h1', user_id: 'demo', title: 'Morning Meditation', category: 'mind', difficulty: 2, target: 1, frequency: 'daily', reward_xp: 20, status: 'active', created_at: dateStr, streak: 12 },
      { id: 'h2', user_id: 'demo', title: 'Read 30 Pages', category: 'learning', difficulty: 3, target: 1, frequency: 'daily', reward_xp: 30, status: 'active', created_at: dateStr, streak: 8 },
      { id: 'h3', user_id: 'demo', title: 'Workout', category: 'fitness', difficulty: 4, target: 1, frequency: 'daily', reward_xp: 40, status: 'active', created_at: dateStr, streak: 5 },
      { id: 'h4', user_id: 'demo', title: 'Code 2 Hours', category: 'business', difficulty: 5, target: 1, frequency: 'daily', reward_xp: 50, status: 'active', created_at: dateStr, streak: 3 },
      { id: 'h5', user_id: 'demo', title: 'Drink 3L Water', category: 'health', difficulty: 1, target: 3, frequency: 'daily', reward_xp: 15, status: 'active', created_at: dateStr, streak: 21 },
      { id: 'h6', user_id: 'demo', title: 'No Social Media', category: 'mind', difficulty: 4, target: 1, frequency: 'daily', reward_xp: 35, status: 'active', created_at: dateStr, streak: 7 },
    ]);

    this.set('missions', [
      { id: 'm1', user_id: 'demo', title: 'Launch MVP', priority: 'P1', deadline: '2026-05-20', reward: 500, status: 'in_progress', completion_percentage: 65, created_at: dateStr },
      { id: 'm2', user_id: 'demo', title: 'Read Deep Work Book', priority: 'P2', deadline: '2026-05-31', reward: 200, status: 'in_progress', completion_percentage: 40, created_at: dateStr },
      { id: 'm3', user_id: 'demo', title: 'Network 5 People', priority: 'P3', deadline: '2026-06-15', reward: 150, status: 'not_started', completion_percentage: 0, created_at: dateStr },
      { id: 'm4', user_id: 'demo', title: 'Morning Routine Audit', priority: 'P2', deadline: '2026-05-18', reward: 250, status: 'blocked', completion_percentage: 20, created_at: dateStr },
    ]);

    const loggedHabits = ['h1', 'h3'];
    this.set('dailyLogs', loggedHabits.map(id => ({
      id: `log_${id}`,
      user_id: 'demo',
      habit_id: id,
      completed: true,
      date: dateStr,
    })));

    this.set('analytics', {
      total_xp: 3450,
      streak_days: 23,
      productivity_score: 87,
      weekly_consistency: 92,
      deep_work_average: 3.5,
      discipline_score: 91,
      habits_completed_today: 2,
      total_habits: 6,
    });
  }

  setupRealtimeSync() {
    sheetService.subscribe((sheetName, data) => {
      this.handleSheetUpdate(sheetName, data);
    });
    
    sheetService.startPolling(5000);
  }

  handleSheetUpdate(sheetName, data) {
    const normalizedData = sheetService.normalizeRows(data);
    
    switch (sheetName) {
      case 'HABITS':
        this.set('habits', normalizedData);
        break;
      case 'MISSIONS':
        this.set('missions', normalizedData);
        break;
      case 'DAILY_LOGS':
        this.set('dailyLogs', normalizedData);
        break;
      case 'ANALYTICS':
        this.set('analytics', normalizedData);
        break;
      default:
        break;
    }
  }

  async completeHabit(habitId) {
    const today = new Date().toISOString().split('T')[0];
    const existingLog = this.get('dailyLogs').find(
      log => log.habit_id === habitId && log.date === today
    );

    if (!existingLog) {
      await sheetService.appendRow('DAILY_LOGS', [
        `log_${Date.now()}`,
        this.get('user').id,
        habitId,
        true,
        today,
      ]);
      
      this.update('dailyLogs', logs => [...logs, {
        id: `log_${Date.now()}`,
        user_id: this.get('user').id,
        habit_id: habitId,
        completed: true,
        date: today,
        time: `${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}`,
      }]);

      const habit = this.get('habits').find(h => h.id === habitId);
      if (habit) {
        this.update('user', user => ({
          ...user,
          xp: user.xp + habit.reward_xp,
        }));
      }
    }

    return true;
  }

  toggleSidebar() {
    this.update('ui', ui => ({
      ...ui,
      sidebarExpanded: !ui.sidebarExpanded,
    }));
  }

  setPage(page) {
    this.update('ui', ui => ({
      ...ui,
      currentPage: page,
    }));
  }
}

export const stateService = new StateService();
export default stateService;