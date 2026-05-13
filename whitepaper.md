# Guitar Learning App - Backend Architecture Plan

## Context
Building a backend for a guitar learning web project with:
- Two React frontends (login screen, introduction screen)
- Client-side pitch detection algorithm (js-guitar-pitch-detector)
- Goal: Support lessons, gamification, and songs with progression system

## Tech Stack
- **Backend**: Node.js + Express + TypeScript
- **Database**: Turso (SQLite edge database) with `@libsql/client`
- **Auth**: JWT (access + refresh tokens), bcrypt for passwords
- **Real-time**: Not needed - algorithm runs client-side, results submitted to backend

**Note**: Using `@libsql/client` (async driver) for serverless compatibility. NOT `better-sqlite3` (sync, local file only).

## User Progression Flow
```
Beginner Lessons (Single Note) → Intermediate Lessons (Multi-Note) → Songs
```

---

## Database Schema

### Tables

**users**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| email | TEXT UNIQUE | User email |
| password_hash | TEXT | Bcrypt hash |
| username | TEXT UNIQUE | Display name |
| avatar_url | TEXT | Optional avatar |
| xp_total | INTEGER | Cumulative XP |
| level | INTEGER | Current level (1-10) |
| created_at | DATETIME | Registration date |

**streaks**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| current_streak | INTEGER | Days in current streak |
| longest_streak | INTEGER | All-time best |
| last_practice_date | DATE | Last activity |

**lessons**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Lesson name (e.g., "Play Open E") |
| description | TEXT | Instructions |
| target_note | TEXT | Note to play (e.g., "E2") |
| difficulty | INTEGER | 1=beginner, 2=intermediate |
| xp_reward | INTEGER | XP for completing |
| order_index | INTEGER | Lesson sequence |

**lesson_progress**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| lesson_id | INTEGER FK | References lessons |
| is_completed | BOOLEAN | Lesson done? |
| attempts | INTEGER | Times attempted |
| best_accuracy | REAL | Best % achieved |
| completed_at | DATETIME | First completion time |

**songs**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| title | TEXT | Song title |
| artist | TEXT | Artist name |
| difficulty | INTEGER | 1-5 scale |
| notes | TEXT | JSON: [{note, time, duration}] |
| xp_reward | INTEGER | XP for completing |

**song_scores**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| song_id | INTEGER FK | References songs |
| score | INTEGER | 0-100 |
| accuracy_percent | REAL | % accuracy |
| xp_earned | INTEGER | XP gained |
| played_at | DATETIME | When played |

**quests**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| title | TEXT | Quest name |
| description | TEXT | What to do |
| quest_type | TEXT | practice_time, lessons_complete, songs_complete |
| target_value | INTEGER | Goal to reach |
| current_value | INTEGER | Progress |
| xp_reward | INTEGER | Reward |
| is_completed | BOOLEAN | Done? |
| is_claimed | BOOLEAN | Reward claimed? |
| expires_at | DATETIME | Daily reset |

**achievements**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| name | TEXT | Achievement name |
| description | TEXT | How to earn |
| icon | TEXT | Icon identifier |
| xp_reward | INTEGER | Bonus XP |

**user_achievements**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| achievement_id | INTEGER FK | References achievements |
| earned_at | DATETIME | When earned |

**sessions**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| token_hash | TEXT | Refresh token hash |
| expires_at | DATETIME | Expiration |
| created_at | DATETIME | Login time |

**practice_sessions**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| started_at | DATETIME | Session start |
| ended_at | DATETIME | Session end |
| duration_seconds | INTEGER | Total practice time |
| notes_played | TEXT | JSON array of note names |
| lesson_id | INTEGER FK | Optional, if practice was lesson |
| song_id | INTEGER FK | Optional, if practice was song |
| created_at | DATETIME | Record creation |

