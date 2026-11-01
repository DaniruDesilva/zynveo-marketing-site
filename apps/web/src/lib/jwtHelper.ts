/**
 * Web Crypto & Browser-Safe HMAC-SHA256 JWT Generator
 * Fully compatible with apps/api-gateway/src/auth/jwt-auth.guard.ts
 */

const DEFAULT_DEV_JWT_SECRET = 'zynveo-dev-jwt-secret-local-fallback';

export function base64UrlEncode(str: string): string {
  let base64: string;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    base64 = window.btoa(unescape(encodeURIComponent(str)));
  } else {
    base64 = Buffer.from(str, 'utf8').toString('base64');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(escape(window.atob(base64)));
  } else {
    return Buffer.from(base64, 'base64').toString('utf8');
  }
}

export async function signHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(sigBuf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof window !== 'undefined' && typeof window.btoa === 'function'
    ? window.btoa(binary)
    : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface JwtTokenPayload {
  sub: string;
  email: string;
  tenant_id: string;
  branch_id?: string;
  roles: string[];
  exp: number;
  iat: number;
  app_metadata?: {
    tenant_id: string;
    branch_id?: string;
    roles: string[];
  };
  user_metadata?: {
    full_name?: string;
    roles?: string[];
  };
}

export async function createSignedDevToken(
  payload: Omit<JwtTokenPayload, 'iat'>,
  secret: string = DEFAULT_DEV_JWT_SECRET
): Promise<string> {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const fullPayload: JwtTokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    app_metadata: {
      tenant_id: payload.tenant_id,
      branch_id: payload.branch_id,
      roles: payload.roles,
    },
    user_metadata: {
      full_name: (payload as any).fullName || (payload as any).name,
      roles: payload.roles,
    }
  };
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const unsignedToken = `${header}.${body}`;
  const signature = await signHmacSha256(unsignedToken, secret);
  return `${unsignedToken}.${signature}`;
}

export function decodeJwtPayload<T = any>(token: string): T | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(base64UrlDecode(parts[1])) as T;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload<{ exp?: number }>(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return payload.exp * 1000 < Date.now();
}
