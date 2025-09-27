// backend/index.js
'use strict';

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');

const auth = require('./middleware/auth');

// Routers (make sure these files exist)
const sessions = require('./routes/sessions');
const approvals = require('./routes/approvals');
const exportsRouter = require('./routes/exports');
const clients = require('./routes/clients');

const app = express();

// --- middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: true,          // reflect request origin
  credentials: true      // send/accept cookies
}));
app.use(morgan('dev'));

// --- health ---
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// --- whoami (used by Navbar/Dashboards) ---
app.get('/api/me', auth, (req, res) => {
  // auth middleware must set req.user = { id, email, role, ... }
  const { id, email, role } = req.user || {};
  res.json({ id, email, role });
});

// --- mount feature routes ---
app.use('/api/sessions', sessions);
app.use('/api/approvals', approvals);
app.use('/api/exports', exportsRouter);
app.use('/api/clients', clients);

// --- 404 fallback for unknown /api paths ---
app.use('/api', (_req, res) => res.status(404).json({ msg: 'Not found' }));

// --- error handler (consistent JSON shape) ---
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = typeof err.status === 'number' ? err.status : 500;
  const msg = (err && err.expose && err.message) ? err.message
            : (err && err.message) || 'Server error';
  res.status(status).json({ msg });
});

const users = require('./routes/users');
app.use('/api/users', users);

// --- boot ---
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});
