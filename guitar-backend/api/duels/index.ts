import { Router, type Request, type Response } from 'express';
import db from '../../src/config/database.js';
import { authenticate } from '../../src/middleware/auth.js';

const router = Router();

const DUEL_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateInviteCode() {
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += DUEL_CODE_CHARS.charAt(Math.floor(Math.random() * DUEL_CODE_CHARS.length));
  }
  return code;
}

async function createUniqueInviteCode() {
  let code = generateInviteCode();
  let existing = await db.execute({ sql: 'SELECT id FROM duels WHERE invite_code = ?', args: [code] });
  while (existing.rows.length > 0) {
    code = generateInviteCode();
    existing = await db.execute({ sql: 'SELECT id FROM duels WHERE invite_code = ?', args: [code] });
  }
  return code;
}

async function getDuelByCode(inviteCode: string) {
  const result = await db.execute({
    sql: `SELECT d.*, h.username AS host_username, g.username AS guest_username
          FROM duels d
          JOIN users h ON d.host_user_id = h.id
          LEFT JOIN users g ON d.guest_user_id = g.id
          WHERE d.invite_code = ?`,
    args: [inviteCode],
  });
  return result.rows[0] as any;
}

router.use(authenticate);

router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { song_id } = req.body || {};
    const inviteCode = await createUniqueInviteCode();

    const result = await db.execute({
      sql: 'INSERT INTO duels (host_user_id, song_id, invite_code, status, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
      args: [userId, song_id ?? null, inviteCode, 'waiting'],
    });

    const duelId = Number(result.lastInsertRowid);
    const duel = await getDuelByCode(inviteCode);

    res.status(201).json({
      success: true,
      data: {
        id: duelId,
        invite_code: inviteCode,
        invite_url: `/dashboard/duel/${inviteCode}`,
        status: 'waiting',
        host_user_id: userId,
        host_username: duel?.host_username || null,
        guest_user_id: null,
        guest_username: null,
        song_id: song_id ?? null,
        host_score: null,
        guest_score: null,
        host_accuracy: null,
        guest_accuracy: null,
        winner_user_id: null,
      },
    });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to create duel', code: 'SERVER_ERROR' });
  }
});

router.get('/:inviteCode', async (req: Request, res: Response) => {
  try {
    const duel = await getDuelByCode(req.params.inviteCode);
    if (!duel) {
      res.status(404).json({ error: 'Duel not found', code: 'NOT_FOUND' });
      return;
    }

    res.json({
      data: {
        id: duel.id,
        invite_code: duel.invite_code,
        invite_url: `/dashboard/duel/${duel.invite_code}`,
        status: duel.status,
        host_user_id: duel.host_user_id,
        host_username: duel.host_username,
        guest_user_id: duel.guest_user_id,
        guest_username: duel.guest_username,
        song_id: duel.song_id,
        host_score: duel.host_score,
        guest_score: duel.guest_score,
        host_accuracy: duel.host_accuracy,
        guest_accuracy: duel.guest_accuracy,
        winner_user_id: duel.winner_user_id,
      },
    });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to load duel', code: 'SERVER_ERROR' });
  }
});

router.post('/:inviteCode/join', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const inviteCode = req.params.inviteCode;
    const duel = await getDuelByCode(inviteCode);

    if (!duel) {
      res.status(404).json({ error: 'Duel not found', code: 'NOT_FOUND' });
      return;
    }

    if (duel.guest_user_id && duel.guest_user_id !== userId) {
      res.status(400).json({ error: 'This duel already has a guest', code: 'DUEL_FULL' });
      return;
    }

    if (duel.host_user_id === userId) {
      res.json({ data: duel });
      return;
    }

    if (!duel.guest_user_id) {
      await db.execute({
        sql: 'UPDATE duels SET guest_user_id = ?, status = ? WHERE id = ?',
        args: [userId, 'active', duel.id],
      });
    }

    const updated = await getDuelByCode(inviteCode);
    res.json({ data: updated });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to join duel', code: 'SERVER_ERROR' });
  }
});

