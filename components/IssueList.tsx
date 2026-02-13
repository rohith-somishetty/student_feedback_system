
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Issue, IssueStatus, Department } from '../types';

interface IssueListProps {
  issues: Issue[];
  departments: Department[];
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

const IssueList: React.FC<IssueListProps> = ({ issues, departments }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const filteredIssues = issues.filter(issue => {
    // Only show active issues in this list
    if (issue.status === IssueStatus.RESOLVED || issue.status === IssueStatus.REJECTED) return false;

    const statusMatch = filter === 'ALL' || issue.status === filter;
    const deptMatch = deptFilter === 'ALL' || issue.departmentId === deptFilter;
    return statusMatch && deptMatch;
  });

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-8 max-w-7xl mx-auto font-outfit animate-fadeIn">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div className="space-y-4">
          <div className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-600 text-xs font-bold uppercase tracking-widest animate-in">
            Intelligence Feed
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 tracking-tight leading-none">
            Live <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-500">Reports</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-wide max-w-xl text-lg">
            Real-time student feedback protocols and campus infrastructure alerts.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 p-2 bg-white/40 backdrop-blur-md rounded-2xl border border-white/50 shadow-sm">
          <div className="relative group">
            <select
              className="text-xs font-bold uppercase tracking-wider pl-4 pr-10 py-3 rounded-xl bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 transition-all cursor-pointer focus:outline-none appearance-none text-slate-600"
              value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}
            >
              <option value="ALL">All Sectors</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>

          <div className="relative group">
            <select
              className="text-xs font-bold uppercase tracking-wider pl-4 pr-10 py-3 rounded-xl bg-white/50 hover:bg-white border border-transparent hover:border-indigo-100 transition-all cursor-pointer focus:outline-none appearance-none text-slate-600"
              value={filter}
              onChange={e => setFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value={IssueStatus.PENDING_APPROVAL}>Pending</option>
              <option value={IssueStatus.OPEN}>Active</option>
              <option value={IssueStatus.IN_REVIEW}>Reviewing</option>
              <option value={IssueStatus.CONTESTED}>Contested</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {filteredIssues.map((issue, i) => (
          <Link
            key={issue.id}
            to={`/issues/${issue.id}`}
            className="group block"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="h-full glass-card p-8 rounded-3xl relative overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1 group-hover:border-indigo-500/30">
              {/* Decorative Gradient Blob */}
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-full blur-3xl group-hover:from-indigo-500/10 group-hover:to-purple-500/10 transition-colors"></div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.15em] border backdrop-blur-md ${issue.status === IssueStatus.PENDING_APPROVAL ? 'bg-amber-50/80 text-amber-600 border-amber-100' :
                      issue.status === IssueStatus.OPEN ? 'bg-indigo-50/80 text-brand-primary border-indigo-100' :
                        issue.status === IssueStatus.IN_REVIEW ? 'bg-violet-50/80 text-violet-600 border-violet-100' :
                          issue.status === IssueStatus.CONTESTED ? 'bg-rose-50/80 text-rose-600 border-rose-100' :
                            'bg-slate-50/80 text-slate-500 border-slate-100'
                    }`}>
                    {statusLabel(issue.status)}
                  </span>

                  <div className="text-right">
                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Priority</span>
                    <span className="text-2xl font-display font-bold text-slate-900 leading-none">{Math.round(issue.priorityScore)}</span>
                  </div>
                </div>

                <h3 className="text-xl font-display font-bold text-slate-900 mb-3 leading-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                  {issue.title}
                </h3>

                <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-8 flex-grow">
                  {issue.description}
                </p>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100/50">
                  <div className="flex items-center space-x-4">
                    <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      {departments.find(d => d.id === issue.departmentId)?.name}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs font-bold text-slate-400">
                    <span className="flex items-center gap-1 group-hover:text-brand-primary transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      {issue.supportCount}
                    </span>
                    <span className="flex items-center gap-1 group-hover:text-rose-500 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      {issue.contestCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filteredIssues.length === 0 && (
          <div className="col-span-full py-32 text-center text-slate-300 border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-white/30 backdrop-blur-sm">
            <div className="text-6xl mb-6 opacity-20 filter grayscale">🛸</div>
            <p className="font-bold uppercase tracking-widest text-sm mb-2 text-slate-400">No signals detected</p>
            <button onClick={() => { setFilter('ALL'); setDeptFilter('ALL'); }} className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-primary hover:text-white bg-indigo-50 hover:bg-brand-primary px-8 py-3 rounded-xl transition-all">Clear Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueList;
