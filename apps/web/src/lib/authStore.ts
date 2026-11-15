import { UserRole, getPermissionsForRoles } from '@zynveo/contracts';
import { UserSession, DEMO_PERSONAS, DEMO_TENANT } from './authTypes';
import { createSignedDevToken, decodeJwtPayload, isTokenExpired } from './jwtHelper';

const TOKEN_KEY = 'zynveo_access_token';
const SESSION_KEY = 'zynveo_user_session';
const COOKIE_NAME = 'zynveo_access_token';

const API_GATEWAY_BASE_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:4000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export function isDemoModeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

function setSessionCookie(token: string, maxAgeSeconds: number = 8 * 3600): void {
  if (typeof document === 'undefined') return;
  const secureFlag =
    typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secureFlag}`;
}

function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: UserSession = JSON.parse(raw);
    if (!session?.token || isTokenExpired(session.token)) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    clearSession();
    return null;
  }
}

export function saveSession(session: UserSession, maxAgeSeconds?: number): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setSessionCookie(session.token, maxAgeSeconds);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  clearSessionCookie();
}

class GatewayAuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
  }
}

async function fetchGatewayMe(token: string): Promise<{
  user: {
    userId: string;
    tenantId: string;
    branchId?: string;
    roles: UserRole[];
    permissions: string[];
  };
  tenantContext: {
    tenantId: string;
    branchId?: string;
    actorUserId: string;
  };
}> {
  const res = await fetch(`${API_GATEWAY_BASE_URL}/api/v1/iam/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let msg = `IAM verification failed (${res.status})`;
    try {
      const errBody = await res.json();
      if (errBody?.message) msg = errBody.message;
    } catch {
      // Ignore invalid error JSON
    }
    throw new GatewayAuthError(msg, res.status);
  }

  return res.json();
}

export async function refreshSessionFromGateway(
  existing: UserSession,
): Promise<UserSession | null> {
  if (!existing?.token || isTokenExpired(existing.token)) {
    clearSession();
    return null;
  }

  try {
    const me = await fetchGatewayMe(existing.token);
    const roles: UserRole[] =
      me.user?.roles && me.user.roles.length > 0 ? me.user.roles : ['VIEWER'];
    const permissions =
      me.user?.permissions && me.user.permissions.length > 0
        ? me.user.permissions
        : getPermissionsForRoles(roles);

    const refreshed: UserSession = {
      ...existing,
      id: me.user?.userId || existing.id,
      tenantId: me.tenantContext?.tenantId || me.user?.tenantId || existing.tenantId,
      branchId: me.tenantContext?.branchId || me.user?.branchId || existing.branchId,
      role: roles[0],
      roles,
      permissions,
    };
    saveSession(refreshed);
    return refreshed;
  } catch (err) {
    if (err instanceof GatewayAuthError && (err.statusCode === 401 || err.statusCode === 403)) {
      clearSession();
      return null;
    }
    return existing;
  }
}

export async function createSessionForRole(
  role: UserRole,
  branchId?: string,
): Promise<UserSession> {
  if (!isDemoModeEnabled()) {
    throw new Error('Demo persona sign-in is disabled unless NEXT_PUBLIC_DEMO_MODE=true.');
  }

  const persona = DEMO_PERSONAS[role];
  if (!persona) {
    throw new Error(`Unsupported demo role: ${role}`);
  }

  const isKandy = branchId === DEMO_TENANT.kandyBranchId;
  const selectedBranchId = isKandy ? DEMO_TENANT.kandyBranchId : DEMO_TENANT.colomboBranchId;
  const selectedBranchName = isKandy ? DEMO_TENANT.kandyBranchName : DEMO_TENANT.colomboBranchName;

  const permissions = getPermissionsForRoles([role]);
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600; // 8 hours

  const token = await createSignedDevToken({
    sub: persona.id,
    email: persona.email,
    tenant_id: DEMO_TENANT.id,
    branch_id: selectedBranchId,
    roles: [role],
    exp,
  });

  const session: UserSession = {
    id: persona.id,
    email: persona.email,
    fullName: persona.fullName,
    role: persona.role,
    roles: [persona.role],
    tenantId: DEMO_TENANT.id,
    tenantName: DEMO_TENANT.name,
    branchId: selectedBranchId,
    branchName: selectedBranchName,
    permissions,
    token,
    expiresAt: exp * 1000,
    avatarColor: persona.avatarColor,
    jobTitle: persona.jobTitle,
    department: persona.department,
  };

  saveSession(session);
  return session;
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<UserSession> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !password || password.length < 6) {
    throw new Error('Corporate email and password (minimum 6 characters) are required.');
  }

  // Exact demo persona sign-in ONLY when NEXT_PUBLIC_DEMO_MODE=true
  if (isDemoModeEnabled()) {
    const personaEntry = Object.entries(DEMO_PERSONAS).find(
      ([, p]) => p.email.toLowerCase() === normalized,
    );
    if (personaEntry) {
      return createSessionForRole(personaEntry[0] as UserRole);
    }
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Authentication service not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email: normalized, password }),
  });

  if (!authRes.ok) {
    let message = 'Invalid corporate email or password.';
    try {
      const errData = await authRes.json();
      if (errData?.error_description || errData?.msg) {
        message = errData.error_description || errData.msg;
      }
    } catch {
      // Keep default error message
    }
    throw new Error(message);
  }

  const authData = (await authRes.json()) as {
    access_token?: string;
    expires_in?: number;
    user?: {
      id?: string;
      email?: string;
      user_metadata?: { full_name?: string };
    };
  };

  if (!authData.access_token) {
    throw new Error('Authentication server did not return an access token.');
  }

  // Resolve authoritative tenant, roles, and permissions via API Gateway -> svc-iam-tenant
  const me = await fetchGatewayMe(authData.access_token);
  const roles: UserRole[] =
    me.user?.roles && me.user.roles.length > 0 ? me.user.roles : ['VIEWER'];
  const permissions =
    me.user?.permissions && me.user.permissions.length > 0
      ? me.user.permissions
      : getPermissionsForRoles(roles);

  const decoded = decodeJwtPayload<{ exp?: number }>(authData.access_token);
  const expMs = decoded?.exp
    ? decoded.exp * 1000
    : Date.now() + (authData.expires_in || 28800) * 1000;

  const fullName =
    authData.user?.user_metadata?.full_name ||
    normalized.split('@')[0];

  const session: UserSession = {
    id: me.user.userId,
    email: authData.user?.email || normalized,
    fullName,
    role: roles[0],
    roles,
    tenantId: me.tenantContext.tenantId,
    tenantName: DEMO_TENANT.name,
    branchId: me.tenantContext.branchId || DEMO_TENANT.colomboBranchId,
    branchName:
      me.tenantContext.branchId === DEMO_TENANT.kandyBranchId
        ? DEMO_TENANT.kandyBranchName
        : DEMO_TENANT.colomboBranchName,
    permissions,
    token: authData.access_token,
    expiresAt: expMs,
    avatarColor: 'bg-blue-600',
    jobTitle: roles[0],
    department: 'Enterprise Operations',
  };

  saveSession(session, authData.expires_in || 8 * 3600);
  return session;
}
