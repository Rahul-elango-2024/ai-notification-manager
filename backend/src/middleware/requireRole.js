/**
 * requireRole middleware
 *
 * Role-based access control guard. Must be used AFTER authMiddleware.
 * Checks req.user.role against an allowed list of roles.
 *
 * Usage:
 *   router.get('/users', authMiddleware, requireRole(['Admin']), controller)
 *   router.get('/reports', authMiddleware, requireRole(['Admin','Manager']), controller)
 *
 * @param {string|string[]} allowedRoles - One or more roles permitted to access the route
 */
const requireRole = (allowedRoles) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Unauthorized. Authentication required.",
      });
    }

    const userRole = req.user.role;

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: `Forbidden. Required role: ${roles.join(" or ")}. Your role: ${userRole}.`,
      });
    }

    next();
  };
};

module.exports = requireRole;
