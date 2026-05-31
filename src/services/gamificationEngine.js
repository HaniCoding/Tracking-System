import stateService from './stateService.js';

const RANKS = [
  { name: 'Rookie', level: 1, minXP: 0, color: '#6b7280' },
  { name: 'Operator', level: 5, minXP: 500, color: '#3b82f6' },
  { name: 'Commander', level: 10, minXP: 2000, color: '#8b5cf6' },
  { name: 'Execution Beast', level: 20, minXP: 10000, color: '#f59e0b' },
  { name: 'Titan', level: 35, minXP: 35000, color: '#ef4444' },
  { name: 'Apex Architect', level: 50, minXP: 100000, color: '#10b981' },
];

const ACHIEVEMENTS = [
  { 
    id: 'first_habit', 
    name: 'First Step', 
    description: 'Complete your first habit',
    icon: '🌱',
    condition: (stats) => stats.totalCompleted >= 1,
  },
  { 
    id: 'streak_7', 
    name: 'Week Warrior', 
    description: 'Maintain a 7-day streak',
    icon: '🔥',
    condition: (stats) => stats.currentStreak >= 7,
  },
  { 
    id: 'streak_30', 
    name: 'Monthly Master', 
    description: 'Maintain a 30-day streak',
    icon: '💎',
    condition: (stats) => stats.currentStreak >= 30,
  },
  { 
    id: 'streak_100', 
    name: 'Century Champion', 
    description: 'Maintain a 100-day streak',
    icon: '👑',
    condition: (stats) => stats.currentStreak >= 100,
  },
  { 
    id: 'early_bird', 
    name: 'Early Bird', 
    description: 'Complete a habit before 7 AM',
    icon: '🐦',
    condition: (stats) => stats.earlyCompletions > 0,
  },
  { 
    id: 'night_owl', 
    name: 'Night Owl', 
    description: 'Complete a habit after 10 PM',
    icon: '🦉',
    condition: (stats) => stats.lateCompletions > 0,
  },
  { 
    id: 'perfect_week', 
    name: 'Perfect Week', 
    description: 'Complete all habits for 7 consecutive days',
    icon: '⭐',
    condition: (stats) => stats.perfectWeeks >= 1,
  },
  { 
    id: 'deep_diver', 
    name: 'Deep Diver', 
    description: 'Accumulate 100 hours of focus time',
    icon: '🌊',
    condition: (stats) => stats.totalFocusHours >= 100,
  },
  { 
    id: 'mission_master', 
    name: 'Mission Master', 
    description: 'Complete 10 missions',
    icon: '🎯',
    condition: (stats) => stats.missionsCompleted >= 10,
  },
  { 
    id: 'level_10', 
    name: 'Rising Star', 
    description: 'Reach level 10',
    icon: '🌟',
    condition: (stats) => stats.currentLevel >= 10,
  },
  { 
    id: 'level_25', 
    name: 'Elite Operative', 
    description: 'Reach level 25',
    icon: '⚡',
    condition: (stats) => stats.currentLevel >= 25,
  },
  { 
    id: 'all_categories', 
    name: 'Well Rounded', 
    description: 'Have at least one habit in each category',
    icon: '🎨',
    condition: (stats) => stats.uniqueCategories >= 7,
  },
];

class GamificationEngine {
  constructor() {
    this.ranks = RANKS;
    this.achievements = ACHIEVEMENTS;
    this.unlockedAchievements = new Set();
  }

  getRank(level) {
    let currentRank = this.ranks[0];
    
    for (const rank of this.ranks) {
      if (level >= rank.level) {
        currentRank = rank;
      }
    }
    
    return currentRank;
  }

  getNextRank(level) {
    for (const rank of this.ranks) {
      if (rank.level > level) {
        return rank;
      }
    }
    return this.ranks[this.ranks.length - 1];
  }

  calculateLevel(xp) {
    let level = 1;
    let xpRequired = 100;
    let totalXPRequired = 0;
    
    while (totalXPRequired + xpRequired <= xp) {
      totalXPRequired += xpRequired;
      level++;
      xpRequired = Math.floor(100 * Math.pow(1.15, level - 1));
    }
    
    return { level, currentXP: xp - totalXPRequired, xpRequired, totalXPRequired };
  }

  calculateHabitXP(habit, streak = 1) {
    const baseXP = {
      1: 10,
      2: 15,
      3: 20,
      4: 30,
      5: 50,
    };
    
    let xp = baseXP[habit.difficulty] || 20;
    
    if (streak >= 7) xp *= 1.1;
    if (streak >= 30) xp *= 1.2;
    if (streak >= 100) xp *= 1.5;
    
    return Math.round(xp);
  }

