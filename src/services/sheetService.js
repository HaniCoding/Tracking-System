import api from './apiService.js';

const SHEET_NAMES = {
  USERS: 'USERS',
  HABITS: 'HABITS',
  DAILY_LOGS: 'DAILY_LOGS',
  MISSIONS: 'MISSIONS',
  ANALYTICS: 'ANALYTICS',
  FOCUS_SESSIONS: 'FOCUS_SESSIONS',
  ACHIEVEMENTS: 'ACHIEVEMENTS',
};

class SheetService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5000;
    this.lastSync = null;
    this.subscribers = new Set();
    this.pollingInterval = null;
  }

  async readSheet(sheetName, forceRefresh = false) {
    const cacheKey = sheetName;
    const cached = this.cache.get(cacheKey);
    
    if (!forceRefresh && cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const data = await api.get(`/sheets/read`, { sheet: sheetName });
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      this.notifySubscribers(sheetName, data);
      return data;
    } catch (error) {
      console.error(`Failed to read sheet ${sheetName}:`, error);
      if (cached) return cached.data;
      throw error;
    }
  }

  async writeSheet(sheetName, rows) {
    try {
      const result = await api.post(`/sheets/write`, { sheet: sheetName, rows });
      this.invalidateCache(sheetName);
      return result;
    } catch (error) {
      console.error(`Failed to write to sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async appendRow(sheetName, row) {
    try {
      const result = await api.post(`/sheets/append`, { sheet: sheetName, row });
      this.invalidateCache(sheetName);
      return result;
    } catch (error) {
      console.error(`Failed to append to sheet ${sheetName}:`, error);
      throw error;
    }
  }

  async updateRow(sheetName, rowIndex, rowData) {
    try {
      const result = await api.put(`/sheets/update`, { 
        sheet: sheetName, 
        row: rowIndex,
        data: rowData 
      });
      this.invalidateCache(sheetName);
      return result;
    } catch (error) {
      console.error(`Failed to update row in ${sheetName}:`, error);
      throw error;
    }
  }

  async deleteRow(sheetName, rowIndex) {
    try {
      const result = await api.delete(`/sheets/delete`, { 
        sheet: sheetName, 
        row: rowIndex 
      });
      this.invalidateCache(sheetName);
      return result;
    } catch (error) {
      console.error(`Failed to delete row from ${sheetName}:`, error);
      throw error;
    }
  }

  invalidateCache(sheetName) {
    if (sheetName) {
      this.cache.delete(sheetName);
    } else {
      this.cache.clear();
    }
    this.lastSync = Date.now();
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(sheetName, data) {
    this.subscribers.forEach(callback => callback(sheetName, data));
  }

  startPolling(interval = 5000) {
    if (this.pollingInterval) return;
    
    this.pollingInterval = setInterval(async () => {
      try {
        const changes = await this.checkForUpdates();
        if (changes.length > 0) {
          changes.forEach(({ sheet, data }) => {
            this.notifySubscribers(sheet, data);
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  async checkForUpdates() {
    try {
      const updates = await api.get('/sheets/sync-check', {
        since: this.lastSync || 0
      });
      return updates || [];
    } catch {
      return [];
    }
  }

  normalizeRows(rawRows) {
    if (!rawRows || rawRows.length < 2) return [];
    
    const headers = rawRows[0];
    const dataRows = rawRows.slice(1);
    
    return dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[this.normalizeKey(header)] = row[index] || '';
      });
      return obj;
    });
  }

  normalizeKey(key) {
    return key
      .toLowerCase()
      .replace(/\s+/g, '_')
      .trim();
  }

  formatRowForSheet(obj) {
    return Object.values(obj);
  }

  async getUsers(userId = null) {
    const data = await this.readSheet(SHEET_NAMES.USERS);
    const users = this.normalizeRows(data);
    return userId ? users.find(u => u.id === userId) : users;
  }

  async getHabits(userId = null, status = 'active') {
    const data = await this.readSheet(SHEET_NAMES.HABITS);
    let habits = this.normalizeRows(data);
    
    if (userId) {
      habits = habits.filter(h => h.user_id === userId);
    }
    if (status) {
      habits = habits.filter(h => h.status === status);
    }
    
    return habits;
  }

  async getDailyLogs(userId, date = null) {
    const data = await this.readSheet(SHEET_NAMES.DAILY_LOGS);
    let logs = this.normalizeRows(data).filter(l => l.user_id === userId);
    
    if (date) {
      logs = logs.filter(l => l.date === date);
    }
    
    return logs;
  }

  async getMissions(userId = null, status = null) {
    const data = await this.readSheet(SHEET_NAMES.MISSIONS);
    let missions = this.normalizeRows(data);
    
    if (userId) {
      missions = missions.filter(m => m.user_id === userId);
    }
    if (status) {
      missions = missions.filter(m => m.status === status);
    }
    
    return missions;
  }

  async getAnalytics(userId, date = null) {
    const data = await this.readSheet(SHEET_NAMES.ANALYTICS);
    let analytics = this.normalizeRows(data);
    
    analytics = analytics.filter(a => a.user_id === userId);
    if (date) {
      analytics = analytics.filter(a => a.date === date);
    }
    
    return analytics;
  }

  getSheetNames() {
    return SHEET_NAMES;
  }
}

export const sheetService = new SheetService();
export { SHEET_NAMES };
export default sheetService;