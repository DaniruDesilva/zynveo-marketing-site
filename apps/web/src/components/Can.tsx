"use client";

import React from 'react';
import { Permission, UserRole } from '@zynveo/contracts';
import { useAuth } from './AuthProvider';

interface CanProps {
  permission?: Permission | string;
  permissions?: (Permission | string)[];
  role?: UserRole | string;
  roles?: (UserRole | string)[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({
  permission,
  permissions,
  role,
  roles,
  fallback = null,
  children,
}: CanProps) {
  const { user, can, hasAnyPermission, hasRole } = useAuth();

  if (!user) return <>{fallback}</>;

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (permissions && permissions.length > 0 && !hasAnyPermission(permissions)) {
    return <>{fallback}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  if (roles && roles.length > 0 && !roles.some((r) => hasRole(r))) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
