const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin'); // Import admin middleware

// Protect all routes in this file with both auth and admin middleware
router.use(authMiddleware, adminMiddleware);

// GET /api/admin/sessions/submitted - Get all sessions needing approval
router.get('/sessions/submitted', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id, s.session_date, s.start_time, s.end_time, s.status, u.full_name as tutor_name, c.client_name
       FROM sessions s
       JOIN users u ON s.tutor_id = u.id
       JOIN clients c ON s.client_id = c.id
       WHERE s.status = 'submitted' ORDER BY s.session_date ASC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// PUT /api/admin/sessions/:id/status - Approve or reject a session
router.put('/sessions/:id/status', async (req, res) => {
  const { status, rejection_reason = null } = req.body;
  const { id } = req.params;

  if (status !== 'approved' && status !== 'rejected') {
    return res.status(400).json({ msg: 'Invalid status' });
  }

  try {
    const result = await db.query(
      'UPDATE sessions SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *',
      [status, rejection_reason, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});


// GET /api/admin/users - Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await db.query('SELECT id, full_name, email, role, pay_rate_cents, is_active FROM users ORDER BY full_name');
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/admin/users/:id - Update a user's details
router.put('/users/:id', async (req, res) => {
  const { id } = req.params;
  const { full_name, email, role, pay_rate_cents, is_active } = req.body;

  try {
    const updatedUser = await db.query(
      'UPDATE users SET full_name = $1, email = $2, role = $3, pay_rate_cents = $4, is_active = $5 WHERE id = $6 RETURNING id, full_name, email, role, pay_rate_cents, is_active',
      [full_name, email, role, pay_rate_cents, is_active, id]
    );
    res.json(updatedUser.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


module.exports = router;