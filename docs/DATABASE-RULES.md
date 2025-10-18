# Database Migrations Guide

This document outlines the structure and process for managing database migrations with a security-first approach.

## Core Security Principles

### 1. RLS is Mandatory
**Every table must have Row Level Security enabled.** No exceptions. This reduces attack surface area and prevents accidental data exposure.

### 2. Metadata Column is Mandatory
**Every table must have a `metadata JSONB` column.** No exceptions. This ensures uniform queryable interface across all tables, enables consistent test data tagging, and provides a future-proof escape hatch for feature flags and operational metadata without schema changes.

### 3. Principle of Least Privilege
- Start with zero access, then grant only what's needed
- If unsure, be more restrictive
- You can always add permissions later, but data breaches can't be undone

### 4. Policies Match Real Access Patterns
- Study how your application actually uses the data
- Don't copy generic CRUD policies
- Write policies that reflect actual user behavior

### 5. Schema Qualification
- Always use `public.table_name` to prevent naming conflicts
- Be explicit about which schema you're working in

## Migration File Structure

All migrations should be placed in the `/migrations` directory at the root of the project, with filenames in the format `XXXX_description.sql` where `XXXX` is a zero-padded sequence number.

### Recommended Migration Structure

For clean, maintainable migrations that avoid forward reference errors, follow this order:

1. **Create all tables** (with RLS enabled but no policies yet)
2. **Create all indexes**
3. **Create all functions**
4. **Create all triggers**
5. **Create all RLS policies** (now all tables exist, avoiding forward references)

This structure is idiomatic for PostgreSQL/Supabase because:
- Avoids forward reference errors (policies can't reference tables that don't exist)
- Easier to read and maintain
- Clear separation of concerns
- Dependencies are created in the correct order

### Migration Template

```sql
---------------------------------
-- Migration 0001: Title
-- Description: Brief description of what this migration does
---------------------------------

-- ============================================
-- CREATE ALL TABLES FIRST
-- ============================================

CREATE TABLE public.table_name (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Domain columns
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),

    -- Standard metadata column (REQUIRED on every table)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (but policies will be created later)
ALTER TABLE public.table_name ENABLE ROW LEVEL SECURITY;

-- More tables...

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_table_column ON public.table_name(column);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.function_name()
RETURNS ... AS $$
BEGIN
    -- function body
END;
$$ LANGUAGE plpgsql SECURITY INVOKER; -- or DEFINER if needed

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER trigger_name
    AFTER INSERT ON public.table_name
    FOR EACH ROW
    EXECUTE FUNCTION public.function_name();

-- ============================================
-- RLS POLICIES (After all tables exist)
-- ============================================

CREATE POLICY "policy_name" ON public.table_name
    FOR SELECT
    TO authenticated
    USING (...);

-- Down Migration (MUST be commented out!)
/*
-- CRITICAL: Drop objects in REVERSE dependency order!
-- 1. Drop all RLS policies first (they depend on tables)
DROP POLICY IF EXISTS "policy_name" ON public.table_name;

-- 2. Drop all triggers (they depend on functions)
DROP TRIGGER IF EXISTS trigger_name ON public.table_name;

-- 3. Drop all functions
DROP FUNCTION IF EXISTS public.function_name();

-- 4. Drop all indexes (optional but clean)
DROP INDEX IF EXISTS idx_table_column;

-- 5. Drop all tables last (now safe with no dependencies)
DROP TABLE IF EXISTS public.table_name;
*/
-- End Migration 0001
---------------------------------
```

## Standard Metadata Column Pattern

### Metadata JSONB Column is Required on Every Table

**Required Pattern:** Every table must include a `metadata JSONB` column. This is not optional - it's a core architectural requirement that ensures uniform query interface, consistent test data management, and future-proof schema flexibility.

```sql
CREATE TABLE public.any_table (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Domain-specific columns
    name TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),

    -- Standard metadata column (REQUIRED)
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Why is Metadata Required on Every Table?

**This is a template-wide architectural standard.** Just as every table must have RLS enabled, every table must have a metadata JSONB column. This requirement exists for consistency, maintainability, and operational excellence.

1. **Uniform Query Interface (Critical)**
   - Every table has the exact same shape - no exceptions
   - Write generic cleanup/migration scripts once, apply to all tables
   - Zero special cases - predictable schema everywhere
   - **Without uniformity:** Each table needs custom handling, scripts break, maintenance nightmare

2. **Test Data Tagging (Essential)**
   - Mark test data consistently across all tables with `is_test_data` flag
   - Generic cleanup scripts work everywhere - no table-specific logic
   - Safe shared database testing (dev/test in same Supabase project)
   - **Without metadata:** Test pollution, manual cleanup, data leaks between environments

3. **Future-Proof Escape Hatch (Strategic)**
   - Feature flags per record (no migrations required)
   - Deployment tracking and rollback markers
   - A/B test variants and experiment tracking
   - Soft delete markers for audit compliance
   - **Without metadata:** Every new operational need requires schema migration and downtime

4. **Template Consistency (Mandatory for Templates)**
   - Users expect uniform patterns across all provided code
   - Documentation applies equally to all tables
   - Examples work identically everywhere
   - **Without uniformity:** Template becomes a collection of special cases, not a coherent system

### Indexing Strategies

#### Partial GIN Index for Test Data

Only indexes rows where metadata contains test data:

```sql
-- Recommended: Partial index (only indexes test rows)
CREATE INDEX idx_table_name_metadata_test ON public.table_name
    USING gin (metadata)
    WHERE (metadata->>'is_test_data')::boolean = true;
