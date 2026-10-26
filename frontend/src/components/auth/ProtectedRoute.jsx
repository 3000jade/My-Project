import React from 'react';
import AuthGuard from './AuthGuard';

/**
 * ProtectedRoute Guard
 * Evaluates authentication state and enforces Role-Based Access Control (RBAC).
 * Redirects unauthorized users to /unauthorized.
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  return (
    <AuthGuard allowedRoles={allowedRoles} unauthorizedRedirect="/unauthorized">
      {children}
    </AuthGuard>
  );
}

export { AuthGuard };
