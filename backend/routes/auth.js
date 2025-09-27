// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const auth = require('../middleware/auth');

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  full_name: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1)
});

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ msg: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 12);
    // Note: 'tutor' is used to align with potential database enums.
    const ins = await db.query(
      "INSERT INTO users (email, password_hash, role, full_name) VALUES ($1, $2, 'tutor', $3) RETURNING id, email, role, pay_rate_cents",
      [email, hash, full_name || email.split('@')[0]]
    );

    const user = ins.rows[0];
    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    // FEATURE UPDATE: Select pay_rate_cents during login
  const q = await db.query(
    'SELECT id, email, role, password_hash, COALESCE(pay_rate_cents, 2850) AS pay_rate_cents FROM users WHERE email = $1',
    [email]
  );
    if (q.rowCount === 0) return res.status(401).json({ msg: 'Invalid credentials' });

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // FEATURE UPDATE: Return pay_rate_cents in the user payload
  res.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, pay_rate_cents: user.pay_rate_cents }
  });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  // This is a best-effort endpoint. The client handles token removal.
  res.json({ ok: true });
});

router.get('/me', auth, async (req, res) => {
  // The user object from the `auth` middleware now includes pay_rate_cents
  res.json({ user: req.user });
});

module.exports = router;