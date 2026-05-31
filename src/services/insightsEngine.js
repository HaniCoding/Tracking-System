import stateService from './stateService.js';
import { analyticsEngine } from './analyticsEngine.js';

class InsightsEngine {
  constructor() {
    this.insights = [];
    this.lastGeneration = 0;
  }

  generateInsights() {
    const state = stateService.getState();
    if (!state.dailyLogs?.length) return this.getDefaultInsights();

    const insights = [];
    const weeklyData = analyticsEngine.getWeeklyData();
    const radarData = analyticsEngine.getRadarData();
    const burnout = analyticsEngine.predictBurnout();
    const momentum = analyticsEngine.calculateMomentum();

    const today = weeklyData[weeklyData.length - 1];
    const yesterday = weeklyData[weeklyData.length - 2];

    if (today && yesterday) {
      if (today.percentage > yesterday.percentage) {
        insights.push({ type: 'success', icon: '📈', message: `Consistency up ${today.percentage - yesterday.percentage}% vs yesterday. Keep the momentum!` });
      } else if (today.percentage < yesterday.percentage) {
        insights.push({ type: 'warning', icon: '📉', message: `Consistency dropped ${yesterday.percentage - today.percentage}% from yesterday. Let's bounce back!` });
      }
    }

    if (momentum.value === 'rising') {
      insights.push({ type: 'success', icon: '🚀', message: 'Momentum is rising! You\'re in an elite execution phase.' });
    } else if (momentum.value === 'declining') {
      insights.push({ type: 'warning', icon: '⚠️', message: 'Momentum slowing. Complete today\'s habits to rebuild.' });
    }

    if (burnout.risk === 'high') {
      insights.push({ type: 'danger', icon: '🧘', message: burnout.message });
    }

    const weakest = Object.entries(radarData).sort((a, b) => a[1] - b[1])[0];
    if (weakest && weakest[1] < 60) {
      const tips = {
        focus: 'Try a 25-min deep work session',
        consistency: 'Focus on completing one more habit daily',
        energy: 'Consider adjusting sleep or nutrition',
        growth: 'Take on a challenging new habit',
        output: 'Break tasks into smaller chunks',
        health: 'Add one health-related habit',
      };
      insights.push({ type: 'info', icon: '💡', message: `Boost your ${weakest[0]}: ${tips[weakest[0]] || 'Small consistent steps'}` });
    }

    const totalToday = state.dailyLogs.filter(l => l.date === new Date().toISOString().split('T')[0] && l.completed).length;
    if (totalToday === 0) {
      insights.push({ type: 'info', icon: '🌅', message: 'No habits completed yet today. Start with one small win!' });
    } else if (totalToday >= (state.habits?.filter(h => h.status === 'active').length || 1)) {
      insights.push({ type: 'success', icon: '🏆', message: 'All habits done! You\'re dominating today.' });
    }

    const hour = new Date().getHours();
    const timeMessages = {
      morning: { before: 12, icon: '🌅', msg: 'Morning momentum sets the tone for the day. Strike now!' },
      afternoon: { before: 17, icon: '☀️', msg: 'Afternoon energy dip is normal. A 5-min reset helps.' },
      evening: { after: 17, icon: '🌙', msg: 'Evening reflection: review today, plan tomorrow.' },
    };
    if (hour < 12) insights.push({ type: 'info', icon: timeMessages.morning.icon, message: timeMessages.morning.msg });
    else if (hour < 17) insights.push({ type: 'info', icon: timeMessages.afternoon.icon, message: timeMessages.afternoon.msg });
    else insights.push({ type: 'info', icon: timeMessages.evening.icon, message: timeMessages.evening.msg });

    this.insights = insights.slice(0, 5);
    this.lastGeneration = Date.now();
    return this.insights;
  }

  getDefaultInsights() {
    return [
      { type: 'info', icon: '👋', message: 'Welcome! Start by creating your first habit.' },
      { type: 'info', icon: '💡', message: 'Tip: Morning habits have the highest completion rate.' },
    ];
  }

  getStreakMilestone(currentStreak) {
    const milestones = [3, 7, 14, 21, 30, 50, 100];
    const next = milestones.find(m => m > currentStreak);
    if (!next) return null;
    return { current: currentStreak, next, remaining: next - currentStreak };
  }
}

export const insightsEngine = new InsightsEngine();
export default insightsEngine;