**daily_stats**
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PK | Auto-increment |
| user_id | INTEGER FK | References users |
| date | DATE | The date |
| total_practice_seconds | INTEGER | Total practice that day |
| sessions_count | INTEGER | Number of sessions |
| lessons_completed | INTEGER | Lessons done that day |
| songs_completed | INTEGER | Songs done that day |
| xp_earned | INTEGER | XP earned that day |
| avg_accuracy | REAL | Average accuracy % |

---

## Practice Statistics API

### Practice Stats (`/api/stats`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /stats/practice | Yes | Get practice stats (today/week/month/all-time) |
| GET | /stats/accuracy | Yes | Get accuracy trends over time |
| GET | /stats/activity | Yes | Get activity breakdown (notes, frequency) |
| GET | /stats/summary | Yes | Quick summary for dashboard |

### Query Parameters
- `period`: today | week | month | all (default: week)
- `limit`: number of records (default: 30)

---

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Login |
| POST | /auth/refresh | No | Refresh access token |
| POST | /auth/logout | Yes | Invalidate session |

### Users (`/api/users`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /users/me | Yes | Get profile |
| PATCH | /users/me | Yes | Update profile |

### Lessons (`/api/lessons`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /lessons | Yes | List all lessons |
| GET | /lessons/:id | Yes | Get lesson details |
| POST | /lessons | Yes | Create lesson (admin) |
| PATCH | /lessons/:id | Yes | Update lesson (admin) |
| DELETE | /lessons/:id | Yes | Delete lesson (admin) |

### Lesson Progress (`/api/progress`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /progress/lessons | Yes | Get all lesson progress |
| POST | /progress/lessons | Yes | Submit lesson attempt |
| GET | /progress/lessons/:id | Yes | Get specific lesson progress |

### Songs (`/api/songs`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /songs | Yes | List songs |
| GET | /songs/:id | Yes | Get song details |
| POST | /songs | Yes | Create song (admin) |
| PATCH | /songs/:id | Yes | Update song (admin) |
| DELETE | /songs/:id | Yes | Delete song (admin) |

### Song Scores (`/api/scores`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /scores | Yes | Submit song score |
| GET | /scores/me | Yes | My scores |
| GET | /scores/leaderboard | Yes | Global leaderboard |

### Gamification (`/api/gamification`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /gamification/profile | Yes | XP, level, streak |
| GET | /gamification/quests | Yes | Daily quests |
| POST | /gamification/quests/:id/claim | Yes | Claim quest reward |
| GET | /gamification/achievements | Yes | All achievements |
| GET | /gamification/milestones | Yes | All milestones |

### Statistics (`/api/stats`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /stats/practice | Yes | Practice time stats |
| GET | /stats/accuracy | Yes | Accuracy trends |
| GET | /stats/activity | Yes | Most played notes, activity |
| GET | /stats/summary | Yes | Dashboard summary |

---

## XP & Level System

### Level Thresholds (cumulative)
| Level | XP Required |
|-------|-------------|
| 1 | 0 |
| 2 | 100 |
| 3 | 250 |
| 4 | 500 |
| 5 | 1000 |
| 6 | 2000 |
| 7 | 4000 |
| 8 | 7500 |
| 9 | 12000 |
| 10 | 20000 |

### XP Rewards
| Action | XP |
|--------|-----|
| Lesson completed | 10 |
| Song completed | 50 |
| Quest completed | 25 |
| Perfect accuracy | 20 |
| Daily streak bonus | 15 |

---

## Achievements & Milestones

### Achievements
- "First Note" - Complete first lesson
- "Perfect Pitch" - 100% accuracy on a lesson
- "Streak Starter" - 3 day streak
- "Week Warrior" - 7 day streak
- "Song Master" - Complete 10 songs
- "Lesson Legend" - Complete 25 lessons

### Milestones
- Reach Level 5
- Reach Level 10
- 30 day streak
- 100 songs completed

---

## Practice Statistics (Frontend-tracked)

### How It Works
1. Frontend tracks session start/end timestamps
2. Client sends session data to backend after completion
3. Backend aggregates data for stats queries
4. Data older than 30 days is cleaned up (retention policy)

