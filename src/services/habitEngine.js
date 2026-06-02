import stateService from './stateService.js';
import sheetService from './sheetService.js';
import { gamificationEngine } from './gamificationEngine.js';

const CATEGORIES = {
  health: { label: 'Health', icon: 'heart', color: '#ef4444' },
  fitness: { label: 'Fitness', icon: 'dumbbell', color: '#f59e0b' },
  learning: { label: 'Learning', icon: 'book-open', color: '#3b82f6' },
  business: { label: 'Business', icon: 'briefcase', color: '#8b5cf6' },
  mind: { label: 'Mind', icon: 'brain', color: '#06b6d4' },
  social: { label: 'Social', icon: 'users', color: '#10b981' },
  finance: { label: 'Finance', icon: 'dollar-sign', color: '#10b981' },
};

class HabitEngine {
  constructor() {
    this.categories = CATEGORIES;
  }

  getCategories() {
    return this.categories;
  }

  getCategoryInfo(category) {
    return this.categories[category] || this.categories.health;
  }

  getActiveHabits() {
    return stateService.get('habits').filter(h => h.status === 'active');
  }

  getTodayHabits() {
    const today = new Date().toISOString().split('T')[0];
    const dailyLogs = stateService.get('dailyLogs');
    
    return this.getActiveHabits().map(habit => {
      const log = dailyLogs.find(l => l.habit_id === habit.id && l.date === today);
      return {
        ...habit,
        completed: log?.completed || false,
        logId: log?.id,
      };
    });
  }

  getHabitStreak(habitId) {
    const habits = stateService.get('habits');
    const dailyLogs = stateService.get('dailyLogs');
    const habit = habits.find(h => h.id === habitId);
    
    if (!habit) return 0;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayLog = dailyLogs.find(l => l.habit_id === habitId && l.date === dateStr);
      
      if (dayLog?.completed) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  getCompletionStats() {
    const todayHabits = this.getTodayHabits();
    const completed = todayHabits.filter(h => h.completed).length;
    const total = todayHabits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { completed, total, percentage };
  }

  async completeHabit(habitId) {
    const user = stateService.get('user');
    const today = new Date().toISOString().split('T')[0];
    const habit = stateService.get('habits').find(h => h.id === habitId);
    
    if (!habit) throw new Error('Habit not found');
    
    const dailyLogs = stateService.get('dailyLogs');
    const existingLog = dailyLogs.find(
      l => l.habit_id === habitId && l.date === today
    );
    
    if (existingLog?.completed) {
      return { success: false, message: 'Habit already completed today' };
    }
    
    try {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`;
      await sheetService.appendRow('DAILY_LOGS', {
        id: `log_${Date.now()}`,
        user_id: user.id,
        habit_id: habitId,
        completed: true,
        date: today,
        time: timeStr,
      });
    } catch (error) {
      console.warn('Sheet sync failed, updating local state');
    }
    
    const streak = this.getHabitStreak(habitId) + 1;
    const xpEarned = gamificationEngine.calculateHabitXP(habit, streak);
    
    stateService.update('dailyLogs', logs => [
      ...logs,
      {
        id: `log_${Date.now()}`,
        user_id: user.id,
        habit_id: habitId,
        completed: true,
        date: today,
        time: `${new Date().getHours().toString().padStart(2,'0')}:${new Date().getMinutes().toString().padStart(2,'0')}`,
      },
    ]);
    
    stateService.update('user', u => ({
      ...u,
      xp: u.xp + xpEarned,
    }));
    
    stateService.update('habits', habits =>
      habits.map(h =>
        h.id === habitId ? { ...h, streak } : h
      )
    );
    
    gamificationEngine.checkAchievements();
    
    return { success: true, xpEarned, streak, message: `+${xpEarned} XP` };
  }

  async uncompleteHabit(habitId) {
    const user = stateService.get('user');
    const today = new Date().toISOString().split('T')[0];
    const habit = stateService.get('habits').find(h => h.id === habitId);
    
    if (!habit) throw new Error('Habit not found');
    
    stateService.update('dailyLogs', logs =>
      logs.filter(l => !(l.habit_id === habitId && l.date === today))
    );
    
    const newStreak = Math.max(0, this.getHabitStreak(habitId) - 1);
    
    stateService.update('habits', habits =>
      habits.map(h =>
        h.id === habitId ? { ...h, streak: newStreak } : h
      )
    );
    
    return { success: true };
  }

  async createHabit(habitData) {
    const user = stateService.get('user');
    const id = `habit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newHabit = {
      id,
      user_id: user.id,
      title: habitData.title,
      category: habitData.category || 'health',
      difficulty: habitData.difficulty || 3,
      target: habitData.target || 1,
      frequency: habitData.frequency || 'daily',
      reward_xp: this.calculateXPReward(habitData.difficulty || 3),
      status: 'active',
      created_at: new Date().toISOString(),
      streak: 0,
    };
    
    try {
      await sheetService.appendRow('HABITS', newHabit);
    } catch (error) {
      console.warn('Sheet sync failed, updating local state');
    }
    
    stateService.update('habits', habits => [...habits, newHabit]);
    
    return newHabit;
  }

  async updateHabit(habitId, updates) {
    const habits = stateService.get('habits');
    const index = habits.findIndex(h => h.id === habitId);
    
    if (index === -1) throw new Error('Habit not found');
    
    const updatedHabit = {
      ...habits[index],
      ...updates,
      reward_xp: updates.difficulty 
        ? this.calculateXPReward(updates.difficulty) 
        : habits[index].reward_xp,
    };
    
    try {
      await sheetService.updateRow('HABITS', index, updatedHabit);
    } catch (error) {
      console.warn('Sheet sync failed, updating local state');
    }
    
    stateService.update('habits', habits =>
      habits.map(h => h.id === habitId ? updatedHabit : h)
    );
    
    return updatedHabit;
  }

  async deleteHabit(habitId) {
    return this.updateHabit(habitId, { status: 'archived' });
  }

  async pauseHabit(habitId) {
    return this.updateHabit(habitId, { status: 'paused' });
  }

  calculateXPReward(difficulty) {
    const baseXP = 10;
    const difficultyMultiplier = {
      1: 1,
      2: 1.5,
      3: 2,
      4: 2.5,
      5: 3,
    };
    return Math.round(baseXP * (difficultyMultiplier[difficulty] || 2));
  }

  getHabitSuggestions() {
    const habits = this.getActiveHabits();
    const suggestions = [];
    
    if (habits.filter(h => h.category === 'fitness').length === 0) {
      suggestions.push({ category: 'fitness', message: 'Add a fitness habit for better health' });
    }
    if (habits.filter(h => h.category === 'learning').length === 0) {
      suggestions.push({ category: 'learning', message: 'Learning habits drive growth' });
    }
    if (habits.filter(h => h.category === 'mind').length < 2) {
      suggestions.push({ category: 'mind', message: 'Consider adding meditation or journaling' });
    }
    
    return suggestions;
  }

  getPerfectDayBonus() {
    const stats = this.getCompletionStats();
    return stats.percentage === 100;
  }
}

export const habitEngine = new HabitEngine();
export { CATEGORIES };
export default habitEngine;