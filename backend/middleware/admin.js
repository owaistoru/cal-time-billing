const adminMiddleware = (req, res, next) => {
  // This assumes the authMiddleware has already run
  // and attached the user's details to the request.
  if (req.user && req.user.role === 'admin') {
    next(); // If user is an admin, proceed to the route
  } else {
    // If not an admin, send a "Forbidden" error
    res.status(403).json({ msg: 'Access denied. Admin role required.' });
  }
};

module.exports = adminMiddleware;