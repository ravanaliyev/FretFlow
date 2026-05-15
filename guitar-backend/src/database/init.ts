import db from '../config/database.js';

export async function initializeDatabase() {
  const schema = `
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        username TEXT UNIQUE NOT NULL,
        avatar_url TEXT,
        xp_total INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        best_score INTEGER DEFAULT 0,
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
        level INTEGER DEFAULT 1,
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

    -- Practice history table (synced from frontend)
    CREATE TABLE IF NOT EXISTS practice_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        lesson_id INTEGER NOT NULL,
        lesson_title TEXT NOT NULL,
        date TEXT NOT NULL,
        duration_seconds INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `;

  const statements = schema.split(';').filter(s => s.trim());

  for (const statement of statements) {
    if (statement.trim()) {
      await db.execute(statement);
    }
  }

  // Seed default achievements if not exists
  const achievements = await db.execute('SELECT COUNT(*) as count FROM achievements');
  if (achievements.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO achievements (name, description, icon, xp_reward) VALUES
        ('First Note', 'Complete your first lesson', '🎵', 20),
        ('Perfect Pitch', '100% accuracy on a lesson', '⭐', 25),
        ('Streak Starter', '3 day practice streak', '🔥', 30),
        ('Week Warrior', '7 day practice streak', '⚡', 50),
        ('Song Master', 'Complete 10 songs', '🏆', 75),
        ('Lesson Legend', 'Complete 25 lessons', '🏅', 100)
    `);
  }

  // Seed default lessons if not exists
  const lessons = await db.execute('SELECT COUNT(*) as count FROM lessons');
  if (lessons.rows[0].count === 0) {
    await db.execute(`
      INSERT INTO lessons (title, description, notes, difficulty, xp_reward, level, order_index) VALUES
        -- Level 1: The Foundations (5 Lessons)
        ('Open A String', 'The 5th string. Let it ring clearly.', '[{"note":"A2","time":0}]', 1, 10, 1, 2),
        ('Open D String', 'The 4th string. Getting to the middle.', '[{"note":"D3","time":0}]', 1, 10, 1, 3),
        ('Open G String', 'The 3rd string. A bright, open sound.', '[{"note":"G3","time":0}]', 1, 10, 1, 4),
        ('Open B String', 'The 2nd string. Almost at the top!', '[{"note":"B3","time":0}]', 1, 10, 1, 5),
        ('Open High E', 'The thinnest string (1st string). High and clear.', '[{"note":"E4","time":0}]', 1, 10, 1, 6),
        
        -- Level 2: Fret Mastery (4 Lessons)
        ('First Fret Challenge', 'Play F on the Low E (1st fret, 6th string)', '[{"note":"F2","time":0}]', 2, 15, 2, 7),
        ('Third Fret Power', 'Play G on the Low E (3rd fret, 6th string)', '[{"note":"G2","time":0}]', 2, 15, 2, 8),
        ('The C Major Step', 'Play C on the A string (3rd fret, 5th string)', '[{"note":"C3","time":0}]', 2, 15, 2, 9),
        ('Fretboard Explorer', 'Navigate between 1st and 3rd frets: F2 then G2.', '[{"note":"F2","time":0},{"note":"G2","time":1000}]', 2, 20, 2, 10),

        -- Level 3: Melodies (5 Lessons)
        ('Simple Blues Start', 'The classic E, G, A sequence.', '[{"note":"E2","time":0},{"note":"G2","time":500},{"note":"A2","time":1000}]', 3, 25, 3, 11),
        ('The "Smoke" Intro', 'Famous three-note riff fragment: E, G, A.', '[{"note":"E2","time":0},{"note":"G2","time":500},{"note":"A2","time":1000}]', 3, 30, 3, 12),
        ('Morning Call', 'Bright melodic sequence: G3, A3, B3.', '[{"note":"G3","time":0},{"note":"A3","time":500},{"note":"B3","time":1000}]', 3, 25, 3, 13),
        ('Low String Groove', 'A heavy bass-line riff: E2, F#2, G2.', '[{"note":"E2","time":0},{"note":"F#2","time":500},{"note":"G2","time":1000}]', 3, 30, 3, 14),
        ('Final Mastery', 'Combine everything: E2, A2, D3, G3, B3, E4.', '[{"note":"E2","time":0},{"note":"A2","time":500},{"note":"D3","time":1000},{"note":"G3","time":1500},{"note":"B3","time":2000},{"note":"E4","time":2500}]', 3, 50, 3, 15)
    `);
  }

  console.log('Database initialized successfully');
}