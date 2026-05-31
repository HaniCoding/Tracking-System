import stateService from '../services/stateService.js';
import { analyticsEngine } from '../services/analyticsEngine.js';
import { gamificationEngine, RANKS } from '../services/gamificationEngine.js';
import { habitEngine } from '../services/habitEngine.js';
import { icons } from '../assets/icons.js';

export async function renderAnalyticsPage() {
  const container = document.getElementById('page-container');
  const user = stateService.get('user');
  const analytics = stateService.get('analytics');
  
  const disciplineScore = analyticsEngine.calculateDisciplineScore();
  const productivityScore = analyticsEngine.calculateProductivityScore();
  const weeklyData = analyticsEngine.getWeeklyData();
  const radarData = analyticsEngine.getRadarData();
  const heatmapData = analyticsEngine.getHeatmapData();
  const categoryBreakdown = analyticsEngine.getCategoryBreakdown();
  const burnout = analyticsEngine.predictBurnout();
  const achievements = gamificationEngine.getUnlockedAchievements();
  const levelProgress = gamificationEngine.getProgressToNextLevel();
  
  container.innerHTML = `
    <div class="analytics-page">
      <header class="page-header">
        <h1>${icons.barChart} Analytics Command Center</h1>
        <p>Deep insights into your performance</p>
      </header>

      <div class="analytics-grid">
        <section class="analytics-section main-score">
          <div class="score-card card-glow">
            <div class="score-header">
              <h3>Discipline Score</h3>
              <span class="score-badge ${disciplineScore >= 80 ? 'elite' : disciplineScore >= 50 ? 'good' : 'needs-work'}">
                ${disciplineScore >= 80 ? 'Elite' : disciplineScore >= 50 ? 'Good' : 'Developing'}
              </span>
            </div>
            <div class="score-display">
              <span class="score-number">${disciplineScore}</span>
              <span class="score-label">/ 100</span>
            </div>
            <div class="score-breakdown">
              <div class="breakdown-item">
                <span>Habits</span>
                <span>${Math.round(disciplineScore * 0.3)}%</span>
              </div>
              <div class="breakdown-item">
                <span>Missions</span>
                <span>${Math.round(disciplineScore * 0.25)}%</span>
              </div>
              <div class="breakdown-item">
                <span>Consistency</span>
                <span>${Math.round(disciplineScore * 0.2)}%</span>
              </div>
              <div class="breakdown-item">
                <span>Focus</span>
                <span>${Math.round(disciplineScore * 0.25)}%</span>
              </div>
            </div>
          </div>
        </section>

        <section class="analytics-section productivity">
          <div class="card">
            <h3>${icons.trendingUp} Productivity Score</h3>
            <div class="big-stat">
              <span class="stat-value">${productivityScore}</span>
              <span class="stat-label">/ 100</span>
            </div>
            <div class="productivity-meter">
              ${renderMeter(productivityScore)}
            </div>
          </div>
        </section>

        <section class="analytics-section burnout">
          <div class="card ${burnout.risk === 'high' ? 'border-danger' : burnout.risk === 'medium' ? 'border-warning' : 'border-success'}">
            <h3>${icons.heart} Burnout Analysis</h3>
            <div class="burnout-indicator ${burnout.risk}">
              <span class="risk-badge">${burnout.risk.toUpperCase()}</span>
              <p>${burnout.message}</p>
            </div>
          </div>
        </section>

        <section class="analytics-section weekly-chart">
          <div class="card">
            <h3>${icons.calendar} Weekly Overview</h3>
            <div class="bar-chart" id="weekly-analytics-chart">
              ${renderBarChart(weeklyData)}
            </div>
          </div>
        </section>

        <section class="analytics-section radar">
          <div class="card">
            <h3>${icons.target} Performance Radar</h3>
            <div class="radar-chart" id="radar-chart">
              ${renderRadarChart(radarData)}
            </div>
          </div>
        </section>

        <section class="analytics-section heatmap">
          <div class="card">
            <h3>${icons.grid} Activity Heatmap (30 Days)</h3>
            <div class="heatmap-grid">
              ${renderHeatmap(heatmapData)}
            </div>
            <div class="heatmap-legend">
              <span>Less</span>
              <div class="legend-scale">
                <div class="legend-block" style="opacity: 0.2"></div>
                <div class="legend-block" style="opacity: 0.4"></div>
                <div class="legend-block" style="opacity: 0.6"></div>
                <div class="legend-block" style="opacity: 0.8"></div>
                <div class="legend-block" style="opacity: 1"></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </section>

        <section class="analytics-section categories">
          <div class="card">
            <h3>${icons.pieChart} Habit Categories</h3>
            <div class="donut-chart">
              ${renderDonutChart(categoryBreakdown)}
            </div>
            <div class="category-legend">
              ${categoryBreakdown.map(cat => `
                <div class="legend-item">
                  <span class="legend-dot" style="background: ${getCategoryColor(cat.name)}"></span>
                  <span>${cat.name}</span>
                  <span class="legend-value">${cat.percentage}%</span>
                </div>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="analytics-section achievements">
          <div class="card">
            <h3>${icons.award} Achievements</h3>
            <div class="achievements-grid">
              ${achievements.length > 0 ? achievements.map(a => `
                <div class="achievement-unlocked">
                  <span class="achievement-icon">${a.icon}</span>
                  <span class="achievement-name">${a.name}</span>
                </div>
              `).join('') : '<p class="text-muted">Complete habits to unlock achievements!</p>'}
            </div>
          </div>
        </section>

        <section class="analytics-section xp-progress">
          <div class="card">
            <h3>${icons.zap} XP Progress</h3>
            <div class="xp-display">
              <span class="xp-current">${user?.xp || 0}</span>
              <span class="xp-label">Total XP</span>
            </div>
            <div class="xp-next-level">
              <span>Next: ${levelProgress?.nextRank}</span>
              <span>${levelProgress?.xpRequired - levelProgress?.currentXP} XP away</span>
            </div>
            <div class="progress-bar" style="height: 16px; margin-top: 16px;">
              <div class="progress-bar-fill" style="width: ${levelProgress?.progress || 0}%"></div>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;
}

