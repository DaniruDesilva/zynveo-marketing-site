/**
 * Web Crypto & Edge-Safe HMAC-SHA256 JWT Utilities.
 * Verification is available across Next.js Edge middleware and browser/Node runtimes.
 * Token minting (`createSignedDevToken`) is restricted strictly to explicit non-production demo mode.
 */

export function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function base64UrlDecode(str: string): string {
  const bytes = base64UrlToUint8Array(str);
  return new TextDecoder().decode(bytes);
}

export async function signHmacSha256(data: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  const bytes = new Uint8Array(sigBuf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export interface JwtTokenPayload {
  sub: string;
  email?: string;
  tenant_id?: string;
  branch_id?: string;
  roles?: string[];
  exp?: number;
  iat?: number;
  app_metadata?: {
    tenant_id?: string;
    branch_id?: string;
    roles?: string[];
  };
  user_metadata?: {
    full_name?: string;
    roles?: string[];
  };
}

export async function createSignedDevToken(
  payload: Omit<JwtTokenPayload, 'iat'>,
  secret?: string,
): Promise<string> {
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const effectiveSecret =
    secret ||
    process.env.NEXT_PUBLIC_DEV_JWT_SECRET ||
    (process.env.NODE_ENV !== 'production' && isDemoMode
      ? 'zynveo-dev-jwt-secret-local-fallback'
      : undefined);

  if (!effectiveSecret) {
    throw new Error('Client-side dev JWT minting is disabled outside explicit demo mode.');
  }

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
    },
  };
  const body = base64UrlEncode(JSON.stringify(fullPayload));
  const unsignedToken = `${header}.${body}`;
  const signature = await signHmacSha256(unsignedToken, effectiveSecret);
  return `${unsignedToken}.${signature}`;
}

export async function verifyJwtHs256(
  token: string,
  secret?: string,
): Promise<JwtTokenPayload | null> {
  if (!secret || !token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const [headerB64, payloadB64, signatureB64] = parts;
    const header = JSON.parse(base64UrlDecode(headerB64)) as { alg?: string };
    if (header?.alg !== 'HS256') return null;

    const expectedSig = await signHmacSha256(`${headerB64}.${payloadB64}`, secret);
    if (signatureB64.length !== expectedSig.length) return null;

    let diff = 0;
    for (let i = 0; i < signatureB64.length; i++) {
      diff |= signatureB64.charCodeAt(i) ^ expectedSig.charCodeAt(i);
    }
    if (diff !== 0) return null;

    const payload = JSON.parse(base64UrlDecode(payloadB64)) as JwtTokenPayload;
    if (!payload?.sub || typeof payload.sub !== 'string') return null;
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
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
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 < Date.now();
}
