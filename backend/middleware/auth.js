const jwt = require('jsonwebtoken');
const db = require('../db');

const authMiddleware = async (req, res, next) => {
  let token = null;

  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  } else if (req.header('x-auth-token')) {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ msg: 'Server misconfigured. JWT secret missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userResult = await db.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.user.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }
    req.user = userResult.rows[0];
    next();
  } catch {
    return res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;
