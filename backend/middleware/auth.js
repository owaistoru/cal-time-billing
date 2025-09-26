const jwt = require('jsonwebtoken');
const db = require('../db');

const authMiddleware = async (req, res, next) => {
  const token = req.header('x-auth-token');

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use the ID from the token to fetch the user's full details from the database
    const userResult = await db.query('SELECT id, email, role FROM users WHERE id = $1', [
      decoded.user.id,
    ]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({ msg: 'Token is not valid' });
    }

    // Attach the full user object (with role) to the request
    req.user = userResult.rows[0];

    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

module.exports = authMiddleware;