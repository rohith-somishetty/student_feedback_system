
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Issue, IssueStatus, Department } from '../types';

interface IssueListProps {
  issues: Issue[];
  departments: Department[];
}

const IssueList: React.FC<IssueListProps> = ({ issues, departments }) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  const filteredIssues = issues.filter(issue => {
    const statusMatch = filter === 'ALL' || issue.status === filter;
    const deptMatch = deptFilter === 'ALL' || issue.departmentId === deptFilter;
    return statusMatch && deptMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Public Issues Feed</h1>
          <p className="text-sm text-slate-500">Sorted by dynamic priority score.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <select 
            className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={deptFilter}
            onChange={e => setDeptFilter(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          
          <select 
            className="text-xs font-semibold px-3 py-2 rounded-lg border bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={filter}
            onChange={e => setFilter(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value={IssueStatus.OPEN}>Open</option>
            <option value={IssueStatus.RESOLVED}>Resolved</option>
            <option value={IssueStatus.CONTESTED}>Contested</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredIssues.map(issue => (
          <Link 
            key={issue.id} 
            to={`/issues/${issue.id}`}
            className="block group"
          >
            <div className="bg-white border border-slate-200 rounded-xl p-6 hover:border-indigo-300 shadow-sm transition-all hover:shadow-md flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex-grow space-y-2">
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    issue.status === IssueStatus.RESOLVED ? 'bg-emerald-100 text-emerald-700' :
                    issue.status === IssueStatus.CONTESTED ? 'bg-red-100 text-red-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {issue.status}
                  </span>
                  <span className="text-xs text-slate-400">#{issue.id}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {issue.title}
                </h3>
                <p className="text-sm text-slate-500 line-clamp-1">
                  {issue.description}
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs text-slate-400 font-medium">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
                    {issue.supportCount} Supports
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1 text-red-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                    {issue.contestCount} Contests
                  </span>
                  <span>🗓 {new Date(issue.createdAt).toLocaleDateString()}</span>
                  <span className="bg-slate-50 px-2 py-0.5 rounded text-slate-500">
                    {departments.find(d => d.id === issue.departmentId)?.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-lg min-w-[100px]">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Priority</div>
                <div className="text-xl font-black text-slate-800">{Math.round(issue.priorityScore)}</div>
              </div>
            </div>
          </Link>
        ))}

        {filteredIssues.length === 0 && (
          <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <div className="text-slate-400 mb-2">No issues matching your filters.</div>
            <button onClick={() => {setFilter('ALL'); setDeptFilter('ALL');}} className="text-indigo-600 font-bold hover:underline">Clear all filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueList;
