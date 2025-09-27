// backend/middleware/roles.js
'use strict';

/**
 * Assumes an auth middleware already ran and, on success,
 * set req.user = { id, email, role, ... }.
 */

function ensureAuthed(req, res) {
  if (!req.user) {
    res.status(401).json({ msg: 'Unauthenticated' });
    return false;
  }
  return true;
}

function requireAdmin(req, res, next) {
  if (!ensureAuthed(req, res)) return;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin only' });
  }
  return next();
}

/**
 * Require a non-admin tutor/user account.
 * Our app uses 'admin' and 'user' (tutor) roles.
 * If you later add more roles (e.g., 'staff'), adjust as needed.
 */
function requireTutor(req, res, next) {
  if (!ensureAuthed(req, res)) return;
  if (req.user.role === 'admin') {
    return res.status(403).json({ msg: 'Tutor-only endpoint' });
  }
  return next();
}

module.exports = {
  requireAdmin,
  requireTutor,
};
