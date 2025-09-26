const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// All routes in this file are protected and can only be accessed by logged-in users.
router.use(authMiddleware);

// ## CREATE A NEW SESSION ##
// POST /api/sessions/
router.post('/', async (req, res) => {
  const { client_id, session_date, start_time, end_time, session_type, notes } = req.body;
  const tutor_id = req.user.id; // Get the user's ID from the middleware

  if (!client_id || !session_date || !start_time || !end_time) {
    return res.status(400).json({ msg: 'Please provide all required session details' });
  }

  try {
    const newSession = await db.query(
      `INSERT INTO sessions (tutor_id, client_id, session_date, start_time, end_time, session_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [tutor_id, client_id, session_date, start_time, end_time, session_type, notes]
    );
    res.status(201).json(newSession.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// ## GET ALL SESSIONS FOR THE LOGGED-IN TUTOR ##
// GET /api/sessions/my-sessions
router.get('/my-sessions', async (req, res) => {
  const tutor_id = req.user.id;

  try {
    const sessions = await db.query(
      'SELECT * FROM sessions WHERE tutor_id = $1 ORDER BY session_date DESC, start_time DESC',
      [tutor_id]
    );
    res.json(sessions.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;