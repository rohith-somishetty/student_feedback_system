import express from 'express';
import { supabase, supabaseAdmin } from '../database.js';

const router = express.Router();

// Login with Supabase Auth
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        // Sign in via Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return res.status(401).json({ error: error.message });
        }

        // Get profile data
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

        if (profileError) {
            return res.status(500).json({ error: 'Failed to load profile' });
        }

        res.json({
            token: data.session.access_token,
            refreshToken: data.session.refresh_token,
            user: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                credibility: profile.credibility,
                departmentId: profile.department_id,
                rollNumber: profile.roll_number,
                adminId: profile.admin_id,
                createdAt: profile.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new student via Supabase Auth
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, rollNumber } = req.body;

        if (!name || !email || !password || !rollNumber) {
            return res.status(400).json({ error: 'All fields required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Create user in Supabase Auth (trigger will auto-create profile)
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm for dev
            user_metadata: { name, role: 'STUDENT' }
        });

        if (error) {
            return res.status(400).json({ error: error.message });
        }

        // Update profile with rollNumber
        await supabaseAdmin
            .from('profiles')
            .update({ roll_number: rollNumber, name })
            .eq('id', data.user.id);

        // Sign in to get session token
        const { data: session, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (loginError) {
            return res.status(500).json({ error: 'Account created but login failed' });
        }

        res.status(201).json({
            token: session.session.access_token,
            refreshToken: session.session.refresh_token,
            user: {
                id: data.user.id,
                name,
                email,
                role: 'STUDENT',
                credibility: 50,
                rollNumber
            }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
