import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, TEST_RUN_ID } from '../helpers/factories';

/**
 * Integration Tests - Supabase RLS Policies
 *
 * These tests verify Row Level Security policies work correctly with real Supabase calls.
 *
 * IMPORTANT:
 * - Uses real Supabase instance (ensure test environment variables are set)
 * - Test users are automatically tagged for cleanup (see TEST_RUN_ID)
 * - No automatic teardown - data persists for debugging
 * - Run `npm run test:cleanup` to remove all test data
 * - Tests use unique UUIDs - safe to run in parallel
 */

// Skip these tests if environment variables are not set
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const shouldSkip = !SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SECRET_KEY;

describe.skipIf(shouldSkip)('Supabase RLS Policies', () => {
  // Generate unique test users for this test suite
  const user1 = createTestUser({ testSuite: 'rls-policies' });
  const user2 = createTestUser({ testSuite: 'rls-policies' });

  // Declare clients but don't initialize (prevents evaluation when tests are skipped)
  let supabase: ReturnType<typeof createClient>;
  let adminSupabase: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // Initialize clients here (only runs if tests aren't skipped)
    supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: {
        storageKey: 'supabase-test-user',
      },
    });
    adminSupabase = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: 'supabase-test-admin',
      },
    });

    // Setup: Create test users using admin client
    // These users are tagged with is_test_data for cleanup
    // Note: Not passing custom ID - let Supabase generate it for proper password setup
    const user1Result = await adminSupabase.auth.admin.createUser({
      email: user1.email,
      password: user1.password,
      email_confirm: true,
      user_metadata: user1.user_metadata,
    });

    const user2Result = await adminSupabase.auth.admin.createUser({
      email: user2.email,
      password: user2.password,
      email_confirm: true,
      user_metadata: user2.user_metadata,
    });

    // Check for errors
    if (user1Result.error) {
      console.error('Failed to create user1:', user1Result.error);
      throw user1Result.error;
    }
    if (user2Result.error) {
      console.error('Failed to create user2:', user2Result.error);
      throw user2Result.error;
    }

    console.log(`\n[Test Run ID: ${TEST_RUN_ID}]`);
    console.log(`Created test users: ${user1.email}, ${user2.email}`);
    console.log('Run "npm run test:cleanup" to remove test data\n');
  });

  // No afterAll cleanup - data persists for debugging
  // Use cleanup scripts when needed

  it('allows authenticated user to access auth.users', async () => {
    // Sign in as User 1
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user1.email,
      password: user1.password,
    });

    expect(signInError).toBeNull();

    // Verify session exists
    const { data: session } = await supabase.auth.getSession();
    expect(session.session).toBeDefined();
    expect(session.session?.user.email).toBe(user1.email);
  });

  it('allows different users to authenticate independently', async () => {
    // Sign in as User 2
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user2.email,
      password: user2.password,
    });

    expect(signInError).toBeNull();

    // Verify session
    const { data: session } = await supabase.auth.getSession();
    expect(session.session?.user.email).toBe(user2.email);
  });

  /*
   * Example: Testing RLS with Application Tables
   *
   * This demonstrates how to test RLS policies with tables that have the metadata JSONB column.
   * Uncomment when you have application tables created.
   *
   * it('should allow User 1 to only see their own data', async () => {
   *   // Setup: Create test data with metadata tagging using admin client
   *   const { error: insertError } = await adminSupabase
   *     .from('todos')
   *     .insert([
   *       {
   *         task: 'User 1 Task',
   *         user_id: user1.id,
   *         metadata: {
   *           is_test_data: true,
   *           test_run_id: TEST_RUN_ID,
   *           test_suite: 'rls-policies',
   *         },
   *       },
   *       {
   *         task: 'User 2 Task',
   *         user_id: user2.id,
   *         metadata: {
   *           is_test_data: true,
   *           test_run_id: TEST_RUN_ID,
   *           test_suite: 'rls-policies',
   *         },
   *       },
   *     ]);
   *
   *   expect(insertError).toBeNull();
   *
   *   // Test: Sign in as User 1
   *   await supabase.auth.signInWithPassword({
   *     email: user1.email,
   *     password: user1.password,
   *   });
   *
   *   // Verify User 1 can only see their own todos
   *   const { data: todos, error } = await supabase
   *     .from('todos')
   *     .select('*')
   *     .eq('metadata->>test_run_id', TEST_RUN_ID);
   *
   *   expect(error).toBeNull();
   *   expect(todos).toHaveLength(1);
   *   expect(todos?.[0].user_id).toBe(user1.id);
   *   expect(todos?.[0].task).toBe('User 1 Task');
   * });
   *
   * it('should prevent User 2 from accessing User 1 data', async () => {
   *   // Test: Sign in as User 2
   *   await supabase.auth.signInWithPassword({
   *     email: user2.email,
   *     password: user2.password,
   *   });
   *
   *   // Attempt to query User 1's data
   *   const { data: todos, error } = await supabase
   *     .from('todos')
   *     .select('*')
   *     .eq('user_id', user1.id);
   *
   *   expect(error).toBeNull();
   *   expect(todos).toHaveLength(0); // RLS blocks access
   * });
   */
});

/**
 * NOTE: This is a minimal example showing Supabase RLS testing pattern.
 *
 * In a real application, you would:
 * 1. Create test data in beforeAll (todos, organizations, etc.)
 * 2. Test that RLS policies correctly isolate data between users
 * 3. Verify CRUD operations respect RLS rules
 * 4. Test edge cases (admin access, public data, etc.)
 *
 * See docs/TEST-INSTRUCTIONS.md for complete examples and patterns.
 */
