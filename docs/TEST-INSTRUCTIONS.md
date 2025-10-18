# Testing Guide

Complete guide to testing Kaiba Manor applications with Vitest, Supabase, and Stripe.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Project Structure](#project-structure)
4. [Configuration](#configuration)
5. [Running Tests](#running-tests)
6. [Writing Tests](#writing-tests)
7. [Application-Level Testing](#application-level-testing)
8. [Test Data Management](#test-data-management)
9. [Supabase RLS Testing](#supabase-rls-testing)
10. [Stripe Testing](#stripe-testing)
11. [Best Practices](#best-practices)
12. [Troubleshooting](#troubleshooting)

---

## Testing Philosophy

This template follows the **Testing Trophy** approach (popularized by Kent C. Dodds):

```
         E2E (few)
     ↗              ↖
Integration (most)
     ↘              ↙
      Unit (some)
```

**Why Integration-Focused?**
- Tests how users actually interact with your app
- Catches more real bugs than pure unit tests
- Less brittle (don't break on refactors)
- Provides confidence for shipping

**Recommended Distribution:**
- 60% Integration tests (tRPC procedures, components with real hooks)
- 30% Unit tests (pure functions, utilities, schemas)
- 10% E2E tests (critical user flows only)

---

## Test Types

### Unit Tests

**Definition:** Test a single unit of code in complete isolation with all dependencies mocked.

**Characteristics:**
- No network calls
- No database queries
- No file system access
- Fast (<10ms per test)

**Examples:**
```ts
// Pure function
const calculateTotal = (items: Item[]) =>
  items.reduce((sum, item) => sum + item.price, 0);

// Zod schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});
```

**File naming:** `*.test.ts`

---

### Integration Tests

**Definition:** Test how multiple units work together with real or semi-real dependencies.

**Characteristics:**
- Tests multiple layers (component + hook + tRPC + context)
- May hit real API endpoints (in test environment)
- May use test database
- Moderate speed (100ms-1s per test)

**Examples:**
```ts
// tRPC procedure with real context
test('getUser returns user data for authenticated user', async () => {
  const caller = appRouter.createCaller({ user: mockUser });
  const result = await caller.example.getUser();
  expect(result.user.email).toBe('test@example.com');
});

// Component with real tRPC hook
test('Dashboard shows user name from API', async () => {
  render(<Dashboard />);
  await waitFor(() => {
    expect(screen.getByText('Hello, John!')).toBeInTheDocument();
  });
});
```

**File naming:** `*.integration.test.ts`

---

### E2E (End-to-End) Tests

**Definition:** Full user flows through real browser with real backend.

**Characteristics:**
- Browser automation (Playwright/Cypress)
- Real database (test environment)
- Real network calls
- Slowest (5-30s per test)

**File naming:** `*.e2e.test.ts` (not included in template, add as needed)

---

## Project Structure

```
tests/
├── unit/                           # Fast, isolated tests
│   └── example.test.ts
├── integration/                    # Multi-layer tests
│   ├── trpc.integration.test.ts
│   └── supabase-rls.integration.test.ts
├── helpers/
│   └── factories.ts                # Test data factories
├── setup.ts                        # Global test setup
└── tsconfig.json                   # Test TypeScript config

scripts/
├── cleanup-test-data.ts            # Clean all test data
└── cleanup-test-run.ts             # Clean specific test run

vitest.config.mts                   # Vitest configuration
```

---

## Configuration

### Vitest Config (`vitest.config.mts`)

The test configuration uses the `.mts` extension instead of `.ts` for an important reason:

**Why `.mts`?**
- Vitest and Vite are ES modules and cannot be `require()`'d in CommonJS context
- Without `"type": "module"` in `package.json`, Node.js defaults to CommonJS
- The `.mts` extension forces Node.js to treat the file as an ES module
- This prevents `ERR_REQUIRE_ESM` errors when running tests

**Key Configuration:**

```ts
import { defineConfig } from 'vitest/config';
import { loadEnv } from 'vite';  // ← Note: from 'vite', not 'vitest'
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({  // ← Function form to access mode
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules', '.next', 'out'],
    env: loadEnv(mode, process.cwd(), ''),  // ← Loads .env files
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '.next/',
        '*.config.{ts,js}',
        'src/types/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}));
```

**Important: Environment Variable Loading**

Unlike Next.js, Vitest doesn't automatically load `.env.local` files. You must use Vite's `loadEnv()`:

```ts
// ✅ Correct - loads .env, .env.local, etc.
env: loadEnv(mode, process.cwd(), '')

// ❌ Wrong - env vars won't be available
// (no env configuration)
```

The third parameter (`''`) means "load all env vars" - you can specify a prefix like `'VITE_'` to filter.

### TypeScript Configuration

Tests have a separate `tests/tsconfig.json` that doesn't extend the root config:

**Why separate?**
- Root config excludes `tests/` directory
- Tests need access to both test files AND src files
- Standalone config prevents inheritance conflicts

**Key settings:**
```json
{
  "compilerOptions": {
    "baseUrl": "..",           // Relative to tests/ directory
    "paths": {
      "@/*": ["./src/*"]       // Resolves @/ imports
    },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "../src/**/*.ts",          // Include src for type checking
    "../src/**/*.tsx"
  ]
}
```

---

## Running Tests

### All Tests
```bash
npm test
# or
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (UI)
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Specific File
```bash
npm test tests/unit/example.test.ts
```

### Specific Test
```bash
npm test -t "should calculate total correctly"
```

---

## Writing Tests

### Basic Test Structure

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Feature Name', () => {
  // Setup before all tests
  beforeAll(async () => {
    // Create test data
  });

  // Optional: Cleanup after all tests
  afterAll(async () => {
    if (process.env.CLEANUP_TEST_DATA === 'true') {
      // Cleanup test data
    }
  });

  it('should do something specific', () => {
    // Arrange
    const input = 'test';

    // Act
    const result = doSomething(input);

    // Assert
    expect(result).toBe('expected');
  });
});
```

### Unit Test Example

```ts
// tests/unit/utils.test.ts
import { describe, it, expect } from 'vitest';

describe('Date Utilities', () => {
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  it('formats date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    expect(formatDate(date)).toBe('2024-01-15');
  });
});
```

### Integration Test Example (tRPC)

```ts
// tests/integration/user-profile.integration.test.ts
import { describe, it, expect } from 'vitest';
import { appRouter } from '@/server/root';
import { createAuthenticatedContext } from '../helpers/factories';

describe('User Profile', () => {
  it('updates user name successfully', async () => {
    const ctx = createAuthenticatedContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.example.updateProfile({
      name: 'New Name'
    });

    expect(result.success).toBe(true);
    expect(result.user.name).toBe('New Name');
  });
});
```

---

## Application-Level Testing

### Why Application-Level Testing?

**Traditional approach (database-level with pgTAP):**
- Tests SQL queries directly
- Uses transactions for isolation
- Fast but doesn't test real app behavior

**Application-level testing:**
- Tests through your actual API (tRPC, Supabase client)
- Verifies RLS policies work as users experience them
- Catches bugs in application code + database policies
- More realistic, end-to-end verification

### Key Principle: No Database Resets

**Don't do this:**
```ts
afterEach(async () => {
  await db.query('DELETE FROM users WHERE is_test = true');
  // ❌ Slow, prevents parallelization, complicates test code
});
```

**Do this instead:**
```ts
const USER_ID = crypto.randomUUID(); // Unique per test run
// ✅ Fast, parallel-safe, simple
```

### Why No Database Resets?

1. **Speed** - DELETE operations add 20-50% overhead
2. **Parallelization** - Can run tests simultaneously without conflicts
3. **Debugging** - Test data persists for post-mortem inspection
4. **Simplicity** - Less code to maintain
5. **Idiomatic** - Recommended by Supabase docs

### Cleanup Strategy

Instead of automatic teardown, we use:
- **Unique UUIDs** for test isolation
- **Metadata tagging** for identification
- **Cleanup scripts** for manual/scheduled cleanup

---

## Test Data Management

### Tagging Strategy

**Every test entity must be tagged as test data.**

This allows safe cleanup without affecting real data.

### Supabase Auth Users

```ts
import { createTestUser, TEST_RUN_ID } from '../helpers/factories';

const user = createTestUser({
  testSuite: 'rls-policies',
});

// Note: Don't pass custom ID - let Supabase generate it for proper password handling
await adminSupabase.auth.admin.createUser({
  email: user.email,              // test-{uuid}@test.example.com
  password: user.password,
  email_confirm: true,
  user_metadata: {
    is_test_data: true,           // Tag for cleanup
    test_run_id: TEST_RUN_ID,     // Identify specific test run
    test_suite: 'rls-policies',   // Group related tests
    created_at: new Date().toISOString(),
  },
});
```

**Queryable by:**
- Email pattern: `email LIKE '%@test.example.com'`
- Metadata: `user_metadata->>'is_test_data' = 'true'`
- Test run: `user_metadata->>'test_run_id' = '...'`

### Database Rows (Custom Tables)

```ts
import { createTestMetadata, TEST_RUN_ID } from '../helpers/factories';

await supabase.from('todos').insert({
  task: 'Test todo',
  user_id: TEST_USER_ID,
  metadata: createTestMetadata('todos-suite'), // Adds tagging
});

// metadata contains:
// {
//   is_test_data: true,
//   test_run_id: TEST_RUN_ID,
//   test_suite: 'todos-suite',
//   created_at: '...'
// }
```

**Queryable by:**
- JSONB: `metadata->>'is_test_data' = 'true'`
- Foreign key: `user_id IN (SELECT id FROM auth.users WHERE ...)`

### Stripe Resources

```ts
import { createStripeTestMetadata } from '../helpers/factories';

await stripe.customers.create({
  email: `test-${crypto.randomUUID()}@test.example.com`,
  metadata: createStripeTestMetadata('billing-suite'),
  // metadata: { is_test_data: 'true', test_run_id: '...', test_suite: 'billing-suite' }
});
```

**Queryable by:**
- Stripe API: Filter by `metadata.is_test_data`
- Email pattern: `test-%@test.example.com`

### Cleanup Scripts

#### Clean All Test Data

```bash
# Preview what would be deleted
npm run test:cleanup -- --dry-run

# Delete all test data (with confirmation)
npm run test:cleanup

# Delete without confirmation (CI mode)
npm run test:cleanup -- --yes
```

#### Clean Specific Test Run

```bash
# Get test run ID from test output, then:
npm run test:cleanup-run <test-run-id>

# Example:
npm run test:cleanup-run a1b2c3d4-e5f6-7890-abcd-ef1234567890 --yes
```

### When to Cleanup

- **After major test runs** (especially when testing locally)
- **Before demos** (clean up accumulated test data)
- **Weekly/monthly** (scheduled cleanup in CI)
- **Never during tests** (data persists for debugging)

---

## Supabase RLS Testing

### Pattern: Unique UUIDs + Tagged Test Users

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { createTestUser, TEST_RUN_ID } from '../helpers/factories';

describe('Todos RLS Policies', () => {
  // Generate unique test users for this test suite
  const user1 = createTestUser({ testSuite: 'todos-rls' });
  const user2 = createTestUser({ testSuite: 'todos-rls' });

  // Declare clients but don't initialize (prevents evaluation when tests are skipped)
  let supabase: ReturnType<typeof createClient>;
  let adminSupabase: ReturnType<typeof createClient>;

  beforeAll(async () => {
    // Initialize clients here (only runs if tests aren't skipped)
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        auth: {
          storageKey: 'supabase-test-user',  // Unique key to avoid client conflicts
        },
      }
    );

    adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          storageKey: 'supabase-test-admin',  // Unique key to avoid client conflicts
        },
      }
    );
    // Create test users (auto-tagged)
    // Note: Don't pass custom ID - let Supabase generate it for proper password handling
    await adminSupabase.auth.admin.createUser({
      email: user1.email,
      password: user1.password,
      email_confirm: true,
      user_metadata: user1.user_metadata,
    });

    await adminSupabase.auth.admin.createUser({
      email: user2.email,
      password: user2.password,
      email_confirm: true,
      user_metadata: user2.user_metadata,
    });

    // Create test data (also tagged)
    await adminSupabase.from('todos').insert([
      {
        task: 'User 1 Task 1',
        user_id: user1.id,
        metadata: { is_test_data: true, test_run_id: TEST_RUN_ID }
      },
      {
        task: 'User 1 Task 2',
        user_id: user1.id,
        metadata: { is_test_data: true, test_run_id: TEST_RUN_ID }
      },
      {
        task: 'User 2 Task 1',
        user_id: user2.id,
        metadata: { is_test_data: true, test_run_id: TEST_RUN_ID }
      },
    ]);

    console.log(`\n[Test Run ID: ${TEST_RUN_ID}]`);
  });

  // No afterAll cleanup - use scripts when needed

  it('should allow User 1 to only see their own todos', async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: user1.email,
      password: user1.password,
    });

    const { data: todos } = await supabase
      .from('todos')
      .select('*');

    expect(todos).toHaveLength(2);
    todos?.forEach((todo) => {
      expect(todo.user_id).toBe(user1.id);
    });
  });

  it('should allow User 1 to create their own todo', async () => {
    await supabase.auth.signInWithPassword({
      email: user1.email,
      password: user1.password,
    });

    const { error } = await supabase.from('todos').insert({
      task: 'New Task',
      user_id: user1.id,
      metadata: { is_test_data: true, test_run_id: TEST_RUN_ID }
    });

    expect(error).toBeNull();
  });

  it('should allow User 2 to only see their own todos', async () => {
    await supabase.auth.signInWithPassword({
      email: user2.email,
      password: user2.password,
    });

    const { data: todos } = await supabase
      .from('todos')
      .select('*');

    expect(todos).toHaveLength(1);
    expect(todos![0].user_id).toBe(user2.id);
  });

  it('should prevent User 2 from modifying User 1 todos', async () => {
    await supabase.auth.signInWithPassword({
      email: user2.email,
      password: user2.password,
    });

    // Attempt to update User 1's todos (should be no-op due to RLS)
    await supabase
      .from('todos')
      .update({ task: 'Hacked!' })
      .eq('user_id', user1.id);

    // Verify User 1's todos weren't changed
    await supabase.auth.signInWithPassword({
      email: user1.email,
      password: user1.password,
    });

    const { data: todos } = await supabase
      .from('todos')
      .select('*');

    todos?.forEach((todo) => {
      expect(todo.task).not.toBe('Hacked!');
    });
  });
});
```

### Key Points

- ✅ **Unique UUIDs** prevent test conflicts
- ✅ **Tagged data** enables safe cleanup
- ✅ **Real auth flows** test actual user experience
- ✅ **Admin client** for setup (bypasses RLS)
- ✅ **Anon client** for tests (respects RLS)
- ✅ **Unique storage keys** prevent GoTrueClient conflicts when using multiple clients
- ✅ **No cleanup** during tests (data persists for debugging)
- ✅ **No custom IDs** - let Supabase generate IDs for proper password handling

---

## Stripe Testing

### Test Mode Keys

**Always use test mode keys for testing:**

```bash
# .env.test (gitignored)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Never use live keys in tests!**

### Creating Test Resources

```ts
import Stripe from 'stripe';
import { createStripeTestMetadata } from '../helpers/factories';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia',
});

describe('Stripe Billing', () => {
  it('creates customer with test metadata', async () => {
    const customer = await stripe.customers.create({
      email: `test-${crypto.randomUUID()}@test.example.com`,
      metadata: createStripeTestMetadata('billing-suite'),
    });

    expect(customer.id).toMatch(/^cus_/);
    expect(customer.metadata.is_test_data).toBe('true');
  });
});
```

### Test Clock Pattern

For testing time-based scenarios (subscriptions, trials):

```ts
// Create test clock
const testClock = await stripe.testHelpers.testClocks.create({
  frozen_time: Math.floor(Date.now() / 1000),
});

// Create customer tied to test clock
const customer = await stripe.customers.create({
  email: 'test@test.example.com',
  test_clock: testClock.id,
});

// Advance time
await stripe.testHelpers.testClocks.advance(testClock.id, {
  frozen_time: Math.floor(Date.now() / 1000) + 86400 * 7, // +7 days
});
```

### Webhook Testing

**Option 1: Mock webhook events**
```ts
const mockEvent = {
  type: 'customer.subscription.created',
  data: {
    object: { /* subscription data */ },
  },
};

// Test webhook handler with mock event
```

**Option 2: Use Stripe CLI**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger payment_intent.succeeded
```

### When to Mock vs Real Stripe

**Use real Stripe calls when:**
- Testing payment flows end-to-end
- Verifying webhook handling
- Testing subscription lifecycle

**Mock Stripe when:**
- Unit testing business logic
- Fast feedback loops
- CI/CD environments (rate limits)

---

## Best Practices

### 1. Test Isolation

Each test should be completely independent:

```ts
// ✅ Good - unique data per test
const user = createTestUser();

// ❌ Bad - shared state between tests
let sharedUser: User;
beforeAll(() => {
  sharedUser = createTestUser();
});
```

### 2. Descriptive Test Names

```ts
// ✅ Good - describes what and why
it('should return 401 when user is not authenticated', () => {});

// ❌ Bad - vague
it('test auth', () => {});
```

### 3. Arrange-Act-Assert

```ts
it('calculates discount correctly', () => {
  // Arrange - setup
  const price = 100;
  const discountPercent = 20;

  // Act - execute
  const final = applyDiscount(price, discountPercent);

  // Assert - verify
  expect(final).toBe(80);
});
```

### 4. Test One Thing Per Test

```ts
// ✅ Good - tests one specific behavior
it('should validate email format', () => {
  expect(() => validateEmail('invalid')).toThrow();
});

it('should accept valid email', () => {
  expect(validateEmail('test@example.com')).toBe(true);
});

// ❌ Bad - tests multiple things
it('validates email and name', () => {
  expect(validateEmail('test@example.com')).toBe(true);
  expect(validateName('John')).toBe(true);
});
```

### 5. Use Factories for Test Data

```ts
// ✅ Good - use factory
const user = createTestUser({ name: 'Custom Name' });

// ❌ Bad - manual construction
const user = {
  id: crypto.randomUUID(),
  email: `test-${crypto.randomUUID()}@test.example.com`,
  user_metadata: { is_test_data: true, /* ... */ }
};
```

### 6. Skip Tests That Require Setup

```ts
const shouldSkip = !process.env.NEXT_PUBLIC_SUPABASE_URL;

describe.skipIf(shouldSkip)('Supabase Tests', () => {
  // These tests only run if Supabase is configured
});
```

### 7. Log Test Run IDs

```ts
beforeAll(() => {
  console.log(`\n[Test Run ID: ${TEST_RUN_ID}]`);
  console.log('Run "npm run test:cleanup" to remove test data\n');
});
```

---

## Troubleshooting

### Tests Failing Locally

1. Check environment variables:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   ```

2. Verify Supabase connection:
   ```bash
   curl $NEXT_PUBLIC_SUPABASE_URL
   ```

3. Check test data conflicts:
   ```bash
   npm run test:cleanup -- --dry-run
   ```

### Slow Tests

1. Run only unit tests:
   ```bash
   npm run test:unit
   ```

2. Run specific file:
   ```bash
   npm test tests/unit/example.test.ts
   ```

3. Use watch mode with filters:
   ```bash
   npm run test:ui
   ```

### Test Data Accumulation

Periodically clean up test data:

```bash
# Check what would be deleted
npm run test:cleanup -- --dry-run

# Delete all test data
npm run test:cleanup -- --yes
```

---

**Happy Testing!** 🎯
