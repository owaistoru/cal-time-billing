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
  password: z.string().min(8).max(128)
});

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1)
});

// POST /api/auth/register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const exists = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rowCount > 0) {
      return res.status(409).json({ msg: 'Email already in use' });
    }

    const hash = await bcrypt.hash(password, 12);
    const ins = await db.query(
      "INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'user') RETURNING id, email, role",
      [email, hash]
    );

    const user = ins.rows[0];
    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const q = await db.query('SELECT id, email, role, password_hash FROM users WHERE email = $1', [email]);
    if (q.rowCount === 0) return res.status(401).json({ msg: 'Invalid credentials' });

    const user = q.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });

    const token = jwt.sign({ user: { id: user.id } }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});
// backend/routes/auth.js (example)
router.post('/logout', (req, res) => {
  res.clearCookie('session'); // or whatever cookie you set
  req.session?.destroy?.(() => {}); // if using express-session
  return res.json({ ok: true });
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