router.post('/:inviteCode/ready', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const inviteCode = req.params.inviteCode;
    const duel = await getDuelByCode(inviteCode);

    if (!duel) {
      res.status(404).json({ error: 'Duel not found', code: 'NOT_FOUND' });
      return;
    }

    const isHost = duel.host_user_id === userId;
    const isGuest = duel.guest_user_id === userId;
    if (!isHost && !isGuest) {
      res.status(403).json({ error: 'You are not a participant in this duel', code: 'FORBIDDEN' });
      return;
    }

    const hostReady = isHost ? true : Boolean(duel.host_ready);
    const guestReady = isGuest ? true : Boolean(duel.guest_ready);
    const updates: Array<string | number | boolean> = [];
    let query = 'UPDATE duels SET ';

    if (isHost) {
      query += 'host_ready = ?';
      updates.push(true);
    } else {
      query += 'guest_ready = ?';
      updates.push(true);
    }

    if (duel.guest_user_id && hostReady && guestReady && duel.status !== 'started') {
      query += ', status = ?, started_at = CURRENT_TIMESTAMP';
      updates.push('started');
    }

    query += ' WHERE id = ?';
    updates.push(duel.id);

    await db.execute({ sql: query, args: updates });

    const updated = await getDuelByCode(inviteCode);
    res.json({ data: updated });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to ready duel', code: 'SERVER_ERROR' });
  }
});

router.post('/:inviteCode/finish', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const inviteCode = req.params.inviteCode;
    const { score, accuracy_percent } = req.body || {};

    if (typeof score !== 'number') {
      res.status(400).json({ error: 'Score must be a number', code: 'VALIDATION_ERROR' });
      return;
    }

    const duel = await getDuelByCode(inviteCode);
    if (!duel) {
      res.status(404).json({ error: 'Duel not found', code: 'NOT_FOUND' });
      return;
    }

    if (![duel.host_user_id, duel.guest_user_id].includes(userId)) {
      res.status(403).json({ error: 'Only duel participants can submit results', code: 'FORBIDDEN' });
      return;
    }

    const isHost = duel.host_user_id === userId;
    const values: Array<string | number | null> = [];
    let updateSql = 'UPDATE duels SET ';

    if (isHost) {
      updateSql += 'host_score = ?, host_accuracy = ?';
      values.push(score, typeof accuracy_percent === 'number' ? accuracy_percent : null);
    } else {
      if (!duel.guest_user_id) {
        res.status(400).json({ error: 'You must join the duel before submitting results', code: 'NOT_JOINED' });
        return;
      }
      updateSql += 'guest_score = ?, guest_accuracy = ?';
      values.push(score, typeof accuracy_percent === 'number' ? accuracy_percent : null);
    }

    if (duel.status === 'waiting' && duel.guest_user_id) {
      updateSql += ', status = ?';
      values.push('active');
    }

    updateSql += ' WHERE id = ?';
    values.push(duel.id);

    await db.execute({ sql: updateSql, args: values });

    const updated = await getDuelByCode(inviteCode);
    let winnerId = updated.winner_user_id;
    let newStatus = updated.status;

    if (updated.host_score !== null && updated.guest_score !== null) {
      newStatus = 'finished';
      const hostScore = Number(updated.host_score);
      const guestScore = Number(updated.guest_score);
      if (hostScore === guestScore) {
        winnerId = null;
      } else {
        winnerId = hostScore > guestScore ? updated.host_user_id : updated.guest_user_id;
      }
      await db.execute({
        sql: 'UPDATE duels SET winner_user_id = ?, status = ?, finished_at = CURRENT_TIMESTAMP WHERE id = ?',
        args: [winnerId, newStatus, duel.id],
      });
    }

    const finishedDuel = await getDuelByCode(inviteCode);
    
    // Check achievements for both players
    import('../../src/services/achievement.service.js').then(m => {
      m.checkAndGrantAchievements(finishedDuel.host_user_id).catch(console.error);
      if (finishedDuel.guest_user_id) {
        m.checkAndGrantAchievements(finishedDuel.guest_user_id).catch(console.error);
      }
    });

    res.json({ data: finishedDuel });
  } catch (_error) {
    console.error(_error);
    res.status(500).json({ error: 'Failed to submit duel results', code: 'SERVER_ERROR' });
  }
});

export default router;
