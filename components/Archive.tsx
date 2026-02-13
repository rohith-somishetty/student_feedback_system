
import React from 'react';
import { Link } from 'react-router-dom';
import { Issue, Department, IssueStatus } from '../types';

interface ArchiveProps {
    issues: Issue[];
    departments: Department[];
}

const Archive: React.FC<ArchiveProps> = ({ issues, departments }) => {
    const resolvedIssues = issues.filter(i => i.status === IssueStatus.RESOLVED || i.status === IssueStatus.REJECTED);

    return (
        <div className="space-y-10 animate-fadeIn font-outfit">
            <header className="flex items-center justify-between border-b border-slate-200/60 pb-8">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Resolution Archive</h1>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Historical Record & Evidence Locker</p>
                </div>
                <div className="text-right hidden md:block">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">{resolvedIssues.length} Records Digitized</span>
                </div>
            </header>

            <div className="space-y-4">
                {resolvedIssues.length > 0 ? (
                    resolvedIssues.map(issue => (
                        <Link key={issue.id} to={`/issues/${issue.id}`} className="block group">
                            <div className="relative bg-slate-50/50 hover:bg-white rounded-[2rem] p-8 border border-slate-100 hover:border-emerald-200 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5 overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] transition-colors group-hover:bg-emerald-500/10"></div>

                                <div className="flex flex-col md:flex-row md:items-center gap-6 relative z-10">
                                    <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>

                                    <div className="flex-grow">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${issue.status === IssueStatus.RESOLVED ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                                                }`}>
                                                {issue.status}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">#{issue.id}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 tracking-tight mb-2 group-hover:text-emerald-700 transition-colors">{issue.title}</h3>
                                        <div className="flex flex-wrap gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span>Resolution Date: {new Date(issue.createdAt).toLocaleDateString()}</span>
                                            <span className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                {departments.find(d => d.id === issue.departmentId)?.name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="self-start md:self-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-emerald-100 shadow-sm">View Evidence</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="py-32 text-center text-slate-300 border border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/50">
                        <div className="text-6xl mb-6 opacity-20">📁</div>
                        <p className="font-black uppercase tracking-[0.2em] text-sm mb-2">Archive Protocol Empty</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest opacity-60">No closed cases found in the mainframe.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Archive;
