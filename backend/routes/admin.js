'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const { z } = require('zod');
const { validate } = require('../middleware/validate');

const router = express.Router();
router.use(auth, requireAdmin);

// ... (GET and POST routes for users remain the same)

router.get('/users', async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT id, email, role, created_at, full_name FROM users ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// ... (POST /users, POST /users/:id/role, POST /users/:id/reset-password remain here)
router.post(
  '/users',
  validate(z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.enum(['user', 'admin']),
    full_name: z.string().min(1).max(200).optional()
  })),
  async (req, res, next) => {
    try {
      const { email, password, role, full_name } = req.body;
      const { rowCount } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (rowCount > 0) {
        return res.status(409).json({ msg: 'Email already in use' });
      }
      const hash = await bcrypt.hash(password, 12);
      const { rows } = await db.query(
        'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, created_at, full_name',
        [email, hash, role, full_name || email.split('@')[0]]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  '/users/:id/role',
  validate(z.object({ role: z.enum(['admin', 'user']) })),
  async (req, res, next) => {
    try {
      const { rows } = await db.query(
        'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
        [req.body.role, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ msg: 'User not found' });
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  }
);


router.post(
  '/users/:id/reset-password',
  validate(z.object({ password: z.string().min(8).max(128) })),
  async (req, res, next) => {
    try {
      const hash = await bcrypt.hash(req.body.password, 12);
      const { rows } = await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
        [hash, req.params.id]
      );
      if (!rows.length) return res.status(404).json({ msg: 'User not found' });
      res.json({ msg: 'Password reset successfully' });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * NEW: DELETE a user
 */
router.delete('/users/:id', async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (userId === req.user.id) {
      return res.status(403).json({ msg: 'You cannot delete yourself.' });
    }

    const sessions = await db.query('SELECT id FROM sessions WHERE tutor_id = $1 LIMIT 1', [userId]);
    if (sessions.rowCount > 0) {
      return res.status(409).json({ msg: 'Cannot delete user with existing sessions. Please reassign or delete their sessions first.' });
    }

    await db.query('DELETE FROM users WHERE id = $1', [userId]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;