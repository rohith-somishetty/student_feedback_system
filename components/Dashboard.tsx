import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Issue, User, UserRole, Department, IssueStatus, Support } from '../types';
import { issuesAPI } from '../services/api';
import { SkeletonHub } from './Skeleton';

interface DashboardProps {
  issues: Issue[];
  user: User;
  departments: Department[];
  supports: Support[];
  onSupportIssue?: (userId: string, issueId: string) => Promise<void>;
  onApproveIssue?: (id: string) => void;
  onRejectIssue?: (id: string, reason?: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ issues, user, departments, supports, onSupportIssue, onApproveIssue, onRejectIssue }) => {
  const [topics, setTopics] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data hydration
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const data = await issuesAPI.getTopics();
        setTopics(data);
      } catch (err) {
        console.error('Failed to fetch dashboard topics:', err);
      }
    };
    fetchTopics();
  }, []);
  const pendingIssues = issues.filter(i => i.status === IssueStatus.PENDING_APPROVAL);
  const contestedIssues = issues.filter(i => i.contestedFlag && (i.status === IssueStatus.RESOLVED || i.status === IssueStatus.REJECTED));
  const pendingRevalIssues = issues.filter(i => i.status === IssueStatus.PENDING_REVALIDATION || i.status === IssueStatus.RE_RESOLVED);
  const activeIssues = issues.filter(i =>
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

  const topPriority = activeIssues.slice(0, 10);

  // Simple Graph Data
  const statusDist = [
    { label: 'Open', count: stats.open, color: 'bg-amber-400' },
    { label: 'Review', count: stats.inReview, color: 'bg-blue-400' },
    { label: 'Resolved', count: stats.resolved, color: 'bg-emerald-400' },
    { label: 'Contested', count: stats.contested, color: 'bg-red-400' },
    ...(user.role === UserRole.ADMIN ? [{ label: 'Pending', count: stats.pending, color: 'bg-orange-400' }] : []),
  ];

  const userCreatedIssues = issues.filter(i => i.creatorId === user.id);
  const userSupports = supports.filter(s => s.userId === user.id);

  const userStats = {
    active: userCreatedIssues.filter(i => i.status !== IssueStatus.RESOLVED && i.status !== IssueStatus.REJECTED).length,
    resolved: userCreatedIssues.filter(i => i.status === IssueStatus.RESOLVED).length,
    supported: userSupports.length,
    impact: userCreatedIssues.filter(i => i.status === IssueStatus.RESOLVED).length * 10 + userSupports.length * 2,
  };

  const dashboardMetrics = [
    {
      label: 'My Reports',
      value: userStats.active + userStats.resolved,
      subValue: `${userStats.active} Active`,
      trend: userStats.active > 0 ? '+12%' : '0%',
      trendUp: true,
      hint: 'Your total contribution to campus improvements.',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      to: '/my-issues'
    },
    {
      label: 'Community Impact',
      value: userStats.impact,
      subValue: 'Points Earned',
      trend: '+24',
      trendUp: true,
      hint: 'Calculated from resolved reports and cases you supported.',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      to: '/profile'
    },
    {
      label: 'Credibility Tier',
      value: user.credibility >= 80 ? 'Elite' : user.credibility >= 50 ? 'Pro' : 'Novice',
      subValue: `Trust Score: ${user.credibility}`,
      trend: user.credibility > 50 ? 'Steady' : 'Rising',
      trendUp: true,
      hint: 'Reflects your reporting accuracy and community trust.',
      icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806',
      to: '/profile'
    },
    {
      label: 'Contribution',
      value: userStats.supported,
      subValue: 'Issues Supported',
      trend: '+3',
      trendUp: true,
      hint: 'Number of campus issues you are actively backing.',
      icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      to: '/issues'
    },
  ];

  const adminStatCards = [
    { label: 'Active Reports', value: activeIssues.length, color: 'text-indigo-600', bg: 'bg-indigo-50/50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z', to: '/issues' },
    { label: 'Resolution Rate', value: `${Math.round((stats.resolved / (stats.total || 1)) * 100)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50/50', icon: 'M13 10V3L4 14h7v7l9-11h-7z', to: '/issues' },
    { label: 'Open Issues', value: stats.open, color: 'text-amber-600', bg: 'bg-amber-50/50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', to: '/issues' },
    { label: 'Incoming', value: stats.pending, color: 'text-rose-600', bg: 'bg-rose-50/50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z', to: '/issues' }
  ];

  const cardsToRender = user.role === UserRole.ADMIN ? adminStatCards : dashboardMetrics;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-7xl mx-auto font-outfit page-enter">
      {isLoading ? (
        <SkeletonHub />
      ) : (
        <>
          {/* Navigation & Header */}
          <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#94A3B8] text-[10px] font-black uppercase tracking-[0.3em]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8A6] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8A6]"></span>
                </span>
                <span>System Operational</span>
              </div>
              <div className="space-y-1">
                <h1 className="text-5xl md:text-6xl font-display font-black text-[#E5E7EB] tracking-tighter leading-tight italic">
                  {user.role === UserRole.ADMIN ? (
                    <>Command<span className="text-[#0B5F5A] not-italic">Center</span></>
                  ) : (
                    <>Student<span className="text-[#0B5F5A] not-italic">Hub</span></>
                  )}
                </h1>
                <p className="text-lg text-[#64748B] font-medium tracking-tight">
                  {user.role === UserRole.ADMIN
                    ? `Sector: ${departments.find(d => d.id === user.departmentId)?.name || 'Central Command'}`
                    : `Welcome back, ${user.name.split(' ')[0]}`}
                </p>
              </div>
            </div>

            {/* Action Button */}
            {user.role === UserRole.STUDENT && (
              <Link
                to="/report"
                className="group relative inline-flex items-center justify-center px-10 py-4.5 font-black text-white bg-[#0B5F5A] font-display rounded-2xl hover:bg-[#0D9488] transition-all duration-300 shadow-xl shadow-[#0B5F5A]/20 active:scale-95 border border-white/5 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 text-sm uppercase tracking-widest">
                  <span className="text-xl leading-none">+</span> New Case
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              </Link>
            )}
          </header>

          {/* Stats Grid - Bento Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {cardsToRender.map((stat: any, i) => {
              const isHero = i === 0;
              return (
                <Link
                  key={stat.label}
                  to={stat.to}
                  className={`group relative bg-white rounded-[32px] p-8 border border-slate-100 shadow-[0_8px_30px_rgba(0,0,0,0.02)] overflow-hidden cursor-pointer no-underline block interaction-lift ${isHero ? 'lg:col-span-2 bg-gradient-to-br from-white to-slate-50/50' : ''
                    }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`rounded-2xl transition-all duration-500 flex items-center justify-center ${isHero ? 'w-14 h-14 bg-[#0B5F5A] text-white shadow-lg shadow-[#0B5F5A]/20' : 'w-12 h-12 bg-[#0B5F5A]/5 text-[#0B5F5A] group-hover:bg-[#0B5F5A] group-hover:text-white'
                        }`}>
                        <svg className={isHero ? "w-7 h-7" : "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isHero ? 2.5 : 2} d={stat.icon} />
                        </svg>
                      </div>

                      {stat.trend && (
                        <div className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-[11px] font-black tracking-tight ${stat.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-500'
                          }`}>
                          <span className="text-xs">{stat.trendUp ? '↑' : '→'}</span>
                          <span>{stat.trend}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col">
                        <p className={`font-bold text-[#64748B] uppercase tracking-[0.2em] mb-2 ${isHero ? 'text-[11px]' : 'text-[9px]'
                          }`}>
                          {stat.label}
                        </p>
                        <div className="flex items-baseline space-x-3">
                          <h3 className={`font-display font-black text-[#0F172A] tracking-tight leading-none ${isHero ? 'text-6xl' : 'text-3xl'
                            }`}>
                            {stat.value}
                          </h3>
                          {stat.label === 'Credibility Tier' && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-black uppercase tracking-wider">
                              Level {Math.floor(user.credibility / 20) + 1}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <p className={`font-medium text-slate-400 ${isHero ? 'text-sm' : 'text-[11px]'}`}>
                          {stat.subValue || 'System Metric'}
                        </p>
                        <span className="text-[10px] font-black text-[#0B5F5A] opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 duration-300 uppercase tracking-widest">
                          View Details →
                        </span>
                      </div>
                    </div>

                    {isHero && stat.label === 'Credibility Tier' && (
                      <div className="mt-8 pt-6 border-t border-slate-100">
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#0B5F5A] to-[#14B8A6] rounded-full transition-all duration-1000"
                            style={{ width: `${(user.credibility % 20) * 5}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-3">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Tier Progression</p>
                          <p className="text-[10px] text-[#0B5F5A] font-black uppercase tracking-wider">{20 - (user.credibility % 20)} Points to Rank Up</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Decorative background icon */}
                  <div className={`absolute -bottom-6 -right-6 transform transition-transform group-hover:scale-110 group-hover:-rotate-6 duration-700 opacity-[0.03] pointer-events-none ${isHero ? 'scale-150' : 'scale-110'
                    }`}>
                    <svg className="w-48 h-48 text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                      <path d={stat.icon} />
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Admin Review Queue */}
          {user.role === UserRole.ADMIN && pendingIssues.length > 0 && (
            <section className="mb-12 animate-in">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h2 className="text-2xl font-display font-black text-[#E5E7EB] tracking-tight">Review Queue</h2>
                  <p className="text-[11px] text-[#64748B] font-bold uppercase tracking-widest">Action Required</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  <span className="text-rose-500 text-[10px] font-black uppercase tracking-wider">
                    {pendingIssues.length} Pending
                  </span>
                </div>
              </div>

              <div className="grid gap-3">
                {pendingIssues.map(issue => (
                  <div key={issue.id} className="bg-white px-8 py-5 rounded-[24px] shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between group hover:shadow-md transition-all duration-300">
                    <div className="flex-grow space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black px-2 py-0.5 rounded bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-widest">
                          {issue.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          ID: {issue.id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#0B5F5A] transition-colors tracking-tight">
                        <Link to={`/issues/${issue.id}`}>{issue.title}</Link>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      <button
                        onClick={() => onApproveIssue?.(issue.id)}
                        className="flex-1 lg:flex-none px-6 py-2.5 bg-[#0B5F5A] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#0D9488] transition-all shadow-lg shadow-[#0B5F5A]/10 active:scale-95"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onRejectIssue?.(issue.id)}
                        className="flex-1 lg:flex-none px-6 py-2.5 bg-white border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all active:scale-95"
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
            <section className="mb-10 animate-in space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-display font-bold text-[#E5E7EB]">⚠ Contested & Revalidation</h2>
                <span className="px-3 py-1 rounded-full bg-[#F59E0B]/15 text-[#F59E0B] text-xs font-bold border border-[#F59E0B]/20">
                  {contestedIssues.length + pendingRevalIssues.length} Issues
                </span>
              </div>

              <div className="grid gap-4">
                {[...contestedIssues, ...pendingRevalIssues].map(issue => (
                  <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
                    <div className="glass-card p-6 rounded-2xl border-l-4 border-l-amber-500 hover:border-l-amber-400 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                      <div className="flex-grow space-y-2">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide ${issue.status === IssueStatus.PENDING_REVALIDATION ? 'bg-[#F59E0B]/15 text-[#F59E0B]' :
                            issue.status === IssueStatus.RE_RESOLVED ? 'bg-[#16A34A]/15 text-[#16A34A]' :
                              'bg-[#EF4444]/15 text-[#EF4444]'
                            }`}>
                            {issue.status === IssueStatus.PENDING_REVALIDATION ? 'Pending Revalidation' :
                              issue.status === IssueStatus.RE_RESOLVED ? 'Re-Resolved (Voting)' :
                                `Contested (${issue.contestCount}/3)`}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs font-medium text-[#64748B]">
                            {issue.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0F172A] group-hover:text-[#0B5F5A] transition-colors">
                          {issue.title}
                        </h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-display font-bold text-[#E5E7EB]">Priority Feed</h2>
                <Link to="/issues" className="text-sm font-bold text-[#0B5F5A] hover:text-[#094C48] transition-colors">View All &rarr;</Link>
              </div>

              <div className="space-y-6">
                {topPriority.length > 0 ? topPriority.map((issue, i) => {
                  const hasSupported = supports.some(s => s.userId === user.id && s.issueId === issue.id);
                  const isFeatured = i === 0;
                  return (
                    <div key={issue.id} className="block group">
                      <div
                        className={`p-8 rounded-[32px] border transition-all duration-500 relative overflow-hidden ${isFeatured
                          ? 'bg-gradient-to-br from-white to-[#0B5F5A]/5 border-[#0B5F5A]/20 shadow-xl shadow-[#0B5F5A]/5'
                          : 'bg-white border-slate-100 shadow-premium'
                          } interaction-lift`}
                        style={{ animationDelay: `${i * 150}ms` }}
                      >
                        {isFeatured && (
                          <div className="absolute top-0 right-0 px-4 py-1.5 bg-[#0B5F5A] text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-bl-2xl shadow-sm z-20">
                            Active Priority
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-3 pr-12 flex-grow">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${isFeatured ? 'bg-[#0B5F5A] text-white' : 'bg-slate-100 text-slate-500'
                                }`}>
                                {issue.category}
                              </span>
                              {issue.status === IssueStatus.PENDING_APPROVAL && (
                                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-amber-100 text-amber-700">Pending Review</span>
                              )}
                              <span className="text-[10px] font-bold text-slate-400">
                                {new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <Link to={`/issues/${issue.id}`} className={`block font-display font-black text-[#0F172A] group-hover:text-[#0B5F5A] transition-colors leading-tight tracking-tight ${isFeatured ? 'text-2xl md:text-3xl' : 'text-xl'
                              }`}>
                              {issue.title}
                            </Link>
                            <p className={`text-[#64748B] line-clamp-2 leading-relaxed font-medium ${isFeatured ? 'text-base' : 'text-sm'
                              }`}>{issue.description}</p>
                          </div>
                          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl shrink-0 shadow-sm ${issue.priorityScore >= 100
                            ? 'bg-rose-50 text-rose-600 border border-rose-100'
                            : 'bg-[#0B5F5A]/5 text-[#0B5F5A] border border-[#0B5F5A]/10'
                            } font-display font-black text-xl transition-all duration-300 group-hover:scale-110`}>
                            <span>{Math.round(issue.priorityScore)}</span>
                            <span className="text-[7px] uppercase tracking-widest opacity-60">Score</span>
                          </div>
                        </div>

                        <div className={`flex items-center justify-between mt-8 pt-6 border-t ${isFeatured ? 'border-[#0B5F5A]/10' : 'border-slate-50'
                          }`}>
                          <div className="flex items-center gap-6 text-[11px] font-bold text-[#64748B]">
                            <span className="flex items-center gap-2 group-hover:text-[#0B5F5A] transition-colors">
                              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                              {issue.supportCount} Supports
                            </span>
                            <span className="flex items-center gap-2 group-hover:text-[#0F172A] transition-colors">
                              <svg className="w-5 h-5 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                              </svg>
                              {departments.find(d => d.id === issue.departmentId)?.name}
                            </span>
                          </div>

                          {user.role === UserRole.STUDENT && user.id !== issue.creatorId && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (!hasSupported) onSupportIssue?.(user.id, issue.id);
                              }}
                              disabled={hasSupported}
                              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all duration-300 ${hasSupported
                                ? 'bg-slate-50 text-slate-400 cursor-not-allowed border border-slate-100'
                                : 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20 hover:shadow-[#14B8A6]/30 hover:-translate-y-0.5'
                                }`}
                            >
                              {hasSupported ? '✓ Supported' : 'Support Case'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="bg-white p-16 text-center rounded-[32px] border border-dashed border-slate-200 shadow-sm overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 mb-6 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                      </div>
                      <h3 className="text-xl font-display font-bold text-slate-800 mb-2">Campus is Running Smoothly</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto mb-8 font-medium">No high-priority issues detected in your sectors. Great time to review archived reports or contribute to ongoing discussions.</p>
                      <Link to="/issues" className="inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-full text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">Explore All Issues</Link>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Hot Topics */}
              <div className="bg-[#0F172A] p-8 rounded-[32px] shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
                  <svg className="w-32 h-32 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="space-y-1">
                      <h3 className="font-display font-black text-xl text-white tracking-tight">Hot Topics</h3>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Community Pulse</p>
                    </div>
                  </div>

                  {topics.length > 0 ? (
                    <div className="space-y-6">
                      {topics.slice(0, 4).map((topic, idx) => (
                        <div key={topic.phrase} className="group/topic relative pl-4 border-l-2 border-white/10 hover:border-[#14B8A6] transition-colors py-0.5">
                          <div className="flex justify-between items-center">
                            <span className="text-base font-black text-white/90 group-hover/topic:text-white transition-colors capitalize">"{topic.phrase}"</span>
                            <span className="text-[11px] font-black text-[#14B8A6]">{topic.frequency}x</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                      <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 text-white/20 animate-pulse">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
                      </div>
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] leading-relaxed">Analyzing<br />Campus Trends...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* System Stats Sidebar */}
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 space-y-6">
                <h3 className="font-display font-black text-xl text-[#0F172A] tracking-tight">System Metrics</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                      <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Resolution</span>
                    </div>
                    <span className="font-display font-black text-lg text-[#0F172A]">{stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0}%</span>
                  </div>
                  <div className="h-px bg-slate-50 w-full"></div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <span className="text-[#64748B] text-xs font-bold uppercase tracking-widest">Contest Rate</span>
                    </div>
                    <span className="font-display font-black text-lg text-[#0F172A]">{stats.resolved > 0 ? Math.round((stats.contested / stats.resolved) * 100) : 0}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
