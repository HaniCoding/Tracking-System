import sheetService, { SHEET_NAMES } from './sheetService.js';

const STORAGE_KEY = 'nexus_user';
const DEFAULT_USER = {
  id: 'demo_user_001',
  username: 'Commander',
  email: 'commander@nexus.io',
  role: 'admin',
  level: 12,
  xp: 3450,
  streak: 23,
  total_focus_hours: 156.5,
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  last_active: new Date().toISOString(),
};

class AuthService {
  constructor() {
    this.currentUser = null;
    this.listeners = new Set();
  }

  async init() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        this.currentUser = JSON.parse(stored);
      } catch {
        this.currentUser = { ...DEFAULT_USER };
      }
    } else {
      this.currentUser = { ...DEFAULT_USER };
      this.persistUser();
    }

    try {
      const users = await sheetService.getUsers(this.currentUser.id);
      if (users && users.length > 0) {
        this.currentUser = { ...this.currentUser, ...users[0] };
        this.persistUser();
      }
    } catch (error) {
      console.warn('Using local user data:', error.message);
    }

    this.notifyListeners();
    return this.currentUser;
  }

  getUser() {
    return this.currentUser;
  }

  getUserId() {
    return this.currentUser?.id;
  }

  isAdmin() {
    return this.currentUser?.role === 'admin';
  }

  isAuthenticated() {
    return !!this.currentUser;
  }

  async login(email, password) {
    try {
      const users = await sheetService.getUsers();
      const user = users.find(u => u.email === email);
      
      if (!user) {
        throw new Error('User not found');
      }

      this.currentUser = user;
      this.persistUser();
      this.notifyListeners();
      return user;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  async register(userData) {
    try {
      const newUser = {
        id: this.generateId(),
        ...userData,
        level: 1,
        xp: 0,
        streak: 0,
        total_focus_hours: 0,
        created_at: new Date().toISOString(),
        last_active: new Date().toISOString(),
      };

      await sheetService.appendRow(SHEET_NAMES.USERS, Object.values(newUser));
      
      this.currentUser = newUser;
      this.persistUser();
      this.notifyListeners();
      return newUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEY);
    this.notifyListeners();
  }

  async updateProfile(updates) {
    this.currentUser = { ...this.currentUser, ...updates };
    this.persistUser();
    
    try {
      await sheetService.updateUser(this.currentUser.id, updates);
    } catch (error) {
      console.warn('Profile sync failed, using local data');
    }
    
    this.notifyListeners();
    return this.currentUser;
  }

  async updateLastActive() {
    const now = new Date().toISOString();
    await this.updateProfile({ last_active: now });
  }

  persistUser() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentUser));
  }

  generateId() {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.currentUser));
  }
}

export const authService = new AuthService();
export default authService;