import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function PermissionGate({
  permission,
  role,
  fallback = null,
  children
}) {
  const { can, hasRole } = useAuth();

  let isAllowed = true;

  if (permission && can) {
    isAllowed = isAllowed && can(permission);
  }

  if (role && hasRole) {
    isAllowed = isAllowed && hasRole(role);
  }

  if (!isAllowed) {
    return fallback;
  }

  return <>{children}</>;
}
