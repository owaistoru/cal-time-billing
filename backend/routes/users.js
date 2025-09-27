// backend/routes/users.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roles');

const router = express.Router();

// Admin-only
router.use(auth, requireAdmin);

/**
 * GET /api/users
 * Optional helper so the Admin Exports page can show a tutor dropdown.
 * Returns: [{ id, email, role }]
 * Supports ?q= to fuzzy match email.
 */
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').trim();
    let rows;
    if (q) {
      rows = await db.query(
        `SELECT id, email, role
           FROM users
          WHERE email ILIKE '%' || $1 || '%'
          ORDER BY email ASC
          LIMIT 500`,
        [q]
      );
    } else {
      rows = await db.query(
        `SELECT id, email, role
           FROM users
          ORDER BY email ASC
          LIMIT 500`
      );
    }
    res.json(rows.rows || []);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
