-- Guitar Learning App Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    username TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Admin users (separate table)
CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    permissions TEXT DEFAULT '{}',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Streaks table
CREATE TABLE IF NOT EXISTS streaks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_practice_date DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '[]',
    difficulty INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 10,
    order_index INTEGER DEFAULT 0
);

-- Lesson progress table
CREATE TABLE IF NOT EXISTS lesson_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lesson_id INTEGER NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    attempts INTEGER DEFAULT 0,
    best_accuracy REAL,
    last_attempt_result TEXT,
    completed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
    UNIQUE(user_id, lesson_id)
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    difficulty INTEGER DEFAULT 1,
    notes TEXT NOT NULL DEFAULT '[]',
    xp_reward INTEGER DEFAULT 50
);

-- Song scores table
CREATE TABLE IF NOT EXISTS song_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    song_id INTEGER NOT NULL,
    score INTEGER DEFAULT 0,
    accuracy_percent REAL,
    xp_earned INTEGER DEFAULT 0,
    played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
);

-- Quests table
CREATE TABLE IF NOT EXISTS quests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    quest_type TEXT NOT NULL,
    target_value INTEGER DEFAULT 1,
    current_value INTEGER DEFAULT 0,
    xp_reward INTEGER DEFAULT 25,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    xp_reward INTEGER DEFAULT 20
);

-- User achievements junction table
CREATE TABLE IF NOT EXISTS user_achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    achievement_id INTEGER NOT NULL,
    earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE(user_id, achievement_id)
);

-- Sessions table (for refresh token tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Practice sessions table
CREATE TABLE IF NOT EXISTS practice_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    started_at DATETIME NOT NULL,
    ended_at DATETIME,
    duration_seconds INTEGER DEFAULT 0,
    notes_played TEXT DEFAULT '[]',
    lesson_id INTEGER,
    song_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL,
    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE SET NULL
);

-- Daily stats table
CREATE TABLE IF NOT EXISTS daily_stats (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    date DATE NOT NULL,
    total_practice_seconds INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    songs_completed INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    avg_accuracy REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

-- Seed default achievements
INSERT INTO achievements (name, description, icon, xp_reward) VALUES
    ('First Note', 'Complete your first lesson', 'music-note', 20),
    ('Perfect Pitch', '100% accuracy on a lesson', 'star', 25),
    ('Streak Starter', '3 day practice streak', 'fire', 30),
    ('Week Warrior', '7 day practice streak', 'flame', 50),
    ('Song Master', 'Complete 10 songs', 'trophy', 75),
    ('Lesson Legend', 'Complete 25 lessons', 'medal', 100);

-- Seed default lessons (beginner single-note lessons)
INSERT INTO lessons (title, description, notes, difficulty, xp_reward, order_index) VALUES
    ('Play Open E', 'Play the low E string (6th string) open', '[{"note":"E2","time":0}]', 1, 10, 1),
    ('Play Open A', 'Play the A string (5th string) open', '[{"note":"A2","time":0}]', 1, 10, 2),
    ('Play Open D', 'Play the D string (4th string) open', '[{"note":"D3","time":0}]', 1, 10, 3),
    ('Play Open G', 'Play the G string (3rd string) open', '[{"note":"G3","time":0}]', 1, 10, 4),
    ('Play Open B', 'Play the B string (2nd string) open', '[{"note":"B3","time":0}]', 1, 10, 5),
    ('Play High E', 'Play the high E string (1st string) open', '[{"note":"E4","time":0}]', 1, 10, 6);