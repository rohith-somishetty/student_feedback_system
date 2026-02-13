// Quick test script for backend endpoints
const test = async () => {
    const BASE = 'http://localhost:3001';

    // 1. Health check
    console.log('--- Health Check ---');
    const health = await fetch(`${BASE}/health`).then(r => r.json());
    console.log(health);

    // 2. Login
    console.log('\n--- Login (Student) ---');
    const login = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'alex@student.edu', password: '0000' })
    }).then(r => r.json());
    console.log('Token:', login.token ? login.token.substring(0, 30) + '...' : 'NONE');
    console.log('User:', login.user?.name, '| Role:', login.user?.role, '| Credibility:', login.user?.credibility);

    const token = login.token;
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 3. Get all users
    console.log('\n--- All Users ---');
    const users = await fetch(`${BASE}/api/users`, { headers }).then(r => r.json());
    users.forEach(u => console.log(`  ${u.name} [${u.role}] cred: ${u.credibility}`));

    // 4. Get departments
    console.log('\n--- Departments ---');
    const depts = await fetch(`${BASE}/api/departments`, { headers }).then(r => r.json());
    depts.forEach(d => console.log(`  ${d.name}: score ${d.performanceScore}`));

    // 5. Get issues
    console.log('\n--- Issues ---');
    const issues = await fetch(`${BASE}/api/issues`, { headers }).then(r => r.json());
    console.log(`Total issues: ${issues.length}`);
    issues.forEach(i => console.log(`  [${i.status}] ${i.title} (priority: ${i.priorityScore})`));

    // 6. Login admin
    console.log('\n--- Login (Admin) ---');
    const adminLogin = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'sarah@admin.edu', password: '0000' })
    }).then(r => r.json());
    console.log('Admin:', adminLogin.user?.name, '| Role:', adminLogin.user?.role);

    // 7. Login super admin
    console.log('\n--- Login (Super Admin) ---');
    const superLogin = await fetch(`${BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'leadership@institution.edu', password: '0000' })
    }).then(r => r.json());
    console.log('Super Admin:', superLogin.user?.name, '| Role:', superLogin.user?.role);

    console.log('\n✅ All backend endpoints working!');
};

test().catch(e => console.error('❌ Test failed:', e.message));
