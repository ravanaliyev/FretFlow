import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database/init.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { validateBody } from './middleware/validate.js';
import { registerSchema, loginSchema, submitScoreSchema } from './validation/schemas.js';

// Instantiate Express app
const app = express();

// Global Middlewares
app.use(cors());             // Cross-Origin Resource Sharing middleware
app.use(express.json());     // JSON body-parsing middleware

/**
 * Health check endpoint.
 * Quick connection validation probe for uptime monitors.
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Import API Routing Modules
import { register } from '../api/auth/register.js';
import { login } from '../api/auth/login.js';
import { refresh } from '../api/auth/refresh.js';
import { logout } from '../api/auth/logout.js';
import me from '../api/auth/me.js';
import usersMe from '../api/users/me.js';
import lessonsIndex from '../api/lessons/index.js';
import lessonsId from '../api/lessons/[id].js';
import progressLessons from '../api/progress/lessons.js';
import songsIndex from '../api/songs/index.js';
import songsId from '../api/songs/[id].js';
import scoresIndex from '../api/scores/index.js';
import scoresMe from '../api/scores/me.js';
import leaderboard from '../api/scores/leaderboard.js';
import challengeScore from '../api/scores/challenge.js';
import duelsRouter from '../api/duels/index.js';
import profile from '../api/gamification/profile.js';
import quests from '../api/gamification/quests.js';
import questClaim from '../api/gamification/quests/[id]/claim.js';
import achievements from '../api/gamification/achievements.js';
import milestones from '../api/gamification/milestones.js';
import statsPractice from '../api/stats/practice.js';
import statsAccuracy from '../api/stats/accuracy.js';
import statsActivity from '../api/stats/activity.js';
import statsSummary from '../api/stats/summary.js';
import history from '../api/history/index.js';
import practiceSessions from '../api/practice-sessions/index.js';
import adminReorder from '../api/admin/reorder.js';

// Mount Route Handlers
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
app.use('/api/scores/challenge', challengeScore);
app.use('/api/scores', validateBody(submitScoreSchema), scoresIndex);
app.use('/api/duels', duelsRouter);
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
app.use('/api/admin/lessons/reorder', adminReorder);

// Custom Fallback Handlers
app.use(notFoundHandler);    // Returns 404 for unmapped endpoints
app.use(errorHandler);       // Universal express error middleware catches unhandled exceptions

// Initialize SQLite database schema and boot Express server
const PORT = process.env.PORT || 3000;

initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

export default app;