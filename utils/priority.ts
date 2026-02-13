import { Issue, IssueCategory, Urgency, User, Support } from '../types';
import { CATEGORY_CONFIG, CREDIBILITY_RULES } from '../constants';

export const calculatePriorityScore = (
    issue: Issue,
    supports: Support[],
    users: User[]
): number => {
    const now = Date.now();
    const created = new Date(issue.createdAt).getTime();
    const hoursSinceCreation = (now - created) / (1000 * 60 * 60);

    // 1. Sum of supporter credibility
    const supportScore = supports
        .filter(s => s.issueId === issue.id)
        .reduce((acc, support) => {
            const supporter = users.find(u => u.id === support.userId);
            return acc + (supporter ? supporter.credibility : 0);
        }, 0);

    // 2. Category Urgency Multiplier (Base urgency * Category factor could be added here, 
    // currently relying on Urgency enum value 1-5)
    const urgencyMultiplier = issue.urgency;

    // 3. Time-based factor (Decay or Boost?)
    // Requirement: "Time-based factor". 
    // Typically, older urgent issues might need MORE priority (starvation prevention) 
    // OR newer issues might need initial boost.
    // Let's implement a "Staleness Boost": Older unresolved issues slightly gain priority to prevent being ignored.
    // +1 point per day open
    const stalenessFactor = hoursSinceCreation / 24;

    const baseScore = (supportScore * urgencyMultiplier) + stalenessFactor;

    return Math.round(baseScore * 10) / 10;
};

export const calculateDeadline = (category: IssueCategory, urgency: Urgency): string => {
    const config = CATEGORY_CONFIG[category];
    let days = config.baseDeadlineDays;

    // Adjust based on urgency
    if (urgency === Urgency.CRITICAL) days = Math.max(1, days * 0.2); // 80% faster
    else if (urgency === Urgency.HIGH) days = Math.max(1, days * 0.5); // 50% faster
    else if (urgency === Urgency.LOW) days = days * 1.5; // 50% slower

    return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
};

export const updateCredibility = (user: User, action: keyof typeof CREDIBILITY_RULES): User => {
    const change = CREDIBILITY_RULES[action];
    let newScore = user.credibility + change;

    // Cap at 0 and 100
    newScore = Math.max(0, Math.min(100, newScore));

    return { ...user, credibility: newScore };
};
