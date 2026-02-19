
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Issue, IssueStatus, Department } from '../types';
import { SkeletonIssueCard } from './Skeleton';

interface MyIssuesProps {
    issues: Issue[];
    departments: Department[];
    user: any; // Type User
}

const statusBadge = (status: string) => {
    switch (status) {
        case IssueStatus.PENDING_APPROVAL: return 'bg-orange-100 text-orange-700';
        case IssueStatus.OPEN: return 'bg-amber-100 text-amber-700';
        case IssueStatus.IN_REVIEW: return 'bg-blue-100 text-blue-700';
        case IssueStatus.RESOLVED: return 'bg-emerald-100 text-emerald-700';
        case IssueStatus.CONTESTED: return 'bg-red-100 text-red-700';
        case IssueStatus.REOPENED: return 'bg-purple-100 text-purple-700';
        case IssueStatus.REJECTED: return 'bg-red-200 text-red-800';
        default: return 'bg-slate-100 text-slate-700';
    }
};

const statusLabel = (status: string) => {
    switch (status) {
        case IssueStatus.PENDING_APPROVAL: return '⏳ Pending';
        case IssueStatus.REJECTED: return '✗ Rejected';
        default: return status.replace('_', ' ');
    }
};

const MyIssues: React.FC<MyIssuesProps> = ({ issues, departments, user }) => {
    const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'RESOLVED'>('PENDING');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 900);
        return () => clearTimeout(timer);
    }, []);

    // Filter issues for the current user
    const myIssues = issues.filter(i => i.creatorId === user.id);

    // Categorize issues
    const pendingIssues = myIssues.filter(i => i.status === IssueStatus.PENDING_APPROVAL);
    const activeIssues = myIssues.filter(i =>
        [IssueStatus.OPEN, IssueStatus.IN_REVIEW, IssueStatus.CONTESTED, IssueStatus.PENDING_REVALIDATION, IssueStatus.REOPENED].includes(i.status)
    );
    const resolvedIssues = myIssues.filter(i =>
        [IssueStatus.RESOLVED, IssueStatus.RESOLVED_PENDING_REVIEW, IssueStatus.RE_RESOLVED, IssueStatus.FINAL_CLOSED, IssueStatus.REJECTED].includes(i.status)
    );

    const currentList = activeTab === 'PENDING' ? pendingIssues : activeTab === 'ACTIVE' ? activeIssues : resolvedIssues;

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-5xl mx-auto font-outfit page-enter">
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-3">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-500">History</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Track the status of your reported issues and resolutions.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-6 bg-slate-100/50 p-1.5 rounded-xl w-fit">
                {[
                    { id: 'PENDING', label: 'Pending Approval', count: pendingIssues.length },
                    { id: 'ACTIVE', label: 'In Progress', count: activeIssues.length },
                    { id: 'RESOLVED', label: 'Resolved / Closed', count: resolvedIssues.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
              px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all
              ${activeTab === tab.id
                                ? 'bg-white text-brand-primary shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'}
            `}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? 'bg-brand-primary/10 text-brand-primary' : 'bg-slate-200 text-slate-600'}`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-4">
                {isLoading ? (
                    [1, 2, 3].map(i => <SkeletonIssueCard key={i} />)
                ) : currentList.length === 0 ? (
                    <div className="py-20 text-center bg-white/50 backdrop-blur-sm border-2 border-dashed border-slate-200 rounded-2xl p-10 group transition-all duration-500 hover:border-brand-primary/30">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-300 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                            {activeTab === 'PENDING' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            ) : activeTab === 'ACTIVE' ? (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )}
                        </div>
                        <h3 className="text-xl font-display font-bold text-slate-800 mb-2">
                            {activeTab === 'PENDING' ? "No reports awaiting review" : activeTab === 'ACTIVE' ? "Your active list is empty" : "No resolved cases yet"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                            {activeTab === 'PENDING'
                                ? "When you submit a new report, it will appear here while our team verifies the details."
                                : activeTab === 'ACTIVE'
                                    ? "You're currently all caught up. If you spot something that needs attention, don't hesitate to speak up."
                                    : "Reports specifically created by you that have been fully resolved will be stored here for your reference."
                            }
                        </p>
                        <Link to="/report" className="inline-flex items-center px-8 py-3 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0B5F5A] transition-all hover:shadow-xl active:scale-95">
                            + File New Report
                        </Link>
                    </div>
                ) : (
                    currentList.map(issue => (
                        <Link
                            key={issue.id}
                            to={`/issues/${issue.id}`}
                            className="block group"
                        >
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 interaction-lift">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-3 mb-3">
                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${statusBadge(issue.status)}`}>
                                                {statusLabel(issue.status)}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400">
                                                {new Date(issue.createdAt).toLocaleDateString()}
                                            </span>
                                            {issue.contestedFlag && (
                                                <span className="px-2 py-0.5 bg-rose-100 text-rose-600 rounded text-[9px] font-black uppercase tracking-wider">
                                                    Contested
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-800 group-hover:text-brand-primary transition-colors mb-1">
                                            {issue.title}
                                        </h3>
                                        <p className="text-sm text-slate-500 line-clamp-1">
                                            {issue.description}
                                        </p>
                                    </div>

                                    <div className="hidden sm:block text-right">
                                        <span className="text-xs font-bold text-slate-500 flex items-center justify-end gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                            {departments.find(d => d.id === issue.departmentId)?.name}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyIssues;