```

#### Full GIN Index (if querying metadata frequently)

```sql
-- If you query metadata for non-test purposes too
CREATE INDEX idx_table_name_metadata ON public.table_name
    USING gin (metadata jsonb_path_ops);
```

#### Expression Index (for specific keys)

```sql
-- If you frequently query specific metadata key
CREATE INDEX idx_table_name_feature_flag ON public.table_name
    ((metadata->>'feature_flag'))
    WHERE metadata->>'feature_flag' IS NOT NULL;
```

### Query Patterns

#### Insert with Metadata

```sql
INSERT INTO public.todos (task, user_id, metadata)
VALUES (
    'Task name',
    '123e4567-e89b-12d3-a456-426614174000',
    '{"is_test_data": true, "test_run_id": "abc", "test_suite": "rls"}'::jsonb
);
```

#### Query by Metadata

```sql
-- Find all test data
SELECT * FROM public.todos
WHERE metadata->>'is_test_data' = 'true';

-- Find specific test run
SELECT * FROM public.todos
WHERE metadata->>'test_run_id' = 'abc-123';

-- Combined conditions
SELECT * FROM public.todos
WHERE
    metadata->>'is_test_data' = 'true'
    AND metadata->>'test_suite' = 'rls-policies';
```

#### Update Metadata

```sql
-- Add metadata key
UPDATE public.todos
SET metadata = metadata || '{"reviewed": true}'::jsonb
WHERE id = '123e4567-e89b-12d3-a456-426614174000';

-- Remove metadata key
UPDATE public.todos
SET metadata = metadata - 'reviewed'
WHERE id = '123e4567-e89b-12d3-a456-426614174000';
```

#### Delete by Metadata

```sql
-- Generic cleanup for any table
DELETE FROM public.todos
WHERE metadata->>'is_test_data' = 'true';
```

### Performance Optimization

#### When JSONB Queries Become Slow

For very large tables (>1M rows) with frequent metadata queries, consider adding a generated column:

```sql
-- Add generated boolean column
ALTER TABLE public.high_volume_table
    ADD COLUMN is_test_data BOOLEAN
    GENERATED ALWAYS AS ((metadata->>'is_test_data')::boolean) STORED;

-- Index the generated column (faster than JSONB)
CREATE INDEX idx_high_volume_test ON public.high_volume_table(is_test_data)
    WHERE is_test_data = true;

-- Query using generated column (faster)
SELECT * FROM public.high_volume_table
WHERE is_test_data = true;
```

**Trade-offs:**
- ✅ Faster queries (boolean index vs JSONB)
- ✅ Can use standard B-tree index
- ❌ Additional storage overhead
- ❌ Column needs updating if metadata logic changes
- ❌ Only worthwhile for high-volume tables

### Metadata Structure Guidelines

#### Recommended Metadata Shape

```json
{
  "is_test_data": true,           // Boolean flag
  "test_run_id": "uuid-here",     // For granular cleanup
  "test_suite": "suite-name",     // Group related tests
  "created_at": "2024-01-15T...", // When record was created
  "feature_flag": "new_ui",       // Optional: feature flags
  "ab_variant": "B"               // Optional: A/B testing
}
```

#### Best Practices

1. **Use consistent keys**
   - `is_test_data` not `isTestData` or `test_data`
   - `test_run_id` not `runId` or `testRun`

2. **Boolean values as booleans**
   ```json
   // Good
   {"is_test_data": true}

   // Bad (Postgres JSONB keeps types)
   {"is_test_data": "true"}
   ```

3. **Namespace related keys**
   ```json
   {
     "test_data": true,
     "test_run_id": "abc",
     "test_suite": "rls",
     "feature_new_ui": true,
     "ab_experiment_id": "exp_123"
   }
   ```

4. **Avoid deeply nested structures**
   ```json
   // Good - flat structure
   {"is_test_data": true, "test_suite": "rls"}

   // Avoid - harder to query
   {"test": {"is_data": true, "suite": "rls"}}
   ```

### Adding Metadata to Existing Tables

**All existing tables must be migrated** to include the metadata column. This is not optional - tables without metadata violate template standards and break generic tooling.

**Migration pattern for existing tables:**

```sql
-- Migration XXXX: Add mandatory metadata column to existing_table
-- Description: Brings existing_table into compliance with metadata standard

-- Add required metadata column
ALTER TABLE public.existing_table
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;

-- Add partial GIN index for test data queries
CREATE INDEX idx_existing_table_metadata_test ON public.existing_table
    USING gin (metadata)
    WHERE (metadata->>'is_test_data')::boolean = true;

-- Note: All new tables MUST include metadata from creation
```

### Real-World Example

```sql
---------------------------------
-- Migration 0001: Todos Table with Metadata
---------------------------------

CREATE TABLE public.todos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id),
    completed BOOLEAN DEFAULT FALSE,

    -- Standard metadata column
    metadata JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

-- Partial GIN index for test data queries
CREATE INDEX idx_todos_metadata_test ON public.todos
    USING gin (metadata)
    WHERE (metadata->>'is_test_data')::boolean = true;