  calculateMissionXP(mission) {
    const baseXP = {
      P1: 500,
      P2: 300,
      P3: 150,
      P4: 75,
    };
    
    return baseXP[mission.priority] || 100;
  }

  calculateFocusXP(minutes) {
    const per25min = 5;
    return Math.floor(minutes / 25) * per25min;
  }

  getProgressToNextLevel() {
    const user = stateService.get('user');
    if (!user) return null;
    
    const { level, currentXP, xpRequired } = this.calculateLevel(user.xp);
    const nextRank = this.getNextRank(level);
    const currentRank = this.getRank(level);
    
    return {
      currentLevel: level,
      currentRank: currentRank.name,
      nextRank: nextRank.name,
      nextRankLevel: nextRank.level,
      currentXP,
      xpRequired,
      progress: Math.round((currentXP / xpRequired) * 100),
    };
  }

  getAllAchievements() {
    return this.achievements.map(achievement => ({
      ...achievement,
      unlocked: this.unlockedAchievements.has(achievement.id),
    }));
  }

  getUnlockedAchievements() {
    return this.achievements.filter(a => this.unlockedAchievements.has(a.id));
  }

  calculatePerfectWeeks() {
    const dailyLogs = stateService.get('dailyLogs');
    const habits = stateService.get('habits').filter(h => h.status === 'active');
    if (!habits.length) return 0;
    
    let perfectWeeks = 0;
    const now = new Date();
    
    for (let w = 0; w < 52; w++) {
      let allDaysPerfect = true;
      for (let d = 0; d < 7; d++) {
        const date = new Date(now);
        date.setDate(date.getDate() - (w * 7 + d));
        const dateStr = date.toISOString().split('T')[0];
        const dayLogs = dailyLogs.filter(l => l.date === dateStr && l.completed);
        if (dayLogs.length < habits.length) {
          allDaysPerfect = false;
          break;
        }
      }
      if (allDaysPerfect) perfectWeeks++;
    }
    
    return perfectWeeks;
  }

  getAchievementStats() {
    const user = stateService.get('user');
    const habits = stateService.get('habits');
    const missions = stateService.get('missions');
    
    const dailyLogs = stateService.get('dailyLogs');
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = dailyLogs.filter(l => l.date === today);
    
    const currentHour = new Date().getHours();
    const earlyCompletions = dailyLogs.filter(l => {
      return l.completed && l.time && parseInt(l.time.split(':')[0]) < 7;
    }).length;
    
    const lateCompletions = dailyLogs.filter(l => {
      return l.completed && l.time && parseInt(l.time.split(':')[0]) >= 22;
    }).length;
    
    const uniqueCategories = new Set(habits.filter(h => h.status === 'active').map(h => h.category)).size;
    
    return {
      totalCompleted: dailyLogs.filter(l => l.completed).length,
      currentStreak: user?.streak || 0,
      currentLevel: this.calculateLevel(user?.xp || 0).level,
      totalFocusHours: user?.total_focus_hours || 0,
      missionsCompleted: missions.filter(m => m.status === 'completed').length,
      earlyCompletions,
      lateCompletions,
      perfectWeeks: this.calculatePerfectWeeks(),
      uniqueCategories,
    };
  }

  checkAchievements() {
    const stats = this.getAchievementStats();
    const newlyUnlocked = [];
    
    for (const achievement of this.achievements) {
      if (!this.unlockedAchievements.has(achievement.id) && achievement.condition(stats)) {
        this.unlockedAchievements.add(achievement.id);
        newlyUnlocked.push(achievement);
        
        this.showAchievementNotification(achievement);
      }
    }
    
    return newlyUnlocked;
  }

  showAchievementNotification(achievement) {
    const event = new CustomEvent('achievement-unlocked', { detail: achievement });
    window.dispatchEvent(event);
  }

  addXP(amount, source = 'general') {
    stateService.update('user', user => {
      const newXP = user.xp + amount;
      const { level: newLevel } = this.calculateLevel(newXP);
      const { level: currentLevel } = this.calculateLevel(user.xp);
      
      let newStreak = user.streak;
      if (newLevel > currentLevel) {
        this.showLevelUpNotification(newLevel);
      }
      
      return {
        ...user,
        xp: newXP,
        level: newLevel,
        streak: newStreak,
      };
    });
  }

  showLevelUpNotification(newLevel) {
    const rank = this.getRank(newLevel);
    const event = new CustomEvent('level-up', { 
      detail: { level: newLevel, rank } 
    });
    window.dispatchEvent(event);
  }

  resetProgress() {
    this.unlockedAchievements.clear();
    stateService.update('user', user => ({
      ...user,
      xp: 0,
      level: 1,
      streak: 0,
    }));
  }
}

export const gamificationEngine = new GamificationEngine();
export { RANKS, ACHIEVEMENTS };
export default gamificationEngine;