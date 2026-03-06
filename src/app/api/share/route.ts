import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter for share API
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds

// In-memory store for share tokens (in production, use a database)
// Format: token -> { title, members, createdAt, expiresAt, lastAccessedAt, accessCount }
const shareTokens = new Map<string, {
  title: string;
  members: string[];
  createdAt: string;
  expiresAt: string;
  lastAccessedAt?: string;
  accessCount: number;
}>();

// Track invalid token attempts for security monitoring
const invalidTokenAttempts = new Map<string, { count: number; resetTime: number }>();
const MAX_INVALID_ATTEMPTS = 5;
const INVALID_ATTEMPTS_WINDOW = 5 * 60 * 1000; // 5 minutes

function generateSecureToken(): string {
  // Generate a cryptographically secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

// Check for potential token enumeration attacks
function checkInvalidTokenAttempts(ip: string): boolean {
  const now = Date.now();
  const record = invalidTokenAttempts.get(ip);
  
  if (!record || now > record.resetTime) {
    invalidTokenAttempts.set(ip, { count: 1, resetTime: now + INVALID_ATTEMPTS_WINDOW });
    return true;
  }
  
  if (record.count >= MAX_INVALID_ATTEMPTS) {
    return false;
  }
  
  record.count++;
  return true;
}

// Clean up expired rate limit entries to prevent memory leaks
function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
  for (const [ip, record] of invalidTokenAttempts.entries()) {
    if (now > record.resetTime) {
      invalidTokenAttempts.delete(ip);
    }
  }
}

// Clean up expired share tokens
function cleanupExpiredTokens(): void {
  const now = new Date();
  for (const [token, data] of shareTokens.entries()) {
    if (new Date(data.expiresAt) < now) {
      shareTokens.delete(token);
    }
  }
}

// Run cleanup periodically (every 100 requests)
let requestCounter = 0;
function periodicCleanup(): void {
  requestCounter++;
  if (requestCounter % 100 === 0) {
    cleanupRateLimitMap();
    cleanupExpiredTokens();
  }
}

// GET: Validate token and get share data
export async function GET(request: NextRequest) {
  try {
    // Run periodic cleanup
    periodicCleanup();
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Validate token format (hex, 64 characters)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      // Check for enumeration attacks - don't reveal if format is invalid
      if (!checkInvalidTokenAttempts(ip)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      // Return same error as non-existent token to prevent enumeration
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }
    
    // Look up token in store
    const shareData = shareTokens.get(token);
    
    if (!shareData) {
      // Check for enumeration attacks
      if (!checkInvalidTokenAttempts(ip)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      // Return same error as invalid format to prevent enumeration
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }
    
    // Check if token has expired
    if (new Date(shareData.expiresAt) < new Date()) {
      shareTokens.delete(token);
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }
    
    // Update access tracking
    shareData.lastAccessedAt = new Date().toISOString();
    shareData.accessCount = (shareData.accessCount || 0) + 1;
    
    // Return share data (without the sensitive token)
    return NextResponse.json({
      title: shareData.title,
      members: shareData.members,
      createdAt: shareData.createdAt,
    });
    
  } catch (error) {
    console.error('Error validating share token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new share token
export async function POST(request: NextRequest) {
  try {
    // Run periodic cleanup
    periodicCleanup();
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const body = await request.json();
    const { title, members, expiresInDays = 30 } = body;
    
    // Validate input
    if (!title || typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }
    
    if (title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 100 characters or less' },
        { status: 400 }
      );
    }
    
    // Validate members is an array if provided
    if (members && !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'Members must be an array' },
        { status: 400 }
      );
    }
    
    // Validate members array contents
    if (members && Array.isArray(members)) {
      for (const member of members) {
        if (typeof member !== 'string') {
          return NextResponse.json(
            { error: 'Members must be an array of strings' },
            { status: 400 }
          );
        }
        if (member.length > 100) {
          return NextResponse.json(
            { error: 'Member ID must be 100 characters or less' },
            { status: 400 }
          );
        }
      }
    }
    
    // Validate expiresInDays
    if (typeof expiresInDays !== 'number' || expiresInDays < 1 || expiresInDays > 365) {
      return NextResponse.json(
        { error: 'expiresInDays must be between 1 and 365' },
        { status: 400 }
      );
    }
    
    // Generate secure token
    const token = generateSecureToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInDays * 24 * 60 * 60 * 1000);
    
    // Store token data with access tracking
    shareTokens.set(token, {
      title: title.substring(0, 100),
      members: members || [],
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      accessCount: 0,
    });
    
    // Return the share link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const shareLink = `${baseUrl}/share?token=${token}`;
    
    return NextResponse.json({
      success: true,
      token,
      shareLink,
      expiresAt: expiresAt.toISOString(),
    });
    
  } catch (error) {
    console.error('Error creating share token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Revoke a share token
export async function DELETE(request: NextRequest) {
  try {
    // Run periodic cleanup
    periodicCleanup();
    
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }
    
    // Validate token format (hex, 64 characters)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      // Check for enumeration attacks
      if (!checkInvalidTokenAttempts(ip)) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429 }
        );
      }
      // Return same error as non-existent token to prevent enumeration
      return NextResponse.json(
        { error: 'Invalid or expired share link' },
        { status: 404 }
      );
    }
    
    // Delete token if it exists
    if (shareTokens.has(token)) {
      shareTokens.delete(token);
      return NextResponse.json({ success: true });
    }
    
    // Check for enumeration attacks
    if (!checkInvalidTokenAttempts(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
    
    // Return same error as invalid format to prevent enumeration
    return NextResponse.json(
      { error: 'Invalid or expired share link' },
      { status: 404 }
    );
    
  } catch (error) {
    console.error('Error revoking share token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
