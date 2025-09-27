// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db');
const { hasColumn } = require('../lib/schema');

// We'll check for the column once and cache the result for efficiency.
let userSchemaHasPayRate = null;

const authMiddleware = async (req, res, next) => {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }

  if (!token) {
    return next(); // No token, proceed as unauthenticated.
  }

  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET is not configured in your .env file.');
    return res.status(500).json({ msg: 'Server misconfigured. JWT secret missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the pay rate column exists, but only the first time.
    if (userSchemaHasPayRate === null) {
      userSchemaHasPayRate = await hasColumn('users', 'pay_rate_cents');
    }

    // Dynamically build the query to be safe.
    const columnsToSelect = userSchemaHasPayRate
      ? 'id, email, role, COALESCE(pay_rate_cents, 2850) AS pay_rate_cents'
      : 'id, email, role';
    
    const userResult = await db.query(`SELECT ${columnsToSelect} FROM users WHERE id = $1`, [decoded.user.id]);

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }
    
    next();
  } catch (err) {
    // If token is invalid (expired, etc.), just proceed as unauthenticated.
    next();
  }
};

module.exports = authMiddleware;