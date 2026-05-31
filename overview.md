# NEXUS - Life Command Center

> **Billionaire-Level Realtime Habit Tracker & Personal Execution Operating System**

---

## Application Overview

NEXUS is a **military-grade personal productivity intelligence platform** that transforms Google Sheets into a realtime AI-powered command center. Built with Vanilla JavaScript ES Modules and deployed on Netlify, it tracks, analyzes, and gamifies every aspect of a user's life with a dark luxury aesthetic.

---

## Pages & Features

### 1. Dashboard (Command Center)
| Section | Description |
|---------|-------------|
| Welcome Header | Personalized greeting with current date and level badge |
| 6 Stat Cards | Focus Today, Discipline Score, Current Streak, Total XP, Habits Today, Momentum |
| Level Progress | XP progress bar showing current level, rank, and next rank target |
| Today's Habits | Quick-toggle list to complete/uncomplete habits inline |
| Weekly Chart | 7-day bar chart showing daily completion percentage |
| Quick Stats | Productivity Score, Weekly Consistency, Total Focus Hours |
| Quick Actions | Shortcut buttons for "Start Focus Session" and "Add New Habit" |

### 2. Habits (Habit Command Center)
| Section | Description |
|---------|-------------|
| Filter Tabs | Filter by category: All, Health, Fitness, Learning, Mind |
| Habit Cards Grid | Each card shows title, category badge, difficulty stars, streak count, XP reward, progress ring |
| Smart Suggestions | Automatically suggests missing habit categories |
| Create Habit | Modal form: title, category, difficulty (1-5), daily target, frequency |
| Edit / Delete | Modify or archive existing habits |
| Complete / Undo | Toggle completion with instant XP feedback via toast notification |

### 3. Missions (Mission Control)
| Section | Description |
|---------|-------------|
| Priority Groups | P1 (Critical) → P4 (Low) missions grouped by priority |
| Mission Cards | Title, priority badge, animated progress bar, deadline countdown with color-coding |
| Status Tabs | Inline toggle: Not Started / In Progress / Blocked / Done |
| Create Mission | Modal with title, priority selection, date picker (defaults to 14 days ahead) |
| Edit Progress | Quick prompt-based percentage update |
| Delete Mission | Confirmation-based deletion |

**Deadline Color Coding:**
- Red: Overdue or due today
- Yellow: 3 days or less remaining
- Default: Normal date display

### 4. Focus (Deep Work Timer)
| Section | Description |
|---------|-------------|
| Session Types | Deep Work, Creative, Learning, Admin (each with distinct color) |
| Timer | Large circular progress ring with 25/50/90 min presets |
| Controls | Start, Pause, Resume, Stop with realtime countdown |
| Distraction Counter | Manual increment button with live counter display |
| Session Stats | Type, goal duration, calculated focus score |
| Session History | Last 5 sessions listed with type and duration |

**Session Rewards:** 5 XP per 25 minutes of focus time.

### 5. Analytics (Analytics Command Center)
| Section | Description |
|---------|-------------|
| Discipline Score | 0-100 weighted composite score with elite/good/developing badge |
| Productivity Score | 10-segment meter showing daily output efficiency |
| Burnout Analysis | High/Medium/Low risk prediction with actionable message |
| Weekly Bar Chart | 7-day completion percentage bars |
| Performance Radar | 6-axis SVG radar chart: Focus, Consistency, Energy, Growth, Output, Health |
| Activity Heatmap | 30-day calendar heatmap with 0-5 intensity levels |
| Category Donut Chart | Custom SVG donut showing habit category distribution |
| Achievements Grid | All unlocked achievements with icons |
| XP Progress | Total XP display with next rank distance and progress bar |

**Score Breakdown:**
| Score | Weight | Source |
|-------|--------|--------|
| Habit Score | 30% | Daily completion rate + difficulty bonus |
| Focus Score | 25% | Session quality and consistency |
| Mission Score | 25% | Progress weighted by priority |
| Consistency | 20% | Current streak contribution |

### 6. Admin (Admin Panel)
| Section | Description |
|---------|-------------|
| User Overview | Total users, active habits, active missions, system consistency |
| User Management | Table with all users: avatar, level, XP, streak, role, edit/reset actions |
| System Status | Live indicators for Google Sheets connection, Realtime Sync, State, Cache |
| Quick Actions | Export All Data (JSON download), Clear Cache & Reload, Force Sync |
| Google Sheets Links | Direct navigation shortcuts to all 5 sheets |
| Access Control | Non-admin users see "Access Denied" message |

---

## Gamification System

