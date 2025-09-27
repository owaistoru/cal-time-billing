// backend/middleware/authorize.js
'use strict';

/**
 * Middleware for role-based authorization.
 * Assumes that the `auth` middleware has already run and attached
 * a `user` object to the request.
 */

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ msg: 'Authorization denied. No user logged in.' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Forbidden. Admin role required.' });
  }
  return next();
}

function requireTutor(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ msg: 'Authorization denied. No user logged in.' });
  }
  // This app considers any non-admin a "tutor" or general user.
  // If more roles are added, this logic might need to be adjusted.
  if (req.user.role === 'admin') {
    return res.status(403).json({ msg: 'Forbidden. This action is for tutors only.' });
  }
  return next();
}

module.exports = {
  requireAdmin,
  requireTutor,
};