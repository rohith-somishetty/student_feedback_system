import express from 'express';
import { supabaseAdmin } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('departments')
            .select('*');

        if (error) throw error;

        res.json(data.map(d => ({
            id: d.id,
            name: d.name,
            performanceScore: d.performance_score
        })));
    } catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all supports (for metrics)
router.get('/supports', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('supports')
            .select('user_id, issue_id');

        if (error) throw error;

        res.json(data.map(s => ({ userId: s.user_id, issueId: s.issue_id })));
    } catch (error) {
        console.error('Get supports error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
