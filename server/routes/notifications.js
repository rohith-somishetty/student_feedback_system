const express = require('express');
const { supabaseAdmin } = require('../database.js');
const { authenticateToken } = require('../middleware/auth.js');

const router = express.Router();

// Get unread notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from('notifications')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Mark as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const { error } = await supabaseAdmin
            .from('notifications')
            .update({ read: true })
            .eq('id', req.params.id)
            .eq('user_id', req.user.id);

        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Helper to create notification (internal use)
async function createNotification(userId, issueId, type, message) {
    try {
        await supabaseAdmin.from('notifications').insert({
            user_id: userId,
            issue_id: issueId,
            type,
            message
        });
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

module.exports = { router, createNotification };
