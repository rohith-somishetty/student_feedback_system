import { Issue, Department, IssueStatus } from '../types';
import { isIssueOverdue } from './timeline';

export interface DepartmentMetrics {
    totalIssues: number;
    resolvedIssues: number;
    overdueIssues: number;
    contestedIssues: number;
    avgResolutionTime: number;
    deadlineAdherence: number; // percentage
    contestReopenRate: number; // percentage
    performanceScore: number;
}

export const calculateDepartmentMetrics = (
    department: Department,
    issues: Issue[]
): DepartmentMetrics => {
    const deptIssues = issues.filter(issue => issue.departmentId === department.id);

    const totalIssues = deptIssues.length;
    const resolvedIssues = deptIssues.filter(i => i.status === IssueStatus.RESOLVED).length;
    const overdueIssues = deptIssues.filter(i => isIssueOverdue(i.deadline, i.status)).length;
    const contestedIssues = deptIssues.filter(i => i.status === IssueStatus.CONTESTED).length;

    // Calculate average resolution time
    const resolvedWithTime = deptIssues.filter(i => i.status === IssueStatus.RESOLVED);
    const avgResolutionTime = resolvedWithTime.length > 0
        ? resolvedWithTime.reduce((acc, issue) => {
            const created = new Date(issue.createdAt).getTime();
            const deadline = new Date(issue.deadline).getTime();
            const timeTaken = (deadline - created) / (1000 * 60 * 60 * 24); // days
            return acc + timeTaken;
        }, 0) / resolvedWithTime.length
        : 0;

    // Deadline adherence (percentage of issues resolved before deadline)
    const resolvedOnTime = resolvedWithTime.filter(i =>
        new Date(i.createdAt).getTime() <= new Date(i.deadline).getTime()
    ).length;
    const deadlineAdherence = resolvedWithTime.length > 0
        ? (resolvedOnTime / resolvedWithTime.length) * 100
        : 100;

    // Contest reopen rate
    const contestReopenRate = totalIssues > 0
        ? (contestedIssues / totalIssues) * 100
        : 0;

    // Performance Score Calculation
    // Base: 100
    // -10 for each 10% overdue rate
    // -5 for each 10% contest rate
    // +10 for >90% deadline adherence
    let performanceScore = department.performanceScore || 85;

    if (totalIssues > 0) {
        const overdueRate = (overdueIssues / totalIssues) * 100;
        performanceScore -= Math.floor(overdueRate / 10) * 10;
        performanceScore -= Math.floor(contestReopenRate / 10) * 5;

        if (deadlineAdherence > 90) performanceScore += 10;
        if (deadlineAdherence < 70) performanceScore -= 15;

        performanceScore = Math.max(0, Math.min(100, performanceScore));
    }

    return {
        totalIssues,
        resolvedIssues,
        overdueIssues,
        contestedIssues,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        deadlineAdherence: Math.round(deadlineAdherence),
        contestReopenRate: Math.round(contestReopenRate),
        performanceScore: Math.round(performanceScore)
    };
};

export const calculateSystemMetrics = (issues: Issue[]) => {
    const now = Date.now();

    const totalIssues = issues.length;
    const openIssues = issues.filter(i => i.status === IssueStatus.OPEN).length;
    const resolvedIssues = issues.filter(i => i.status === IssueStatus.RESOLVED).length;
    const overdueIssues = issues.filter(i => isIssueOverdue(i.deadline, i.status)).length;
    const contestedIssues = issues.filter(i => i.status === IssueStatus.CONTESTED).length;

    // Average resolution time
    const resolved = issues.filter(i => i.status === IssueStatus.RESOLVED);
    const avgResolutionTime = resolved.length > 0
        ? resolved.reduce((acc, issue) => {
            const created = new Date(issue.createdAt).getTime();
            return acc + ((now - created) / (1000 * 60 * 60 * 24));
        }, 0) / resolved.length
        : 0;

    // Backlog aging (average age of open issues)
    const openBacklog = issues.filter(i =>
        i.status === IssueStatus.OPEN || i.status === IssueStatus.IN_REVIEW
    );
    const avgBacklogAge = openBacklog.length > 0
        ? openBacklog.reduce((acc, issue) => {
            const created = new Date(issue.createdAt).getTime();
            return acc + ((now - created) / (1000 * 60 * 60 * 24));
        }, 0) / openBacklog.length
        : 0;

    // Overdue percentage
    const overduePercentage = totalIssues > 0 ? (overdueIssues / totalIssues) * 100 : 0;

    // Resolution rate
    const resolutionRate = totalIssues > 0 ? (resolvedIssues / totalIssues) * 100 : 0;

    return {
        totalIssues,
        openIssues,
        resolvedIssues,
        overdueIssues,
        contestedIssues,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        avgBacklogAge: Math.round(avgBacklogAge * 10) / 10,
        overduePercentage: Math.round(overduePercentage),
        resolutionRate: Math.round(resolutionRate)
    };
};
