import stateService from './stateService.js';
import sheetService from './sheetService.js';

class AnalyticsEngine {
  constructor() {
    this.weights = {
      habits: 0.3,
      focus: 0.25,
      missions: 0.25,
      consistency: 0.2,
    };
  }

  calculateDisciplineScore() {
    const state = stateService.getState();
    const { habits, dailyLogs, missions, analytics } = state;
    
    const habitScore = this.calculateHabitScore(habits, dailyLogs);
    const missionScore = this.calculateMissionScore(missions);
    const consistencyScore = analytics.streak_days ? Math.min(100, analytics.streak_days * 3) : 0;
    
    const weightedScore = 
      habitScore * this.weights.habits +
      missionScore * this.weights.missions +
      consistencyScore * this.weights.consistency;
    
    return Math.round(weightedScore);
  }

  calculateHabitScore(habits, dailyLogs) {
    if (!habits.length) return 0;
    
    const activeHabits = habits.filter(h => h.status === 'active');
    if (!activeHabits.length) return 0;
    
    const todayLogs = dailyLogs.filter(l => l.completed);
    const completionRate = todayLogs.length / activeHabits.length;
    
    const difficultyBonus = activeHabits.reduce((sum, h) => sum + h.difficulty, 0) / activeHabits.length;
    
    return Math.round((completionRate * 100 + difficultyBonus * 5) / 2);
  }

  calculateMissionScore(missions) {
    if (!missions.length) return 0;
    
    const inProgress = missions.filter(m => m.status === 'in_progress');
    if (!inProgress.length) return missions.filter(m => m.status === 'completed').length ? 50 : 0;
    
    const avgProgress = inProgress.reduce((sum, m) => sum + m.completion_percentage, 0) / inProgress.length;
    
    const priorityBonus = inProgress.reduce((sum, m) => {
      const bonus = { P1: 20, P2: 15, P3: 10, P4: 5 }[m.priority] || 0;
      return sum + bonus;
    }, 0) / inProgress.length;
    
    return Math.round(avgProgress + priorityBonus);
  }

  calculateProductivityScore() {
    const state = stateService.getState();
    const { analytics, dailyLogs, habits } = state;
    
    const todayCompleted = dailyLogs.filter(l => l.completed).length;
    const totalHabits = habits.filter(h => h.status === 'active').length;
    
    const completionRate = totalHabits > 0 ? (todayCompleted / totalHabits) * 100 : 0;
    const streakBonus = Math.min(analytics.streak_days || 0, 30);
    const xpRate = Math.min((analytics.total_xp || 0) / 100, 50);
    
    return Math.round((completionRate * 0.4) + (streakBonus * 1) + (xpRate * 0.6));
  }

