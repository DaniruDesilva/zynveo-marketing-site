import { UserRole, getPermissionsForRoles } from '@zynveo/contracts';
import { UserSession, DEMO_PERSONAS, DEMO_TENANT } from './authTypes';
import { createSignedDevToken, decodeJwtPayload, isTokenExpired } from './jwtHelper';

const TOKEN_KEY = 'zynveo_access_token';
const SESSION_KEY = 'zynveo_user_session';
const COOKIE_NAME = 'zynveo_access_token';

function setSessionCookie(token: string, maxAgeSeconds: number = 7 * 86400): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=${token}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
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

export function saveSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, session.token);
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  setSessionCookie(session.token);
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  clearSessionCookie();
}

export async function createSessionForRole(
  role: UserRole,
  branchId?: string
): Promise<UserSession> {
  const persona = DEMO_PERSONAS[role] || DEMO_PERSONAS.OWNER;
  const isKandy = branchId === DEMO_TENANT.kandyBranchId;
  const selectedBranchId = isKandy ? DEMO_TENANT.kandyBranchId : DEMO_TENANT.colomboBranchId;
  const selectedBranchName = isKandy ? DEMO_TENANT.kandyBranchName : DEMO_TENANT.colomboBranchName;

  const permissions = getPermissionsForRoles([role]);
  const exp = Math.floor(Date.now() / 1000) + 7 * 86400; // 7 days

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
  password?: string
): Promise<UserSession> {
  const normalized = email.trim().toLowerCase();
  
  // Find matching demo persona by email or role keyword
  const personaEntry = Object.entries(DEMO_PERSONAS).find(
    ([roleKey, p]) =>
      p.email.toLowerCase() === normalized ||
      roleKey.toLowerCase() === normalized ||
      p.fullName.toLowerCase().includes(normalized)
  );

  const role: UserRole = personaEntry ? (personaEntry[0] as UserRole) : 'OWNER';
  return createSessionForRole(role);
}
