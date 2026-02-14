const express = require('express');
const { supabaseAdmin } = require('../database.js');
const { authenticateToken } = require('../middleware/auth.js');
const { upload } = require('../middleware/upload.js');
const { createNotification } = require('./notifications.js');

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

        const { data: allIssues, error } = await query.order('priority_score', { ascending: false });
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
            contestedFlag: issue.contested_flag || false,
            contestWindowEnd: issue.contest_window_end || null,
            revalidationWindowEnd: issue.revalidation_window_end || null,
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
        const { title, description, category, departmentId, deadline } = req.body;
        const creatorId = req.user.id;

        if (!title || !description || !category || !departmentId || !deadline) {
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

        // Default urgency to 1 (LOW) since we removed the selector
        const defaultUrgency = 1;
        const priorityScore = (req.user.credibility || 50); // Base priority = Creator Credibility

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
                urgency: defaultUrgency,
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

        // 1. Check if already supported
        const { data: existing } = await supabaseAdmin
            .from('supports')
            .select('id')
            .eq('issue_id', id)
            .eq('user_id', userId)
            .single();

        if (existing) {
            return res.status(400).json({ error: 'You have already supported this issue' });
        }

        // 2. Insert support
        const { error: insertError } = await supabaseAdmin
            .from('supports')
            .insert({
                user_id: userId,
                issue_id: id
            });

        if (insertError) throw insertError;

        // 3. Update issue stats (Atomic increment + Priority Recalculation)
        // Fetch current stats first
        const { data: issue, error: fetchError } = await supabaseAdmin
            .from('issues')
            .select('support_count, priority_score')
            .eq('id', id)
            .single();

        if (fetchError) throw fetchError;

        // New Score = Old Score + 5 (Each support adds 5 points)
        const newSupportCount = (issue.support_count || 0) + 1;
        const newPriorityScore = (issue.priority_score || 0) + 5;

        const { data: updatedIssue, error: updateError } = await supabaseAdmin
            .from('issues')
            .update({
                support_count: newSupportCount,
                priority_score: newPriorityScore
            })
            .eq('id', id)
            .select('*')
            .single();

        if (updateError) throw updateError;

        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'SUPPORT',
            user_id: userId,
            user_name: 'Anonymous Student',
            description: 'Issue supported by a student'
        });

        res.json({
            message: 'Support added',
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

        // Notify student
        await createNotification(issue.creator_id, id, 'APPROVED', 'Your complaint has been approved and is now open for support.');

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

        // 7-day contest window for rejected issues
        const contestEnd = new Date();
        contestEnd.setDate(contestEnd.getDate() + 7);

        // Update status to REJECTED
        const { error } = await supabaseAdmin
            .from('issues')
            .update({
                status: 'REJECTED',
                contest_window_end: contestEnd.toISOString(),
                contested_flag: false,
                contest_count: 0
            })
            .eq('id', id);

        if (error) throw error;

        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'REJECTED',
            user_id: req.user.id,
            user_name: 'Admin',
            description: `Complaint rejected by admin${reason ? ': ' + reason : ''}`
        });

        // Notify student
        await createNotification(issue.creator_id, id, 'REJECTED', `Your complaint was rejected: ${reason || 'No reason provided'}`);

        res.json({ message: 'Complaint rejected' });
    } catch (error) {
        console.error('Reject error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// ==========================================
// CONTEST & REVALIDATION ROUTES (Prototype)
// Simple count-based, no credibility math
// ==========================================

const CONTEST_THRESHOLD = 3;    // Auto-revalidation after this many contests
const VOTE_THRESHOLD = 3;       // Final decision after this many votes
const WINDOW_DAYS = 7;          // Contest/revalidation window in days

// Resolve issue (admin → sets RESOLVED + opens 7-day contest window)
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
        contestWindowEnd.setDate(contestWindowEnd.getDate() + WINDOW_DAYS);

        const { error } = await supabaseAdmin
            .from('issues')
            .update({
                status: 'RESOLVED',
                resolution_summary: resolutionSummary,
                resolution_evidence_url: evidenceUrl,
                contest_window_end: contestWindowEnd.toISOString(),
                contested_flag: false,
                contest_count: 0
            })
            .eq('id', id);

        if (error) throw error;

        // Clear any old contests from previous rounds
        await supabaseAdmin.from('contests').delete().eq('issue_id', id);

        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: req.user.id,
            user_name: 'Admin',
            description: 'Issue resolved. 7-day contest window opened.',
            metadata: { newStatus: 'RESOLVED', evidenceUrl }
        });

        // Notify student
        // Fetch creator_id first
        const { data: issue } = await supabaseAdmin.from('issues').select('creator_id').eq('id', id).single();
        if (issue) {
            await createNotification(issue.creator_id, id, 'RESOLVED', 'Your complaint has been marked as resolved.');
        }

        res.json({ message: 'Issue resolved. Contest window opened.' });
    } catch (error) {
        console.error('Resolve error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Contest issue (Student — simple insert, no credibility math)
router.post('/:id/contest', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ error: 'Only students can contest issues' });
        }

        const { id } = req.params;
        const { reason } = req.body;

        // Fetch issue
        const { data: issue, error: fetchErr } = await supabaseAdmin
            .from('issues')
            .select('status, contest_window_end, contest_count')
            .eq('id', id)
            .single();

        if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

        // Validate status
        if (!['RESOLVED', 'REJECTED'].includes(issue.status)) {
            return res.status(400).json({ error: 'Issue is not in a contestable state' });
        }

        // Validate window
        if (issue.contest_window_end && new Date() > new Date(issue.contest_window_end)) {
            return res.status(400).json({ error: 'Contest window has expired' });
        }

        // Insert contest (unique constraint prevents duplicates)
        const { error: insertErr } = await supabaseAdmin.from('contests').insert({
            issue_id: id,
            user_id: req.user.id,
            reason: reason || null
        });

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(400).json({ error: 'You have already contested this issue' });
            }
            throw insertErr;
        }

        // Increment contest_count and set contested_flag
        const newCount = (issue.contest_count || 0) + 1;
        const updateData = {
            contest_count: newCount,
            contested_flag: true
        };

        // Auto-revalidation if threshold reached
        if (newCount >= CONTEST_THRESHOLD) {
            updateData.status = 'PENDING_REVALIDATION';
        }

        const { error: updateErr } = await supabaseAdmin
            .from('issues')
            .update(updateData)
            .eq('id', id);

        if (updateErr) throw updateErr;

        // Timeline
        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'CONTEST',
            user_id: req.user.id,
            user_name: 'Anonymous Student',
            description: reason
                ? `Contested: ${reason}`
                : 'Issue contested by student',
            metadata: { contestCount: newCount, threshold: CONTEST_THRESHOLD }
        });

        const autoEscalated = newCount >= CONTEST_THRESHOLD;
        res.json({
            message: autoEscalated
                ? 'Contest threshold reached. Issue sent for revalidation.'
                : 'Contest submitted successfully.',
            contestCount: newCount,
            status: autoEscalated ? 'PENDING_REVALIDATION' : issue.status
        });
    } catch (error) {
        console.error('Contest error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Contest Decision (Admin — accept or reject contest)
router.post('/:id/contest-decision', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can make contest decisions' });
        }

        const { id } = req.params;
        const { decision, explanation, evidenceUrl } = req.body;

        if (!['ACCEPT', 'REJECT'].includes(decision)) {
            return res.status(400).json({ error: 'Decision must be ACCEPT or REJECT' });
        }

        // Fetch issue
        const { data: issue, error: fetchErr } = await supabaseAdmin
            .from('issues')
            .select('status, contested_flag')
            .eq('id', id)
            .single();

        if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

        if (!issue.contested_flag) {
            return res.status(400).json({ error: 'Issue has no active contests' });
        }

        if (decision === 'ACCEPT') {
            // Move back to OPEN, clear contests
            const { error } = await supabaseAdmin
                .from('issues')
                .update({
                    status: 'OPEN',
                    contested_flag: false,
                    contest_count: 0
                })
                .eq('id', id);
            if (error) throw error;

            // Clear contest records
            await supabaseAdmin.from('contests').delete().eq('issue_id', id);

            await supabaseAdmin.from('timeline_events').insert({
                id: 'tl-' + Date.now(),
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'Admin',
                description: `Contest ACCEPTED. Issue reopened. ${explanation || ''}`,
                metadata: { decision: 'ACCEPT', explanation, evidenceUrl }
            });

            // Notify student
            const { data: creator } = await supabaseAdmin.from('issues').select('creator_id').eq('id', id).single();
            if (creator) {
                await createNotification(creator.creator_id, id, 'CONTEST_ACCEPTED', `Your contest was accepted. The issue has been reopened. ${explanation || ''}`);
            }
        } else {
            // REJECT — issue stays resolved/rejected, contest window continues
            await supabaseAdmin.from('timeline_events').insert({
                id: 'tl-' + Date.now(),
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'Admin',
                description: `Contest REJECTED. ${explanation || ''}`,
                metadata: { decision: 'REJECT', explanation, evidenceUrl }
            });

            // Notify student
            const { data: creator } = await supabaseAdmin.from('issues').select('creator_id').eq('id', id).single();
            if (creator) {
                await createNotification(creator.creator_id, id, 'CONTEST_REJECTED', `Your contest was rejected. The issue remains resolved/rejected. ${explanation || ''}`);
            }
        }

        // Notify student
        const { data: creator } = await supabaseAdmin.from('issues').select('creator_id').eq('id', id).single();
        if (creator) {
            await createNotification(creator.creator_id, id, 'CONTEST_REJECTED', `Your contest was rejected. The issue remains resolved/rejected. ${explanation || ''}`);
        }
    } catch (error) {
        console.error('Contest decision error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Re-resolve issue (admin — after pending_revalidation, marks RE_RESOLVED + opens vote window)
router.post('/:id/re-resolve', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Only admins can re-resolve issues' });
        }

        const { id } = req.params;
        const { resolutionSummary, evidenceUrl } = req.body;

        // Verify status
        const { data: issue, error: fetchErr } = await supabaseAdmin
            .from('issues')
            .select('status')
            .eq('id', id)
            .single();

        if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

        if (!['PENDING_REVALIDATION', 'OPEN'].includes(issue.status)) {
            return res.status(400).json({ error: 'Issue cannot be re-resolved in current state' });
        }

        const revalidationEnd = new Date();
        revalidationEnd.setDate(revalidationEnd.getDate() + WINDOW_DAYS);

        const { error } = await supabaseAdmin
            .from('issues')
            .update({
                status: 'RE_RESOLVED',
                resolution_summary: resolutionSummary || null,
                resolution_evidence_url: evidenceUrl || null,
                revalidation_window_end: revalidationEnd.toISOString(),
                contested_flag: false,
                contest_count: 0
            })
            .eq('id', id);

        if (error) throw error;

        // Clear old contests and votes
        await supabaseAdmin.from('contests').delete().eq('issue_id', id);
        await supabaseAdmin.from('revalidation_votes').delete().eq('issue_id', id);

        await supabaseAdmin.from('timeline_events').insert({
            id: 'tl-' + Date.now(),
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: req.user.id,
            user_name: 'Admin',
            description: 'Issue re-resolved. 7-day voting window opened.',
            metadata: { newStatus: 'RE_RESOLVED', evidenceUrl }
        });

        // Notify student
        if (issue.creator_id) { // issue loaded above might not have creator_id selected, let's select it
            const { data: creator } = await supabaseAdmin.from('issues').select('creator_id').eq('id', id).single();
            if (creator) {
                await createNotification(creator.creator_id, id, 'RE_RESOLVED', 'Your issue has been re-resolved. Please review and vote.');
            }
        }

        res.json({ message: 'Issue re-resolved. Revalidation voting window opened.' });
    } catch (error) {
        console.error('Re-resolve error:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    }
});

// Revalidation vote (Student — confirm or reject)
router.post('/:id/revalidation-vote', authenticateToken, async (req, res) => {
    try {
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ error: 'Only students can vote on revalidation' });
        }

        const { id } = req.params;
        const { voteType } = req.body; // 'confirm' or 'reject'

        if (!['confirm', 'reject'].includes(voteType)) {
            return res.status(400).json({ error: 'Vote must be confirm or reject' });
        }

        // Fetch issue
        const { data: issue, error: fetchErr } = await supabaseAdmin
            .from('issues')
            .select('status, revalidation_window_end')
            .eq('id', id)
            .single();

        if (fetchErr || !issue) return res.status(404).json({ error: 'Issue not found' });

        if (issue.status !== 'RE_RESOLVED') {
            return res.status(400).json({ error: 'Issue is not in revalidation' });
        }

        if (issue.revalidation_window_end && new Date() > new Date(issue.revalidation_window_end)) {
            return res.status(400).json({ error: 'Revalidation window has expired' });
        }

        // Insert vote (unique constraint prevents duplicates)
        const { error: insertErr } = await supabaseAdmin.from('revalidation_votes').insert({
            issue_id: id,
            user_id: req.user.id,
            vote_type: voteType
        });

        if (insertErr) {
            if (insertErr.code === '23505') {
                return res.status(400).json({ error: 'You have already voted on this issue' });
            }
            throw insertErr;
        }

        // Count votes
        const { data: votes } = await supabaseAdmin
            .from('revalidation_votes')
            .select('vote_type')
            .eq('issue_id', id);

        const confirmCount = (votes || []).filter(v => v.vote_type === 'confirm').length;
        const rejectCount = (votes || []).filter(v => v.vote_type === 'reject').length;

        let newStatus = 'RE_RESOLVED';
        let statusMessage = 'Vote recorded.';

        if (confirmCount >= VOTE_THRESHOLD) {
            newStatus = 'FINAL_CLOSED';
            statusMessage = 'Enough confirmations received. Issue permanently closed.';
            await supabaseAdmin.from('issues').update({ status: 'FINAL_CLOSED' }).eq('id', id);

            await supabaseAdmin.from('timeline_events').insert({
                id: 'tl-' + Date.now(),
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'System',
                description: 'Issue permanently closed after student confirmation votes.',
                metadata: { confirmCount, rejectCount }
            });

            // Notify student
            if (issue.creator_id) { // might need refetch if issue obj doesn't have it
                await createNotification(issue.creator_id, id, 'FINAL_CLOSED', 'Your issue has been permanently closed after student confirmation.');
            }
        } else if (rejectCount >= VOTE_THRESHOLD) {
            newStatus = 'OPEN';
            statusMessage = 'Enough rejections received. Issue marked as not solved.';
            await supabaseAdmin.from('issues').update({
                status: 'OPEN',
                contested_flag: false,
                contest_count: 0
            }).eq('id', id);

            // Clear votes for next round
            await supabaseAdmin.from('revalidation_votes').delete().eq('issue_id', id);

            await supabaseAdmin.from('timeline_events').insert({
                id: 'tl-' + Date.now(),
                issue_id: id,
                type: 'STATUS_CHANGE',
                user_id: req.user.id,
                user_name: 'System',
                description: 'Issue reopened after students rejected the re-resolution.',
                metadata: { confirmCount, rejectCount }
            });

            // Notify student
            if (issue.creator_id) {
                await createNotification(issue.creator_id, id, 'REOPENED', 'Your issue has been reopened after student rejection votes.');
            }
        }

        res.json({
            message: statusMessage,
            confirmCount,
            rejectCount,
            status: newStatus
        });
    } catch (error) {
        console.error('Revalidation vote error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
