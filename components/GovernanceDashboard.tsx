import React, { useMemo, useEffect, useState } from 'react';
import { Issue, Department, IssueCategory, IssueStatus } from '../types';
import { calculateSystemMetrics, calculateDepartmentMetrics } from '../utils/metrics';
import { issuesAPI } from '../services/api';

interface GovernanceDashboardProps {
    issues: Issue[];
    departments: Department[];
}

const GovernanceDashboard: React.FC<GovernanceDashboardProps> = ({ issues, departments }) => {
    const [topics, setTopics] = useState<any[]>([]);

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const data = await issuesAPI.getTopics();
                setTopics(data);
            } catch (err) {
                console.error('Failed to fetch topics:', err);
            }
        };
        fetchTopics();
    }, []);

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
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Leadership Hub</h1>
                <p className="text-slate-500 font-medium">Resolution Insights & Community Performance Overview</p>
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

            {/* Emerging Trends (Topic Discovery) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-widest border border-indigo-100">AI Enabled</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Emerging Needs</h2>
                <p className="text-xs text-slate-500 font-medium mb-6 uppercase tracking-widest">Discovered recurring patterns in student feedback texts</p>

                {topics.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {topics.map((topic, idx) => (
                            <div key={idx} className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 hover:border-indigo-300 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                                            <h3 className="text-sm font-black text-slate-900 capitalize group-hover:text-indigo-600 transition-colors">"{topic.phrase}"</h3>
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1.5">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
                                            Example: {topic.sampleIssue}
                                        </div>
                                    </div>
                                    <div className="text-right ml-4">
                                        <div className="text-2xl font-black text-indigo-600 leading-none">{topic.frequency}x</div>
                                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mt-1">Signals</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 text-slate-300 animate-pulse">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Observing campus signals...</p>
                        <p className="text-[10px] mt-2 font-medium">Trends and common themes emerge automatically as more reports are shared.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GovernanceDashboard;
