// Run this script ONCE to create demo users in Supabase Auth
// Usage: node seed-users.js

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
);

const DEMO_USERS = [
    {
        email: 'alex@student.edu',
        password: '000000',
        name: 'Alex Johnson',
        role: 'STUDENT',
        credibility: 72,
        roll_number: '123456789012'
    },
    {
        email: 'sarah@admin.edu',
        password: '000000',
        name: 'Sarah Chen',
        role: 'ADMIN',
        credibility: 100,
        admin_id: 'ADM001',
        department_id: 'dept-1'
    },
    {
        email: 'sam@student.edu',
        password: '000000',
        name: 'Sam Rivera',
        role: 'STUDENT',
        credibility: 85,
        roll_number: '987654321098'
    },
    {
        email: 'leadership@institution.edu',
        password: '000000',
        name: 'Leadership Council',
        role: 'SUPER_ADMIN',
        credibility: 100,
        admin_id: 'SA001'
    }
];

const seed = async () => {
    console.log('🌱 Seeding demo users into Supabase...\n');

    for (const user of DEMO_USERS) {
        const { email, password, name, role, credibility, roll_number, admin_id, department_id } = user;

        // Create auth user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name, role }
        });

        if (error) {
            if (error.message.includes('already been registered')) {
                console.log(`⚠️  ${email} already exists, skipping auth creation...`);

                // Still update the profile
                const { data: users } = await supabaseAdmin.auth.admin.listUsers();
                const existing = users.users.find(u => u.email === email);
                if (existing) {
                    await supabaseAdmin
                        .from('profiles')
                        .upsert({
                            id: existing.id,
                            name,
                            email,
                            role,
                            credibility,
                            roll_number: roll_number || null,
                            admin_id: admin_id || null,
                            department_id: department_id || null
                        });
                    console.log(`   ✅ Profile updated for ${name}`);
                }
                continue;
            }
            console.error(`❌ Failed to create ${email}:`, error.message);
            continue;
        }

        // Update profile with extra fields
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: data.user.id,
                name,
                email,
                role,
                credibility,
                roll_number: roll_number || null,
                admin_id: admin_id || null,
                department_id: department_id || null
            });

        if (profileError) {
            console.error(`❌ Profile error for ${email}:`, profileError.message);
        } else {
            console.log(`✅ ${name} (${email}) — role: ${role}, credibility: ${credibility}`);
        }
    }

    console.log('\n🎉 Done! Demo accounts:');
    console.log('   Student:    alex@student.edu / 000000');
    console.log('   Admin:      sarah@admin.edu / 000000');
    console.log('   Student 2:  sam@student.edu / 000000');
    console.log('   Leadership: leadership@institution.edu / 000000');
};

seed().catch(e => console.error('Fatal:', e));