-- RLS Policies
CREATE POLICY "users_manage_own_todos" ON public.todos
    FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Example usage:
-- INSERT INTO todos (task, user_id, metadata)
-- VALUES ('Test task', auth.uid(), '{"is_test_data": true, "test_run_id": "abc"}'::jsonb);

-- Down Migration
/*
DROP POLICY IF EXISTS "users_manage_own_todos" ON public.todos;
DROP INDEX IF EXISTS idx_todos_metadata_test;
DROP TABLE IF EXISTS public.todos;
*/
-- End Migration 0001
---------------------------------
```

### What NOT to Put in Metadata

**Important:** The metadata column itself is **required on every table**, but what you put in it should follow strict guidelines.

**Never store domain data in metadata.** Metadata is for operational flags, not business data. Don't do this:

```sql
-- ❌ BAD: Domain data in metadata (column still required, but misused!)
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    metadata JSONB DEFAULT '{"name": "John", "email": "john@example.com", "age": 30}'::jsonb
    -- WRONG: Business data belongs in explicit columns
);

-- ✅ GOOD: Domain data as columns, metadata for operational flags
CREATE TABLE public.users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb -- Required column, used for flags/test markers only
);
```

**Rule of Thumb:**
- **Domain/Business data** = Explicit typed columns (queryable, validated, indexed properly)
- **Operational metadata** = metadata JSONB (test flags, feature flags, deployment markers)
- **The metadata column** = Required on every table, even if often empty `'{}'::jsonb`

### Integration with Testing

See [TEST-INSTRUCTIONS.md](./TEST-INSTRUCTIONS.md) for complete testing patterns using metadata:

- Test data tagging strategies
- Generic cleanup scripts
- Supabase RLS testing with metadata
- Stripe resource tagging

## Constraint Naming Conventions

### Named Constraints Are Required
Always use explicitly named constraints instead of inline constraints. This enables graceful schema evolution without dropping columns.

> ⚠️ **CRITICAL FOR PRODUCTION**: Inline CHECK constraints cannot be modified without recreating the entire column, causing table locks and potential downtime. A simple role addition that should take milliseconds becomes a multi-minute operation that blocks all writes.

### Naming Pattern
- Use full words, no abbreviations (e.g., `check_` not `chk_`)
- Pattern: `check_<table>_<field>` for CHECK constraints
- Always use lowercase with underscores
- Be descriptive but concise

### Examples
```sql
-- Good: Named constraint with full words
CREATE TABLE public.user_organizations (
    role TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT check_user_organizations_role 
        CHECK (role IN ('member', 'manager', 'admin'))
);

-- Bad: Inline constraint (harder to modify)
CREATE TABLE public.user_organizations (
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'manager', 'admin'))
);
```

### Real Production Scenario: The Cost of Inline Constraints

**With inline CHECK constraint (DISASTER):**
```sql
-- Adding 'viewer' role requires column recreation
-- Step 1: Add new column (locks table)
ALTER TABLE user_organizations ADD COLUMN role_new TEXT;
-- Step 2: Copy all data (full table scan)
UPDATE user_organizations SET role_new = role;
-- Step 3: Drop old column (locks table, cascades dependencies)
ALTER TABLE user_organizations DROP COLUMN role;
-- Step 4: Rename new column (locks table)
ALTER TABLE user_organizations RENAME COLUMN role_new TO role;
-- Step 5: Re-add all indexes, foreign keys, policies that referenced this column
-- Result: 5+ operations, multiple locks, potential downtime, error-prone
```

**With named constraint (ELEGANT):**
```sql
-- Single atomic operation, minimal lock
ALTER TABLE user_organizations 
    DROP CONSTRAINT check_user_organizations_role,
    ADD CONSTRAINT check_user_organizations_role 
        CHECK (role IN ('member', 'admin', 'owner', 'viewer'));
-- Result: <1 second, no column recreation, zero downtime
```

## Constraint Evolution Patterns

### Production-Safe Constraint Changes

#### Single-Statement Atomic Change (Preferred)
Minimizes lock time and ensures atomicity:
```sql
-- Migration 00XX: Add 'owner' role
ALTER TABLE public.user_organizations 
    DROP CONSTRAINT check_user_organizations_role,
    ADD CONSTRAINT check_user_organizations_role 
        CHECK (role IN ('member', 'manager', 'admin', 'owner'));
```

#### Transaction-Wrapped for Complex Changes
When you need to update data alongside constraint changes:
```sql
-- Migration 00XX: Rename 'manager' to 'lead'
BEGIN;
ALTER TABLE public.user_organizations 
    DROP CONSTRAINT check_user_organizations_role;
    
UPDATE public.user_organizations 
    SET role = 'lead' WHERE role = 'manager';
    
ALTER TABLE public.user_organizations 
    ADD CONSTRAINT check_user_organizations_role 
        CHECK (role IN ('member', 'lead', 'admin'));
COMMIT;
```

### Common Scenarios

#### Adding New Enum Values
```sql
-- Safe: Expanding allowed values
ALTER TABLE public.organization_billing
    DROP CONSTRAINT check_organization_billing_status,
    ADD CONSTRAINT check_organization_billing_status 
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused', 'suspended'));
```

#### Removing Enum Values (Requires Data Migration)
```sql
BEGIN;
-- First, migrate existing data
UPDATE public.organization_billing 
    SET status = 'canceled' WHERE status = 'suspended';
    
