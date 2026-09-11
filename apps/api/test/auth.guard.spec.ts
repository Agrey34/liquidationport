import { describe, it, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { SupabaseAuthGuard } from '../src/common/guards/supabase-auth.guard';
import * as jwt from 'jsonwebtoken';

describe('SupabaseAuthGuard (Production Auth Hardening)', () => {
  let guard: SupabaseAuthGuard;
  const testSecret = process.env.SUPABASE_JWT_SECRET || 'mock-jwt-secret-for-unit-testing-32-chars-long-min!';
  const testSupabaseUrl = 'https://dwcqddafnxerhoredcmw.supabase.co';

  beforeEach(() => {
    process.env.SUPABASE_JWT_SECRET = testSecret;
    guard = new SupabaseAuthGuard();
  });

  const createMockContext = (authHeader?: string): ExecutionContext => {
    const request: Record<string, unknown> = {
      headers: {
        authorization: authHeader,
      },
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  };

  it('should authenticate a valid token with correct security claims locally', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      email: 'admin@liquidationport.com',
      role: 'authenticated',
      aud: 'authenticated',
      iss: `${testSupabaseUrl}/auth/v1`,
      app_metadata: { role: 'admin' },
    };

    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const context = createMockContext(`Bearer ${token}`);

    const result = await guard.canActivate(context);
    assert.strictEqual(result, true);

    const request = context.switchToHttp().getRequest() as any;
    assert.ok(request.user);
    assert.strictEqual(request.user.id, payload.sub);
    assert.strictEqual(request.user.role, 'admin');
  });

  it('should reject missing authorization headers', async () => {
    const context = createMockContext(undefined);
    await assert.rejects(guard.canActivate(context), UnauthorizedException);
  });

  it('should reject expired tokens', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: `${testSupabaseUrl}/auth/v1`,
      aud: 'authenticated',
    };

    // Expired 10 minutes ago
    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '-10m' });
    const context = createMockContext(`Bearer ${token}`);

    await assert.rejects(guard.canActivate(context), UnauthorizedException);
  });

  it('should reject tokens with an invalid signature', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: `${testSupabaseUrl}/auth/v1`,
      aud: 'authenticated',
    };

    const token = jwt.sign(payload, 'wrong-secret-key-that-does-not-match', { algorithm: 'HS256' });
    const context = createMockContext(`Bearer ${token}`);

    await assert.rejects(guard.canActivate(context), UnauthorizedException);
  });

  it('should verify a correctly signed token without a remote issuer lookup', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: 'https://attacker-fake-auth.com/auth/v1',
      aud: 'authenticated',
    };

    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const context = createMockContext(`Bearer ${token}`);

    assert.strictEqual(await guard.canActivate(context), true);
  });

  it('should reject tokens with an invalid audience claim', async () => {
    const payload = {
      sub: '5a829da4-c7f3-4744-b606-64cfaf262249',
      iss: `${testSupabaseUrl}/auth/v1`,
      aud: 'untrusted-third-party',
    };

    const token = jwt.sign(payload, testSecret, { algorithm: 'HS256', expiresIn: '1h' });
    const context = createMockContext(`Bearer ${token}`);

    await assert.rejects(guard.canActivate(context), UnauthorizedException);
  });
});