function renderMeter(value) {
  const segments = 10;
  const filledSegments = Math.floor(value / 10);
  
  return Array(segments).fill(0).map((_, i) => `
    <div class="meter-segment ${i < filledSegments ? 'filled' : ''}"></div>
  `).join('');
}

function renderBarChart(data) {
  const maxVal = Math.max(...data.map(d => d.percentage), 1);
  
  return `
    <div class="bar-chart-container">
      ${data.map(day => {
        const height = (day.percentage / maxVal) * 150;
        const isToday = day.label === new Date().toLocaleDateString('en-US', { weekday: 'short' });
        return `
          <div class="bar-container">
            <div class="bar-wrapper">
              <div class="bar ${isToday ? 'today' : ''}" style="height: ${height}px"></div>
            </div>
            <span class="bar-label">${day.label}</span>
            <span class="bar-value">${day.percentage}%</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderRadarChart(data) {
  const labels = Object.keys(data);
  const values = Object.values(data);
  const maxValue = 100;
  
  const angleStep = (2 * Math.PI) / labels.length;
  let points = '';
  let labelPoints = '';
  
  labels.forEach((label, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = values[i] / maxValue;
    const x = 100 + 70 * value * Math.cos(angle);
    const y = 100 + 70 * value * Math.sin(angle);
    points += `${x},${y} `;
    
    const labelX = 100 + 90 * Math.cos(angle);
    const labelY = 100 + 90 * Math.sin(angle);
    labelPoints += `<text x="${labelX}" y="${labelY}" class="radar-label">${label}</text>`;
  });
  
  return `
    <svg viewBox="0 0 200 200" class="radar-svg">
      ${[0.2, 0.4, 0.6, 0.8, 1].map(scale => `
        <polygon 
          points="${labels.map((_, i) => {
            const angle = i * angleStep - Math.PI / 2;
            const x = 100 + 70 * scale * Math.cos(angle);
            const y = 100 + 70 * scale * Math.sin(angle);
            return `${x},${y}`;
          }).join(' ')}"
          fill="none"
          stroke="var(--bg-card)"
          stroke-width="1"
        />
      `).join('')}
      ${labels.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = 100 + 70 * Math.cos(angle);
        const y = 100 + 70 * Math.sin(angle);
        return `<line x1="100" y1="100" x2="${x}" y2="${y}" stroke="var(--bg-card)" />`;
      }).join('')}
      <polygon points="${points}" fill="var(--accent-primary)" fill-opacity="0.3" stroke="var(--accent-primary)" stroke-width="2" />
      ${labelPoints}
    </svg>
    <div class="radar-values">
      ${labels.map((label, i) => `
        <span>${label}: ${values[i]}</span>
      `).join('')}
    </div>
  `;
}

function renderHeatmap(data) {
  const weeks = [];
  let currentWeek = [];
  
  data.forEach((day, i) => {
    currentWeek.push(day);
    if (currentWeek.length === 7 || i === data.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });
  
  return `
    <div class="heatmap-weeks">
      ${weeks.map(week => `
        <div class="heatmap-week">
          ${week.map(day => `
            <div class="heatmap-day intensity-${day.intensity}" title="${day.date}: ${day.intensity * 20}%"></div>
          `).join('')}
        </div>
      `).join('')}
    </div>
  `;
}

function renderDonutChart(categories) {
  const total = categories.reduce((sum, c) => sum + c.count, 0);
  let currentAngle = -90;
  
  const paths = categories.map(cat => {
    const angle = (cat.count / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    
    const x1 = 50 + 40 * Math.cos(startRad);
    const y1 = 50 + 40 * Math.sin(startRad);
    const x2 = 50 + 40 * Math.cos(endRad);
    const y2 = 50 + 40 * Math.sin(endRad);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return `<path d="M50,50 L${x1},${y1} A40,40 0 ${largeArc},1 ${x2},${y2} Z" fill="${getCategoryColor(cat.name)}" />`;
  });
  
  return `
    <svg viewBox="0 0 100 100" class="donut-svg">
      ${paths.join('')}
      <circle cx="50" cy="50" r="25" fill="var(--bg-card)" />
    </svg>
  `;
}

function getCategoryColor(category) {
  const colors = {
    health: '#ef4444',
    fitness: '#f59e0b',
    learning: '#3b82f6',
    business: '#8b5cf6',
    mind: '#06b6d4',
    social: '#10b981',
    finance: '#10b981',
  };
  return colors[category] || '#6366f1';
}

export default renderAnalyticsPage;