-- Then update constraint
ALTER TABLE public.organization_billing
    DROP CONSTRAINT check_organization_billing_status,
    ADD CONSTRAINT check_organization_billing_status 
        CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused'));
COMMIT;
```

### Important Notes
- **Always test constraint changes in staging first**
- **Check existing data compliance before applying new constraints**
- **Use transactions for multi-step changes**
- **Document why constraints are being changed in migration comments**
- **Never modify constraints in existing migrations - create new ones**

### Pre-Migration Checklist

Before approving any migration, verify:

**Required Standards:**
- [ ] **Metadata column included** - Every table MUST have `metadata JSONB DEFAULT '{}'::jsonb`
- [ ] **RLS enabled** - Every table MUST have `ENABLE ROW LEVEL SECURITY`
- [ ] **ALL CHECK constraints are named** (zero inline constraints)
- [ ] **Names follow `check_<table>_<field>` pattern**
- [ ] **Down migration included and commented out**

**Migration Quality:**
- [ ] **Future-proof**: Could this constraint need modification? (If yes, it MUST be named)
- [ ] **Down migration includes proper `DROP CONSTRAINT` statements**
- [ ] **No column-level CHECK syntax** like `column_name TYPE CHECK (...)`
- [ ] **Tables include partial GIN index for test data** (metadata column)

> 💡 **Quick Test**: Search for `CHECK (` in your migration. If it appears anywhere except after `CONSTRAINT constraint_name`, you have an inline constraint that must be fixed.

## Key Components

1. **Header Section**: Contains the migration sequence number, title, and description
2. **Up Migration**: The actual SQL statements to perform the migration
3. **Down Migration**: SQL statements to revert the migration (**MUST be commented out**) - **⚠️ CRITICAL: Must follow strict dependency order! See [Down Migration Requirements](#down-migration-requirements)**
4. **Footer**: Marks the end of the migration

## Migration Principles

- Each migration should be **atomic** and focus on a single logical change
- **Never** modify an existing migration file after it has been applied to any environment
- Always include a valid down migration to allow for rollbacks if needed
- **Down migrations MUST be commented out** using `/* */` to prevent accidental execution
- Comment your SQL appropriately, especially for complex changes
- All migrations MUST be sequential to previous ones
- **Always enable RLS** immediately after creating a table
- **Always create at least one policy** (even if restrictive)

## Down Migration Requirements

### ⚠️ Down Migrations MUST Be Commented Out

**All down migrations must be wrapped in `/* */` comment blocks.** They are included for reference and emergency rollback procedures only. This prevents accidental execution which could cause data loss.

### Critical: Dependency Order is MANDATORY

PostgreSQL enforces referential integrity - you CANNOT drop objects that have dependencies. Attempting to drop a table before its dependent policies will result in:

```
ERROR: cannot drop table user_organizations because other objects depend on it
DETAIL: policy users_view_their_orgs on table organizations depends on table user_organizations
```

### Correct Drop Order (ALWAYS follow this sequence)

1. **RLS Policies** - Drop FIRST (they reference tables)
2. **Triggers** - Drop SECOND (they reference functions and tables)  
3. **Functions** - Drop THIRD (may be used by triggers)
4. **Indexes** - Drop FOURTH (clean but less critical)
5. **Tables** - Drop LAST (now safe with no dependencies)

### Complete Down Migration Template

```sql
-- Down Migration
/*
-- ============================================
-- 1. DROP ALL RLS POLICIES FIRST
-- ============================================
-- List every policy created in the migration
DROP POLICY IF EXISTS "users_view_billing_events" ON public.billing_events;
DROP POLICY IF EXISTS "admins_update_billing" ON public.organization_billing;
DROP POLICY IF EXISTS "users_view_org_billing" ON public.organization_billing;
-- ... continue for ALL policies

-- ============================================
-- 2. DROP ALL TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS on_org_created ON public.organizations;
DROP TRIGGER IF EXISTS update_org_seats_on_member_change ON public.user_organizations;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================
-- 3. DROP ALL FUNCTIONS
-- ============================================
DROP FUNCTION IF EXISTS public.init_org_billing();
DROP FUNCTION IF EXISTS public.update_seats_used();
DROP FUNCTION IF EXISTS public.can_access_features(UUID);
-- ... continue for ALL functions

-- ============================================
-- 4. DROP ALL INDEXES (optional but clean)
-- ============================================
DROP INDEX IF EXISTS idx_billing_events_created;
DROP INDEX IF EXISTS idx_organization_billing_org;
DROP INDEX IF EXISTS idx_teams_org_id;

-- ============================================
-- 5. DROP ALL TABLES (now safe!)
-- ============================================
DROP TABLE IF EXISTS public.billing_events;
DROP TABLE IF EXISTS public.organization_billing;
DROP TABLE IF EXISTS public.user_sessions;
-- ... tables in reverse order of foreign key dependencies
*/
```

### Quick Fix Alternative (Use with Caution)

If you need to quickly drop everything and dependencies are complex:

```sql
-- Nuclear option - drops table and ALL dependent objects
DROP TABLE IF EXISTS public.organizations CASCADE;
```

⚠️ **WARNING**: CASCADE is destructive and may drop more than intended. Only use in development or when you're certain about the impact.

### Down Migration Checklist

Before running a down migration, verify:

- [ ] All policies that reference your tables are listed for dropping
- [ ] All triggers are listed before their associated functions
- [ ] All functions are listed before the tables they operate on
- [ ] Tables with foreign keys are dropped before referenced tables
- [ ] You've tested the down migration in a development environment

### Common Pitfalls to Avoid

❌ **Never do this:**
```sql
-- BAD: Trying to drop table with active policies
DROP TABLE IF EXISTS public.organizations;
-- ERROR: cannot drop table because policies depend on it
```

❌ **Never forget cross-table policy dependencies:**
```sql
-- BAD: Missing policy that references multiple tables
-- The policy on organizations references user_organizations table
DROP TABLE IF EXISTS public.user_organizations;
-- ERROR: policy "users_view_their_orgs" depends on this table
```

✅ **Always check for hidden dependencies:**
- Policies on one table that reference another table in their USING clause
- Functions that query multiple tables
- Triggers that insert into other tables

## Documentation Standards

### Always Document Access Patterns

Every policy, trigger, and function should have clear comments explaining the access pattern. This makes your code self-documenting and prevents security mistakes.

#### For RLS Policies
```sql
-- Policy: [Who] can [do what] to [which records]
-- Access Pattern: Explain the specific access rules
CREATE POLICY "policy_name" ON public.table_name
    FOR SELECT
    TO authenticated
    USING (...);
```

Example:
```sql
-- Policy: Organization members can view billing information
-- Access Pattern: Users can SELECT billing data only for organizations they belong to
CREATE POLICY "users_view_org_billing" ON public.organization_billing
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations
            WHERE user_organizations.org_id = organization_billing.org_id
            AND user_organizations.user_id = auth.uid()
        )
    );
