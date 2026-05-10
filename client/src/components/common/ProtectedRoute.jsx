import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Protects a route by role.
 * @param {string|string[]} roles - Allowed role(s)
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowed = Array.isArray(roles) ? roles : [roles];
  if (user && !allowed.includes(user.role)) {
    // Redirect to their own dashboard if wrong role
    const redirects = { admin: '/admin', doctor: '/doctor', patient: '/patient' };
    return <Navigate to={redirects[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;
