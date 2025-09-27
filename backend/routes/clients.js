// backend/routes/clients.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// All clients routes require auth
router.use(auth);

// Helper: does clients table have user_id column?
async function clientsHasUserId() {
  const q = await db.query(`
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'clients'
      AND column_name  = 'user_id'
  `);
  return q.rowCount > 0;
}

/**
 * GET /api/clients
 * - Admin: returns all clients
 * - Tutor: returns own clients if clients.user_id exists; otherwise returns []
 */
router.get('/', async (req, res, next) => {
  try {
    const hasUserId = await clientsHasUserId();

    if (req.user.role === 'admin') {
      const all = await db.query(
        `SELECT id, name, email, notes, created_at
           FROM clients
          ORDER BY created_at DESC NULLS LAST, id DESC`
      );
      return res.json(all.rows);
    }

    if (!hasUserId) return res.json([]); // safe fallback if schema lacks user_id

    const mine = await db.query(
      `SELECT id, name, email, notes, created_at
         FROM clients
        WHERE user_id = $1
        ORDER BY created_at DESC NULLS LAST, id DESC`,
      [req.user.id]
    );
    return res.json(mine.rows);
  } catch (err) { next(err); }
});

/**
 * POST /api/clients
 * Admin only: create a client
 * Body: { name, email?, notes? }
 */
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { name, email, notes } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ msg: 'name is required' });
    }
    const q = await db.query(
      `INSERT INTO clients (name, email, notes, created_at)
       VALUES ($1, $2, $3, now())
       RETURNING id, name, email, notes, created_at`,
      [String(name).trim(), email ?? null, notes ?? null]
    );
    return res.status(201).json(q.rows[0]);
  } catch (err) { next(err); }
});

/**
 * DELETE /api/clients/:id
 * Admin only: delete a client
 */
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ msg: 'invalid id' });

    const del = await db.query(`DELETE FROM clients WHERE id = $1`, [id]);
    if (!del.rowCount) return res.status(404).json({ msg: 'Not found' });

    return res.status(204).send();
  } catch (err) { next(err); }
});

module.exports = router;
