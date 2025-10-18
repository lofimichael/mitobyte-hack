#!/usr/bin/env tsx

/**
 * Cleanup All Test Data
 *
 * Removes all test data from Supabase and Stripe (test mode).
 * Safe to run - only deletes data tagged with is_test_data.
 *
 * Usage:
 *   npm run test:cleanup                    # Interactive mode with confirmation
 *   npm run test:cleanup --dry-run          # Preview what would be deleted
 *   npm run test:cleanup --yes              # Skip confirmation (CI mode)
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_CONFIRM = process.argv.includes('--yes') || process.argv.includes('-y');

// Tables to clean up (add your application tables here)
// These tables must have a 'metadata' JSONB column with is_test_data flag
const TABLES_TO_CLEANUP: string[] = [
  // Example: 'todos', 'organizations', 'system_logs'
  // Add your tables here as you create them
];

// Environment validation
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: Cannot run cleanup in production environment!');
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ ERROR: Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Safety check - warn if not using test database
if (!SUPABASE_URL.includes('test') && !SUPABASE_URL.includes('dev')) {
  console.warn('⚠️  WARNING: Supabase URL does not contain "test" or "dev"');
  console.warn(`   URL: ${SUPABASE_URL}`);
  console.warn('   Are you sure this is a test environment?');
  if (!SKIP_CONFIRM) {
    console.log('\n   Pass --yes to proceed anyway');
    process.exit(1);
  }
}

const adminSupabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

/**
 * Generic cleanup for any table with metadata column
 * Works with the uniform metadata JSONB pattern
 */
async function cleanupTableTestData(tableName: string): Promise<number> {
  try {
    // First, count how many records would be deleted
    const { data: records, error: countError } = await adminSupabase
      .from(tableName)
      .select('id')
      .eq('metadata->>is_test_data', 'true');

    if (countError) {
      console.error(`   ❌ Error querying ${tableName}:`, countError.message);
      return 0;
    }

    const count = records?.length || 0;
    if (count === 0) return 0;

    console.log(`   Found ${count} test records in ${tableName}`);

    if (DRY_RUN) {
      console.log(`   🏃 Would delete ${count} records (dry run)`);
      return count;
    }

    if (!SKIP_CONFIRM) {
      console.log(`   ⏭️  Skipping deletion (run with --yes to delete)`);
      return count;
    }

    // Delete the test data
    const { error: deleteError } = await adminSupabase
      .from(tableName)
      .delete()
      .eq('metadata->>is_test_data', 'true');

    if (deleteError) {
      console.error(`   ❌ Error deleting from ${tableName}:`, deleteError.message);
      return 0;
    }

    console.log(`   ✓ Deleted ${count} records from ${tableName}`);
    return count;

  } catch (error: any) {
    console.error(`   ❌ Unexpected error with ${tableName}:`, error.message);
    return 0;
  }
}

async function cleanupSupabase() {
  console.log('\n🔍 Finding Supabase test data...');

  // 1. Clean up application tables with metadata pattern
  if (TABLES_TO_CLEANUP.length > 0) {
    console.log('\n📊 Cleaning application tables...');
    let totalRecords = 0;

    for (const tableName of TABLES_TO_CLEANUP) {
      const deleted = await cleanupTableTestData(tableName);
      totalRecords += deleted;
    }

    if (totalRecords > 0) {
      console.log(`\n✅ Application tables: ${totalRecords} test records processed`);
    } else {
      console.log('✓ No test records found in application tables');
    }
  } else {
    console.log('\n💡 No application tables configured for cleanup');
    console.log('   Add tables to TABLES_TO_CLEANUP array in this script');
  }

  // 2. Clean up auth users
  console.log('\n👥 Cleaning auth users...');
  const { data, error } = await adminSupabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  // Filter test users by email pattern and metadata
  const testUsers = data.users.filter(user => {
    const hasTestEmail = user.email?.endsWith('@test.example.com');
    const hasTestMetadata = user.user_metadata?.is_test_data === true;
    return hasTestEmail || hasTestMetadata;
  });

  if (testUsers.length === 0) {
    console.log('✓ No test users found');
    return;
  }

  console.log(`\n📋 Found ${testUsers.length} test users:`);
  testUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.id})`);
  });

  if (DRY_RUN) {
    console.log('\n🏃 DRY RUN: Would delete these users (use without --dry-run to actually delete)');
    return;
  }

  if (!SKIP_CONFIRM) {
    console.log('\n❓ Delete these users? This cannot be undone.');
    console.log('   Press Ctrl+C to cancel, or re-run with --yes to skip this prompt');
    process.exit(0);
  }

  console.log('\n🗑️  Deleting test users...');

  let successCount = 0;
  let errorCount = 0;

  for (const user of testUsers) {
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
      errorCount++;
    } else {
      console.log(`   ✓ Deleted ${user.email}`);
      successCount++;
    }
  }

  console.log(`\n✅ Cleanup complete: ${successCount} deleted, ${errorCount} failed`);
}

async function cleanupStripe() {
  if (!STRIPE_SECRET_KEY) {
    console.log('\n⏭️  Skipping Stripe cleanup (no STRIPE_SECRET_KEY)');
    return;
  }

  // Verify it's a test key
  if (!STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.error('❌ ERROR: STRIPE_SECRET_KEY is not a test key!');
    console.error('   Only sk_test_* keys are allowed for cleanup');
    return;
  }

  console.log('\n🔍 Finding Stripe test data...');

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });

  try {
    // Find test customers
    const customers = await stripe.customers.list({ limit: 100 });
    const testCustomers = customers.data.filter(c =>
      c.metadata?.is_test_data === 'true' ||
      c.email?.endsWith('@test.example.com')
    );

    if (testCustomers.length === 0) {
      console.log('✓ No test customers found');
      return;
    }

    console.log(`\n📋 Found ${testCustomers.length} test customers:`);
    testCustomers.forEach(customer => {
      console.log(`   - ${customer.email || customer.id}`);
    });

    if (DRY_RUN) {
      console.log('\n🏃 DRY RUN: Would delete these customers (use without --dry-run to actually delete)');
      return;
    }

    if (!SKIP_CONFIRM) {
      console.log('\n   (Run with --yes to delete)');
      return;
    }

    console.log('\n🗑️  Deleting test customers...');

    for (const customer of testCustomers) {
      try {
        await stripe.customers.del(customer.id);
        console.log(`   ✓ Deleted ${customer.email || customer.id}`);
      } catch (error: any) {
        console.error(`   ❌ Failed to delete ${customer.id}:`, error.message);
      }
    }

    console.log('\n✅ Stripe cleanup complete');

  } catch (error: any) {
    console.error('❌ Error during Stripe cleanup:', error.message);
  }
}

async function main() {
  console.log('🧹 Kaiba Manor Test Data Cleanup');
  console.log('================================\n');

  if (DRY_RUN) {
    console.log('🏃 DRY RUN MODE - No data will be deleted\n');
  }

  await cleanupSupabase();
  await cleanupStripe();

  console.log('\n✨ All done!\n');
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
