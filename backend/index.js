// backend/index.js
'use strict';

require('dotenv').config();

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');

// Middleware
const auth = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/error');

// Routers
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const approvalRoutes = require('./routes/approvals');
const exportRoutes = require('./routes/exports');
const clientRoutes = require('./routes/clients');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

const app = express();

// --- Core Middleware ---
app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true,
  credentials: true
}));
app.use(morgan('dev'));
const path = require('path');
// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// --- Who Am I Route ---
app.get('/api/me', auth, (req, res) => {
  if (req.user) {
    res.json({ user: req.user });
  } else {
    res.status(401).json({ msg: 'Not authenticated' });
  }
});

// --- Error Handling ---
app.use('/api', notFound); // 404 for any unhandled /api routes
app.use(errorHandler);     // General purpose error handler
// Serve the built frontend (production-ish local use)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});
// --- Server Boot ---
const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => {
  console.log(`API listening on http://localhost:${PORT}`);
});