```

#### For Triggers
```sql
-- Trigger: [When this happens] -> [do this action]
-- Access Pattern: Explain when/why this fires and what privileges it needs
CREATE TRIGGER trigger_name
    AFTER INSERT ON public.table_name
    FOR EACH ROW
    EXECUTE FUNCTION public.function_name();
```

Example:
```sql
-- Trigger: Auto-create billing record when organization is created
-- Access Pattern: System-level operation after org INSERT (requires DEFINER for billing table access)
CREATE TRIGGER on_org_created
    AFTER INSERT ON public.organizations
    FOR EACH ROW
    EXECUTE FUNCTION public.init_org_billing();
```

#### For Functions
```sql
-- Function: [Primary purpose]
-- Access Pattern: [Who calls this and why]
-- Security: DEFINER because [reason] / INVOKER to respect RLS
CREATE OR REPLACE FUNCTION public.function_name()
RETURNS ... AS $$
BEGIN
    -- function body
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

Example:
```sql
-- Function: Check if user's email domain matches organization's domain
-- Access Pattern: Called during signup/invite flow to validate domain-based joining
-- Security: INVOKER - simple utility function, no special privileges needed
CREATE OR REPLACE FUNCTION public.can_join_org_by_domain(user_email TEXT, org_domain TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN LOWER(SPLIT_PART(user_email, '@', 2)) = LOWER(org_domain);
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
```

## Writing Effective RLS Policies

### Before Writing Policies, Ask:
1. Who needs access to this data?
2. What operations do they need (SELECT, INSERT, UPDATE, DELETE)?
3. Under what conditions should access be granted?
4. Is this accessed by the client or only by service-role?

### Common Real-World Patterns

#### Write-Only Pattern (e.g., feedback submissions)
```sql
-- Users can insert but never read back their own data
CREATE POLICY "users_insert_only" ON public.entries
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- No SELECT policy = users can't read entries
```

#### Aggregated Access Pattern (e.g., managers see summaries)
```sql
-- Managers see digests, not individual entries
CREATE POLICY "managers_read_digests" ON public.daily_digests
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teams
            WHERE teams.id = daily_digests.team_id
            AND teams.manager_id = auth.uid()
        )
    );
```

#### Multi-Tenant Isolation
```sql
-- Users only see data from their organization
CREATE POLICY "org_isolation" ON public.team_data
    FOR ALL
    TO authenticated
    USING (
        org_id IN (
            SELECT org_id FROM public.user_organizations
            WHERE user_id = auth.uid()
            AND is_active = true
        )
    );
```

#### Service-Role Only Pattern
```sql
-- No policies for authenticated users = only service role can access
-- Document this clearly
-- Note: Table accessed only via service role for processing; no explicit policies needed as service role bypasses RLS
```

## Anti-Patterns to Avoid

❌ **Over-permissive "make it work" policies:**
```sql
-- BAD: Too permissive
CREATE POLICY "users_do_everything" ON public.data
    FOR ALL
    TO authenticated
    USING (true);
```

❌ **Policies that don't match actual usage:**
```sql
-- BAD: If users never actually update profiles
CREATE POLICY "users_update_profiles" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (id = auth.uid());
```

❌ **Forgetting service-role access patterns:**
```sql
-- BAD: Blocking service role unnecessarily
CREATE POLICY "only_owner" ON public.processing_queue
    FOR ALL
    TO authenticated, service_role  -- service_role shouldn't be here
    USING (user_id = auth.uid());
```

## Practical Example

