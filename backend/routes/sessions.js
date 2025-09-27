// backend/routes/sessions.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const { hasColumn, getClientsNameColumn, clientsHasUserId } = require('../lib/schema');
const { INTRO_POS, TRAINING_POS, IDS_POS, applyMinRules, POSITIONS } = require('../lib/constants');

const router = express.Router();
router.use(auth);

/**
 * Your schema stores session_date (date) + start_time (time) + end_time (time).
 * We compose full timestamps for the UI, handling cross-midnight sessions.
 */
const START_TS = `(s.session_date::timestamp + s.start_time)`;
const END_TS = `CASE WHEN s.end_time < s.start_time
                      THEN (s.session_date::timestamp + s.end_time + interval '1 day')
                      ELSE (s.session_date::timestamp + s.end_time)
                 END`;
const RAW_HOURS = `EXTRACT(EPOCH FROM (${END_TS} - ${START_TS})) / 3600.0`;

function splitIsoToDateTime(iso) {
  if (!iso || typeof iso !== 'string') return null;
  const s = iso.trim().replace(' ', 'T');
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  const ss = pad(d.getSeconds());
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${mi}:${ss}` };
}

async function flags() {
  const [hasTutor, hasUser, hasNotes, hasCreated] = await Promise.all([
    hasColumn('sessions', 'tutor_id'),
    hasColumn('sessions', 'user_id'),
    hasColumn('sessions', 'notes'),
    hasColumn('sessions', 'created_at'),
  ]);
  return { hasTutor, hasUser, hasNotes, hasCreated };
}

// ----- validation -----
const createSchema = z.object({
  client_id: z.number().int().positive().optional(),
  client_first_name: z.string().max(100).optional().nullable(),
  client_last_name: z.string().max(100).optional().nullable(),
  subject_code: z.string().max(20).optional().nullable(),
  course_number: z.string().max(20).optional().nullable(),
  position: z.enum(POSITIONS),
  start_time: z.string().min(5), // ISO-like: "YYYY-MM-DDTHH:mm"
  end_time: z.string().min(5),
  description: z.string().max(2000).optional().nullable(),
  no_show: z.boolean().optional().default(false),
}).superRefine((v, ctx) => {
  const a = new Date(v.start_time);
  const b = new Date(v.end_time);
  if (Number.isNaN(a) || Number.isNaN(b)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['start_time'], message: 'Invalid datetime' });
    return;
  }
  // allow cross-midnight (b < a); only equal times invalid
  if (b.getTime() === a.getTime()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['end_time'], message: 'End must be after Start' });
  }

  // Position-specific requirements
  if (TRAINING_POS.has(v.position)) {
    // no client names required
  } else if (IDS_POS.has(v.position)) {
    if (!v.subject_code || !v.course_number) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subject_code'], message: 'Subject & Course required for Image Description Specialist' });
    }
  } else {
    if (!v.client_first_name || !v.client_last_name) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['client_first_name'], message: 'Client first/last required for this position' });
    }
  }
});

const updateSchema = createSchema.partial();

// ===== LIST =====
router.get('/', async (req, res, next) => {
  try {
    const nameCol = await getClientsNameColumn(); // may be null — we’ll handle
    const { hasTutor, hasUser, hasNotes, hasCreated } = await flags();

    const selectCols = `
      s.id,
      s.client_id,
      ${nameCol ? `c.${nameCol} AS client_name` : 'NULL::text AS client_name'},
      ${START_TS} AS start_time,
      ${END_TS} AS end_time,
      s.position,
      s.client_first_name,
      s.client_last_name,
      s.subject_code,
      s.course_number,
      s.no_show,
      s.status,
      ${hasNotes ? 's.notes' : 'NULL::text'} AS description,
      ${hasCreated ? 's.created_at' : 'now()'} AS created_at,
      ${RAW_HOURS} AS raw_hours
    `;

    const where = hasTutor ? 'WHERE s.tutor_id = $1'
      : hasUser ? 'WHERE s.user_id = $1'
        : '';
    const params = (hasTutor || hasUser) ? [req.user.id] : [];

    const q = await db.query(
      `SELECT ${selectCols}
         FROM sessions s
         ${nameCol ? 'LEFT JOIN clients c ON c.id = s.client_id' : ''}
        ${where}
        ORDER BY ${START_TS} DESC`,
      params
    );

    const rows = q.rows.map((r) => ({
      ...r,
      hours: applyMinRules(r.position, Number(r.raw_hours)),
    }));
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ===== CREATE =====
router.post('/', validate(createSchema), async (req, res, next) => {
  try {
    const { hasTutor, hasUser, hasNotes } = await flags();

    // If clients are owned, validate ownership when client_id is provided
    if (await clientsHasUserId() && req.body.client_id) {
      const c = await db.query('SELECT id FROM clients WHERE id = $1 AND user_id = $2', [
        req.body.client_id,
        req.user.id,
      ]);
      if (c.rowCount === 0) return res.status(400).json({ msg: 'Invalid client_id' });
    }

    const a = splitIsoToDateTime(req.body.start_time);
    const b = splitIsoToDateTime(req.body.end_time);
    if (!a || !b) return res.status(400).json({ msg: 'Invalid datetime format' });

    const cols = [
      'client_id',
      'session_date',
      'start_time',
      'end_time',
      'position',
      'client_first_name',
      'client_last_name',
      'subject_code',
      'course_number',
      'no_show',
      'status',
    ];
    const vals = [
      req.body.client_id ?? null,
      a.date,
      a.time,
      b.time,
      req.body.position,
      req.body.client_first_name ?? null,
      req.body.client_last_name ?? null,
      req.body.subject_code ?? null,
      req.body.course_number ?? null,
      !!req.body.no_show,
      'submitted',
    ];

    if (hasTutor) {
      cols.unshift('tutor_id');
      vals.unshift(req.user.id);
    } else if (hasUser) {
      cols.unshift('user_id');
      vals.unshift(req.user.id);
    }
    if (hasNotes) {
      cols.push('notes');
      vals.push(req.body.description ?? null);
    }

    const ph = vals.map((_, i) => `$${i + 1}`).join(', ');
    const ret = await db.query(
      `INSERT INTO sessions (${cols.join(', ')}) VALUES (${ph})
       RETURNING id, position, ${START_TS} AS start_time, ${END_TS} AS end_time, ${RAW_HOURS} AS raw_hours`,
      vals
    );

    const row = ret.rows[0];
    row.hours = applyMinRules(row.position, Number(row.raw_hours));
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
});

// ===== GET ONE =====
router.get('/:id', async (req, res, next) => {
  try {
    const { hasTutor, hasUser } = await flags();
    const where = hasTutor ? 'id = $1 AND tutor_id = $2'
      : hasUser ? 'id = $1 AND user_id = $2'
        : 'id = $1';
    const params = (hasTutor || hasUser) ? [req.params.id, req.user.id] : [req.params.id];

    const q = await db.query(
      `SELECT id, position, ${START_TS} AS start_time, ${END_TS} AS end_time, ${RAW_HOURS} AS raw_hours
         FROM sessions
        WHERE ${where}`,
      params
    );
    if (!q.rowCount) return res.status(404).json({ msg: 'Not found' });

    const r = q.rows[0];
    r.hours = applyMinRules(r.position, Number(r.raw_hours));
    res.json(r);
  } catch (err) {
    next(err);
  }
});

// ===== UPDATE =====
router.put('/:id', validate(updateSchema), async (req, res, next) => {
  try {
    const { hasTutor, hasUser, hasNotes } = await flags();

    const sets = [];
    const vals = [];
    let i = 1;

    // basic fields
    for (const f of [
      'position',
      'client_id',
      'client_first_name',
      'client_last_name',
      'subject_code',
      'course_number',
      'no_show',
      'status',
    ]) {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        sets.push(`${f} = $${i++}`);
        vals.push(req.body[f]);
      }
    }

    // time fields split
    if (Object.prototype.hasOwnProperty.call(req.body, 'start_time')) {
      const a = splitIsoToDateTime(req.body.start_time);
      sets.push(`session_date = COALESCE($${i++}, session_date)`); vals.push(a ? a.date : null);
      sets.push(`start_time = COALESCE($${i++}, start_time)`);     vals.push(a ? a.time : null);
    }
    if (Object.prototype.hasOwnProperty.call(req.body, 'end_time')) {
      const b = splitIsoToDateTime(req.body.end_time);
      if (!Object.prototype.hasOwnProperty.call(req.body, 'start_time')) {
        sets.push(`session_date = COALESCE($${i++}, session_date)`); vals.push(b ? b.date : null);
      }
      sets.push(`end_time = COALESCE($${i++}, end_time)`);           vals.push(b ? b.time : null);
    }

    if (hasNotes && Object.prototype.hasOwnProperty.call(req.body, 'description')) {
      sets.push(`notes = COALESCE($${i++}, notes)`); vals.push(req.body.description ?? null);
    }

    if (!sets.length) return res.status(400).json({ msg: 'No updatable fields provided' });

    vals.push(req.params.id);
    if (hasTutor) vals.push(req.user.id);
    else if (hasUser) vals.push(req.user.id);

    const where = hasTutor ? `id = $${i} AND tutor_id = $${i + 1}`
      : hasUser ? `id = $${i} AND user_id = $${i + 1}`
        : `id = $${i}`;

    const q = await db.query(
      `UPDATE sessions
          SET ${sets.join(', ')}
        WHERE ${where}
        RETURNING id, position, ${START_TS} AS start_time, ${END_TS} AS end_time, ${RAW_HOURS} AS raw_hours`,
      vals
    );
    if (!q.rowCount) return res.status(404).json({ msg: 'Not found' });

    const r = q.rows[0];
    r.hours = applyMinRules(r.position, Number(r.raw_hours));
    res.json(r);
  } catch (err) {
    next(err);
  }
});

// ===== DELETE =====
router.delete('/:id', async (req, res, next) => {
  try {
    const { hasTutor, hasUser } = await flags();
    const params = [req.params.id];
    let where = 'id = $1';
    if (hasTutor) { where += ' AND tutor_id = $2'; params.push(req.user.id); }
    else if (hasUser) { where += ' AND user_id = $2'; params.push(req.user.id); }

    const del = await db.query(`DELETE FROM sessions WHERE ${where}`, params);
    if (!del.rowCount) return res.status(404).json({ msg: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
