const express = require('express');
const router = express.Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

// Protect all routes in this file
router.use(authMiddleware);

// GET /api/clients - Fetches all clients (accessible by any logged-in user)
router.get('/', async (req, res) => {
  try {
    const clients = await db.query('SELECT id, client_name, billing_info FROM clients ORDER BY client_name');
    res.json(clients.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/clients - Create a new client (admins only)
router.post('/', adminMiddleware, async (req, res) => {
  const { client_name, billing_info } = req.body;
  try {
    const newClient = await db.query(
      'INSERT INTO clients (client_name, billing_info) VALUES ($1, $2) RETURNING *',
      [client_name, billing_info]
    );
    res.status(201).json(newClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/clients/:id - Update a client (admins only)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { client_name, billing_info } = req.body;
  const { id } = req.params;
  try {
    const updatedClient = await db.query(
      'UPDATE clients SET client_name = $1, billing_info = $2 WHERE id = $3 RETURNING *',
      [client_name, billing_info, id]
    );
    res.json(updatedClient.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/clients/:id - Delete a client (admins only)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM clients WHERE id = $1', [id]);
    res.json({ msg: 'Client deleted' });
  } catch (err)
  {
    console.error(err.message);
    // Handle cases where client is still referenced in sessions
    if (err.code === '23503') {
      return res.status(400).json({ msg: 'Cannot delete client. They are still referenced in past sessions.' });
    }
    res.status(500).send('Server Error');
  }
});


module.exports = router;