```sql
---------------------------------
-- Migration 0001: Core Tables with Write-Only Entries
-- Description: Creates teams and entries tables with proper access patterns
---------------------------------

-- ============================================
-- CREATE ALL TABLES FIRST
-- ============================================

-- Teams table
CREATE TABLE public.teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES public.organizations(id),
    name TEXT NOT NULL,
    manager_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Entries table (write-only for users)
CREATE TABLE public.entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES public.teams(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX idx_teams_org_id ON public.teams(org_id);
CREATE INDEX idx_teams_manager_id ON public.teams(manager_id);
CREATE INDEX idx_entries_team_created ON public.entries(team_id, created_at DESC);

-- ============================================
-- RLS POLICIES (After all tables exist)
-- ============================================

-- Teams: Users can view their org's teams
CREATE POLICY "users_view_org_teams" ON public.teams
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_organizations
            WHERE user_organizations.org_id = teams.org_id
            AND user_organizations.user_id = auth.uid()
        )
    );

-- Entries: Write-only (privacy by design)
CREATE POLICY "users_write_entries" ON public.entries
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id 
        AND EXISTS (
            SELECT 1 FROM public.user_organizations uo
            JOIN public.teams t ON t.org_id = uo.org_id
            WHERE uo.user_id = auth.uid()
            AND t.id = team_id
            AND uo.is_active = true
        )
    );

-- Note: No SELECT policy for entries - write-only pattern
-- Service role will process these for aggregation

-- Down Migration
/*
-- 1. Drop RLS policies first
DROP POLICY IF EXISTS "users_write_entries" ON public.entries;
DROP POLICY IF EXISTS "users_view_org_teams" ON public.teams;

-- 2. Drop indexes
DROP INDEX IF EXISTS idx_entries_team_created;
DROP INDEX IF EXISTS idx_teams_manager_id;
DROP INDEX IF EXISTS idx_teams_org_id;

-- 3. Drop tables (entries first due to foreign key to teams)
DROP TABLE IF EXISTS public.entries;
DROP TABLE IF EXISTS public.teams;
*/
-- End Migration 0001
---------------------------------
```

## Function Security (SECURITY DEFINER vs INVOKER)

### Understanding SECURITY DEFINER

`SECURITY DEFINER` makes a function execute with the **privileges of the function owner** (typically superuser), bypassing RLS policies. This is powerful but dangerous if misused.

`SECURITY INVOKER` (default) makes a function execute with the **privileges of the caller**, respecting all RLS policies.

### When to Use SECURITY DEFINER

✅ **Use SECURITY DEFINER for:**
- **Trigger functions** that need elevated access to perform system operations
- **Initial setup functions** that create records before users have permissions
- **System maintenance functions** that intentionally bypass RLS for administrative tasks

Examples:
```sql
-- Trigger that creates profile on user signup (user has no permissions yet)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### When NOT to Use SECURITY DEFINER

❌ **Never use SECURITY DEFINER for:**
- **User-callable functions** that read or modify user data
- **Utility functions** that perform simple calculations
- **Query functions** that should respect RLS policies
- **Any function where multi-tenant isolation is important**

Examples:
```sql
-- BAD: This bypasses RLS and could leak data across tenants!
CREATE OR REPLACE FUNCTION get_org_data(org_id UUID)
RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY SELECT * FROM organizations WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- WRONG!

-- GOOD: Respects RLS policies
CREATE OR REPLACE FUNCTION get_org_data(org_id UUID)
RETURNS TABLE(...) AS $$
BEGIN
    RETURN QUERY SELECT * FROM organizations WHERE id = org_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;  -- Or omit, as INVOKER is default
```

### Security Implications

**Risk:** With SECURITY DEFINER, any authenticated user could potentially call:
```sql
SELECT your_function('any-org-id');
-- And access data from ANY organization because RLS is bypassed!
```

**Best Practice:** 
- Default to SECURITY INVOKER (or omit the clause)
- Only use SECURITY DEFINER when absolutely necessary
- Document why SECURITY DEFINER is needed with a comment
- Regularly audit functions with SECURITY DEFINER

## Views: An Anti-Pattern

### Never Use Views in Multi-Tenant SaaS

Views should be **completely avoided** in secure multi-tenant architectures. Here's why:

#### Security Risks
- Views bypass RLS by default (execute with creator privileges)
- SECURITY DEFINER views completely bypass all RLS policies  
- Views created by postgres user have superuser access
- Even with SECURITY INVOKER (Postgres 15+), views add unnecessary complexity

#### Better Alternative: API Layer Queries
Instead of database views, implement query logic at the API layer:
- **Full control** over query composition
- **Explicit security** - RLS policies always apply
- **Better testing** - Business logic in application code
- **Clear access patterns** - No hidden privilege escalation
- **Easier debugging** - Single layer of security to reason about

#### Example: Instead of Views
```sql
-- BAD: Creating a view for team summaries
CREATE VIEW team_summaries AS
SELECT t.id, t.name, COUNT(e.id) as entry_count
FROM teams t
LEFT JOIN entries e ON e.team_id = t.id
GROUP BY t.id, t.name;

-- GOOD: Query directly from API with RLS protection
-- In your API layer (e.g., Node.js/Supabase client):
const teamSummaries = await supabase
  .from('teams')
  .select('id, name, entries(count)')
  // RLS automatically filters to user's accessible teams
