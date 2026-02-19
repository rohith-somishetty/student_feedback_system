const { supabaseAdmin } = require('../database.js');

class IssueService {
    /**
     * Get all issues with pagination and enrichment
     * @param {Object} db - Authenticated Supabase client
     * @param {Object} options - Query options (page, limit)
     */
    static async getAllIssues(db, { page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;

        // Fetch issues with total count
        const { data: issues, error, count } = await db
            .from('issues')
            .select('*', { count: 'exact' })
            .order('priority_score', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        if (!issues || issues.length === 0) {
            return { issues: [], totalCount: count || 0 };
        }

        // Batch fetch related data (timeline, comments, proposals)
        const issueIds = issues.map(i => i.id);

        const [timelineRes, commentsRes, proposalsRes] = await Promise.all([
            db.from('timeline_events').select('*').in('issue_id', issueIds).order('created_at', { ascending: true }),
            db.from('comments').select('*').in('issue_id', issueIds).order('created_at', { ascending: true }),
            db.from('proposals').select('*').in('issue_id', issueIds).order('votes', { ascending: false })
        ]);

        const timelineByIssue = this._groupBy(timelineRes.data || [], 'issue_id');
        const commentsByIssue = this._groupBy(commentsRes.data || [], 'issue_id');
        const proposalsByIssue = this._groupBy(proposalsRes.data || [], 'issue_id');

        const enriched = issues.map(issue => ({
            ...this._mapIssueFields(issue),
            timeline: (timelineByIssue[issue.id] || []).map(t => this._mapTimelineFields(t)),
            comments: (commentsByIssue[issue.id] || []).map(c => this._mapCommentFields(c)),
            proposals: (proposalsByIssue[issue.id] || []).map(p => this._mapProposalFields(p))
        }));

        return {
            issues: enriched,
            totalCount: count || 0,
            page,
            limit
        };
    }

    static async createIssue(db, user, data, file) {
        const { title, description, category, departmentId, deadline } = data;
        let evidenceUrl = null;

        if (file) {
            const fileName = `${Date.now()}-${file.originalname}`;
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('evidence')
                .upload(`issues/${fileName}`, file.buffer, { contentType: file.mimetype });

            if (!uploadError) {
                const { data: urlData } = supabaseAdmin.storage.from('evidence').getPublicUrl(`issues/${fileName}`);
                evidenceUrl = urlData.publicUrl;
            }
        }

        const { data: issue, error: issueError } = await db.from('issues').insert({
            title,
            description,
            category,
            creator_id: user.id,
            department_id: departmentId,
            status: 'PENDING_APPROVAL',
            urgency: 1,
            deadline,
            priority_score: user.credibility || 50,
            evidence_url: evidenceUrl,
            support_count: 1
        }).select('id').single();

        if (issueError) throw issueError;

        await db.from('timeline_events').insert({
            issue_id: issue.id,
            type: 'CREATED',
            user_id: user.id,
            user_name: 'Anonymous',
            description: 'Complaint submitted'
        });

        await db.from('supports').insert({ user_id: user.id, issue_id: issue.id });

        return { id: issue.id, evidenceUrl };
    }

    static async updateIssue(db, id, updates) {
        const fieldMap = {
            status: 'status',
            priorityScore: 'priority_score',
            supportCount: 'support_count',
            contestCount: 'contest_count',
            resolutionEvidenceUrl: 'resolution_evidence_url'
        };

        const updateData = {};
        Object.keys(updates).forEach(key => {
            if (fieldMap[key]) updateData[fieldMap[key]] = updates[key];
        });

        if (Object.keys(updateData).length > 0) {
            const { error } = await db.from('issues').update(updateData).eq('id', id);
            if (error) throw error;
        }
        return { message: 'Issue updated' };
    }

    static async supportIssue(db, user, issueId) {
        const { data, error } = await db.rpc('support_issue', { p_issue_id: issueId, p_user_id: user.id });
        if (error) throw error;
        return data;
    }

    static async addComment(db, user, issueId, text) {
        const { data: comment, error } = await db.from('comments').insert({
            issue_id: issueId,
            user_id: user.id,
            user_name: 'Anonymous',
            text
        }).select('id').single();
        if (error) throw error;
        return { id: comment.id, message: 'Comment added' };
    }

    static async addProposal(db, user, issueId, text) {
        const { data: proposal, error } = await db.from('proposals').insert({
            issue_id: issueId,
            user_id: user.id,
            user_name: 'Anonymous',
            text
        }).select('id').single();
        if (error) throw error;
        return { id: proposal.id, message: 'Proposal added' };
    }

    static async approveIssue(db, user, id) {
        if (user.role !== 'ADMIN') throw new Error('Forbidden');
        const { data: issue } = await db.from('issues').select('status, creator_id').eq('id', id).single();
        if (!issue || issue.status !== 'PENDING_APPROVAL') throw new Error('Invalid issue state');

        await db.from('issues').update({ status: 'OPEN' }).eq('id', id);
        await db.from('timeline_events').insert({
            issue_id: id,
            type: 'APPROVED',
            user_id: user.id,
            user_name: 'Admin',
            description: 'Complaint approved'
        });
        return { creatorId: issue.creator_id };
    }

    static async rejectIssue(db, user, id, reason) {
        if (user.role !== 'ADMIN') throw new Error('Forbidden');
        const { data: issue } = await db.from('issues').select('status, creator_id').eq('id', id).single();
        if (!issue || issue.status !== 'PENDING_APPROVAL') throw new Error('Invalid state');

        const window = new Date(); window.setDate(window.getDate() + 7);
        await db.from('issues').update({ status: 'REJECTED', contest_window_end: window.toISOString() }).eq('id', id);
        await db.from('timeline_events').insert({
            issue_id: id,
            type: 'REJECTED',
            user_id: user.id,
            user_name: 'Admin',
            description: `Rejected: ${reason || 'No reason'}`
        });
        return { creatorId: issue.creator_id };
    }

    static async resolveIssue(db, user, id, summary, evidenceUrl) {
        if (user.role !== 'ADMIN') throw new Error('Forbidden');
        const window = new Date(); window.setDate(window.getDate() + 7);
        const { error } = await db.from('issues').update({
            status: 'RESOLVED',
            resolution_summary: summary,
            resolution_evidence_url: evidenceUrl,
            contest_window_end: window.toISOString()
        }).eq('id', id);
        if (error) throw error;

        await db.from('timeline_events').insert({
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: user.id,
            user_name: 'Admin',
            description: `Resolved: ${summary}`
        });

        const { data: issue } = await db.from('issues').select('creator_id').eq('id', id).single();
        return { creatorId: issue?.creator_id };
    }

    static async contestDecision(db, user, id, decision, explanation) {
        if (user.role !== 'ADMIN') throw new Error('Forbidden');
        const { data: issue } = await db.from('issues').select('status').eq('id', id).single();
        if (!issue) throw new Error('Issue not found');

        const updates = { contested_flag: false };
        if (decision === 'ACCEPT') {
            updates.status = 'OPEN';
            updates.contest_count = 0;
        }

        const { error } = await db.from('issues').update(updates).eq('id', id);
        if (error) throw error;

        await db.from('timeline_events').insert({
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: user.id,
            user_name: 'Admin',
            description: `Contest ${decision.toLowerCase()}ed: ${explanation || 'No explanation'}`
        });

        return { message: `Contest ${decision.toLowerCase()}ed` };
    }

    static async reResolve(db, user, id, summary, evidenceUrl) {
        if (user.role !== 'ADMIN') throw new Error('Forbidden');
        const window = new Date(); window.setDate(window.getDate() + 7);

        const { error } = await db.from('issues').update({
            status: 'RE_RESOLVED',
            resolution_summary: summary,
            resolution_evidence_url: evidenceUrl,
            revalidation_window_end: window.toISOString()
        }).eq('id', id);
        if (error) throw error;

        await db.from('timeline_events').insert({
            issue_id: id,
            type: 'STATUS_CHANGE',
            user_id: user.id,
            user_name: 'Admin',
            description: `Re-Resolved: ${summary}`
        });

        return { message: 'Issue re-resolved' };
    }

    static async contestIssue(db, user, id, reason) {
        const { data: issue } = await db.from('issues').select('status, contest_window_end, contest_count').eq('id', id).single();
        if (!issue || !['RESOLVED', 'REJECTED'].includes(issue.status)) throw new Error('Not contestable');

        const { error } = await db.from('contests').insert({ issue_id: id, user_id: user.id, reason });
        if (error) throw error;

        const newCount = (issue.contest_count || 0) + 1;
        const update = { contest_count: newCount, contested_flag: true };
        if (newCount >= 3) update.status = 'PENDING_REVALIDATION';

        await db.from('issues').update(update).eq('id', id);
        return { status: update.status || issue.status };
    }

    static async revalidationVote(db, user, id, voteType) {
        const { data: issue } = await db.from('issues').select('status, creator_id').eq('id', id).single();
        if (!issue || issue.status !== 'RE_RESOLVED') throw new Error('Invalid state');

        await db.from('revalidation_votes').insert({ issue_id: id, user_id: user.id, vote_type: voteType });
        const { data: votes } = await db.from('revalidation_votes').select('vote_type').eq('issue_id', id);
        const confirms = votes.filter(v => v.vote_type === 'confirm').length;
        const rejects = votes.filter(v => v.vote_type === 'reject').length;

        if (confirms >= 3) await db.from('issues').update({ status: 'FINAL_CLOSED' }).eq('id', id);
        if (rejects >= 3) {
            await db.from('issues').update({ status: 'OPEN', contested_flag: false, contest_count: 0 }).eq('id', id);
            await db.from('revalidation_votes').delete().eq('issue_id', id);
        }
        return { creatorId: issue.creator_id };
    }

    // Helpers
    static _groupBy(array, key) {
        return array.reduce((res, cur) => { (res[cur[key]] = res[cur[key]] || []).push(cur); return res; }, {});
    }

    static _mapIssueFields(i) {
        return {
            id: i.id, title: i.title, description: i.description, category: i.category,
            creatorId: i.creator_id, departmentId: i.department_id, status: i.status,
            urgency: i.urgency, deadline: i.deadline, priorityScore: i.priority_score,
            evidenceUrl: i.evidence_url, resolutionEvidenceUrl: i.resolution_evidence_url,
            supportCount: i.support_count, contestCount: i.contest_count,
            contestedFlag: i.contested_flag, createdAt: i.created_at
        };
    }

    static _mapTimelineFields(t) { return { id: t.id, type: t.type, userId: t.user_id, description: t.description, timestamp: t.created_at }; }
    static _mapCommentFields(c) { return { id: c.id, userId: c.user_id, text: c.text, timestamp: c.created_at }; }
    static _mapProposalFields(p) { return { id: p.id, userId: p.user_id, text: p.text, votes: p.votes, timestamp: p.created_at }; }
}

module.exports = IssueService;
