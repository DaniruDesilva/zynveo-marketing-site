"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { UserRole, Permission, DEFAULT_ROLE_PERMISSIONS } from '@zynveo/contracts';
import { UserSession, DEMO_PERSONAS, DEMO_TENANT } from '../lib/authTypes';
import {
  getStoredSession,
  saveSession,
  clearSession,
  createSessionForRole,
  signInWithEmailPassword,
} from '../lib/authStore';

interface AuthContextType {
  user: UserSession | null;
  role: UserRole | null;
  permissions: string[];
  activeBranchId: string;
  activeBranchName: string;
  isLoading: boolean;
  can: (permission: Permission | string) => boolean;
  hasAnyPermission: (permissions: (Permission | string)[]) => boolean;
  hasRole: (role: UserRole | string) => boolean;
  signInWithDemo: (role: UserRole, branchId?: string) => Promise<void>;
  signIn: (email: string, password?: string) => Promise<void>;
  signOut: () => Promise<void>;
  switchBranch: (branchId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize session from localStorage/cookies on mount
  useEffect(() => {
    try {
      const stored = getStoredSession();
      if (stored) {
        setUser(stored);
      } else {
        // Fallback default for smooth local development experience
        createSessionForRole('OWNER').then((defaultSession) => {
          setUser(defaultSession);
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const can = useCallback(
    (permission: Permission | string): boolean => {
      if (!user) return false;
      if (user.role === 'OWNER') return true;
      return user.permissions.includes(permission);
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (perms: (Permission | string)[]): boolean => {
      if (!user) return false;
      if (user.role === 'OWNER') return true;
      return perms.some((p) => user.permissions.includes(p));
    },
    [user]
  );

  const hasRole = useCallback(
    (roleToCheck: UserRole | string): boolean => {
      if (!user) return false;
      return user.role === roleToCheck || user.roles.includes(roleToCheck as UserRole);
    },
    [user]
  );

  const signInWithDemo = useCallback(
    async (role: UserRole, branchId?: string) => {
      setIsLoading(true);
      try {
        const session = await createSessionForRole(role, branchId);
        setUser(session);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const signIn = useCallback(
    async (email: string, password?: string) => {
      setIsLoading(true);
      try {
        const session = await signInWithEmailPassword(email, password);
        setUser(session);
        router.push('/dashboard');
      } finally {
        setIsLoading(false);
      }
    },
    [router]
  );

  const switchBranch = useCallback(
    async (branchId: string) => {
      if (!user) return;
      setIsLoading(true);
      try {
        const updated = await createSessionForRole(user.role, branchId);
        setUser(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      clearSession();
      setUser(null);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        permissions: user?.permissions || [],
        activeBranchId: user?.branchId || DEMO_TENANT.colomboBranchId,
        activeBranchName: user?.branchName || DEMO_TENANT.colomboBranchName,
        isLoading,
        can,
        hasAnyPermission,
        hasRole,
        signInWithDemo,
        signIn,
        signOut,
        switchBranch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
