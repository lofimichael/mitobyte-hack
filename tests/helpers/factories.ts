import crypto from 'crypto';
import type { User } from '@/store/authStore';

/**
 * Global test run ID - unique per test execution
 * Used to identify and cleanup data from specific test runs
 */
export const TEST_RUN_ID = crypto.randomUUID();

/**
 * Test user factory with automatic tagging
 * Creates users that are identifiable as test data for safe cleanup
 */
export const createTestUser = (overrides?: Partial<{
  id: string;
  email: string;
  name: string;
  testSuite: string;
}>) => {
  const id = overrides?.id || crypto.randomUUID();

  return {
    id,
    email: overrides?.email || `test-${id}@test.example.com`,
    password: 'test-password-123',
    name: overrides?.name || `Test User ${id.slice(0, 8)}`,
    user_metadata: {
      is_test_data: true,
      test_run_id: TEST_RUN_ID,
      test_suite: overrides?.testSuite || 'default',
      created_at: new Date().toISOString(),
    },
  };
};

/**
 * Mock tRPC context factory
 * Creates authenticated or unauthenticated contexts for testing procedures
 */
export const createMockContext = (user?: User | null) => {
  return {
    user: user || null,
    date: new Date(),
  };
};

/**
 * Create authenticated context with a test user
 */
export const createAuthenticatedContext = () => {
  const testUser = createTestUser();
  return createMockContext({
    id: testUser.id,
    email: testUser.email,
    name: testUser.name,
  });
};

/**
 * Create unauthenticated context (no user)
 */
export const createUnauthenticatedContext = () => {
  return createMockContext(null);
};

/**
 * Test data factory for database rows
 * Adds consistent tagging for cleanup
 */
export const createTestMetadata = (testSuite?: string) => ({
  is_test_data: true,
  test_run_id: TEST_RUN_ID,
  test_suite: testSuite || 'default',
  created_at: new Date().toISOString(),
});

/**
 * Stripe test data factory
 * Creates metadata for Stripe resources
 */
export const createStripeTestMetadata = (testSuite?: string) => ({
  is_test_data: 'true', // Stripe metadata values are strings
  test_run_id: TEST_RUN_ID,
  test_suite: testSuite || 'default',
});
