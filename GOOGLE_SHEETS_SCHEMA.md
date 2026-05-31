# Google Sheets Schema

## Overview

Google Sheets serves as the primary database. Each sheet is a table with headers in row 1 and data starting from row 2.

## Sheet: USERS

| Column | Header | Type | Example | Description |
|--------|--------|------|---------|-------------|
| A | id | string | `user_001` | Unique user identifier |
| B | username | string | `Commander` | Display name |
| C | email | string | `user@email.com` | Login email |
| D | role | string | `admin` or `user` | Access level |
| E | level | number | `12` | Current level (1-50) |
| F | xp | number | `3450` | Total XP accumulated |
| G | streak | number | `23` | Current consecutive day streak |
| H | total_focus_hours | number | `156.5` | Lifetime deep work hours |
| I | created_at | string | `2026-01-15T...` | ISO timestamp |
| J | last_active | string | `2026-05-12T...` | ISO timestamp |

## Sheet: HABITS

| Column | Header | Type | Example | Description |
|--------|--------|------|---------|-------------|
| A | id | string | `habit_001` | Unique habit identifier |
| B | user_id | string | `user_001` | Owner reference |
| C | title | string | `Morning Meditation` | Habit name |
| D | category | string | `mind` | Category tag |
| E | difficulty | number | `3` | 1-5 difficulty scale |
| F | target | number | `1` | Daily completion target |
| G | frequency | string | `daily` | daily/weekly/custom |
| H | reward_xp | number | `20` | XP awarded on completion |
| I | created_at | string | `2026-01-20T...` | ISO timestamp |
| J | status | string | `active` | active/paused/archived |

## Sheet: DAILY_LOGS

| Column | Header | Type | Example | Description |
|--------|--------|------|---------|-------------|
| A | id | string | `log_001` | Unique log identifier |
| B | user_id | string | `user_001` | User reference |
| C | habit_id | string | `habit_001` | Habit reference |
| D | completed | boolean | `TRUE` | Completion status |
| E | date | string | `2026-05-12` | Log date (YYYY-MM-DD) |

## Sheet: MISSIONS

| Column | Header | Type | Example | Description |
|--------|--------|------|---------|-------------|
| A | id | string | `mission_001` | Unique mission identifier |
| B | user_id | string | `user_001` | Owner reference |
| C | title | string | `Launch MVP` | Mission name |
| D | priority | string | `P1` | P1/P2/P3/P4 |
| E | deadline | string | `2026-06-01` | ISO date |
| F | reward | number | `500` | XP reward on completion |
| G | status | string | `in_progress` | not_started/in_progress/blocked/completed |
| H | completion_percentage | number | `65` | 0-100 progress |
| I | created_at | string | `2026-04-01T...` | ISO timestamp |

## Sheet: ANALYTICS

| Column | Header | Type | Example | Description |
|--------|--------|------|---------|-------------|
| A | id | string | `an_001` | Unique analytics entry ID |
| B | user_id | string | `user_001` | User reference |
| C | date | string | `2026-05-12` | Analytics date |
| D | total_xp | number | `3450` | Total XP |
| E | streak_days | number | `23` | Current streak length |
| F | productivity_score | number | `87` | 0-100 productivity |
| G | weekly_consistency | number | `92` | 0-100 weekly completion |
| H | deep_work_average | number | `3.5` | Avg daily focus hours |
| I | discipline_score | number | `91` | 0-100 discipline metric |
| J | habits_completed | number | `5` | Habits completed today |
| K | missions_completed | number | `3` | Total missions completed |

## Setting Up the Spreadsheet

1. Create a new Google Spreadsheet
2. Name it `NEXUS Life Command Center`
3. Create 6 sheets (tabs) named exactly as above: `USERS`, `HABITS`, `DAILY_LOGS`, `MISSIONS`, `ANALYTICS`
4. Add the header rows exactly as specified above
5. Share the spreadsheet with your service account email as Editor
6. Copy the Spreadsheet ID from the URL: `https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit`
7. Set `GOOGLE_SHEETS_ID` in your environment variables
