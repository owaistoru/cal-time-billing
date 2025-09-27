// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../db');
const { hasColumn } = require('../lib/schema');

// Cache the result of the schema check for performance
let userHasPayRate = null;

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(); // No token, proceed as unauthenticated
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check for pay_rate_cents column only once
    if (userHasPayRate === null) {
      userHasPayRate = await hasColumn('users', 'pay_rate_cents');
    }
    
    // Dynamically build the query based on the schema
    const selectClause = `SELECT id, email, role${userHasPayRate ? ', pay_rate_cents' : ''}`;
    
    const userResult = await db.query(
      `${selectClause} FROM users WHERE id = $1`,
      [decoded.user.id]
    );

    if (userResult.rows.length > 0) {
      req.user = userResult.rows[0];
    }
    
    next();
  } catch (err) {
    // Invalid token, proceed as unauthenticated
    next();
  }
};

module.exports = authMiddleware;