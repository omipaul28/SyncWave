/**
 * Middleware that restricts access to admin-role users only.
 * Must be used AFTER authMiddleware.
 */
const adminMiddleware = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden – admin access required' });
  }
  next();
};

module.exports = adminMiddleware;