  calculateWeeklyConsistency() {
    const days = 7;
    const state = stateService.getState();
    const { habits } = state;
    
    const activeHabits = habits.filter(h => h.status === 'active');
    if (!activeHabits.length) return 0;
    
    const totalPossible = activeHabits.length * days;
    let totalCompleted = 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = state.dailyLogs.filter(l => l.date === dateStr && l.completed);
      totalCompleted += Math.min(dayLogs.length, activeHabits.length);
    }
    
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  }

  calculateStreak() {
    const state = stateService.getState();
    const { habits, dailyLogs } = state;
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const activeHabits = habits.filter(h => h.status === 'active');
      const completedToday = dailyLogs.filter(l => l.date === dateStr && l.completed).length;
      
      if (completedToday >= Math.ceil(activeHabits.length * 0.8)) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }

  calculateMomentum() {
    const state = stateService.getState();
    const { analytics } = state;
    
    const currentStreak = analytics.streak_days || 0;
    const currentXP = analytics.total_xp || 0;
    
    const momentumScore = currentStreak * 2 + (currentXP / 100);
    
    if (momentumScore > 80) return { value: 'rising', label: 'Rising', color: 'success' };
    if (momentumScore > 40) return { value: 'stable', label: 'Stable', color: 'primary' };
    return { value: 'declining', label: 'Declining', color: 'warning' };
  }

  calculateFocusQuality(focusLogs) {
    if (!focusLogs || !focusLogs.length) return { score: 0, label: 'No Data' };
    
    const avgDuration = focusLogs.reduce((sum, log) => sum + log.duration, 0) / focusLogs.length;
    const avgFocus = focusLogs.reduce((sum, log) => sum + (log.focus_score || 7), 0) / focusLogs.length;
    
    const score = Math.round((avgDuration / 60) * 30 + avgFocus * 7);
    
    let label;
    if (score >= 85) label = 'Elite';
    else if (score >= 70) label = 'Excellent';
    else if (score >= 50) label = 'Good';
    else if (score >= 30) label = 'Fair';
    else label = 'Needs Work';
    
    return { score: Math.min(100, score), label };
  }

  getWeeklyData() {
    const state = stateService.getState();
    const { habits, dailyLogs } = state;
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayLogs = dailyLogs.filter(l => l.date === dateStr && l.completed);
      const activeHabits = habits.filter(h => h.status === 'active').length;
      
      data.push({
        date: dateStr,
        label: dayName,
        completed: dayLogs.length,
        total: activeHabits,
        percentage: activeHabits > 0 ? Math.round((dayLogs.length / activeHabits) * 100) : 0,
      });
    }
    
    return data;
  }

  getCategoryBreakdown() {
    const state = stateService.getState();
    const { habits } = state;
    
    const categories = {};
    habits.forEach(habit => {
      if (habit.status === 'active') {
        categories[habit.category] = (categories[habit.category] || 0) + 1;
      }
    });
    
    return Object.entries(categories).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / habits.length) * 100),
    }));
  }

  getRadarData() {
    const state = stateService.getState();
    const { analytics, dailyLogs, habits } = state;
    
    return {
      focus: Math.min(100, analytics.deep_work_average * 10 || 0),
      consistency: this.calculateWeeklyConsistency(),
      energy: analytics.energy_score || 70,
      growth: Math.min(100, (analytics.total_xp || 0) / 100),
      output: this.calculateProductivityScore(),
      health: this.calculateHabitScore(habits, dailyLogs),
    };
  }

  getHeatmapData(days = 30) {
    const state = stateService.getState();
    const { dailyLogs, habits } = state;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayLogs = dailyLogs.filter(l => l.date === dateStr && l.completed);
      const activeHabits = habits.filter(h => h.status === 'active').length;
      
      let intensity;
      if (activeHabits === 0) intensity = 0;
      else {
        const rate = dayLogs.length / activeHabits;
        if (rate === 0) intensity = 0;
        else if (rate < 0.25) intensity = 1;
        else if (rate < 0.5) intensity = 2;
        else if (rate < 0.75) intensity = 3;
        else if (rate < 1) intensity = 4;
        else intensity = 5;
      }
      
      data.push({
        date: dateStr,
        day: date.getDate(),
        month: date.getMonth(),
        intensity,
      });
    }
    
    return data;
  }

  predictBurnout() {
    const state = stateService.getState();
    const { analytics } = state;
    
    const streak = analytics.streak_days || 0;
    const weeklyConsistency = this.calculateWeeklyConsistency();
    
    if (streak > 60 && weeklyConsistency > 95) {
      return { risk: 'high', message: 'Risk of burnout. Consider taking a rest day.' };
    }
    if (streak > 30 && weeklyConsistency > 85) {
      return { risk: 'medium', message: 'High intensity. Monitor energy levels.' };
    }
    return { risk: 'low', message: 'Sustainable pace. Keep going!' };
  }

  async syncAnalytics() {
    try {
      const user = stateService.get('user');
      const score = this.calculateDisciplineScore();
      const today = new Date().toISOString().split('T')[0];
      
      await sheetService.appendRow('ANALYTICS', [
        `analytics_${Date.now()}`,
        user.id,
        today,
        user.xp,
        stateService.get('analytics').streak_days || this.calculateStreak(),
        this.calculateProductivityScore(),
        this.calculateWeeklyConsistency(),
        stateService.get('analytics').deep_work_average || 0,
        score,
        stateService.get('dailyLogs').filter(l => l.completed).length,
        0,
      ]);
    } catch (error) {
      console.warn('Analytics sync failed:', error.message);
    }
  }
}

export const analyticsEngine = new AnalyticsEngine();
export default analyticsEngine;