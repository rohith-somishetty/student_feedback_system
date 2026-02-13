import React, { useMemo } from 'react';
import { Issue, Department, IssueCategory, IssueStatus } from '../types';
import { calculateSystemMetrics, calculateDepartmentMetrics } from '../utils/metrics';

interface GovernanceDashboardProps {
    issues: Issue[];
    departments: Department[];
}

const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({ issues, departments }) => {
    const systemMetrics = useMemo(() => calculateSystemMetrics(issues), [issues]);

    const departmentMetrics = useMemo(() =>
        departments.map(dept => ({
            department: dept,
            metrics: calculateDepartmentMetrics(dept, issues)
        })).sort((a, b) => b.metrics.performanceScore - a.metrics.performanceScore),
        [departments, issues]
    );

    // Category trend analysis
    const categoryStats = useMemo(() => {
        const stats = Object.values(IssueCategory).map(category => {
            const categoryIssues = issues.filter(i => i.category === category);
            return {
                category,
                total: categoryIssues.length,
                resolved: categoryIssues.filter(i => i.status === IssueStatus.RESOLVED).length,
                contested: categoryIssues.filter(i => i.status === IssueStatus.CONTESTED).length,
                avgPriority: categoryIssues.length > 0
                    ? categoryIssues.reduce((acc, i) => acc + i.priorityScore, 0) / categoryIssues.length
                    : 0
            };
        }).sort((a, b) => b.total - a.total);
        return stats;
    }, [issues]);

    // Recurring systemic issues (issues with same title prefix or high contest rate)
    const recurringIssues = useMemo(() => {
        const issuesByPattern: Record<string, Issue[]> = {};

        issues.forEach(issue => {
            // Simple pattern matching: first 3 words
            const pattern = issue.title.split(' ').slice(0, 3).join(' ').toLowerCase();
            if (!issuesByPattern[pattern]) issuesByPattern[pattern] = [];
            issuesByPattern[pattern].push(issue);
        });

        return Object.entries(issuesByPattern)
            .filter(([_, issueList]) => issueList.length >= 2)
            .map(([pattern, issueList]) => ({
                pattern,
                count: issueList.length,
                category: issueList[0].category,
                avgPriority: issueList.reduce((acc, i) => acc + i.priorityScore, 0) / issueList.length
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [issues]);

    return (
        <div className="space-y-8 animate-fadeIn">
            <header>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Governance Dashboard</h1>
                <p className="text-slate-500 font-medium">Leadership Analytics & Institutional Performance Overview</p>
            </header>

            {/* System-Wide Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: 'Avg Resolution Time', value: `${systemMetrics.avgResolutionTime} days`, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Backlog Age', value: `${systemMetrics.avgBacklogAge} days`, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Overdue Rate', value: `${systemMetrics.overduePercentage}%`, color: 'text-red-600', bg: 'bg-red-50' },
                    { label: 'Resolution Rate', value: `${systemMetrics.resolutionRate}%`, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map(stat => (
                    <div key={stat.label} className={`p-6 rounded-2xl ${stat.bg} border border-white shadow-sm`}>
                        <div className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-tight">{stat.label}</div>
                        <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Department Performance Leaderboard */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Department Performance</h2>
                <div className="space-y-4">
                    {departmentMetrics.map(({ department, metrics }) => (
                        <div key={department.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="text-lg font-black text-slate-900">{department.name}</h3>
                                    <div className="flex space-x-4 text-xs font-bold text-slate-500 mt-1">
                                        <span>Total: {metrics.totalIssues}</span>
                                        <span>Resolved: {metrics.resolvedIssues}</span>
                                        <span className="text-red-600">Overdue: {metrics.overdueIssues}</span>
                                        <span className="text-amber-600">Contested: {metrics.contestedIssues}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-3xl font-black ${metrics.performanceScore >= 85 ? 'text-green-600' :
                                            metrics.performanceScore >= 70 ? 'text-amber-600' : 'text-red-600'
                                        }`}>
                                        {metrics.performanceScore}
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-xs">
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <div className="font-black text-slate-900">{metrics.deadlineAdherence}%</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">SLA Adherence</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <div className="font-black text-slate-900">{metrics.avgResolutionTime}d</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Resolution</div>
                                </div>
                                <div className="text-center p-2 bg-white rounded-lg">
                                    <div className="font-black text-slate-900">{metrics.contestReopenRate}%</div>
                                    <div className="text-[10px] text-slate-500 font-bold uppercase">Contest Rate</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Trend Analysis */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Category Distribution</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryStats.map(stat => (
                        <div key={stat.category} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-sm font-black text-indigo-600 uppercase">{stat.category}</h3>
                                <span className="text-lg font-black text-slate-900">{stat.total}</span>
                            </div>
                            <div className="space-y-1 text-xs font-bold text-slate-500">
                                <div className="flex justify-between">
                                    <span>Resolved:</span>
                                    <span className="text-green-600">{stat.resolved}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Contested:</span>
                                    <span className="text-red-600">{stat.contested}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Priority:</span>
                                    <span className="text-slate-900">{Math.round(stat.avgPriority)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recurring Systemic Issues */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <h2 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tight">Recurring Systemic Issues</h2>
                {recurringIssues.length > 0 ? (
                    <div className="space-y-3">
                        {recurringIssues.map((issue, idx) => (
                            <div key={idx} className="p-4 bg-red-50 rounded-xl border border-red-100">
                                <div className="flex justify-between items-center">
                                    <div className="flex-grow">
                                        <h3 className="text-sm font-black text-slate-900">"{issue.pattern}..."</h3>
                                        <div className="text-xs font-bold text-slate-500 mt-1">
                                            Category: <span className="text-indigo-600">{issue.category}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-black text-red-600">{issue.count}x</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Occurrences</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-400">
                        <p className="font-bold">No Recurring Patterns Detected</p>
                        <p className="text-xs">System showing healthy issue diversity</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovernanceDashboard;