```

#### The Only Exception
If you absolutely must use a view (e.g., legacy migration), ensure:
1. Created with SECURITY INVOKER (Postgres 15+)
2. Owned by a non-superuser role
3. Thoroughly documented why it exists
4. Plan to remove it

### Key Principle
**Keep the database "dumb"** - Tables with RLS policies only. All query intelligence belongs in the API layer where it can be properly tested, versioned, and secured.

## ENUMs: Another Anti-Pattern

### Never Use ENUMs - Use CHECK Constraints Instead

PostgreSQL ENUMs should be **completely avoided** in production multi-tenant SaaS. Use TEXT with CHECK constraints instead.

#### Why ENUMs Are Problematic

**Migration Hell:**
- Adding values requires ACCESS EXCLUSIVE lock (blocks ALL access)
- **Cannot remove values** - they're permanent once created
- Cannot reorder values
- Full table scan for any modification

**Development Friction:**
- String operators (LIKE, ILIKE) don't work  
- Custom types complicate ORMs and client libraries
- Can't use NOT VALID for zero-downtime deployments
- Harder to test and mock

#### Always Use TEXT with CHECK Constraints

```sql
-- BAD: Using ENUM type
CREATE TYPE user_role AS ENUM ('member', 'manager', 'admin');
CREATE TABLE public.user_organizations (
    role user_role NOT NULL DEFAULT 'member'
);

-- GOOD: TEXT with named CHECK constraint
CREATE TABLE public.user_organizations (
    role TEXT NOT NULL DEFAULT 'member',
    CONSTRAINT check_user_organizations_role 
        CHECK (role IN ('member', 'manager', 'admin'))
);
```

#### Benefits of CHECK Constraints Over ENUMs

1. **Graceful Evolution** - We already documented the patterns!
2. **Zero-Downtime Deployments** - Use NOT VALID + VALIDATE  
3. **Standard TEXT Type** - All string functions work normally
4. **Atomic Changes** - Single ALTER TABLE statement
5. **Reversible** - Can remove values (with data migration)

#### The Only Valid Use Case

ENUMs are acceptable ONLY for:
- Truly immutable values (days of week, months)
- Values that will NEVER change in production
- Even then, CHECK constraints are usually better

### Key Principle
Favor flexibility over micro-optimizations. The 4-byte storage savings of ENUMs isn't worth the migration pain.

## Extension Management

### Overview

PostgreSQL extensions add functionality to the database but come with lifecycle management responsibilities. Always evaluate whether an extension's value justifies its maintenance burden.

### When to Add Extensions

✅ **Add extensions when:**
- They provide significant, irreplaceable functionality (e.g., pgvector for semantic search)
- Built-in Postgres features are inadequate
- Extension is actively maintained and widely adopted
- Benefits clearly outweigh infrastructure complexity

❌ **Avoid extensions when:**
- Built-in Postgres features can achieve the same goal
- Extension adds complexity without clear value
- Extension is poorly maintained or has limited adoption
- Use case is temporary or experimental

### Creating Extensions in Migrations

Always use `IF NOT EXISTS` and `CASCADE` for safety:

```sql
-- Migration 00XX: Add pgvector for semantic search
CREATE EXTENSION IF NOT EXISTS vector CASCADE;
```

**Document why:**
```sql
-- Enable vector extension for semantic search on user memories
-- Why: Enables efficient similarity search for contextual memory retrieval
-- Alternatives considered: Application-layer cosine similarity (too slow)
CREATE EXTENSION IF NOT EXISTS vector CASCADE;
```

### Dropping Extensions Safely

#### Pre-Drop Checklist

Before dropping an extension, verify:

1. **Check for dependencies** - What objects does it create?
2. **Audit usage** - Search codebase for references
3. **Plan CASCADE impact** - Understand what CASCADE will remove
4. **Test in development** - Never drop in production first

#### Checking Dependencies

```sql
-- List all objects created by an extension
SELECT
    n.nspname as schema,
    pg_describe_object(classid, objid, 0) as object
FROM pg_depend d
JOIN pg_extension e ON d.refobjid = e.oid
JOIN pg_class c ON d.classid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE e.extname = 'pgmq'
ORDER BY n.nspname, object;

-- Check if extension exists before dropping
SELECT extname, extversion
FROM pg_extension
WHERE extname = 'pgmq';
```

#### Drop Pattern

**Always use CASCADE** to remove dependent objects:

```sql
-- Drop extension and all dependent objects
-- CASCADE removes:
-- - Schemas created by the extension
-- - Functions, types, tables in those schemas
-- - Grants on schema/functions/tables
-- Safe: PostgreSQL prevents dropping if external dependencies exist
DROP EXTENSION IF EXISTS pgmq CASCADE;
```

**Without CASCADE (usually fails):**
```sql
-- BAD: Fails if any objects depend on the extension
DROP EXTENSION pgmq;
-- ERROR: cannot drop extension pgmq because other objects depend on it
```

### Migration Drop Order

When removing extension infrastructure, follow strict dependency order:

#### Example: Removing pgmq Queue Infrastructure

```sql
---------------------------------
-- Migration 00XX: Remove pgmq Infrastructure
---------------------------------

-- ============================================
-- 1. DROP TRIGGERS FIRST (depend on functions)
-- ============================================
DROP TRIGGER IF EXISTS trigger_enqueue_embedding ON public.user_conversations;