### Stats Collected
- **Total time**: practiced today, this week, this month
- **Accuracy trends**: per-session accuracy over last 30 days
- **Activity breakdown**: which notes are played most frequently
- **Summary stats**: quick dashboard data (total XP, total practice, current streak)

### Data Retention
- Practice sessions stored for 30 days
- Daily aggregates stored for 90 days (for trends)
- Old data auto-cleaned on daily job

### Stats Response Example
```json
{
  "period": "week",
  "total_practice_seconds": 3600,
  "sessions_count": 5,
  "lessons_completed": 3,
  "songs_completed": 1,
  "xp_earned": 145,
  "avg_accuracy": 87.5,
  "accuracy_trend": [
    { "date": "2026-05-07", "accuracy": 82 },
    { "date": "2026-05-08", "accuracy": 85 },
    { "date": "2026-05-09", "accuracy": 87 }
  ],
  "most_played_notes": [
    { "note": "E2", "count": 45 },
    { "note": "A2", "count": 38 }
  ]
}
```

---

## Project Structure (Vercel Serverless)

```
guitar-backend/
├── api/
│   ├── auth/
│   │   ├── register.ts       # POST /api/auth/register
│   │   ├── login.ts          # POST /api/auth/login
│   │   ├── refresh.ts        # POST /api/auth/refresh
│   │   ├── logout.ts         # POST /api/auth/logout
│   │   └── me.ts             # GET /api/auth/me
│   ├── users/
│   │   └── me.ts             # GET, PATCH /api/users/me
│   ├── lessons/
│   │   ├── index.ts          # GET, POST /api/lessons
│   │   └── [id].ts           # GET, PATCH, DELETE /api/lessons/:id
│   ├── progress/
│   │   └── lessons.ts        # GET, POST /api/progress/lessons
│   ├── songs/
│   │   ├── index.ts          # GET, POST /api/songs
│   │   └── [id].ts           # GET, PATCH, DELETE /api/songs/:id
│   ├── scores/
│   │   ├── index.ts          # POST /api/scores
│   │   ├── me.ts             # GET /api/scores/me
│   │   └── leaderboard.ts    # GET /api/scores/leaderboard
│   ├── gamification/
│   │   ├── profile.ts        # GET /api/gamification/profile
│   │   ├── quests.ts         # GET /api/gamification/quests
│   │   └── quests/[id]/claim.ts  # POST /api/gamification/quests/:id/claim
│   └── stats/
│       ├── practice.ts       # GET /api/stats/practice
│       ├── accuracy.ts        # GET /api/stats/accuracy
│       ├── activity.ts       # GET /api/stats/activity
│       └── summary.ts        # GET /api/stats/summary
├── src/
│   ├── config/
│   │   └── database.ts        # Turso connection using @libsql/client (async)
│   ├── middleware/
│   │   ├── auth.ts            # JWT verification
│   │   └── errorHandler.ts    # Error handling
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── lesson.service.ts
│   │   └── ...
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── hash.ts
│   │   └── xpCalculator.ts
│   └── lib/
│       └── better-sqlite3.ts  # Turso driver
├── data/
│   └── guitar_app.db          # Local fallback (dev only)
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## Missing Frontend Components (Identified from Code Review)

### Critical Gaps

1. **No State Management**
   - No Context API, Redux, or Zustand
   - All gamification data hardcoded (HeroSection: 14 Days, 2,450 XP, "Acoustic Pro")
   - AuthCard has local useState only, no global auth state

2. **No API Integration**
   - AuthCard form submits nowhere (onSubmit is no-op)
   - Zero API calls from any component
   - All data is mock/static

3. **No Protected Routes**
   - No redirect to /login if unauthenticated
   - No auth guard on any route

4. **Missing Pages**
   - No lessons page (only / and /login exist)
   - No song library page
   - No practice/playing page
   - No leaderboard page
   - No profile/settings page
   - No dashboard

5. **No Pitch Detector Integration**
   - js-guitar-pitch-detector exists but not connected to React
   - No mechanism to submit played notes

---

## Frontend Architecture

### Two Entry Points (Keep Both)
1. **guitar_loginscreen** - Login-focused SPA (single page, no router)
2. **guitar_introductionscreen** - Full app with routing (/, /login)

### State Management
- **React Context API** for:
  - AuthContext (user authentication state)
  - GamificationContext (XP, level, streak, quests)
  - PracticeContext (current session, notes played)

### API Client
- Singleton API client with automatic token refresh
- JWT stored in memory (not localStorage for security)
- Base URL configurable per environment

### Protected Route Component
```tsx
<ProtectedRoute>
  <LessonsPage />
