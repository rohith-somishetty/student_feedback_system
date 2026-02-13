
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Issue, IssueStatus, User, UserRole, Urgency, Support, Comment, Proposal } from '../types';
import { CREDIBILITY_RULES, CREDIBILITY_THRESHOLDS } from '../constants';
import { calculatePriorityScore, updateCredibility } from '../utils/priority';
import { createTimelineEvent, isIssueOverdue } from '../utils/timeline';

interface IssueDetailProps {
  issues: Issue[];
  users: User[]; // Need all users to calculate priority properly
  user: User;
  supports: Support[];
  onUpdateIssue: (issue: Issue) => void;
  onRecordSupport: (userId: string, issueId: string) => void;
  onUpdateUser: (userId: string, updates: Partial<User>) => void; // New prop to update credibility
}

const IssueDetail: React.FC<IssueDetailProps> = ({ issues, users, user, supports, onUpdateIssue, onRecordSupport, onUpdateUser }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const issue = issues.find(i => i.id === id);

  const [supportLoading, setSupportLoading] = useState(false);
  const [resolutionUrl, setResolutionUrl] = useState('');
  const [contestReason, setContestReason] = useState('');

  const [newComment, setNewComment] = useState('');
  const [newProposal, setNewProposal] = useState('');

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
        user.name,
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
      user.name,
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
      user.name,
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

  const handleEscalate = () => {
    if (user.role !== UserRole.SUPER_ADMIN) {
      return alert('Only Super Admins can escalate issues to higher authority.');
    }

    const timelineEvent = createTimelineEvent(
      'STATUS_CHANGE',
      user.id,
      user.name,
      'Escalated issue to higher institutional authority for review',
      { oldStatus: issue.status, newStatus: IssueStatus.ESCALATED }
    );

    const updatedIssue: Issue = {
      ...issue,
      status: IssueStatus.ESCALATED,
      timeline: [...issue.timeline, timelineEvent]
    };

    onUpdateIssue(updatedIssue);
  };


  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const comment: Comment = {
      id: Math.random().toString(36).substr(2, 9),
      userId: user.id,
      userName: user.name,
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
      userName: user.name,
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
      <button onClick={() => navigate(-1)} className="flex items-center text-slate-400 hover:text-indigo-600 font-bold transition-all group">
        <svg className="w-5 h-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        Pipeline Feed
      </button>

      <div className="bg-white border-2 border-slate-100 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-10 border-b bg-slate-50/50">
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${issue.status === IssueStatus.RESOLVED ? 'bg-emerald-500 text-white' :
                  issue.status === IssueStatus.CONTESTED ? 'bg-red-500 text-white' :
                    'bg-indigo-600 text-white'
                  }`}>
                  {issue.status}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">Ref: {issue.id}</span>
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">{issue.title}</h1>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Priority Index</div>
              <div className="text-5xl font-black text-indigo-600 leading-none">{Math.round(issue.priorityScore)}</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs font-black text-slate-500">
            <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-tighter text-indigo-500">{issue.category}</span>
            <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-tighter">Urgency: {Urgency[issue.urgency]}</span>
            <span className={`bg-white px-4 py-2 rounded-xl border uppercase tracking-tighter ${isOverdue ? 'border-red-300 text-red-600 bg-red-50' : 'border-slate-200'}`}>
              Deadline: {new Date(issue.deadline).toLocaleDateString()}
              {isOverdue && ' ⚠️ OVERDUE'}
            </span>
            <span className="bg-white px-4 py-2 rounded-xl border border-slate-200 uppercase tracking-tighter">Supports: {issue.supportCount}</span>
          </div>
        </div>

        <div className="p-10 space-y-12">
          {/* Main Description */}
          <section className="space-y-4">
            <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs flex items-center">
              <span className="w-8 h-px bg-indigo-600 mr-3"></span>
              Issue Intelligence
            </h3>
            <p className="text-slate-600 leading-relaxed text-xl font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 italic">
              "{issue.description}"
            </p>
          </section>

          {/* Solution Proposals */}
          <section className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Crowdsourced Solutions</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{issue.proposals?.length || 0} Submitted</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(issue.proposals || []).map(p => (
                <div key={p.id} className="p-5 bg-indigo-50/30 rounded-2xl border border-indigo-100 flex justify-between items-start">
                  <div className="space-y-2 pr-4">
                    <p className="text-sm font-bold text-indigo-900 leading-relaxed">{p.text}</p>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">By {p.userName}</div>
                  </div>
                  <button
                    onClick={() => voteProposal(p.id)}
                    className="bg-white px-3 py-2 rounded-xl border border-indigo-200 text-indigo-600 font-black text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  >
                    ▲ {p.votes}
                  </button>
                </div>
              ))}
              {user.role === UserRole.STUDENT && (
                <form onSubmit={submitProposal} className="p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <input
                    type="text"
                    className="w-full bg-transparent border-none focus:outline-none text-sm font-medium mb-3"
                    placeholder="Propose a specific solution..."
                    value={newProposal}
                    onChange={e => setNewProposal(e.target.value)}
                  />
                  <button type="submit" className="text-[10px] font-black uppercase text-indigo-600 hover:underline">Submit Proposal</button>
                </form>
              )}
            </div>
          </section>

          {/* Resolution Area */}
          {issue.status === IssueStatus.RESOLVED && (
            <div className="p-8 bg-emerald-50 rounded-3xl border-2 border-emerald-100 space-y-4">
              <div className="flex items-center text-emerald-700 font-black text-lg">
                <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                OFFICIAL RESOLUTION
              </div>
              <p className="text-emerald-600 font-medium">The responsible department has filed completion evidence for this issue.</p>
              <div className="pt-2">
                <a
                  href={issue.resolutionEvidenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 text-white px-6 py-2 rounded-full font-bold text-xs inline-flex items-center hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                >
                  View Evidence Bundle
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
            {user.role === UserRole.STUDENT && issue.status !== IssueStatus.RESOLVED && (
              <button
                onClick={handleSupport}
                disabled={supportLoading || hasSupported}
                className={`flex-grow font-black px-10 py-5 rounded-2xl transition-all flex items-center justify-center shadow-lg ${hasSupported
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 transform hover:-translate-y-1'
                  }`}
              >
                {hasSupported ? 'Already Supported' : supportLoading ? 'Processing...' : 'Endorse This Issue'}
              </button>
            )}

            {user.role === UserRole.ADMIN && issue.status !== IssueStatus.RESOLVED && (
              <div className="w-full space-y-4 p-8 bg-slate-900 rounded-3xl text-white shadow-2xl">
                <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest">Admin Resolution Hub</h4>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Evidence Link (Cloud Storage)"
                    className="flex-grow bg-slate-800 px-6 py-4 rounded-2xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white font-medium"
                    value={resolutionUrl}
                    onChange={e => setResolutionUrl(e.target.value)}
                  />
                  <button
                    onClick={handleResolve}
                    className="bg-indigo-500 text-white font-black px-10 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-900/40"
                  >
                    Resolve Issue
                  </button>
                </div>
              </div>
            )}

            {issue.status === IssueStatus.RESOLVED && user.role === UserRole.STUDENT && (
              <div className="w-full p-8 bg-red-50 rounded-3xl border-2 border-red-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-red-800 text-xs uppercase tracking-widest">Contest Integrity</h4>
                  <span className="text-[10px] font-black text-red-400 bg-white px-3 py-1 rounded-full border border-red-100 uppercase">
                    Threshold: {issue.contestCount}/{CREDIBILITY_THRESHOLDS.MIN_CONTESTS_REQUIRED} Active Contests
                  </span>
                </div>
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Briefly state why this resolution is invalid..."
                    className="flex-grow px-6 py-4 rounded-2xl border border-red-200 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium text-slate-700 bg-white shadow-sm"
                    value={contestReason}
                    onChange={e => setContestReason(e.target.value)}
                  />
                  <button
                    onClick={handleContest}
                    className="bg-red-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                  >
                    File Contest
                  </button>
                </div>
                <p className="text-[10px] font-bold text-red-400 italic">Caution: Contesting requires 65+ credibility. Malicious contests result in automatic 15pt penalty.</p>
              </div>
            )}

            {/* Escalation Section for Super Admin */}
            {(issue.status === IssueStatus.CONTESTED || issue.status === IssueStatus.ESCALATED) && user.role === UserRole.SUPER_ADMIN && (
              <div className="w-full p-8 bg-purple-50 rounded-3xl border-2 border-purple-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-purple-800 text-xs uppercase tracking-widest">Leadership Escalation</h4>
                  <span className="text-[10px] font-black text-purple-400 bg-white px-3 py-1 rounded-full border border-purple-100 uppercase">
                    {issue.status === IssueStatus.ESCALATED ? '✓ Escalated' : 'Action Required'}
                  </span>
                </div>
                {issue.status !== IssueStatus.ESCALATED && (
                  <button
                    onClick={handleEscalate}
                    className="w-full bg-purple-600 text-white font-black px-10 py-4 rounded-2xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
                  >
                    Escalate to Higher Authority
                  </button>
                )}
                {issue.status === IssueStatus.ESCALATED && (
                  <div className="text-sm text-purple-700 font-medium italic p-4 bg-white rounded-xl border border-purple-200">
                    This issue has been escalated to the institutional review board for higher-level investigation and resolution.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Public Timeline */}
          <section className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Public Timeline</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{issue.timeline?.length || 0} Events</span>
            </div>

            <div className="space-y-3">
              {(issue.timeline || []).slice().reverse().map(event => (
                <div key={event.id} className="flex space-x-4 p-4 bg-slate-50 rounded-xl border border-slate-100 animate-fadeIn">
                  <div className="shrink-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${event.type === 'CREATED' ? 'bg-blue-100 text-blue-600' :
                      event.type === 'STATUS_CHANGE' ? 'bg-purple-100 text-purple-600' :
                        event.type === 'SUPPORT' ? 'bg-green-100 text-green-600' :
                          event.type === 'CONTEST' ? 'bg-red-100 text-red-600' :
                            'bg-slate-100 text-slate-600'
                      }`}>
                      {event.type === 'CREATED' ? '📝' :
                        event.type === 'STATUS_CHANGE' ? '🔄' :
                          event.type === 'SUPPORT' ? '👍' :
                            event.type === 'CONTEST' ? '⚠️' : '📌'}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-black text-slate-900">{event.userName}</span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Date(event.timestamp).toLocaleDateString()} {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{event.description}</p>
                    {event.metadata?.evidenceUrl && (
                      <a href={event.metadata.evidenceUrl} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline mt-1 inline-block">
                        View evidence →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Feedback Section */}
          <section className="space-y-6 pt-10 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">Community Feedback</h3>
              <span className="text-[10px] font-bold text-slate-400 uppercase">{issue.comments?.length || 0} Comments</span>
            </div>

            <div className="space-y-4">
              {(issue.comments || []).map(comment => (
                <div key={comment.id} className="flex space-x-4 animate-fadeIn">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 shrink-0 text-xs">
                    {comment.userName.charAt(0)}
                  </div>
                  <div className="flex-grow bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-black text-slate-900">{comment.userName}</span>
                      <span className="text-[10px] font-bold text-slate-400">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}

              <form onSubmit={submitComment} className="flex items-center space-x-4 mt-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center font-black text-indigo-400 shrink-0 text-xs">
                  {user.name.charAt(0)}
                </div>
                <input
                  type="text"
                  className="flex-grow bg-white px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm transition-all shadow-sm"
                  placeholder="Write a message to the community..."
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                />
                <button type="submit" className="bg-indigo-600 text-white p-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IssueDetail;
