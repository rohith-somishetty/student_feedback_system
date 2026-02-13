import express from 'express';
import { supabaseAdmin } from '../database.js';
import { authenticateToken } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// Get all issues with related data
// Admins see everything; Students see approved issues + their own pending ones
router.get('/', authenticateToken, async (req, res) => {
    try {
        let query = supabaseAdmin.from('issues').select('*');

        // Students only see approved (OPEN+) issues and their own pending/rejected
        if (req.user.role === 'STUDENT') {
            query = query.or(`status.neq.PENDING_APPROVAL,status.neq.REJECTED,creator_id.eq.${req.user.id}`);
        }

        const { data: allIssues, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;

        // For students: filter in JS for clarity
        let issues = allIssues;
        if (req.user.role === 'STUDENT') {
            issues = allIssues.filter(i =>
                (i.status !== 'PENDING_APPROVAL' && i.status !== 'REJECTED') ||
                i.creator_id === req.user.id
            );
        }

        // Batch fetch related data
        const issueIds = issues.map(i => i.id);

        const [timelineRes, commentsRes, proposalsRes] = issueIds.length > 0 ? await Promise.all([
            supabaseAdmin.from('timeline_events').select('*').in('issue_id', issueIds).order('created_at', { ascending: true }),
            supabaseAdmin.from('comments').select('*').in('issue_id', issueIds).order('created_at', { ascending: true }),
            supabaseAdmin.from('proposals').select('*').in('issue_id', issueIds).order('votes', { ascending: false })
        ]) : [{ data: [] }, { data: [] }, { data: [] }];

        const timelineByIssue = {};
        const commentsByIssue = {};
        const proposalsByIssue = {};

        (timelineRes.data || []).forEach(t => {
            if (!timelineByIssue[t.issue_id]) timelineByIssue[t.issue_id] = [];
            timelineByIssue[t.issue_id].push({
                id: t.id, issueId: t.issue_id, type: t.type,
                userId: t.user_id, userName: t.user_name,
                description: t.description, metadata: t.metadata,
                timestamp: t.created_at
            });
        });

        (commentsRes.data || []).forEach(c => {
            if (!commentsByIssue[c.issue_id]) commentsByIssue[c.issue_id] = [];
            commentsByIssue[c.issue_id].push({
                id: c.id, userId: c.user_id, userName: c.user_name,
                text: c.text, timestamp: c.created_at
            });
        });

        (proposalsRes.data || []).forEach(p => {
            if (!proposalsByIssue[p.issue_id]) proposalsByIssue[p.issue_id] = [];
            proposalsByIssue[p.issue_id].push({
                id: p.id, userId: p.user_id, userName: p.user_name,
                text: p.text, votes: p.votes, timestamp: p.created_at
            });
        });

        const enriched = issues.map(issue => ({
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            creatorId: issue.creator_id,
            departmentId: issue.department_id,
            status: issue.status,
            urgency: issue.urgency,
            deadline: issue.deadline,
            priorityScore: issue.priority_score,
            evidenceUrl: issue.evidence_url,
            resolutionEvidenceUrl: issue.resolution_evidence_url,
            supportCount: issue.support_count,
            contestCount: issue.contest_count,
            createdAt: issue.created_at,
            timeline: timelineByIssue[issue.id] || [],
            comments: commentsByIssue[issue.id] || [],
            proposals: proposalsByIssue[issue.id] || []
        }));

        res.json(enriched);
    } catch (error) {
        console.error('Get issues error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create issue
router.post('/', authenticateToken, upload.single('evidence'), async (req, res) => {
    try {
        const { title, description, category, departmentId, urgency, deadline } = req.body;
        const creatorId = req.user.id;

        if (!title || !description || !category || !departmentId || !urgency || !deadline) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let evidenceUrl = null;

        // Upload file to Supabase Storage if provided
        if (req.file) {
            const fileName = `${Date.now()}-${req.file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('evidence')
                .upload(`issues/${fileName}`, req.file.buffer, {
                    contentType: req.file.mimetype
                });

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage
                    .from('evidence')
                    .getPublicUrl(`issues/${fileName}`);
                evidenceUrl = urlData.publicUrl;
            }
        }

        const priorityScore = (req.user.credibility || 50) * parseInt(urgency);
        const issueId = 'iss-' + Date.now();

        // Insert issue
        const { error: issueError } = await supabaseAdmin
            .from('issues')
            .insert({
                id: issueId,
                title,
                description,
                category,
                creator_id: creatorId,
                department_id: departmentId,
                status: 'PENDING_APPROVAL',
                urgency: parseInt(urgency),
                deadline,
                priority_score: priorityScore,
                evidence_url: evidenceUrl,
                support_count: 1
            });

        if (issueError) throw issueError;

        // Add timeline event
        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: issueId,
            type: 'CREATED',
            user_id: creatorId,
            user_name: req.user.name,
            description: 'Complaint submitted — awaiting admin approval'
        });

        // Auto-support by creator
        await supabaseAdmin.from('supports').insert({
            user_id: creatorId,
            issue_id: issueId
        });

        res.status(201).json({ id: issueId, message: 'Complaint submitted. Awaiting admin approval.', evidenceUrl });
    } catch (error) {
        console.error('Create issue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update issue
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const updateData = {};
        const fieldMap = {
            status: 'status',
            priorityScore: 'priority_score',
            supportCount: 'support_count',
            contestCount: 'contest_count',
            resolutionEvidenceUrl: 'resolution_evidence_url'
        };

        Object.keys(updates).forEach(key => {
            if (fieldMap[key]) {
                updateData[fieldMap[key]] = updates[key];
            }
        });

        if (Object.keys(updateData).length > 0) {
            const { error } = await supabaseAdmin
                .from('issues')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;
        }

        res.json({ message: 'Issue updated' });
    } catch (error) {
        console.error('Update issue error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Support issue
router.post('/:id/support', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Check if already supported
        const { data: existing } = await supabaseAdmin
            .from('supports')
            .select('user_id')
            .eq('user_id', userId)
            .eq('issue_id', id)
            .maybeSingle();

        if (existing) {
            return res.status(409).json({ error: 'Already supported' });
        }

        // Add support
        await supabaseAdmin.from('supports').insert({ user_id: userId, issue_id: id });

        // Update issue counts
        const { data: issue } = await supabaseAdmin
            .from('issues')
            .select('priority_score, support_count')
            .eq('id', id)
            .single();

        const newPriority = issue.priority_score + (req.user.credibility * 0.75);
        const newCount = issue.support_count + 1;

        await supabaseAdmin
            .from('issues')
            .update({ priority_score: newPriority, support_count: newCount })
            .eq('id', id);

        // Timeline event
        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'SUPPORT',
            user_id: userId,
            user_name: req.user.name,
            description: `Endorsed this issue (credibility: ${req.user.credibility})`
        });

        res.json({ message: 'Support recorded', newPriority, newCount });
    } catch (error) {
        console.error('Support error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add comment
router.post('/:id/comments', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Comment text required' });

        const commentId = 'cmt-' + Date.now();

        const { error } = await supabaseAdmin.from('comments').insert({
            id: commentId,
            issue_id: req.params.id,
            user_id: req.user.id,
            user_name: req.user.name,
            text
        });

        if (error) throw error;
        res.status(201).json({ id: commentId, message: 'Comment added' });
    } catch (error) {
        console.error('Comment error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add proposal
router.post('/:id/proposals', authenticateToken, async (req, res) => {
    try {
        const { text } = req.body;
        if (!text) return res.status(400).json({ error: 'Proposal text required' });

        const proposalId = 'prp-' + Date.now();

        const { error } = await supabaseAdmin.from('proposals').insert({
            id: proposalId,
            issue_id: req.params.id,
            user_id: req.user.id,
            user_name: req.user.name,
            text
        });

        if (error) throw error;
        res.status(201).json({ id: proposalId, message: 'Proposal added' });
    } catch (error) {
        console.error('Proposal error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Add timeline event
router.post('/:id/timeline', authenticateToken, async (req, res) => {
    try {
        const { type, description, metadata } = req.body;

        const timelineId = 'tl-' + Date.now();

        const { error } = await supabaseAdmin.from('timeline_events').insert({
            id: timelineId,
            issue_id: req.params.id,
            type,
            user_id: req.user.id,
            user_name: req.user.name,
            description,
            metadata: metadata || null
        });

        if (error) throw error;
        res.status(201).json({ id: timelineId, message: 'Timeline event added' });
    } catch (error) {
        console.error('Timeline error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// ADMIN APPROVAL WORKFLOW
// ==========================================

// Approve issue (admin only)
router.post('/:id/approve', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can approve complaints' });
        }

        const { id } = req.params;

        // Verify issue exists and is pending
        const { data: issue, error: fetchError } = await supabaseAdmin
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        if (issue.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ error: 'Issue is not pending approval' });
        }

        // Update status to OPEN
        const { error } = await supabaseAdmin
            .from('issues')
            .update({ status: 'OPEN' })
            .eq('id', id);

        if (error) throw error;

        // Timeline event
        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'APPROVED',
            user_id: req.user.id,
            user_name: req.user.name,
            description: 'Complaint approved by admin and is now open for support'
        });

        res.json({ message: 'Complaint approved successfully' });
    } catch (error) {
        console.error('Approve error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Reject issue (admin only)
router.post('/:id/reject', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can reject complaints' });
        }

        const { id } = req.params;
        const { reason } = req.body;

        // Verify issue exists and is pending
        const { data: issue, error: fetchError } = await supabaseAdmin
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchError || !issue) {
            return res.status(404).json({ error: 'Issue not found' });
        }

        if (issue.status !== 'PENDING_APPROVAL') {
            return res.status(400).json({ error: 'Issue is not pending approval' });
        }

        // Update status to REJECTED
        const { error } = await supabaseAdmin
            .from('issues')
            .update({ status: 'REJECTED' })
            .eq('id', id);

        if (error) throw error;

        // Timeline event
        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'REJECTED',
            user_id: req.user.id,
            user_name: req.user.name,
            description: `Complaint rejected by admin${reason ? ': ' + reason : ''}`
        });

        res.json({ message: 'Complaint rejected' });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
