import { cookies } from 'next/headers';
import { createHmac } from 'crypto';
import prisma from '@/lib/prisma';

// Retrieve the JWT secret, enforcing presence in production at runtime (lazy evaluation prevents module evaluation crash during next build)
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL SECURITY EXCEPTION: JWT_SECRET or AUTH_SECRET environment variable must be configured in production.');
    }
    return 'hellfire-prints-super-secret-key-change-in-prod-12345';
  }
  return secret;
}

interface TokenPayload {
  userId: string;
  email: string;
  exp?: number;
}

/**
 * Sign a lightweight JWT token using Node's HMAC-SHA256 crypto APIs
 */
export function signToken(payload: Omit<TokenPayload, 'exp'>, expirySeconds = 30 * 24 * 60 * 60): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expirySeconds;
  const fullPayload = { ...payload, exp };

  const base64UrlEncode = (obj: unknown) =>
    Buffer.from(JSON.stringify(obj))
      .toString('base64url');

  const unsignedToken = `${base64UrlEncode(header)}.${base64UrlEncode(fullPayload)}`;
  const signature = createHmac('sha256', getJwtSecret())
    .update(unsignedToken)
    .digest('base64url');

  return `${unsignedToken}.${signature}`;
}

/**
 * Verify a token signature and return the payload if valid & unexpired
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signature] = parts;
    const unsignedToken = `${headerB64}.${payloadB64}`;

    const expectedSignature = createHmac('sha256', getJwtSecret())
      .update(unsignedToken)
      .digest('base64url');

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as TokenPayload;

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

/**
 * Resolve the current authenticated user on the server side from cookie tokens
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload || !payload.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error resolving current authenticated user:', error);
    return null;
  }
}

/**
 * Resolve the user, throwing or returning null if unauthenticated
 */
export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

/**
 * Resolve the user, throwing if unauthenticated or not an ADMIN
 */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  if (user.role !== 'ADMIN') {
    throw new Error('Forbidden');
  }
  return user;
}

