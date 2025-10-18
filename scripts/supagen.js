#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Supagen - Supabase Type Generator
 * Automatically extracts project ID from .env.local and generates TypeScript types
 */

const ENV_FILE = path.join(__dirname, '..', '.env.local');
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'types');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'supatypes.types.ts');

function main() {
  console.log('🔧 Supagen - Generating Supabase types...\n');

  // Check if .env.local exists
  if (!fs.existsSync(ENV_FILE)) {
    console.error('❌ Error: .env.local not found');
    console.error('   Please create .env.local with NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  // Load .env.local
  const envContent = fs.readFileSync(ENV_FILE, 'utf-8');
  const envVars = {};

  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  // Extract project ID from NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];

  if (!supabaseUrl) {
    console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL not found in .env.local');
    process.exit(1);
  }

  // Parse project ID from URL (e.g., https://wslokvqhygitrphzneyr.supabase.co)
  const match = supabaseUrl.match(/https?:\/\/([a-zA-Z0-9]+)\.supabase\.co/);

  if (!match || !match[1]) {
    console.error('❌ Error: Invalid NEXT_PUBLIC_SUPABASE_URL format');
    console.error(`   Expected: https://your-project-id.supabase.co`);
    console.error(`   Got: ${supabaseUrl}`);
    process.exit(1);
  }

  const projectId = match[1];
  console.log(`✓ Loaded project ID: ${projectId}`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`✓ Created directory: src/types/`);
  }

  // Run supabase gen types command
  const command = `npx supabase gen types typescript --project-id ${projectId} --schema public,auth`;

  console.log(`\n🚀 Running: ${command}\n`);

  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: ['inherit', 'pipe', 'inherit']
    });

    // Write output to file
    fs.writeFileSync(OUTPUT_FILE, output);

    console.log(`\n✅ Success! Types generated at: src/types/supatypes.types.ts`);
  } catch (error) {
    console.error('\n❌ Error running supabase command');
    console.error('   Make sure you have access to the Supabase project');
    console.error('   You may need to run: npx supabase login');
    process.exit(1);
  }
}

main();
