"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { canAccessRoute, getRoutePolicy } from '../lib/routeAccess';

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isLoginRoute = pathname === '/login' || pathname.startsWith('/login/');

  useEffect(() => {
    if (!isLoading && !user && !isLoginRoute) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, user, isLoginRoute, pathname, router]);

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center p-12 text-sm text-slate-500">
        Verifying session and permissions...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const allowed = canAccessRoute(pathname, user.roles, user.permissions);
  if (!allowed) {
    const policy = getRoutePolicy(pathname);
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-8">
        <div className="max-w-md w-full rounded-2xl bg-white border border-rose-200 shadow-sm p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <ShieldAlert size={24} />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-slate-900">Access Denied (403)</h1>
            <p className="text-sm text-slate-500">
              Your role (<span className="font-semibold text-slate-700">{user.role}</span>) does not have permission to access{' '}
              <span className="font-semibold text-slate-700">{policy?.label || pathname}</span>.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
