import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * ProtectedRoute Guard
 * Evaluates authentication state and enforces Role-Based Access Control (RBAC).
 *
 * @param {Array<string>} allowedRoles - Permitted roles (e.g. ['agent', 'admin'])
 * @param {React.ReactNode} children - Target component / route
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-sans uppercase tracking-widest text-on-surface-variant">
            Verifying Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Unauthenticated user -> redirect to /login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // RBAC Role Evaluation
  if (allowedRoles.length > 0) {
    const userRole = user.role || user.userMetadata?.role || 'client';

    // Superuser 'admin' has universal access
    if (userRole !== 'admin' && !allowedRoles.includes(userRole)) {
      return (
        <Navigate
          to="/unauthorized"
          state={{
            from: location,
            requiredRoles: allowedRoles,
            currentRole: userRole,
          }}
          replace
        />
      );
    }
  }

  return children;
}
