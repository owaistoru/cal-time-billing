const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/authorize');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const bcrypt = require('bcrypt');
const { mapRoleLabel, hasColumn } = require('../lib/schema');

const router = express.Router();

router.use(auth);
router.use(requireRole('admin'));

// GET /api/admin/users
router.get('/users', async (req, res, next) => {
  try {
    const q = await db.query('SELECT id, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(q.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users {email, password, role?, full_name?}
router.post(
  '/users',
  validate(z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    role: z.string().default('user'),
    full_name: z.string().min(1).max(200).optional()
  })),
  async (req, res, next) => {
    try {
      const { email, password, full_name } = req.body;
      const roleMapped = await mapRoleLabel(req.body.role || 'user');

      const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
      if (exists.rowCount > 0) return res.status(409).json({ msg: 'Email already in use' });

      const hash = await bcrypt.hash(password, 12);
      const hasFullName = await hasColumn('users', 'full_name');

      let q;
      if (hasFullName) {
        q = await db.query(
          'INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, $3, $4) RETURNING id, email, role, created_at',
          [email, hash, roleMapped, full_name || email.split('@')[0]]
        );
      } else {
        q = await db.query(
          'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at',
          [email, hash, roleMapped]
        );
      }
      res.status(201).json(q.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/admin/users/:id/role {role}
router.post('/users/:id/role', async (req, res, next) => {
  try {
    const desired = String(req.body.role || '');
    if (!desired) return res.status(400).json({ msg: 'Missing role' });
    const roleMapped = await mapRoleLabel(desired);

    const q = await db.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, email, role',
      [roleMapped, req.params.id]
    );
    if (q.rowCount === 0) return res.status(404).json({ msg: 'Not found' });
    res.json(q.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/users/:id/reset-password {password}
router.post(
  '/users/:id/reset-password',
  validate(z.object({ password: z.string().min(8).max(128) })),
  async (req, res, next) => {
    try {
      const hash = await bcrypt.hash(req.body.password, 12);
      const q = await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, email, role',
        [hash, req.params.id]
      );
      if (q.rowCount === 0) return res.status(404).json({ msg: 'Not found' });
      res.json({ msg: 'Password reset', user: q.rows[0] });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
