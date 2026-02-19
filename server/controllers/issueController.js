const IssueService = require('../services/issueService');
const { discoverTopics } = require('../utils/topicDiscovery');

class IssueController {
    static async getTopics(req, res) {
        try {
            const { data: issues, error } = await req.db
                .from('issues')
                .select('id, title, description, department_id')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;

            const topics = discoverTopics(issues);
            res.json(topics);
        } catch (error) {
            console.error('Get topics controller error:', error);
            res.status(500).json({ error: error.message });
        }
    }

    static async getAllIssues(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await IssueService.getAllIssues(req.db, { page, limit });
            res.json(result);
        } catch (error) {
            console.error('Get issues controller error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async createIssue(req, res) {
        try {
            const result = await IssueService.createIssue(req.db, req.user, req.body, req.file);
            res.status(201).json({
                ...result,
                message: 'Complaint submitted. Awaiting admin approval.'
            });
        } catch (error) {
            console.error('Create issue controller error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    static async updateIssue(req, res) {
        try {
            const { id } = req.params;
            const result = await IssueService.updateIssue(req.db, id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async supportIssue(req, res) {
        try {
            const { id } = req.params;
            const result = await IssueService.supportIssue(req.db, req.user, id);
            res.json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    static async addComment(req, res) {
        try {
            const { id } = req.params;
            const result = await IssueService.addComment(req.db, req.user, id, req.body.text);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async addProposal(req, res) {
        try {
            const { id } = req.params;
            const result = await IssueService.addProposal(req.db, req.user, id, req.body.text);
            res.status(201).json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async approveIssue(req, res) {
        try {
            const { id } = req.params;
            const result = await IssueService.approveIssue(req.db, req.user, id);
            res.json({ message: 'Approved' });
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    static async resolveIssue(req, res) {
        try {
            const { id } = req.params;
            // Map frontend resolutionSummary to backend summary
            const { resolutionSummary, summary, evidenceUrl } = req.body;
            await IssueService.resolveIssue(req.db, req.user, id, resolutionSummary || summary, evidenceUrl);
            res.json({ message: 'Resolved' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async contestIssue(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const result = await IssueService.contestIssue(req.db, req.user, id, reason);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async contestDecision(req, res) {
        try {
            const { id } = req.params;
            const { decision, explanation } = req.body;
            const result = await IssueService.contestDecision(req.db, req.user, id, decision, explanation);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async reResolve(req, res) {
        try {
            const { id } = req.params;
            const { resolutionSummary, summary, evidenceUrl } = req.body;
            const result = await IssueService.reResolve(req.db, req.user, id, resolutionSummary || summary, evidenceUrl);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    static async revalidationVote(req, res) {
        try {
            const { id } = req.params;
            const { voteType } = req.body;
            const result = await IssueService.revalidationVote(req.db, req.user, id, voteType);
            res.json(result);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = IssueController;
