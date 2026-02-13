const express = require('express');
const { supabaseAdmin } = require('../database.js');
const { authenticateToken } = require('../middleware/auth.js');
const { upload } = require('../middleware/upload.js');

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
                userId: t.user_id, userName: 'Anonymous', // Masked for privacy
                description: t.description, metadata: t.metadata,
                timestamp: t.created_at
            });
        });

        (commentsRes.data || []).forEach(c => {
            if (!commentsByIssue[c.issue_id]) commentsByIssue[c.issue_id] = [];
            commentsByIssue[c.issue_id].push({
                id: c.id, userId: c.user_id, userName: 'Anonymous', // Masked for privacy
                text: c.text, timestamp: c.created_at
            });
        });

        (proposalsRes.data || []).forEach(p => {
            if (!proposalsByIssue[p.issue_id]) proposalsByIssue[p.issue_id] = [];
            proposalsByIssue[p.issue_id].push({
                id: p.id, userId: p.user_id, userName: 'Anonymous', // Masked for privacy
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
            priorityIndex: issue.priority_index,
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
            user_name: 'Anonymous Student',
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
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Support issue
router.post('/:id/support', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Call the Supabase RPC function for atomic support and priority recalculation
        const { data, error } = await supabaseAdmin.rpc('support_issue', {
            p_issue_id: id,
            p_user_id: userId
        });

        if (error) {
            console.error('RPC Error:', error);
            return res.status(500).json({ error: error.message || 'Failed to process support' });
        }

        // The RPC returns a JSON object with error or success data
        if (data.error) {
            return res.status(data.status || 400).json({ error: data.error });
        }

        // Fetch the updated issue object to return as requested
        const { data: updatedIssue, error: fetchError } = await supabaseAdmin
            .from('issues')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        res.json({
            message: data.message,
            issue: {
                id: updatedIssue.id,
                title: updatedIssue.title,
                status: updatedIssue.status,
                supportCount: updatedIssue.support_count,
                priorityIndex: updatedIssue.priority_index,
                priorityScore: updatedIssue.priority_score
            }
        });
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
            user_name: 'Anonymous',
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
            user_name: 'Anonymous',
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
            user_name: 'Anonymous',
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
            user_name: 'Admin',
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
            user_name: 'Admin',
            description: `Complaint rejected by admin${reason ? ': ' + reason : ''}`
        });

        res.json({ message: 'Complaint rejected' });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// CONTEST LIFECYCLE ROUTES
// ==========================================

// Resolve issue (start contest window)
router.post('/:id/resolve', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can resolve issues' });
        }

        const { id } = req.params;
        const { resolutionSummary, evidenceUrl } = req.body;

        if (!resolutionSummary) {
            return res.status(400).json({ error: 'Resolution summary is required' });
        }

        const contestWindowEnd = new Date();
        contestWindowEnd.setDate(contestWindowEnd.getDate() + 7);

        const { error } = await supabaseAdmin
            .from('issues')
            .update({
                status: 'RESOLVED_PENDING_REVIEW',
                resolution_summary: resolutionSummary,
                resolution_evidence_url: evidenceUrl,
                contest_window_end: contestWindowEnd.toISOString(),
                contest_weight: 0
            })
            .eq('id', id);

        if (error) throw error;

        // Log
        await supabaseAdmin.from('audit_logs').insert({
            action_type: 'ISSUE_RESOLVED',
            user_id: req.user.id,
            target_id: id,
            details: { summary: resolutionSummary }
        });

        // Timeline
        await supabaseAdmin.from('timeline_events').insert({
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: req.user.id,
            user_name: 'Admin',
            description: 'Issue resolved. 7-day contest window opened.',
            metadata: { oldStatus: 'OPEN', newStatus: 'RESOLVED_PENDING_REVIEW', evidenceUrl }
        });

        res.json({ message: 'Issue resolved. Contest window opened.' });
    } catch (error) {
        console.error('Resolve error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Contest issue (Student)
router.post('/:id/contest', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ error: 'Only students can contest issues' });
        }

        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) return res.status(400).json({ error: 'Reason is required' });

        // Call RPC
        const { data, error } = await supabaseAdmin.rpc('contest_issue', {
            p_issue_id: id,
            p_user_id: req.user.id,
            p_reason: reason,
            p_stake: 50, // Hardcoded stake for now
            p_reopen_threshold: 100 // Hardcoded threshold
        });

        if (error) throw error;

        if (data.error) {
            return res.status(400).json({ error: data.error });
        }

        // Timeline event if successful
        await supabaseAdmin.from('timeline_events').insert({
            issue_id: id,
            type: 'CONTEST',
            user_id: req.user.id,
            user_name: 'Anonymous Student',
            description: `Contested resolution: ${reason}`,
            metadata: { status: data.status }
        });

        res.json(data);
    } catch (error) {
        console.error('Contest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contest Decision (Admin)
router.post('/:id/contest-decision', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can make contest decisions' });
        }

        const { id } = req.params;
        const { decision, explanation } = req.body; // decision: 'ACCEPT' | 'REJECT'

        if (!['ACCEPT', 'REJECT'].includes(decision)) {
            return res.status(400).json({ error: 'Invalid decision' });
        }

        if (decision === 'ACCEPT') {
            // Reopen issue
            const { error } = await supabaseAdmin
                .from('issues')
                .update({
                    status: 'REOPENED',
                    reopen_count: 1 // Increment strictly? Or just set? Logic implies +1
                })
                .eq('id', id);

            if (error) throw error;

            // Refund logic should be here if manually accepted, but for MVP we assume RPC handled auto-cases. 
            // Manual accept might need manual refund trigger or just updating status.
            // For now, just update status.

            await supabaseAdmin.from('timeline_events').insert({
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'Admin',
                description: 'Contest ACCEPTED. Issue reopened for rework.',
                metadata: { decision: 'ACCEPT', explanation }
            });

        } else {
            // Reject Contest -> Back to RESOLVED (or RESOLVED_PENDING_REVIEW? Usually effectively closed or back to resolved state)
            // If rejected, it stays resolved? Or pending review?
            // "Return status to resolved_pending_review" or "final close"?
            // Let's set to PENDING_REVIEW (start window again? No).
            // Let's set to 'RESOLVED' effectively.

            // Actually, if contest rejected, it implies resolution holds.

            const { error } = await supabaseAdmin
                .from('issues')
                .update({ status: 'RESOLVED_PENDING_REVIEW' }) // Or maintain status
                .eq('id', id);

            if (error) throw error;

            await supabaseAdmin.from('timeline_events').insert({
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'Admin',
                description: `Contest REJECTED: ${explanation}`,
                metadata: { decision: 'REJECT', explanation }
            });
        }

        await supabaseAdmin.from('audit_logs').insert({
            action_type: 'CONTEST_DECISION',
            user_id: req.user.id,
            target_id: id,
            details: { decision, explanation }
        });

        res.json({ message: `Contest ${decision.toLowerCase()}ed` });

    } catch (error) {
        console.error('Contest decision error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
