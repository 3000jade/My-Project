import React from 'react';
import AuthGuard from './AuthGuard';

/**
 * Backward compatibility alias for AuthGuard
 */
export default function ProtectedRoute({ allowedRoles = [], children }) {
  return <AuthGuard allowedRoles={allowedRoles}>{children}</AuthGuard>;
}

export { AuthGuard };
