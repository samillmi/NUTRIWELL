import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

/**
 * Protects a route by role.
 * @param {string|string[]} roles - Allowed role(s)
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-500"></div>
      </div>
    );
  }

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
