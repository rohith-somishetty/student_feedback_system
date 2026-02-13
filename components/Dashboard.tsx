
import React from 'react';
import { Link } from 'react-router-dom';
import { Issue, User, UserRole, Department, IssueStatus } from '../types';

interface DashboardProps {
  issues: Issue[];
  user: User;
  departments: Department[];
}

const Dashboard: React.FC<DashboardProps> = ({ issues, user, departments }) => {
  const stats = {
    total: issues.length,
    open: issues.filter(i => i.status === IssueStatus.OPEN).length,
    resolved: issues.filter(i => i.status === IssueStatus.RESOLVED).length,
    contested: issues.filter(i => i.status === IssueStatus.CONTESTED).length,
    inReview: issues.filter(i => i.status === IssueStatus.IN_REVIEW).length,
  };

  const topPriority = issues.slice(0, 3);

  // Simple Graph Data
  const statusDist = [
    { label: 'Open', count: stats.open, color: 'bg-amber-400' },
    { label: 'Review', count: stats.inReview, color: 'bg-blue-400' },
    { label: 'Resolved', count: stats.resolved, color: 'bg-emerald-400' },
    { label: 'Contested', count: stats.contested, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">System Overview</h1>
          <p className="text-slate-500 font-medium">
            {user.role === UserRole.ADMIN 
              ? `Administrator: ${user.name} | ${departments.find(d => d.id === user.departmentId)?.name}` 
              : `Student Identity: ${user.name} | Credibility: ${user.credibility}`}
          </p>
        </div>
        <div className="flex bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Updates</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Open Issues', value: stats.open, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Resolution Rate', value: `${Math.round((stats.resolved / (stats.total || 1)) * 100)}%`, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Contested', value: stats.contested, color: 'text-red-600', bg: 'bg-red-50', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
          { label: 'Credibility', value: user.credibility, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }
        ].map(stat => (
          <div key={stat.label} className={`p-6 rounded-2xl ${stat.bg} border border-white shadow-sm flex items-start justify-between`}>
            <div>
              <div className="text-sm font-bold text-slate-500 mb-1 uppercase tracking-tight">{stat.label}</div>
              <div className={`text-3xl font-black ${stat.color}`}>{stat.value}</div>
            </div>
            <svg className={`w-6 h-6 ${stat.color} opacity-40`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
            </svg>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Priority Escalations</h2>
            <Link to="/issues" className="text-sm text-indigo-600 font-bold hover:underline bg-indigo-50 px-4 py-2 rounded-lg transition-all hover:bg-indigo-100">View All Pipeline</Link>
          </div>
          
          <div className="space-y-4">
            {topPriority.length > 0 ? topPriority.map(issue => (
              <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
                <div className="p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-sm hover:shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2">
                    <span className={`px-2 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest ${
                      issue.urgency >= 4 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {issue.urgency >= 4 ? 'Urgent' : 'Prioritized'}
                    </span>
                  </div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors pr-10">{issue.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-4 font-medium leading-relaxed">{issue.description}</p>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <div className="flex space-x-6 items-center">
                      <span className="flex items-center font-bold text-indigo-500">
                        <span className="mr-1">🔥</span> {Math.round(issue.priorityScore)} Score
                      </span>
                      <span className="flex items-center font-bold text-slate-500">
                        <span className="mr-1">🤝</span> {issue.supportCount} Support
                      </span>
                    </div>
                    <span className="font-medium bg-slate-50 px-3 py-1 rounded-full border border-slate-100 italic">
                      Updated {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                <p className="font-bold">System Clean</p>
                <p className="text-xs">No active escalations detected.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Analytics</h2>
          
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-8">
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Issue Distribution</h4>
              <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-100">
                {statusDist.map(s => (
                  <div 
                    key={s.label}
                    className={`${s.color} h-full transition-all hover:opacity-80`}
                    style={{ width: `${(s.count / (stats.total || 1)) * 100}%` }}
                    title={`${s.label}: ${s.count}`}
                  />
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {statusDist.map(s => (
                  <div key={s.label} className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${s.color}`}></div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{s.label} ({s.count})</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Dept. Efficiency</h4>
              {departments.map(dept => (
                <div key={dept.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-bold text-slate-700">{dept.name}</span>
                    <span className="font-black text-slate-900">{dept.performanceScore}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        dept.performanceScore > 85 ? 'bg-indigo-500' : 
                        dept.performanceScore > 70 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dept.performanceScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