### XP Sources
| Activity | XP Reward |
|----------|-----------|
| Habit Completion | 10-50 XP (based on difficulty 1-5) |
| Mission Completion | 75-500 XP (based on priority P4-P1) |
| Focus Session | 5 XP per 25 minutes |
| Streak Bonus | 1.1x at 7 days, 1.2x at 30 days, 1.5x at 100 days |
| Perfect Day | +50 XP (all habits completed) |

### Rank Progression
| Level Range | Rank | Minimum XP |
|-------------|------|------------|
| 1-4 | Rookie | 0 |
| 5-9 | Operator | 500 |
| 10-19 | Commander | 2,000 |
| 20-34 | Execution Beast | 10,000 |
| 35-49 | Titan | 35,000 |
| 50+ | Apex Architect | 100,000 |

### Achievements (12 Total)
| Achievement | Trigger |
|-------------|---------|
| First Step | Complete first habit |
| Week Warrior | 7-day streak |
| Monthly Master | 30-day streak |
| Century Champion | 100-day streak |
| Early Bird | Complete habit before 7 AM |
| Night Owl | Complete habit after 10 PM |
| Perfect Week | All habits complete for 7 consecutive days |
| Deep Diver | 100 hours total focus time |
| Mission Master | 10 completed missions |
| Rising Star | Reach level 10 |
| Elite Operative | Reach level 25 |
| Well Rounded | Active habits in all 7 categories |

---

## Technical Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                              │
│  Vanilla JS + ES Modules                                      │
│  ├── main.js          → App shell, router, init               │
│  ├── pages/           → 6 page renderers                      │
│  ├── services/        → State, Auth, Sheet, Engines           │
│  ├── components/      → Sidebar                               │
│  ├── utils/           → Helpers, Toast, Formatters            │
│  └── assets/          → SVG Icons                             │
├──────────────────────────────────────────────────────────────┤
│                    SERVICE LAYER                               │
│  ├── apiService.js        → HTTP client with retry logic      │
│  ├── sheetService.js      → Google Sheets CRUD + cache + poll │
│  ├── stateService.js      → Reactive proxy-based state store  │
│  ├── authService.js       → Auth & user management            │
│  ├── habitEngine.js       → Habit logic, completion, streaks  │
│  ├── analyticsEngine.js   → Scores, metrics, predictions      │
│  ├── gamificationEngine.js→ XP, levels, ranks, achievements   │
├──────────────────────────────────────────────────────────────┤
│                    BACKEND LAYER (Netlify Functions)           │
│  ├── GET  /api/sheets/read     → Read sheet data              │
│  ├── POST /api/sheets/write    → Write rows                   │
│  ├── POST /api/sheets/append   → Append row                   │
│  └── PUT  /api/sheets/update   → Update row                   │
├──────────────────────────────────────────────────────────────┤
│                    DATA LAYER (Google Sheets)                  │
│  ├── USERS       → id, username, email, role, level, xp, etc. │
│  ├── HABITS      → id, title, category, difficulty, target    │
│  ├── DAILY_LOGS  → id, habit_id, completed, date              │
│  ├── MISSIONS    → id, title, priority, deadline, status      │
│  └── ANALYTICS   → date, total_xp, streak, scores             │
└──────────────────────────────────────────────────────────────┘
```

### Key Technical Decisions
| Decision | Implementation |
|----------|---------------|
| Framework | None (Vanilla JS) — direct DOM control, zero bloat |
| State Management | Custom Proxy-based store with dot-path subscriptions |
| Database | Google Sheets (5 sheets as tables with headers in row 1) |
| Realtime Sync | Polling every 5 seconds (2s when tab active) |
| Caching | In-memory Map with 5s TTL, invalidated on writes |
| Authentication | localStorage-based with Google Sheets fallback |
| Styling | 4 CSS files — variables, components, main layouts, animations |
| Icons | 43 custom Lucide-style SVG icons |

### Realtime Data Flow
```
User Action → optimistic state update → UI re-render (instant)
                  ↓
          Async sheet sync → Netlify Function → Google Sheets API
                  ↓
          Poll cycle detects change → cache refresh → UI sync
