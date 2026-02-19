import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Issue, IssueStatus, Department } from '../types';
import ThemedDropdown from './ThemedDropdown';
import { SkeletonIssueCard } from './Skeleton';

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
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'ARCHIVE'>('ACTIVE');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredIssues = issues.filter(issue => {
    // Determine if issue belongs in current view mode
    const isArchived = [IssueStatus.RESOLVED, IssueStatus.REJECTED, IssueStatus.FINAL_CLOSED].includes(issue.status);

    if (viewMode === 'ACTIVE' && isArchived) return false;
    if (viewMode === 'ARCHIVE' && !isArchived) return false;

    const statusMatch = filter === 'ALL' || issue.status === filter;
    const deptMatch = deptFilter === 'ALL' || issue.departmentId === deptFilter;
    const searchMatch = !searchTerm ||
      issue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.description.toLowerCase().includes(searchTerm.toLowerCase());

    return statusMatch && deptMatch && searchMatch;
  });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto font-outfit page-enter">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#E5E7EB] text-[10px] font-bold uppercase tracking-[0.2em] animate-in">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.4)]"></span>
            <span>Intelligence Feed</span>
          </div>
          <div className="flex items-center space-x-2 bg-white/5 p-1 rounded-xl border border-white/5 backdrop-blur-sm self-start">
            <button
              onClick={() => setViewMode('ACTIVE')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ACTIVE' ? 'bg-[#14B8A6] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Active Feed
            </button>
            <button
              onClick={() => setViewMode('ARCHIVE')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'ARCHIVE' ? 'bg-[#0B5F5A] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
            >
              Archive
            </button>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-[#E5E7EB] tracking-tight leading-none">
            {viewMode === 'ACTIVE' ? 'Live ' : 'Past '}<span className="text-[#0B5F5A]">{viewMode === 'ACTIVE' ? 'Reports' : 'Resolutions'}</span>
          </h1>
          <p className="text-[#9CA3AF] font-medium tracking-wide max-w-xl text-lg">
            {viewMode === 'ACTIVE'
              ? 'Real-time student feedback protocols and campus infrastructure alerts.'
              : 'Historical record of resolved campus issues and implemented solutions.'}
          </p>
        </div>

        <div className="flex flex-wrap lg:flex-nowrap items-center gap-4 p-3 bg-white/5 backdrop-blur-[12px] rounded-2xl border border-white/10 shadow-dropdown grow lg:justify-end">
          {/* Search Bar */}
          <div className="relative group items-center flex grow lg:max-w-xs transition-all duration-150 ease-out">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B] group-focus-within:text-[#0B5F5A] transition-colors duration-150">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm font-semibold pl-11 pr-4 py-3 rounded-xl bg-white/10 border border-transparent focus:bg-white focus:border-[#0B5F5A] focus:ring-[3px] focus:ring-[#0B5F5A]/25 transition-all text-[#E5E7EB] focus:text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none"
            />
          </div>

          <ThemedDropdown
            value={deptFilter}
            onChange={setDeptFilter}
            placeholder="All Sectors"
            options={[
              { value: 'ALL', label: 'All Sectors' },
              ...departments.map(d => ({ value: d.id, label: d.name }))
            ]}
          />

          <ThemedDropdown
            value={filter}
            onChange={setFilter}
            placeholder="All Status"
            options={[
              { value: 'ALL', label: 'All Status' },
              { value: IssueStatus.PENDING_APPROVAL, label: 'Pending' },
              { value: IssueStatus.OPEN, label: 'Active' },
              { value: IssueStatus.IN_REVIEW, label: 'Reviewing' },
              { value: IssueStatus.CONTESTED, label: 'Contested' },
              { value: IssueStatus.PENDING_REVALIDATION, label: 'Pending Revalidation' },
              { value: IssueStatus.RE_RESOLVED, label: 'Re-Resolved' },
            ]}
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {isLoading ? (
          [1, 2, 3, 4, 5, 6].map(i => <SkeletonIssueCard key={i} />)
        ) : (
          <>
            {filteredIssues.map((issue, i) => (
              <Link
                key={issue.id}
                to={`/issues/${issue.id}`}
                className="group block"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="h-full bg-white border border-slate-100 p-6 rounded-2xl relative overflow-hidden interaction-lift">
                  {/* Decorative Gradient Blob */}
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-gradient-to-br from-brand-primary/5 to-teal-500/5 rounded-full blur-3xl group-hover:from-brand-primary/10 group-hover:to-teal-500/10 transition-colors"></div>

                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border backdrop-blur-md ${issue.status === IssueStatus.PENDING_APPROVAL ? 'bg-amber-50/80 text-amber-600 border-amber-100' :
                        issue.status === IssueStatus.OPEN ? 'bg-brand-accent-light text-brand-primary border-brand-primary/20' :
                          issue.status === IssueStatus.IN_REVIEW ? 'bg-blue-50/80 text-blue-600 border-blue-100' :
                            issue.status === IssueStatus.CONTESTED ? 'bg-rose-50/80 text-rose-600 border-rose-100' :
                              issue.status === IssueStatus.PENDING_REVALIDATION ? 'bg-amber-50/80 text-amber-700 border-amber-200' :
                                issue.status === IssueStatus.RE_RESOLVED ? 'bg-teal-50/80 text-brand-primary border-brand-primary/20' :
                                  issue.status === IssueStatus.FINAL_CLOSED ? 'bg-slate-100/80 text-slate-500 border-slate-200' :
                                    'bg-slate-50/80 text-slate-500 border-slate-100'
                        }`}>
                        {statusLabel(issue.status)}
                      </span>

                      <div className="text-right">
                        <span className="block text-[9px] font-black text-[#64748B] uppercase tracking-widest mb-0.5">Priority</span>
                        <span className="text-2xl font-display font-bold text-[#0F172A] leading-none">{Math.round(issue.priorityScore)}</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-display font-bold text-[#0F172A] mb-3 leading-tight group-hover:text-[#0B5F5A] transition-colors line-clamp-2">
                      {issue.title}
                      {issue.contestedFlag && (
                        <span className="ml-2 inline-block align-middle px-2 py-0.5 bg-rose-100 text-rose-600 border border-rose-200 rounded text-[9px] font-black uppercase tracking-wider">Contested</span>
                      )}
                    </h3>

                    <p className="text-sm text-[#64748B] font-medium line-clamp-2 mb-6 flex-grow leading-relaxed">
                      {issue.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center space-x-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0B5F5A] shadow-[0_0_8px_rgba(11,95,90,0.5)]"></span>
                          {departments.find(d => d.id === issue.departmentId)?.name}
                        </span>
                      </div>

                      <div className="flex items-center space-x-4 text-xs font-bold text-[#94A3B8]">
                        <span className="flex items-center gap-1 group-hover:text-[#0B5F5A] transition-colors">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                          {issue.supportCount}
                        </span>
                        {issue.contestedFlag && (
                          <span className="flex items-center gap-1 group-hover:text-rose-500 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            {issue.contestCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {filteredIssues.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white/40 backdrop-blur-md border-2 border-dashed border-slate-200 rounded-2xl p-10 group hover:border-[#0B5F5A]/30 transition-colors">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-display font-bold text-slate-800 mb-2">No matching reports found</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8 font-medium leading-relaxed">We couldn't find any reports matching your current filters. Try adjusting your search or sector selection.</p>
                <button
                  onClick={() => { setFilter('ALL'); setDeptFilter('ALL'); setSearchTerm(''); }}
                  className="inline-flex items-center px-8 py-3 bg-[#0F172A] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#0B5F5A] transition-all hover:shadow-xl active:scale-95"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div >
  );
};

export default IssueList;
