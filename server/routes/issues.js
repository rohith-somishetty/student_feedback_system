const express = require('express');
const { authenticateToken } = require('../middleware/auth.js');
const { upload } = require('../middleware/upload.js');
const IssueController = require('../controllers/issueController');

const router = express.Router();

router.get('/', authenticateToken, IssueController.getAllIssues);
router.get('/topics', authenticateToken, IssueController.getTopics);
router.post('/', authenticateToken, upload.single('evidence'), IssueController.createIssue);
router.put('/:id', authenticateToken, IssueController.updateIssue);
router.post('/:id/support', authenticateToken, IssueController.supportIssue);
router.post('/:id/comments', authenticateToken, IssueController.addComment);
router.post('/:id/proposals', authenticateToken, IssueController.addProposal);
router.post('/:id/approve', authenticateToken, IssueController.approveIssue);
router.post('/:id/resolve', authenticateToken, IssueController.resolveIssue);
router.post('/:id/re-resolve', authenticateToken, IssueController.reResolve);
router.post('/:id/contest', authenticateToken, IssueController.contestIssue);
router.post('/:id/contest-decision', authenticateToken, IssueController.contestDecision);
router.post('/:id/revalidation-vote', authenticateToken, IssueController.revalidationVote);

module.exports = router;
