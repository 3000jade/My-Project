import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconShieldLock } from '@tabler/icons-react';

export default function AuthGuard({
  children,
  allowedRoles = [],
  requiredPermissions = [],
  fallback = null,
  unauthorizedRedirect = null
}) {
  const { user, loading, isAuthenticated, hasRole, can } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBF9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#0D4446] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[12px] font-mono uppercase tracking-[0.12em] text-[#5C6768]">
            Verifying Security Credentials...
          </p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated && !user) {
    const returnUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnUrl=${returnUrl}`} state={{ from: location }} replace />;
  }

  // Check roles
  const hasRequiredRole =
    allowedRoles.length === 0 ||
    allowedRoles.some((role) => (hasRole ? hasRole(role) : user?.role === role || user?.role === 'admin'));

  // Check permissions
  const hasRequiredPermissions =
    requiredPermissions.length === 0 ||
    requiredPermissions.every((perm) => (can ? can(perm) : user?.permissions?.includes(perm) || user?.role === 'admin'));

  if (!hasRequiredRole || !hasRequiredPermissions) {
    if (fallback) return fallback;

    if (unauthorizedRedirect) {
      return (
        <Navigate
          to={unauthorizedRedirect}
          state={{
            from: location,
            requiredRoles: allowedRoles,
            currentRole: user?.role || 'client',
          }}
          replace
        />
      );
    }

    return (
      <div className="min-h-[400px] flex items-center justify-center p-6 bg-[#FBFBF9]">
        <div className="max-w-md w-full bg-white rounded-xl border border-[#D8DFDF] p-8 text-center shadow-sm">
          <div className="w-14 h-14 bg-[#E76F51]/10 text-[#E76F51] rounded-full flex items-center justify-center mx-auto mb-4">
            <IconShieldLock size={32} />
          </div>
          <h2 className="text-[24px] font-manrope font-bold text-[#141717] mb-2">
            Access Restricted
          </h2>
          <p className="text-[14px] text-[#5C6768] font-inter mb-6 leading-relaxed">
            You do not hold sufficient authorization clearance or security claims to access this module.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center h-[46px] px-6 rounded-md bg-[#0D4446] text-white text-[14px] font-medium font-inter hover:bg-[#083335] transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}