</ProtectedRoute>
```

---

## Design System (Unified Style)

### Color Palette
| Name | Hex | Usage |
|------|-----|-------|
| primary-500 | `#58cc02` | Primary CTAs, success states |
| primary-600 | `#58a700` | Button borders, active states |
| accent-500 | `#1cb0f6` | Links, secondary accents |
| dark-900 | `#0a0a0a` | Page background |
| dark-800 | `#141414` | Cards, panels |
| dark-700 | `#1e1e1e` | Borders, dividers |
| neon-green | `#39ff14` | Neon glow effects |

### Typography
- **Font Family**: Inter (Google Fonts)
- **Weights**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Headings**: `font-bold` (700)
- **Scale**: text-xs (12px), text-sm (14px), text-base (16px), text-lg (18px), text-xl (20px), text-2xl (24px), text-3xl (32px)

### Button System (Duolingo-style)
```css
.btn-duo {
  @apply relative inline-flex items-center justify-center 
        font-extrabold tracking-wide rounded-2xl 
        transition-all duration-150 
        active:translate-y-1 select-none;
}
.btn-duo-primary {
  @apply bg-primary-500 text-white 
         border-b-4 border-primary-600 
         hover:bg-[#61e002] 
         active:border-b-0 active:mt-1;
}
.btn-duo-secondary {
  @apply bg-dark-800 text-white 
         border-2 border-b-4 border-dark-700 
         hover:bg-dark-700 
         active:border-b-2 active:mt-0.5;
}
```

### Card System (Glassmorphism)
```css
.glass-panel {
  @apply bg-white/5 backdrop-blur-xl 
         border border-white/10 
         shadow-[0_8px_32px_0_rgba(0,0,0,0.37)];
}
```

### Input System
```css
.glass-input {
  @apply bg-white/5 border border-white/10 
         text-white placeholder-white/40 
         focus:bg-white/10 focus:border-primary-500 
         focus:ring-1 focus:ring-primary-500 
         transition-all duration-300 outline-none
         rounded-xl px-4 py-3;
}
```

### Animation Patterns
- **Entrance**: `fade-in + slide-up`, duration 0.6-0.8s, delay 0.2-0.4s
- **Hover**: `scale(1.02)`, duration 150ms
- **Tap**: `scale(0.98)`, duration 150ms
- **Float**: `translateY(0 to -20px)`, 6s ease-in-out infinite

### Neon Effects
```css
.neon-text {
  text-shadow: 0 0 10px rgba(57, 255, 20, 0.5), 
               0 0 20px rgba(57, 255, 20, 0.3);
}
.neon-border {
  box-shadow: 0 0 10px rgba(57, 255, 20, 0.3);
}
```

### Spacing System
- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

### Border Radius
- **sm**: rounded-lg (8px)
- **md**: rounded-xl (12px)
- **lg**: rounded-2xl (16px)
- **full**: rounded-full (pill buttons)

---

## New Pages to Build

### 1. Lessons Page (`/lessons`)
- List all available lessons (paginated from GET /lessons)
- Show difficulty, title, completion status
- Progress indicator for each lesson
- Locked/unlocked based on progression

### 2. Lesson Practice Page (`/lessons/:id/practice`)
- Play a single note lesson
- Show target note (e.g., "Play E2")
- Use pitch detector to capture user input
- Real-time feedback (correct/incorrect)
- Submit result to POST /progress/lessons

