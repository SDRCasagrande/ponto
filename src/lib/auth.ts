/**
 * Auth utilities — Token-based API protection
 * Uses HMAC-SHA256 signed tokens + bcrypt password hashing
 */
import { createHmac } from 'crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './db';

// Secret key — in production this should be in env vars
const SECRET = process.env.AUTH_SECRET || 'bc_secret_2026_bitkaiser_ponto';

export interface AuthPayload {
  email: string;
  name: string;
  role: 'admin' | 'operator' | 'viewer';
  iat: number;  // issued at
  exp: number;  // expiration
}

// Rate limiting store (in-memory)
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  
  if (!record) return { allowed: true };
  
  // Reset if lockout period has passed
  if (now - record.lastAttempt > LOCKOUT_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  
  if (record.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((LOCKOUT_MS - (now - record.lastAttempt)) / 1000);
    return { allowed: false, retryAfter };
  }
  
  return { allowed: true };
}

function recordAttempt(ip: string, success: boolean) {
  if (success) {
    loginAttempts.delete(ip);
    return;
  }
  const record = loginAttempts.get(ip) || { count: 0, lastAttempt: 0 };
  record.count++;
  record.lastAttempt = Date.now();
  loginAttempts.set(ip, record);
}

/**
 * Generate a signed auth token
 */
export function generateToken(email: string, name: string, role: AuthPayload['role'] = 'admin'): string {
  const payload: AuthPayload = {
    email, name, role,
    iat: Date.now(),
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHmac('sha256', SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): AuthPayload | null {
  try {
    const [data, sig] = token.split('.');
    if (!data || !sig) return null;

    // Verify signature
    const expectedSig = createHmac('sha256', SECRET).update(data).digest('base64url');
    if (sig !== expectedSig) return null;

    // Decode payload
    const payload: AuthPayload = JSON.parse(Buffer.from(data, 'base64url').toString());

    // Check expiration
    if (payload.exp < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Validate API request — extracts and verifies token from Authorization header or cookie
 */
export function validateRequest(request: Request): AuthPayload | null {
  // Check Authorization header first
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return verifyToken(authHeader.substring(7));
  }

  // Check cookie fallback
  const cookies = request.headers.get('cookie') || '';
  const match = cookies.match(/bc_token=([^;]+)/);
  if (match) {
    return verifyToken(match[1]);
  }

  return null;
}

/**
 * Authenticate user against database with bcrypt
 */
export async function authenticateUser(email: string, password: string, ip: string = '0.0.0.0') {
  // Rate limit check
  const rl = checkRateLimit(ip);
  if (!rl.allowed) {
    return { error: `Muitas tentativas. Tente novamente em ${rl.retryAfter}s.` };
  }

  try {
    // Find user in DB
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || !user.active) {
      recordAttempt(ip, false);
      return { error: 'Credenciais inválidas' };
    }

    // Verify password with bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      recordAttempt(ip, false);
      return { error: 'Credenciais inválidas' };
    }

    // Success — update last login
    recordAttempt(ip, true);
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const token = generateToken(user.email, user.name, user.role as AuthPayload['role']);
    return {
      email: user.email,
      name: user.name,
      role: user.role,
      token,
    };
  } catch (err) {
    console.error('Auth error:', err);
    return { error: 'Erro interno de autenticação' };
  }
}

/**
 * Hash a password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
