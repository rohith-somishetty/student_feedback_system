
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Issue, IssueStatus, User, UserRole, Urgency, Support, Comment, Proposal } from '../types';
import { CREDIBILITY_RULES, CREDIBILITY_THRESHOLDS } from '../constants';
import { calculatePriorityScore, updateCredibility } from '../utils/priority';
import { createTimelineEvent, isIssueOverdue } from '../utils/timeline';

interface IssueDetailProps {
  issues: Issue[];
  users: User[];
  user: User;
  supports: Support[];
  onUpdateIssue: (issue: Issue) => void;
  onRecordSupport: (userId: string, issueId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void;
  onApproveIssue: (id: string) => void;
  onRejectIssue: (id: string, reason?: string) => void;
}

const statusLabel = (status: string) => {
  switch (status) {
    case IssueStatus.PENDING_APPROVAL: return '⏳ Pending';
    case IssueStatus.REJECTED: return '✗ Rejected';
    default: return status.replace('_', ' ');
  }
};

const IssueDetail: React.FC<IssueDetailProps> = ({ issues, users, user, supports, onUpdateIssue, onRecordSupport, onUpdateUser, onApproveIssue, onRejectIssue }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const issue = issues.find(i => i.id === id);

  const [supportLoading, setSupportLoading] = useState(false);
  const [resolutionUrl, setResolutionUrl] = useState('');
  const [contestReason, setContestReason] = useState('');

  const [newComment, setNewComment] = useState('');
  const [newProposal, setNewProposal] = useState('');
  const [rejectReason, setRejectReason] = useState('');

  if (!issue) {
    return <div className="text-center py-20 font-bold text-slate-400">Issue Not Found</div>;
  }

  const hasSupported = supports.some(s => s.userId === user.id && s.issueId === issue.id);

  const handleSupport = () => {
    if (hasSupported) return;
    setSupportLoading(true);
    setTimeout(() => {
      const timelineEvent = createTimelineEvent(
        'SUPPORT',
        user.id,
        'Anonymous Student',
        `Endorsed this issue (credibility: ${user.credibility})`
      );

      const updatedIssue: Issue = {
        ...issue,
        supportCount: issue.supportCount + 1,
        priorityScore: issue.priorityScore + (user.credibility * 0.75),
        timeline: [...issue.timeline, timelineEvent]
      };
      onUpdateIssue(updatedIssue);
      onRecordSupport(user.id, issue.id);
      setSupportLoading(false);
    }, 600);
  };

  const handleResolve = () => {
    if (!resolutionUrl) return alert('Admin must provide evidence link before resolving.');

    const timelineEvent = createTimelineEvent(
      'STATUS_CHANGE',
      user.id,
      'Admin',
      'Marked issue as resolved',
      { oldStatus: issue.status, newStatus: IssueStatus.RESOLVED, evidenceUrl: resolutionUrl }
    );

    const updatedIssue = {
      ...issue,
      status: IssueStatus.RESOLVED,
      resolutionEvidenceUrl: resolutionUrl,
      timeline: [...issue.timeline, timelineEvent]
    };
    onUpdateIssue(updatedIssue);
  };

  const handleContest = () => {
    if (user.credibility < CREDIBILITY_THRESHOLDS.MIN_TO_CONTEST) {
      return alert(`Insufficient Credibility: ${user.credibility}/${CREDIBILITY_THRESHOLDS.MIN_TO_CONTEST} required.`);
    }
    if (!contestReason.trim()) return alert('Please provide a reason for the contest.');

    const newContestCount = issue.contestCount + 1;
    let newStatus = issue.status;

    const timelineEvent = createTimelineEvent(
      'CONTEST',
      user.id,
      'Anonymous Student',
      `Contested resolution: ${contestReason}`,
      { contestCount: newContestCount }
    );

    // Check if threshold is reached
    if (newContestCount >= CREDIBILITY_THRESHOLDS.MIN_CONTESTS_REQUIRED) {
      newStatus = IssueStatus.CONTESTED;
      const statusChangeEvent = createTimelineEvent(
        'STATUS_CHANGE',
        'system',
        'System',
        'Issue automatically contested due to threshold reached',
        { oldStatus: issue.status, newStatus: IssueStatus.CONTESTED, contestCount: newContestCount }
      );
      onUpdateIssue({
        ...issue,
        contestCount: newContestCount,
        status: newStatus,
        timeline: [...issue.timeline, timelineEvent, statusChangeEvent]
      });
    } else {
      onUpdateIssue({
        ...issue,
        contestCount: newContestCount,
        status: newStatus,
        timeline: [...issue.timeline, timelineEvent]
      });
    }

    setContestReason('');
  };

  // Admin approval handlers
  const handleApprove = async () => {
    if (user.role !== UserRole.ADMIN) return;
    try {
      await onApproveIssue(issue.id);
    } catch (err: any) {
      alert(err.message || 'Failed to approve');
    }
  };

  const handleReject = async () => {
    if (user.role !== UserRole.ADMIN) return;
    try {
      await onRejectIssue(issue.id, rejectReason || undefined);
      setRejectReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to reject');
    }
  };


  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: 'Anonymous',
      text: newComment,
      timestamp: new Date().toISOString()
    };
    onUpdateIssue({ ...issue, comments: [...(issue.comments || []), comment] });
    setNewComment('');
  };

  const submitProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProposal.trim()) return;
    const proposal: Proposal = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: 'Anonymous',
      text: newProposal,
      timestamp: new Date().toISOString(),
      votes: 1
    };
    onUpdateIssue({ ...issue, proposals: [...(issue.proposals || []), proposal] });
    setNewProposal('');
  };

  const voteProposal = (proposalId: string) => {
    const updatedProposals = (issue.proposals || []).map(p =>
      p.id === proposalId ? { ...p, votes: p.votes + 1 } : p
    );
    onUpdateIssue({ ...issue, proposals: updatedProposals });
  };

  const isOverdue = isIssueOverdue(issue.deadline, issue.status);

  return (
    <div className="min-h-screen pt-32 pb-24 px-4 sm:px-8 max-w-6xl mx-auto font-outfit animate-fadeIn">
      {/* Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="group flex items-center text-slate-400 hover:text-brand-primary font-bold text-xs uppercase tracking-widest mb-8 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center mr-3 group-hover:border-brand-primary/30 group-hover:bg-brand-primary/5 transition-all">
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </div>
        Back to Intelligence
      </button>

      {/* Hero Section */}
      <div className="relative glass-card rounded-[2.5rem] p-8 md:p-12 mb-12 overflow-hidden border-t-white/60">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row gap-12 justify-between">
          <div className="space-y-6 max-w-2xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md border ${issue.status === IssueStatus.RESOLVED ? 'bg-emerald-500 text-white border-emerald-400' :
                  issue.status === IssueStatus.CONTESTED ? 'bg-rose-500 text-white border-rose-400' :
                    'premium-gradient-primary text-white border-white/20'
                }`}>
                {statusLabel(issue.status)}
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-white/50 border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                REF: {issue.id.substring(0, 8)}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-[1.1] tracking-tight">
              {issue.title}
            </h1>

            <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-500">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-slate-100">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                {issue.category}
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-slate-100">
                <span className={`w-2 h-2 rounded-full ${issue.urgency >= 4 ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></span>
                {Urgency[issue.urgency]} Priority
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${isOverdue ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-white/50 border-slate-100'}`}>
                <span>🗓 Deadline: {new Date(issue.deadline).toLocaleDateString()}</span>
                {isOverdue && <span className="text-[10px] bg-rose-100 px-1.5 py-0.5 rounded text-rose-600 uppercase tracking-wide">Overdue</span>}
              </div>
            </div>
          </div>

          <div className="md:text-right flex flex-col items-start md:items-end p-6 rounded-3xl bg-white/40 border border-white/50 shadow-sm backdrop-blur-sm self-start">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Impact Score</span>
            <div className="text-6xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-slate-900 to-slate-700 leading-none tracking-tight">
              {Math.round(issue.priorityScore)}
            </div>
            <div className="flex gap-4 mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>▲ {issue.supportCount} Supports</span>
              <span>⚠ {issue.contestCount} Flags</span>
            </div>
          </div>
        </div>

        <div className="mt-12 p-8 rounded-3xl bg-white/50 border border-white/60 shadow-inner">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Briefing
          </h3>
          <p className="text-lg md:text-xl text-slate-700 font-medium leading-relaxed">
            {issue.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Timeline Section */}
          <section className="glass-card p-8 rounded-[2rem]">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-8 flex items-center gap-3">
              <span className="w-8 h-1 rounded-full bg-brand-primary"></span>
              Operational Timeline
            </h3>

            <div className="relative pl-4 space-y-8 before:absolute before:inset-y-0 before:left-[19px] before:w-0.5 before:bg-slate-100">
              {(issue.timeline || []).slice().reverse().map((event, i) => (
                <div key={event.id} className="relative pl-10 animate-in" style={{ animationDelay: `${i * 100}ms` }}>
                  <div className={`absolute left-0 top-0 w-10 h-10 rounded-xl border-4 border-white shadow-sm flex items-center justify-center text-sm z-10 ${event.type === 'CREATED' ? 'bg-indigo-100 text-indigo-600' :
                      event.type === 'STATUS_CHANGE' ? 'bg-emerald-100 text-emerald-600' :
                        event.type === 'SUPPORT' ? 'bg-amber-100 text-amber-600' :
                          event.type === 'CONTEST' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {event.type === 'CREATED' ? '📝' : event.type === 'STATUS_CHANGE' ? '✓' : event.type === 'SUPPORT' ? '▲' : event.type === 'CONTEST' ? '!' : '•'}
                  </div>

                  <div className="p-5 rounded-2xl bg-white/50 border border-slate-100 hover:border-indigo-100 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{event.userName}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {new Date(event.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-600">{event.description}</p>
                    {event.metadata?.evidenceUrl && (
                      <a href={event.metadata.evidenceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center mt-3 text-[10px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">
                        Attachment <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Secure Comms / Comments */}
          <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 px-4">
              <span className="w-8 h-1 rounded-full bg-slate-900"></span>
              Encrypted Channel
            </h3>

            <div className="space-y-4">
              {(issue.comments || []).map(comment => (
                <div key={comment.id} className="flex gap-4 group animate-in">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-md">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-grow p-5 rounded-2xl rounded-tl-none bg-white border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{comment.userName}</span>
                      <span className="text-[10px] text-slate-400 font-bold">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={submitComment} className="relative mt-8">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0)}
                </div>
              </div>
              <input
                type="text"
                className="w-full glass-card pl-16 pr-14 py-4 rounded-2xl border-transparent focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10 font-medium text-sm transition-all placeholder:text-slate-400"
                placeholder="Transmit secure message..."
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
              />
              <button
                type="submit"
                disabled={!newComment.trim()}
                className="absolute right-2 top-2 bottom-2 aspect-square bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-brand-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            </form>
          </section>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">

          {/* Action Card */}
          <div className="glass-card p-6 rounded-[2rem] space-y-6 sticky top-32">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Protocol Actions</h3>

            {/* Student Actions */}
            {user.role === UserRole.STUDENT && issue.status !== IssueStatus.RESOLVED && issue.status !== IssueStatus.PENDING_APPROVAL && (
              <button
                onClick={handleSupport}
                disabled={supportLoading || hasSupported}
                className={`w-full py-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all transform active:scale-95 shadow-lg ${hasSupported
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'premium-gradient-primary text-white hover:shadow-indigo-500/30 hover:-translate-y-1'
                  }`}
              >
                {hasSupported ? 'Endorsed' : supportLoading ? 'Processing...' : '▲ Endorse Protocol'}
              </button>
            )}

            {/* Admin Actions */}
            {user.role === UserRole.ADMIN && issue.status === IssueStatus.PENDING_APPROVAL && (
              <div className="space-y-3">
                <button onClick={handleApprove} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all">
                  Verify & Approve
                </button>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Reason for rejection..."
                    className="w-full mb-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                  />
                  <button onClick={handleReject} className="w-full py-3 bg-white border border-rose-200 text-rose-500 hover:bg-rose-50 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
                    Reject Protocol
                  </button>
                </div>
              </div>
            )}

            {user.role === UserRole.ADMIN && issue.status === IssueStatus.OPEN && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <input
                  type="text"
                  value={resolutionUrl}
                  onChange={e => setResolutionUrl(e.target.value)}
                  placeholder="Evidence URL..."
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs"
                />
                <button onClick={handleResolve} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all">
                  Mark Resolved
                </button>
              </div>
            )}

            {/* Resolved State */}
            {issue.status === IssueStatus.RESOLVED && (
              <div className="text-center p-6 rounded-2xl bg-emerald-50 border border-emerald-100">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                </div>
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wide mb-4">Protocol Resolved</p>
                <a href={issue.resolutionEvidenceUrl} target="_blank" rel="noreferrer" className="block w-full py-2 bg-emerald-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-700 transition-colors">
                  View Evidence
                </a>

                {user.role === UserRole.STUDENT && (
                  <div className="mt-4 pt-4 border-t border-emerald-200/50">
                    <button
                      onClick={() => {
                        if (issue.contestCount >= CREDIBILITY_THRESHOLDS.MIN_CONTESTS_REQUIRED) {
                          handleContest();
                        } else {
                          // Toggle contest input visibility
                          const reason = prompt("Enter contest reason:");
                          if (reason) {
                            setContestReason(reason);
                            // Hacky state update to trigger standard flow
                            setTimeout(handleContest, 100);
                          }
                        }
                      }}
                      className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors"
                    >
                      Flag Discrepancy
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Proposals Section */}
            <div className="pt-6 border-t border-slate-100">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Proposed Solutions</h4>
              <div className="space-y-3">
                {(issue.proposals || []).map(p => (
                  <div key={p.id} className="p-3 rounded-xl bg-white border border-slate-100 flex justify-between items-center group hover:border-indigo-100 transition-all">
                    <span className="text-xs font-medium text-slate-700 truncate max-w-[140px]">{p.text}</span>
                    <button onClick={() => voteProposal(p.id)} className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-brand-primary hover:text-white transition-colors">
                      ▲ {p.votes}
                    </button>
                  </div>
                ))}

                {user.role === UserRole.STUDENT && (
                  <form onSubmit={submitProposal} className="mt-3">
                    <input
                      type="text"
                      placeholder="Propose solution..."
                      className="w-full px-3 py-2 rounded-lg bg-slate-50 border-none focus:ring-2 focus:ring-indigo-100 text-xs font-medium"
                      value={newProposal}
                      onChange={e => setNewProposal(e.target.value)}
                    />
                  </form>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
