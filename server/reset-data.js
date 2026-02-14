/**
 * Reset script: Deletes all issues/reports and resets department performance.
 * Run from the server/ directory: node reset-data.js
 */
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

async function resetData() {
    console.log('🗑️  Clearing all reports and related data...\n');

    // Delete in dependency order (children first)
    const tables = [
        'revalidation_votes',
        'contests',
        'supports',
        'proposals',
        'comments',
        'timeline_events',
        'issues'
    ];

    for (const table of tables) {
        const { error } = await supabaseAdmin.from(table).delete().neq('id', '___never_matches___');
        if (error) {
            // Some tables may use UUID primary keys, try a different filter
            const { error: err2 } = await supabaseAdmin.from(table).delete().gte('created_at', '1970-01-01');
            if (err2) {
                console.log(`  ⚠️  ${table}: ${err2.message}`);
            } else {
                console.log(`  ✅ ${table} cleared`);
            }
        } else {
            console.log(`  ✅ ${table} cleared`);
        }
    }

    // Reset department performance scores to default (e.g., 75)
    console.log('\n📊 Resetting department performance scores...');
    const { error: deptError } = await supabaseAdmin
        .from('departments')
        .update({ performance_score: 75 })
        .gte('id', '');  // match all rows

    if (deptError) {
        // Try alternative match
        const { data: depts } = await supabaseAdmin.from('departments').select('id');
        if (depts && depts.length > 0) {
            const ids = depts.map(d => d.id);
            const { error: err2 } = await supabaseAdmin
                .from('departments')
                .update({ performance_score: 75 })
                .in('id', ids);
            if (err2) {
                console.log(`  ⚠️  departments: ${err2.message}`);
            } else {
                console.log(`  ✅ ${depts.length} department(s) reset to score 75`);
            }
        }
    } else {
        console.log('  ✅ Department performance scores reset to 75');
    }

    console.log('\n✅ Done! All reports cleared and department performance reset.');
}

resetData().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
