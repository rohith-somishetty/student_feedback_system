
import React from 'react';
import { Link } from 'react-router-dom';
import { Issue, User, UserRole, Department, IssueStatus } from '../types';

interface DashboardProps {
  issues: Issue[];
  user: User;
  departments: Department[];
  onApproveIssue?: (id: string) => void;
  onRejectIssue?: (id: string, reason?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ issues, user, departments, onApproveIssue, onRejectIssue }) => {
  const pendingIssues = issues.filter(i => i.status === IssueStatus.PENDING_APPROVAL);
  const contestedIssues = issues.filter(i => i.contestedFlag && (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.REJECTED));
  const pendingRevalIssues = issues.filter(i => i.status === IssueStatus.PENDING_REVALIDATION || i.status === IssueStatus.RE_RESOLVED);
  const activeIssues = issues.filter(i =>
    i.status !== IssueStatus.PENDING_APPROVAL &&
    i.status !== IssueStatus.REJECTED &&
    i.status !== IssueStatus.RESOLVED &&
    i.status !== IssueStatus.FINAL_CLOSED
  );
  const approvedIssues = issues.filter(i => i.status !== IssueStatus.PENDING_APPROVAL && i.status !== IssueStatus.REJECTED);

  const stats = {
    total: approvedIssues.length,
    open: approvedIssues.filter(i => i.status === IssueStatus.OPEN).length,
    resolved: approvedIssues.filter(i => i.status === IssueStatus.RESOLVED).length,
    contested: contestedIssues.length,
    inReview: approvedIssues.filter(i => i.status === IssueStatus.IN_REVIEW).length,
    pending: pendingIssues.length,
    pendingReval: pendingRevalIssues.length,
  };

  const topPriority = activeIssues.slice(0, 3);

  // Simple Graph Data
  const statusDist = [
    { label: 'Open', count: stats.open, color: 'bg-amber-400' },
    { label: 'Review', count: stats.inReview, color: 'bg-blue-400' },
    { label: 'Resolved', count: stats.resolved, color: 'bg-emerald-400' },
    { label: 'Contested', count: stats.contested, color: 'bg-red-400' },
    ...(user.role === UserRole.ADMIN ? [{ label: 'Pending', count: stats.pending, color: 'bg-orange-400' }] : []),
  ];

  const statCards = [
    { label: 'Active Reports', value: activeIssues.length, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { label: 'Resolution Rate', value: `${Math.round((stats.resolved / (stats.total || 1)) * 100)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { label: 'Open Issues', value: stats.open, color: 'text-amber-600', bg: 'bg-amber-50/50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    ...(user.role === UserRole.ADMIN
      ? [{ label: 'Incoming', value: stats.pending, color: 'text-rose-600', bg: 'bg-rose-50/50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }]
      : [{ label: 'Trust Index', value: user.credibility, color: 'text-blue-600', bg: 'bg-blue-50/50', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806' }]
    ),
  ];

  return (
    <div className="min-h-screen pt-32 pb-12 px-4 sm:px-8 max-w-7xl mx-auto font-outfit animate-fadeIn">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-brand-primary/5 border border-brand-primary/10 text-brand-primary text-[10px] font-bold uppercase tracking-widest animate-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span>Live System Status</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 tracking-tight leading-tight">
            {user.role === UserRole.ADMIN ? (
              <>
                Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-500">Center</span>
              </>
            ) : (
              <>
                Student <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-violet-500">Hub</span>
              </>
            )}
          </h1>
          <p className="text-slate-500 font-medium tracking-wide">
            {user.role === UserRole.ADMIN
              ? `Monitoring ${departments.find(d => d.id === user.departmentId)?.name || 'All Sectors'}`
              : `Welcome back, ${user.name}`}
          </p>
        </div>

        {/* Action Button */}
        {user.role === UserRole.STUDENT && (
          <Link
            to="/report"
            className="group relative inline-flex items-center justify-center px-8 py-3 font-bold text-white transition-all duration-200 bg-brand-primary font-display rounded-xl hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary hover:shadow-lg hover:shadow-brand-primary/30 active:scale-95"
          >
            <span className="mr-2 text-lg">+</span> New Report
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/20"></div>
          </Link>
        )}
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {statCards.map((stat, i) => (
          <div
            key={stat.label}
            className="glass-card rounded-2xl p-6 relative overflow-hidden group"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 `}>
              <svg className={`w-24 h-24 ${stat.color}`} fill="currentColor" viewBox="0 0 24 24">
                <path d={stat.icon} />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-slate-50 group-hover:bg-white transition-colors shadow-sm`}>
                  <svg className={`w-6 h-6 ${stat.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                  </svg>
                </div>
                {i === 0 && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>}
              </div>

              <div className="space-y-1">
                <h3 className="text-3xl font-display font-bold text-slate-900">{stat.value}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Review Queue */}
      {user.role === UserRole.ADMIN && pendingIssues.length > 0 && (
        <section className="mb-12 animate-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-slate-800">Review Queue</h2>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-600 text-xs font-bold border border-rose-200">
              {pendingIssues.length} Pending
            </span>
          </div>

          <div className="grid gap-4">
            {pendingIssues.map(issue => (
              <div key={issue.id} className="glass-card p-6 rounded-2xl border-l-4 border-l-rose-500 hover:border-l-rose-400 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group">
                <div className="flex-grow space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 uppercase tracking-wide`}>
                      {issue.category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                    <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                  </h3>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => onApproveIssue?.(issue.id)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-brand-primary text-white text-xs font-bold uppercase rounded-xl hover:bg-violet-600 shadow-lg shadow-brand-primary/20 transition-all active:scale-95"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => onRejectIssue?.(issue.id)}
                    className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-600 text-xs font-bold uppercase rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Contested Issues Section */}
      {(contestedIssues.length > 0 || pendingRevalIssues.length > 0) && (
        <section className="mb-12 animate-in space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-display font-bold text-slate-800">⚠ Contested & Revalidation</h2>
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold border border-amber-200">
              {contestedIssues.length + pendingRevalIssues.length} Issues
            </span>
          </div>

          <div className="grid gap-4">
            {[...contestedIssues, ...pendingRevalIssues].map(issue => (
              <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
                <div className="glass-card p-6 rounded-2xl border-l-4 border-l-amber-500 hover:border-l-amber-400 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wide ${issue.status === IssueStatus.PENDING_REVALIDATION ? 'bg-amber-100 text-amber-700' :
                        issue.status === IssueStatus.RE_RESOLVED ? 'bg-violet-100 text-violet-700' :
                          'bg-rose-100 text-rose-600'
                        }`}>
                        {issue.status === IssueStatus.PENDING_REVALIDATION ? 'Pending Revalidation' :
                          issue.status === IssueStatus.RE_RESOLVED ? 'Re-Resolved (Voting)' :
                            `Contested (${issue.contestCount}/3)`}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs font-medium text-slate-400">
                        {issue.category}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-primary transition-colors">
                      {issue.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-display font-bold text-slate-800">Priority Feed</h2>
            <Link to="/issues" className="text-sm font-bold text-brand-primary hover:text-violet-600 transition-colors">View All &rarr;</Link>
          </div>

          <div className="space-y-4">
            {topPriority.length > 0 ? topPriority.map((issue, i) => (
              <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
                <div
                  className="glass-card p-6 rounded-2xl hover:border-brand-primary/30 transition-all duration-300 relative overflow-hidden"
                  style={{ animationDelay: `${i * 150}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1 pr-12">
                      <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-primary transition-colors leading-tight">
                        {issue.title}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-2">{issue.description}</p>
                    </div>
                    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl ${issue.priorityScore >= 100 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-brand-primary'
                      } font-display font-bold text-xl`}>
                      <span>{Math.round(issue.priorityScore)}</span>
                      <span className="text-[8px] uppercase tracking-wider opacity-70">Score</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
                      {issue.supportCount} Supports
                    </span>
                    <span>•</span>
                    <span>{departments.find(d => d.id === issue.departmentId)?.name}</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="glass-card p-12 text-center rounded-2xl border-dashed border-2 border-slate-300/50">
                <div className="inline-block p-4 rounded-full bg-slate-50 text-slate-400 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h3 className="text-lg font-bold text-slate-700">All Clear</h3>
                <p className="text-slate-400">No high-priority issues at the moment.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <h3 className="font-display font-bold text-lg text-slate-800 mb-6 relative z-10">Department Performance</h3>
            <div className="space-y-5 relative z-10">
              {departments.map(dept => (
                <div key={dept.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-600">{dept.name}</span>
                    <span className={`${dept.performanceScore > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{dept.performanceScore}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${dept.performanceScore > 80 ? 'bg-emerald-500' : dept.performanceScore > 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                      style={{ width: `${dept.performanceScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 rounded-2xl space-y-4">
            <h3 className="font-display font-bold text-lg text-slate-800">System Status</h3>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Resolution Rate</span>
              <span className="font-bold text-slate-900">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 font-medium">Contest Rate</span>
              <span className="font-bold text-slate-900">{stats.resolved > 0 ? Math.round((stats.contested / stats.resolved) * 100) : 0}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