-- ============================================
-- 2. DROP ALL FUNCTIONS THAT USE EXTENSION
-- ============================================
-- Drop trigger functions
DROP FUNCTION IF EXISTS public.trigger_enqueue_embedding_job();

-- Drop wrapper functions that call extension functions
DROP FUNCTION IF EXISTS public.enqueue_embedding_job(UUID, UUID);
DROP FUNCTION IF EXISTS public.get_embedding_queue_stats();
DROP FUNCTION IF EXISTS public.cleanup_embedding_archive(INTEGER);

-- ============================================
-- 3. DROP EXTENSION-SPECIFIC OBJECTS
-- ============================================
-- Drop queues created by the extension
SELECT pgmq.drop_queue('embedding_jobs');
-- This drops both q_* (active) and a_* (archive) tables

-- ============================================
-- 4. DROP EXTENSION LAST (CASCADE cleans up)
-- ============================================
-- CASCADE removes:
-- - pgmq schema and all remaining objects
-- - All pgmq functions (send, read, archive, etc.)
-- - Grants on pgmq schema/functions
DROP EXTENSION IF EXISTS pgmq CASCADE;
```

#### What CASCADE Removes

When you `DROP EXTENSION ... CASCADE`, PostgreSQL automatically removes:

✅ **Schemas** created by the extension (e.g., `pgmq`)
✅ **All objects** in those schemas (tables, functions, types, indexes)
✅ **Grants** on schemas, functions, and tables
✅ **Dependencies** that were automatically created

❌ **Does NOT remove:**
- Objects in `public` schema (unless they directly depend on extension)
- Manually created objects that happen to reference extension objects
- Data in tables (tables are dropped, so data is lost!)

### Real-World Example: Migration 0017

**Problem:** pgmq queue infrastructure no longer needed after switching to background Promise pattern.

**Audit Results:**
- Extension `pgmq` created schema `pgmq` with queue tables
- 4 functions in `public` schema called pgmq functions
- 1 trigger called one of those functions
- Frontend endpoint called wrapper function

**Removal Plan:**
1. Remove frontend endpoint (`getEmbeddingJobStats`)
2. Drop trigger (`trigger_enqueue_embedding`)
3. Drop all wrapper functions (4 functions)
4. Drop extension-specific objects (queue)
5. Drop extension with CASCADE

**Result:** Clean removal with zero orphaned objects.

### Common Pitfalls

❌ **Dropping extension before dependent objects:**
```sql
-- ERROR: This will fail
DROP EXTENSION pgmq CASCADE;
-- ERROR: cannot drop extension pgmq because function enqueue_embedding_job depends on it
```

Solution: Drop functions first, then extension.

❌ **Forgetting to drop extension after removing all uses:**
```sql
-- You've removed all functions/triggers that use pgmq
-- But extension still installed, using resources
SELECT * FROM pg_extension WHERE extname = 'pgmq';
-- extname | extowner | extnamespace | ...
-- pgmq    | ...      | ...          | ...
```

Solution: Always drop unused extensions.

❌ **Not using CASCADE when needed:**
```sql
DROP EXTENSION vector; -- Fails if user_memories.embedding column exists
```

Solution: Use CASCADE (or drop dependent objects first).

### Documentation Standards

Every migration that adds or removes an extension must document:

1. **Why** - Business justification for adding/removing
2. **What** - What objects does it create/remove
3. **Impact** - Storage, performance, maintenance implications
4. **Alternatives** - What was considered instead

**Example:**

```sql
---------------------------------
-- Migration 00XX: Add pgvector for User Memories
-- Description: Enable semantic search for contextual memory retrieval
--
-- Why: Cross-conversation memory requires similarity search on fact embeddings
-- What: Adds vector extension, creates embedding column on user_memories
-- Impact: +4KB per memory (1536 dimensions), HNSW index ~10% of table size
-- Alternatives: Application-layer search (too slow for >1000 memories)
---------------------------------

CREATE EXTENSION IF NOT EXISTS vector CASCADE;

CREATE TABLE public.user_memories (
    ...
    embedding vector(1536),
    ...
);

CREATE INDEX idx_user_memories_embedding
ON public.user_memories
USING hnsw (embedding vector_cosine_ops);
```

### Best Practices Summary

1. ✅ **Minimize extension dependencies** - Prefer built-in Postgres features
2. ✅ **Document lifecycle** - Why added, when to remove
3. ✅ **Use CASCADE** - Let PostgreSQL handle dependency cleanup
4. ✅ **Test drops in dev** - Verify CASCADE behavior before production
5. ✅ **Audit before dropping** - Search codebase for all references
6. ✅ **Clean up code** - Remove application code that used extension functions
7. ✅ **Monitor extension updates** - Keep extensions updated with Postgres version

### Extension Checklist

Before approving any migration that manages extensions:

- [ ] **CREATE**: Documented why extension is needed
- [ ] **CREATE**: Confirmed no built-in alternative exists
- [ ] **CREATE**: Tested compatibility with Supabase/Postgres version
- [ ] **DROP**: Searched codebase for all references to extension
- [ ] **DROP**: Dropped all dependent objects in correct order
- [ ] **DROP**: Used CASCADE to clean up extension-created objects
- [ ] **DROP**: Tested drop in development environment
- [ ] **DROP**: Updated application code to remove extension function calls