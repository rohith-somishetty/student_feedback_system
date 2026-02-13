const express = require('express');
const { supabaseAdmin } = require('../database.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// Get all departments
router.get('/', authenticateToken, async (req, res) => {
    try {
        // Fetch all departments
        const { data: depts, error: deptsError } = await supabaseAdmin
            .from('departments')
            .select('*');

        if (deptsError) throw deptsError;

        // Fetch issue counts per department and status
        const { data: issues, error: issuesError } = await supabaseAdmin
            .from('issues')
            .select('department_id, status, deadline, created_at');

        if (issuesError) throw issuesError;

        const results = depts.map(d => {
            const deptIssues = issues.filter(i => i.department_id === d.id);
            const resolved = deptIssues.filter(i => i.status === 'RESOLVED').length;
            const total = deptIssues.length;

            // Basic performance score calculation: (Resolved / Total) * 100
            // If no issues, use a default high score or the stored one
            let score = d.performance_score;
            if (total > 0) {
                const resolutionRate = (resolved / total) * 100;
                // Simplified dynamic score - weighted average of stored base and real-time rate
                score = Math.round((resolutionRate * 0.7) + (d.performance_score * 0.3));
            }

            return {
                id: d.id,
                name: d.name,
                performanceScore: score,
                totalIssues: total,
                resolvedIssues: resolved
            };
        });

        res.json(results);
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

module.exports = router;
