// backend/routes/clients.js
'use strict';

const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const { requireAdmin } = require('../middleware/authorize');
const { getClientsNameColumn } = require('../lib/schema');
const { hasColumn } = require('../lib/schema');

const router = express.Router();
router.use(auth, requireAdmin);

// Helper to build queries with only existing columns
const getClientColumns = async () => {
  const nameCol = await getClientsNameColumn() || 'name';
  const emailCol = await hasColumn('clients', 'contact_email') ? 'contact_email' : 'email';
  const notesCol = await hasColumn('clients', 'notes') ? 'notes' : null;
  return { nameCol, emailCol, notesCol };
};

router.get('/', async (req, res, next) => {
  try {
    const { nameCol, emailCol, notesCol } = await getClientColumns();
    const selectCols = ['id', `${nameCol} AS name`, 'created_at'];
    if (await hasColumn('clients', emailCol)) selectCols.push(`${emailCol} AS contact_email`);
    if (notesCol) selectCols.push('notes');

    const { rows } = await db.query(`SELECT ${selectCols.join(', ')} FROM clients ORDER BY ${nameCol} ASC`);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, contact_email, notes } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ msg: 'Client name is required' });
    }
    
    const { nameCol, emailCol, notesCol } = await getClientColumns();
    
    const cols = [nameCol];
    const vals = [name.trim()];
    const placeholders = ['$1'];
    
    if (contact_email && await hasColumn('clients', emailCol)) {
      cols.push(emailCol);
      vals.push(contact_email);
      placeholders.push(`$${vals.length}`);
    }
    if (notes && notesCol) {
      cols.push(notesCol);
      vals.push(notes);
      placeholders.push(`$${vals.length}`);
    }

    const { rows } = await db.query(
      `INSERT INTO clients (${cols.join(', ')}) VALUES (${placeholders.join(', ')})
       RETURNING id, ${nameCol} AS name, created_at, ${await hasColumn('clients', emailCol) ? `${emailCol} AS contact_email` : 'NULL as contact_email'}, ${notesCol ? 'notes' : 'NULL as notes'}`,
      vals
    );
    res.status(201).json(rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    // ... (delete logic remains the same)
  } catch (err) { next(err); }
});

module.exports = router;