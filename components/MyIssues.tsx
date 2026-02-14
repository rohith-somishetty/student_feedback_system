
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Issue, IssueStatus, Department } from '../types';

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
        <div className="min-h-screen pt-32 pb-12 px-4 sm:px-8 max-w-5xl mx-auto font-outfit animate-fadeIn">
            <div className="mb-12">
                <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight mb-4">
                    My <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-500">History</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg">
                    Track the status of your reported issues and resolutions.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-2 mb-8 bg-slate-100/50 p-1.5 rounded-xl w-fit">
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
                {currentList.length === 0 ? (
                    <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">
                        <p className="text-slate-400 font-medium">No issues found in this category.</p>
                    </div>
                ) : (
                    currentList.map(issue => (
                        <Link
                            key={issue.id}
                            to={`/issues/${issue.id}`}
                            className="block group"
                        >
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group-hover:border-indigo-100">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 pr-8">
                                        <div className="flex items-center gap-3 mb-2">
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