```

---

## Design System

### Color Palette
| Token | Value | Usage |
|-------|-------|-------|
| --bg-primary | #0a0a0f | Deep void black background |
| --bg-secondary | #12121a | Elevated surface |
| --bg-card | #1a1a24 | Card background |
| --accent-primary | #6366f1 | Electric indigo |
| --accent-secondary | #8b5cf6 | Violet pulse |
| --accent-tertiary | #06b6d4 | Cyan spark |
| --accent-success | #10b981 | Elite green |
| --accent-warning | #f59e0b | Golden alert |
| --accent-danger | #ef4444 | Critical red |

### Typography
| Usage | Font | Weight |
|-------|------|--------|
| Headlines | Space Grotesk | 700 |
| Body | Inter | 400/500 |
| Data/Stats | JetBrains Mono | 400/500/600 |

### Data Visualizations (6 types)
1. **Bar Chart** — Weekly completion (rounded tops, gradient fills)
2. **Radar Chart** — 6-axis performance (SVG with gradient fill)
3. **Donut Chart** — Category distribution (SVG paths, animated)
4. **Heatmap** — 30-day activity (5 intensity levels)
5. **Progress Ring** — Timer and habit completion (SVG circle)
6. **Meter** — Productivity score (10-segment bar)

---

## Responsive Breakpoints
| Device | Width | Layout Change |
|--------|-------|---------------|
| Desktop | >1200px | Full sidebar (72px collapsed / 240px expanded), 3-column grids |
| Tablet | 768-1200px | Collapsed sidebar, 2-column grids |
| Mobile | <768px | Hidden sidebar → bottom nav bar, single column, stacked cards |

---

## Core Metrics & Scores

### Discipline Score (0-100)
```
disciplineScore = (habitScore × 0.30) + (focusScore × 0.25)
                + (missionScore × 0.25) + (consistency × 0.20)
```

### Productivity Score (0-100)
```
productivityScore = (completionRate × 0.40) + (streakBonus × 1) + (xpRate × 0.60)
```

### Momentum Detection
| Score Range | Status | Color |
|-------------|--------|-------|
| >80 | Rising | Success (green) |
| 40-80 | Stable | Primary (indigo) |
| <40 | Declining | Warning (yellow) |

### Burnout Prediction
| Condition | Risk Level | Message |
|-----------|-----------|---------|
| Streak > 60 days + consistency > 95% | High | "Risk of burnout. Consider taking a rest day." |
| Streak > 30 days + consistency > 85% | Medium | "High intensity. Monitor energy levels." |
| Default | Low | "Sustainable pace. Keep going!" |

---

## Error Handling & Resilience

| Scenario | Behavior | Recovery |
|----------|----------|----------|
| Network error | Warning toast | Next poll cycle retry |
| API timeout | Falls back to cached data | Exponential backoff |
| Google Sheets unavailable | Loads mock/demo data | App remains functional |
| Rate limited | Backs off, shows notice | Retry after delay |
| Auth failure | Shows error, prompts re-auth | Clear credentials, reload |
| State init failure | loadMockData() called | Full demo experience |

---

## Performance Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse Score | > 90 |
| Realtime Update Latency | < 2s |
| Animation Frame Rate | 60fps |
| Bundle Size | < 200KB gzipped |

---

## File Structure
```
nexus-life-command-center/
├── index.html                       # SPA shell entry point
├── package.json                     # Project metadata
├── netlify.toml                     # Deployment config
├── .env.example                     # Environment variables
├── SPEC.md                          # Full system specification
├──
├── public/
│   └── favicon.svg
│
├── src/
│   ├── main.js                      # App init, router, event listeners
│   ├──
│   ├── styles/
│   │   ├── variables.css            # CSS custom properties
│   │   ├── main.css                 # Global + page-specific styles
│   │   ├── components.css           # Reusable component styles
│   │   └── animations.css           # Keyframes + animation classes
│   ├──
│   ├── services/
│   │   ├── apiService.js            # HTTP client with retry
│   │   ├── sheetService.js          # Google Sheets CRUD + cache
│   │   ├── stateService.js          # Reactive state management
│   │   ├── authService.js           # Authentication
│   │   ├── habitEngine.js           # Habit logic engine
│   │   ├── analyticsEngine.js       # Scoring & metrics engine
│   │   └── gamificationEngine.js    # XP, levels, achievements
│   ├──
│   ├── pages/
│   │   ├── dashboard.js             # Command center
│   │   ├── habits.js                # Habit management
│   │   ├── missions.js              # Mission control
│   │   ├── focus.js                 # Deep work timer
│   │   ├── analytics.js             # Analytics & insights
│   │   └── admin.js                 # Admin panel
│   ├──
│   ├── components/
│   │   └── sidebar.js               # Navigation sidebar
│   ├──
│   ├── assets/
│   │   └── icons.js                 # 43 SVG icons
│   └──
│   └── utils/
│       └── helpers.js               # Toast, formatters, utilities
│
└── netlify/functions/
    ├── sheets.js                    # Google Sheets API helper
    ├── sheets-read.js               # GET endpoint
    └── sheets-append.js             # POST endpoint
```