### 3. Song Library Page (`/songs`)
- List all songs (paginated from GET /songs)
- Show difficulty, artist, best score
- Filter by difficulty
- Locked until prerequisites complete

### 4. Song Practice Page (`/songs/:id/play`)
- Play along with a song
- Show scrolling notes/timeline
- Use SongAnalyzer from pitch detector
- Real-time scoring with DTW
- Submit score to POST /scores

### 5. Dashboard (`/dashboard`)
- Summary stats: total XP, level, streak
- Practice time today/week
- Recent activity
- Quick actions (continue lesson, play song)

### 6. Profile Page (`/profile`)
- Edit username, avatar
- View achievements
- View statistics
- Account settings

### 7. Leaderboard Page (`/leaderboard`)
- Global ranking (GET /scores/leaderboard)
- Filter by time period
- Show top players with XP

---

## New Frontend Components

### Auth Components
- `AuthProvider` - Context for auth state
- `ProtectedRoute` - Route wrapper
- `LoginForm` - Connected to /auth/login
- `RegisterForm` - Connected to /auth/register

### Gamification Components
- `XPBadge` - Shows current XP and level
- `StreakCounter` - Shows current streak
- `QuestCard` - Individual quest with progress
- `QuestList` - Daily quests from API
- `AchievementBadge` - Unlock achievement display

### Practice Components
- `PitchDetector` - Wrapper for pitch detection library
- `NoteDisplay` - Shows target note to play
- `ScoreDisplay` - Real-time score feedback
- `SessionTimer` - Practice time tracker

### Shared Components
- `LoadingSpinner` - Loading states
- `ErrorMessage` - Error display
- `Pagination` - Pagination controls
- `Modal` - Reusable modal

---

## Implementation Order (Updated)

1. **Project Setup**
   - Initialize Node.js + Express + TypeScript backend
   - Set up SQLite database + create schema
   - Initialize React frontend with state management

2. **Frontend Foundation**
   - Add AuthContext (user state management)
   - Create API client with JWT handling
   - Add protected route component
   - Connect AuthCard to /auth/login and /auth/register

3. **Authentication**
   - Register, login, logout
   - JWT middleware
   - Session management
   - Auto-redirect on auth state change

4. **Gamification UI**
   - Connect HeroSection to /gamification/profile
   - Connect GamificationShowcase to /gamification/quests
   - Add real XP, level, streak data

5. **Lessons & Progress**
   - Create lessons list page
   - Create lesson practice page (with pitch detector)
   - Connect to POST /progress/lessons

6. **Songs & Scoring**
   - Create songs list page
   - Create song practice page
   - Add leaderboard page

7. **Practice Statistics**
   - Add practice session tracking UI
   - Create stats dashboard

---

## Deployment Plan

### All on Vercel
- **Frontend**: Vercel (static React app - free)
- **Backend**: Vercel Serverless Functions (API routes - free tier: 100k requests/day)
- **Database**: Turso (SQLite edge database - free tier)

### Project Structure for Vercel
```
guitar-backend/
├── api/
│   ├── auth/
│   │   ├── register.ts
│   │   ├── login.ts
│   │   └── ...
│   ├── lessons/
│   ├── songs/
│   └── ...
├── src/
│   ├── config/
│   ├── middleware/
│   ├── services/
│   └── ...
├── package.json
└── vercel.json
```

### Environment Variables (Vercel)

**Backend (Vercel - Runtime env vars)**
```
DATABASE_URL=libsql://my-db.turso.io
TURSO_AUTH_TOKEN=turso_xxx
JWT_SECRET=your-256-bit-secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

**Frontend (Vercel - build time)**
```
VITE_API_URL=https://your-project.vercel.app/api
```

### CORS Configuration
Backend CORS set to allow Vercel frontend origin.

---

## Verification
- Run `npm run dev` → backend on port 3000
- Test auth endpoints with curl/Postman
- Verify database records created
- Check JWT token authentication works
- Verify XP calculation and level updates