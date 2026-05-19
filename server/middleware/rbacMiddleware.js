const { sendError } = require('../utils/responseHelper');

/**
 * Role-Based Access Control guard.
 *
 * Usage:
 *   router.get('/admin/stats', protect, authorize('admin'), handler)
 *   router.get('/doctor/patients', protect, authorize('admin', 'doctor'), handler)
 *
 * @param {...string} allowedRoles - One or more role strings.
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Not authenticated.');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`
      );
    }

    next();
  };
};

/**
 * Convenience pre-bound guards for common patterns.
 */
const adminOnly   = authorize('admin');
const doctorOnly  = authorize('doctor');
const patientOnly = authorize('patient');
const doctorOrAdmin  = authorize('admin', 'doctor');
const verifiedDoctor = (req, res, next) => {
  if (req.user.role === 'admin') return next(); // Admin bypassed
  if (req.user.role !== 'doctor') return sendError(res, 403, 'Access denied. Doctor only.');
  if (!req.user.doctorProfile?.isVerified) {
    return sendError(res, 403, 'Your account is pending admin approval. Access restricted.');
  }
  next();
};

const anyAuthenticated = authorize('admin', 'doctor', 'patient');

module.exports = { authorize, adminOnly, doctorOnly, patientOnly, doctorOrAdmin, anyAuthenticated, verifiedDoctor };
