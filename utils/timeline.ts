import { TimelineEvent, IssueStatus } from '../types';

export const createTimelineEvent = (
    type: TimelineEvent['type'],
    userId: string,
    userName: string,
    description: string,
    metadata?: TimelineEvent['metadata']
): TimelineEvent => {
    return {
        id: `timeline-${Math.random().toString(36).substr(2, 9)}`,
        type,
        userId,
        userName,
        timestamp: new Date().toISOString(),
        description,
        metadata
    };
};

export const isIssueOverdue = (deadline: string, status: IssueStatus): boolean => {
    if (status === 'RESOLVED') return false;
    return Date.now() > new Date(deadline).getTime();
};
