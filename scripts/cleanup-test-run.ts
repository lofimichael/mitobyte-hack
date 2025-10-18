#!/usr/bin/env tsx

/**
 * Cleanup Specific Test Run
 *
 * Removes test data from a specific test run (identified by TEST_RUN_ID).
 * Useful for cleaning up after failed tests or specific test suites.
 *
 * Usage:
 *   npm run test:cleanup-run <test-run-id>           # Interactive mode
 *   npm run test:cleanup-run <test-run-id> --yes     # Skip confirmation
 */

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const TEST_RUN_ID = process.argv[2];
const SKIP_CONFIRM = process.argv.includes('--yes') || process.argv.includes('-y');

// Tables to clean up (add your application tables here)
// These tables must have a 'metadata' JSONB column with test_run_id
const TABLES_TO_CLEANUP: string[] = [
  // Example: 'todos', 'organizations', 'system_logs'
  // Add your tables here as you create them
];

if (!TEST_RUN_ID) {
  console.error('❌ ERROR: Missing test run ID');
  console.error('   Usage: npm run test:cleanup-run <test-run-id>');
  console.error('\n   Example: npm run test:cleanup-run a1b2c3d4-e5f6-7890-abcd-ef1234567890');
  process.exit(1);
}

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
  process.exit(1);
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
async function cleanupTableTestRunData(tableName: string): Promise<number> {
  try {
    // First, count how many records would be deleted
    const { data: records, error: countError } = await adminSupabase
      .from(tableName)
      .select('id')
      .eq('metadata->>test_run_id', TEST_RUN_ID);

    if (countError) {
      console.error(`   ❌ Error querying ${tableName}:`, countError.message);
      return 0;
    }

    const count = records?.length || 0;
    if (count === 0) return 0;

    console.log(`   Found ${count} records in ${tableName}`);

    if (!SKIP_CONFIRM) {
      return count;
    }

    // Delete the test run data
    const { error: deleteError } = await adminSupabase
      .from(tableName)
      .delete()
      .eq('metadata->>test_run_id', TEST_RUN_ID);

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

async function cleanupSupabaseTestRun() {
  console.log(`\n🔍 Finding data from test run: ${TEST_RUN_ID}...`);

  // 1. Clean up application tables with metadata pattern
  if (TABLES_TO_CLEANUP.length > 0) {
    console.log('\n📊 Cleaning application tables...');
    let totalRecords = 0;

    for (const tableName of TABLES_TO_CLEANUP) {
      const deleted = await cleanupTableTestRunData(tableName);
      totalRecords += deleted;
    }

    if (totalRecords > 0) {
      console.log(`\n✅ Application tables: ${totalRecords} records found`);
    } else {
      console.log('✓ No records found in application tables');
    }
  } else {
    console.log('\n💡 No application tables configured for cleanup');
    console.log('   Add tables to TABLES_TO_CLEANUP array in this script');
  }

  // 2. Clean up auth users
  console.log('\n👥 Finding auth users from this test run...');
  const { data, error } = await adminSupabase.auth.admin.listUsers();

  if (error) {
    console.error('❌ Error listing users:', error.message);
    return;
  }

  // Filter users from this specific test run
  const testRunUsers = data.users.filter(user =>
    user.user_metadata?.test_run_id === TEST_RUN_ID
  );

  if (testRunUsers.length === 0) {
    console.log('✓ No users found for this test run');
    return;
  }

  console.log(`\n📋 Found ${testRunUsers.length} users from this test run:`);
  testRunUsers.forEach(user => {
    console.log(`   - ${user.email} (${user.user_metadata?.test_suite || 'unknown suite'})`);
  });

  if (!SKIP_CONFIRM) {
    console.log('\n❓ Delete these users? Re-run with --yes to proceed.');
    process.exit(0);
  }

  console.log('\n🗑️  Deleting users...');

  for (const user of testRunUsers) {
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error(`   ❌ Failed to delete ${user.email}:`, error.message);
    } else {
      console.log(`   ✓ Deleted ${user.email}`);
    }
  }

  console.log(`\n✅ Deleted ${testRunUsers.length} users`);
}

async function cleanupStripeTestRun() {
  if (!STRIPE_SECRET_KEY || !STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.log('\n⏭️  Skipping Stripe cleanup');
    return;
  }

  console.log('\n🔍 Finding Stripe data from this test run...');

  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia',
  });

  try {
    const customers = await stripe.customers.list({ limit: 100 });
    const testRunCustomers = customers.data.filter(c =>
      c.metadata?.test_run_id === TEST_RUN_ID
    );

    if (testRunCustomers.length === 0) {
      console.log('✓ No Stripe data found for this test run');
      return;
    }

    console.log(`\n📋 Found ${testRunCustomers.length} customers:`);
    testRunCustomers.forEach(customer => {
      console.log(`   - ${customer.email || customer.id}`);
    });

    if (!SKIP_CONFIRM) {
      console.log('\n   (Run with --yes to delete)');
      return;
    }

    console.log('\n🗑️  Deleting customers...');

    for (const customer of testRunCustomers) {
      await stripe.customers.del(customer.id);
      console.log(`   ✓ Deleted ${customer.email || customer.id}`);
    }

  } catch (error: any) {
    console.error('❌ Error during Stripe cleanup:', error.message);
  }
}

async function main() {
  console.log('🧹 Cleanup Test Run');
  console.log('===================\n');
  console.log(`Test Run ID: ${TEST_RUN_ID}\n`);

  await cleanupSupabaseTestRun();
  await cleanupStripeTestRun();

  console.log('\n✨ Done!\n');
}

main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
