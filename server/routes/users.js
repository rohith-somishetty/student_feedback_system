const express = require('express');
const { supabaseAdmin } = require('../database.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// Get all users
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('id, name, email, role, credibility, department_id, roll_number, admin_id, created_at');

        if (error) throw error;

        res.json(data.map(u => ({
            id: u.id,
            name: 'Anonymous',
            email: 'hidden@privacy.edu',
            role: u.role,
            credibility: u.credibility,
            departmentId: u.department_id,
            rollNumber: '********',
            adminId: u.admin_id ? '********' : null,
            createdAt: u.created_at
        })));
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('id', req.user.id)
            .single();

        if (error) throw error;

        res.json({
            id: data.id,
            name: data.name,
            email: data.email,
            role: data.role,
            credibility: data.credibility,
            departmentId: data.department_id,
            rollNumber: data.roll_number,
            adminId: data.admin_id,
            createdAt: data.created_at
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user profile
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, credibility } = req.body;

        if (req.user.id !== id && req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const updates = {};
        if (name) updates.name = name;
        if (credibility !== undefined && (req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN')) {
            updates.credibility = Math.max(0, Math.min(100, credibility));
        }

        if (Object.keys(updates).length > 0) {
            const { error } = await supabaseAdmin
                .from('profiles')
                .update(updates)
                .eq('id', id);

            if (error) throw error;
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get user supports
router.get('/:id/supports', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('supports')
            .select('user_id, issue_id')
            .eq('user_id', req.params.id);

        if (error) throw error;

        res.json(data.map(s => ({ userId: s.user_id, issueId: s.issue_id })));
    } catch (error) {
        console.error('Get supports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
