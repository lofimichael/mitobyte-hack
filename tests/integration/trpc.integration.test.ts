import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/root';
import { createAuthenticatedContext, createUnauthenticatedContext } from '../helpers/factories';

/**
 * Integration Tests - tRPC Procedures
 *
 * These tests verify how tRPC procedures work with authentication context.
 * Uses mock contexts (no real database calls).
 */

describe('tRPC Example Router', () => {
  describe('Public Procedures', () => {
    it('hello procedure returns greeting', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.example.hello({ text: 'World' });

      expect(result.greeting).toBe('Hello World');
    });

    it('getAll procedure returns list', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.example.getAll();

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('text');
    });
  });

  describe('Protected Procedures', () => {
    it('getUser returns user data when authenticated', async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.example.getUser();

      expect(result.user).toBeDefined();
      expect(result.user.email).toMatch(/@test\.example\.com$/);
    });

    it('getUser throws UNAUTHORIZED when not authenticated', async () => {
      const ctx = createUnauthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      await expect(caller.example.getUser()).rejects.toThrow();
    });

    it('updateProfile updates user name', async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.example.updateProfile({
        name: 'Updated Name'
      });

      expect(result.success).toBe(true);
      expect(result.user.name).toBe('Updated Name');
    });

    it('updateProfile preserves existing name when not provided', async () => {
      const ctx = createAuthenticatedContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.example.updateProfile({});

      expect(result.success).toBe(true);
      expect(result.user.name).toBe(ctx.user!.name);
    });
  });
});
