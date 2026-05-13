import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/init.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateBody } from './middleware/validate.js';
import { registerSchema, loginSchema, submitScoreSchema } from './validation/schemas.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
import { register } from '../api/auth/register';
import { login } from '../api/auth/login';
import { refresh } from '../api/auth/refresh';
import { logout } from '../api/auth/logout';
import me from '../api/auth/me';
import usersMe from '../api/users/me';
import lessonsIndex from '../api/lessons/index';
import lessonsId from '../api/lessons/[id]';
import progressLessons from '../api/progress/lessons';
import songsIndex from '../api/songs/index';
import songsId from '../api/songs/[id]';
import scoresIndex from '../api/scores/index';
import scoresMe from '../api/scores/me';
import leaderboard from '../api/scores/leaderboard';
import profile from '../api/gamification/profile';
import quests from '../api/gamification/quests';
import questClaim from '../api/gamification/quests/[id]/claim';
import achievements from '../api/gamification/achievements';
import milestones from '../api/gamification/milestones';
import statsPractice from '../api/stats/practice';
import statsAccuracy from '../api/stats/accuracy';
import statsActivity from '../api/stats/activity';
import statsSummary from '../api/stats/summary';
import history from '../api/history';
import practiceSessions from '../api/practice-sessions';

app.use('/api/auth/register', validateBody(registerSchema), register);
app.use('/api/auth/login', validateBody(loginSchema), login);
app.use('/api/auth/refresh', refresh);
app.use('/api/auth/logout', logout);
app.use('/api/auth/me', me);
app.use('/api/users/me', usersMe);
app.use('/api/lessons/:id', lessonsId);
app.use('/api/lessons', lessonsIndex);
app.use('/api/progress/lessons', progressLessons);
app.use('/api/songs/:id', songsId);
app.use('/api/songs', songsIndex);
app.use('/api/scores/me', scoresMe);
app.use('/api/scores/leaderboard', leaderboard);
app.use('/api/scores', validateBody(submitScoreSchema), scoresIndex);
app.use('/api/gamification/profile', profile);
app.use('/api/gamification/quests/:id/claim', questClaim);
app.use('/api/gamification/quests', quests);
app.use('/api/gamification/achievements', achievements);
app.use('/api/gamification/milestones', milestones);
app.use('/api/stats/practice', statsPractice);
app.use('/api/stats/accuracy', statsAccuracy);
app.use('/api/stats/activity', statsActivity);
app.use('/api/stats/summary', statsSummary);
app.use('/api/history', history);
app.use('/api/practice-sessions', practiceSessions);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;