/**
 * Returns middleware that restricts access to the listed roles.
 * Usage:  router.get('/admin', authorize('admin', 'editor'), handler)
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
  
  module.exports = { authorize };