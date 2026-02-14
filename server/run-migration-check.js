// Run migration for contest & revalidation system
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
    console.log('Running contest & revalidation migration...\n');

    // 1. Add columns to issues
    console.log('1. Adding columns to issues table...');
    const { error: e1 } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE issues ADD COLUMN IF NOT EXISTS contested_flag BOOLEAN DEFAULT false`
    });
    // If rpc doesn't work, columns may already exist or we need SQL editor
    // Try a test query to check
    const { data: testIssue } = await supabase.from('issues').select('contested_flag').limit(1);
    if (testIssue !== null) {
        console.log('   contested_flag column exists ✓');
    } else {
        console.log('   Need to add columns via SQL editor');
    }

    // 2. Try creating contests table via insert test
    console.log('\n2. Checking contests table...');
    const { error: contestCheck } = await supabase.from('contests').select('id').limit(1);
    if (!contestCheck) {
        console.log('   contests table exists ✓');
    } else {
        console.log('   contests table missing: ' + contestCheck.message);
    }

    // 3. Check revalidation_votes table
    console.log('\n3. Checking revalidation_votes table...');
    const { error: voteCheck } = await supabase.from('revalidation_votes').select('id').limit(1);
    if (!voteCheck) {
        console.log('   revalidation_votes table exists ✓');
    } else {
        console.log('   revalidation_votes table missing: ' + voteCheck.message);
    }

    // 4. Check audit_logs table
    console.log('\n4. Checking audit_logs table...');
    const { error: auditCheck } = await supabase.from('audit_logs').select('id').limit(1);
    if (!auditCheck) {
        console.log('   audit_logs table exists ✓');
    } else {
        console.log('   audit_logs table missing: ' + auditCheck.message);
    }

    console.log('\n--- Summary ---');
    console.log('If any tables/columns are missing, please run the SQL in');
    console.log('server/supabase/migration_contest_revalidation.sql');
    console.log('in your Supabase SQL Editor (Dashboard > SQL Editor).\n');
}

run().catch(e => console.error('Fatal:', e));
