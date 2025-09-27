// backend/routes/approvals.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const { z } = require('zod');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(auth, requireAdmin);

// Queue of submitted sessions awaiting review.
// NOTE: no join to clients; we rely on fields stored on the session.
router.get('/queue', async (req, res, next) => {
  try {
    const { rows } = await db.query(`
      SELECT
        s.id, s.tutor_id, s.session_date, s.start_time, s.end_time,
        s.position, s.client_first_name, s.client_last_name, s.subject_code,
        s.course_number, s.notes, s.status,
        COALESCE(u.email, 'Deleted Tutor') AS tutor_email
      FROM sessions s
      LEFT JOIN users u ON u.id = s.tutor_id
      WHERE s.status = 'submitted'
      ORDER BY s.session_date DESC, s.start_time DESC, s.id DESC
    `);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

const bulkSchema = z.object({
  approve: z.array(z.number().int()).optional().default([]),
  reject: z.array(z.object({
    id: z.number().int(),
    reason: z.string().min(1).max(1000)
  })).optional().default([])
});

// Bulk approve and/or reject with reasons (reasons appended to notes).
router.post('/bulk', validate(bulkSchema), async (req, res, next) => {
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    if (req.body.approve.length > 0) {
      await client.query(
        `UPDATE sessions SET status = 'approved', approved_by = $1, approved_at = now()
         WHERE id = ANY($2::int[]) AND status = 'submitted'`,
        [req.user.id, req.body.approve]
      );
    }

    for (const r of req.body.reject) {
      await client.query(
        `UPDATE sessions
           SET status = 'rejected',
               notes  = COALESCE(notes, '')
                       || CASE WHEN notes IS NULL OR notes = '' THEN '' ELSE '; ' END
                       || '[Rejected: ' || $2 || ']'
         WHERE id = $1 AND status = 'submitted'`,
        [r.id, r.reason]
      );
    }

    await client.query('COMMIT');
    res.json({ ok: true });
  } catch (e) {
    await client.query('ROLLBACK');
    next(e);
  } finally {
    client.release();
  }
});

module.exports = router;
