
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
        case IssueStatus.PENDING_APPROVAL: return 'bg-amber-50/80 text-amber-600 border-amber-100';
        case IssueStatus.OPEN: return 'bg-brand-accent-light text-brand-primary border-brand-primary/20';
        case IssueStatus.IN_REVIEW: return 'bg-blue-50/80 text-blue-600 border-blue-100';
        case IssueStatus.RESOLVED: return 'bg-emerald-50/80 text-emerald-700 border-emerald-100';
        case IssueStatus.CONTESTED: return 'bg-rose-50/80 text-rose-600 border-rose-100';
        case IssueStatus.REOPENED: return 'bg-purple-50/80 text-purple-700 border-purple-100';
        case IssueStatus.REJECTED: return 'bg-slate-100/80 text-slate-500 border-slate-200';
        default: return 'bg-slate-50/80 text-slate-500 border-slate-100';
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
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    const myIssues = issues.filter(i => i.creatorId === user.id);

    const pendingIssues = myIssues.filter(i => i.status === IssueStatus.PENDING_APPROVAL);
    const activeIssues = myIssues.filter(i =>
        [IssueStatus.OPEN, IssueStatus.IN_REVIEW, IssueStatus.CONTESTED, IssueStatus.PENDING_REVALIDATION, IssueStatus.REOPENED].includes(i.status)
    );
    const resolvedIssues = myIssues.filter(i =>
        [IssueStatus.RESOLVED, IssueStatus.RESOLVED_PENDING_REVIEW, IssueStatus.RE_RESOLVED, IssueStatus.FINAL_CLOSED, IssueStatus.REJECTED].includes(i.status)
    );

    const currentList = activeTab === 'PENDING' ? pendingIssues : activeTab === 'ACTIVE' ? activeIssues : resolvedIssues;

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto font-outfit page-enter">
            {/* Header Section - Matched to Feed */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div className="space-y-3">
                    <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#E5E7EB] text-[10px] font-bold uppercase tracking-[0.2em]">
                        <span className="w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.4)]"></span>
                        <span>Personal Activity Log</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-display font-bold text-[#E5E7EB] tracking-tight leading-none">
                        Your <span className="text-[#0B5F5A]">Activity</span>
                    </h1>
                    <p className="text-[#9CA3AF] font-medium tracking-wide max-w-xl text-lg">
                        Real-time tracking of your reports, contributions, and community impact milestones.
                    </p>
                </div>

                <Link
                    to="/report"
                    className="flex btn-elevate bg-gradient-to-r from-[#0B5F5A] to-[#14B8A6] hover:from-[#0D9488] hover:to-[#0B5F5A] text-white px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_-5px_rgba(11,95,90,0.5)] active:scale-95 items-center space-x-2 border border-white/10"
                >
                    <span>+ New Report</span>
                </Link>
            </div>

            {/* Navigation Tabs - Matched to Feed */}
            <div className="flex items-center space-x-2 mb-8 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-sm self-start w-fit">
                {[
                    { id: 'PENDING', label: 'Triage Queue', count: pendingIssues.length },
                    { id: 'ACTIVE', label: 'In Progress', count: activeIssues.length },
                    { id: 'RESOLVED', label: 'Archived', count: resolvedIssues.length }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`
                            px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2
                            ${activeTab === tab.id
                                ? 'bg-[#14B8A6] text-white shadow-lg'
                                : 'text-slate-400 hover:text-white'}
                        `}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-400'
                                }`}>
                                {tab.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content List - Matched to Feed Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                {isLoading ? (
                    [1, 2, 3, 4].map(i => <SkeletonIssueCard key={i} />)
                ) : currentList.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-2xl p-10 group hover:border-[#0B5F5A]/30 transition-colors">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-xl font-display font-bold text-slate-800 mb-2 tracking-tight">
                            {activeTab === 'PENDING' ? "Triage Queue is Clear" : activeTab === 'ACTIVE' ? "Ready for Action?" : "Archive is Current"}
                        </h3>
                        <p className="text-sm text-slate-500 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                            {activeTab === 'PENDING'
                                ? "No reports are currently awaiting administrative review. Your next submission will appear here for tracking."
                                : activeTab === 'ACTIVE'
                                    ? "Your active pipeline is empty. Is there something on campus that needs attention? Your reports drive change."
                                    : "You have no archived resolutions. As your reports reach completion, they will be safely stored here."
                            }
                        </p>
                        <Link to="/report" className="inline-flex items-center px-8 py-3 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0B5F5A] transition-all hover:shadow-xl active:scale-95">
                            Submit a Report
                        </Link>
                    </div>
                ) : (
                    currentList.map((issue) => (
                        <Link
                            key={issue.id}
                            to={`/issues/${issue.id}`}
                            className="group block"
                        >
                            <div className="h-full bg-white border border-slate-100 p-6 rounded-2xl relative overflow-hidden interaction-lift">
                                {/* Decorative Gradient Blob - From Feed */}
                                <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-brand-primary/5 to-teal-500/5 rounded-full blur-3xl group-hover:from-brand-primary/10 group-hover:to-teal-500/10 transition-colors"></div>

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border backdrop-blur-md ${statusBadge(issue.status)}`}>
                                            {statusLabel(issue.status)}
                                        </span>
                                        {issue.contestedFlag && (
                                            <span className="px-2 py-0.5 bg-rose-100 text-rose-600 border border-rose-200 rounded text-[9px] font-black uppercase tracking-wider">
                                                Contested
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-xl font-display font-bold text-[#0F172A] mb-3 leading-tight group-hover:text-[#0B5F5A] transition-colors line-clamp-2">
                                        {issue.title}
                                    </h3>

                                    <p className="text-sm text-[#64748B] font-medium line-clamp-2 mb-6 flex-grow leading-relaxed">
                                        {issue.description}
                                    </p>

                                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#0B5F5A] shadow-[0_0_8px_rgba(11,95,90,0.5)]"></span>
                                            {departments.find(d => d.id === issue.departmentId)?.name}
                                        </span>
                                        <span className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest opacity-60">
                                            {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
