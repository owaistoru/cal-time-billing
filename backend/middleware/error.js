'use strict';

function notFound(req, res, next) {
  res.status(404).json({ msg: 'Not Found' });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const status = err.status || 500;
  const payload = {
    msg: process.env.NODE_ENV === 'production' ? 'Server error' : err.message
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }
  res.status(status).json(payload);
}

module.exports = { notFound, errorHandler };
