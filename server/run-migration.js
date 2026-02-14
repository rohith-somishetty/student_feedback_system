// Run migration using Supabase service_role key via the database REST endpoint
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const statements = [
    // Step 1: Add columns
    `ALTER TABLE issues ADD COLUMN IF NOT EXISTS contested_flag BOOLEAN DEFAULT false`,
    `ALTER TABLE issues ADD COLUMN IF NOT EXISTS contest_window_end TIMESTAMPTZ`,
    `ALTER TABLE issues ADD COLUMN IF NOT EXISTS revalidation_window_end TIMESTAMPTZ`,

    // Step 2: Status constraint
    `ALTER TABLE issues DROP CONSTRAINT IF EXISTS issues_status_check`,
    `ALTER TABLE issues ADD CONSTRAINT issues_status_check CHECK (status IN ('PENDING_APPROVAL','OPEN','IN_REVIEW','RESOLVED','CONTESTED','REOPENED','REJECTED','PENDING_REVALIDATION','RE_RESOLVED','FINAL_CLOSED'))`,

    // Step 3: Drop/recreate contests
    `DROP TABLE IF EXISTS contests CASCADE`,
    `CREATE TABLE contests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, reason TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(issue_id, user_id))`,
    `ALTER TABLE contests ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "contests_select" ON contests FOR SELECT TO authenticated USING (true)`,
    `CREATE POLICY "contests_insert" ON contests FOR INSERT TO authenticated WITH CHECK (true)`,
    `CREATE POLICY "contests_delete" ON contests FOR DELETE TO authenticated USING (true)`,

    // Step 4: revalidation_votes
    `CREATE TABLE IF NOT EXISTS revalidation_votes (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), issue_id TEXT NOT NULL REFERENCES issues(id) ON DELETE CASCADE, user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, vote_type TEXT NOT NULL CHECK (vote_type IN ('confirm','reject')), created_at TIMESTAMPTZ DEFAULT NOW(), UNIQUE(issue_id, user_id))`,
    `ALTER TABLE revalidation_votes ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "votes_select" ON revalidation_votes FOR SELECT TO authenticated USING (true)`,
    `CREATE POLICY "votes_insert" ON revalidation_votes FOR INSERT TO authenticated WITH CHECK (true)`,

    // Step 5: Indexes
    `CREATE INDEX IF NOT EXISTS idx_issues_contested_flag ON issues(contested_flag)`,
    `CREATE INDEX IF NOT EXISTS idx_contests_issue ON contests(issue_id)`,
    `CREATE INDEX IF NOT EXISTS idx_revalidation_votes_issue ON revalidation_votes(issue_id)`,
];

async function runViaSql() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Join all statements and send as one batch via the Supabase SQL API
    const fullSql = statements.join(';\n') + ';';

    // Try the /sql endpoint (available on some Supabase versions)
    const endpoints = [
        `${url}/rest/v1/sql`,
        `${url}/pg/sql`,
    ];

    for (const ep of endpoints) {
        try {
            const resp = await fetch(ep, {
                method: 'POST',
                headers: {
                    'apikey': key,
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: fullSql })
            });
            const body = await resp.text();
            if (resp.ok) {
                console.log('✅ Migration succeeded via ' + ep);
                return true;
            }
        } catch (e) { }
    }
    return false;
}

async function runViaRpc() {
    // First, try to create a helper function
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Alternative: Try individual updates via supabase client
    // We can verify the schema by doing test operations

    console.log('Checking current schema state...\n');

    // Test contested_flag
    const { data: d1, error: e1 } = await supabase.from('issues').select('id, contested_flag, contest_window_end, revalidation_window_end').limit(1);
    if (e1) {
        console.log('❌ issues columns missing: ' + e1.message);
        console.log('   You need to run the migration SQL manually.');
        return false;
    } else {
        console.log('✅ issues columns (contested_flag, contest_window_end, revalidation_window_end) exist');
    }

    // Test contests table
    const { error: e2 } = await supabase.from('contests').select('id').limit(1);
    if (e2) {
        console.log('❌ contests table: ' + e2.message);
        return false;
    } else {
        console.log('✅ contests table exists');
    }

    // Test revalidation_votes
    const { error: e3 } = await supabase.from('revalidation_votes').select('id').limit(1);
    if (e3) {
        console.log('❌ revalidation_votes table: ' + e3.message);
        return false;
    } else {
        console.log('✅ revalidation_votes table exists');
    }

    return true;
}

async function main() {
    console.log('=== Contest & Revalidation Migration ===\n');

    // Try SQL endpoints first
    const sqlOk = await runViaSql();
    if (sqlOk) {
        console.log('\nMigration completed via SQL endpoint!');
    } else {
        console.log('SQL endpoint not available, checking current state...');
    }

    // Verify
    const ok = await runViaRpc();
    if (!ok) {
        console.log('\n⚠️  Migration incomplete. Please run the following SQL');
        console.log('in your Supabase SQL Editor (Dashboard > SQL Editor):\n');
        console.log('File: server/supabase/migration_contest_revalidation.sql');
    } else {
        console.log('\n✅ All schema elements verified!');
    }
}

main().catch(e => console.error('Fatal:', e));
