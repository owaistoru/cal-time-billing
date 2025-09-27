// backend/middleware/roles.js
module.exports.requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ msg: 'Admin only' });
  next();
};

module.exports.requireSelfOrAdmin = (getUserId = (req) => req.user?.id) => (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  const uid = getUserId(req);
  if (String(uid) === String(req.user?.id)) return next();
  return res.status(403).json({ msg: 'Forbidden' });
};
