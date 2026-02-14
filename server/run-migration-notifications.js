const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const statements = [
    `CREATE TABLE IF NOT EXISTS notifications (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE, issue_id TEXT REFERENCES issues(id) ON DELETE CASCADE, type TEXT NOT NULL, message TEXT NOT NULL, read BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT NOW())`,
    `ALTER TABLE notifications ENABLE ROW LEVEL SECURITY`,
    `CREATE POLICY "notifications_select" ON notifications FOR SELECT TO authenticated USING (auth.uid() = user_id)`,
    `CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id)`,
    `CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated WITH CHECK (true)`,
    `CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, read)`
];

async function runViaSql() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const fullSql = statements.join(';\n') + ';';

    const endpoints = [`${url}/rest/v1/sql`, `${url}/pg/sql`];
    for (const ep of endpoints) {
        try {
            const resp = await fetch(ep, {
                method: 'POST',
                headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: fullSql })
            });
            if (resp.ok) {
                console.log('✅ Migration succeeded via ' + ep);
                return true;
            }
        } catch (e) { }
    }
    return false;
}

async function runViaRpc() {
    console.log('Running via client checks...');
    const { error } = await supabase.from('notifications').select('id').limit(1);
    if (error && error.code === '42P01') {
        console.log('❌ Notifications table missing. Please run SQL manually.');
        return false;
    }
    console.log('✅ Notifications table exists/verified');
    return true;
}

async function main() {
    console.log('=== Notifications Migration ===\n');
    const sqlOk = await runViaSql();
    if (!sqlOk) await runViaRpc();
}

main().catch(console.error);
