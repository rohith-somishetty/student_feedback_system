import React, { useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Issue } from './types';
import { issuesAPI } from './services/api';
import { useStore } from './store/useStore';
import { Toaster, toast } from 'sonner';

import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IssueForm from './components/IssueForm';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import MyIssues from './components/MyIssues';
import Profile from './components/Profile';
import Login from './components/Login';

const App: React.FC = () => {
  const {
    currentUser,
    allUsers,
    issues,
    departments,
    supports,
    notifications,
    loading,
    loadInitialData,
    login,
    logout,
    fetchIssues,
    supportIssue,
    markNotificationRead,
    addIssue: addIssueToStore,
    updateIssue: updateIssueInStore
  } = useStore();

  // Load data from backend
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleLogin = async (user: any) => {
    await login(user);
    toast.success(`Welcome back, ${user.name}!`);
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out successfully');
  };

  const addIssue = async (newIssue: Partial<Issue>) => {
    try {
      const formData = new FormData();
      formData.append('title', newIssue.title!);
      formData.append('description', newIssue.description!);
      formData.append('category', newIssue.category!);
      formData.append('departmentId', newIssue.departmentId!);
      formData.append('urgency', String(newIssue.urgency!));
      formData.append('deadline', newIssue.deadline!);

      await addIssueToStore(formData);
      toast.success('Complaint submitted successfully!');
    } catch (error) {
      toast.error('Failed to create issue');
    }
  };

  const updateIssue = async (updatedIssue: Issue) => {
    try {
      const updates = {
        status: updatedIssue.status,
        priorityScore: updatedIssue.priorityScore,
        supportCount: updatedIssue.supportCount,
        contestCount: updatedIssue.contestCount,
        resolutionEvidenceUrl: updatedIssue.resolutionEvidenceUrl
      };

      await updateIssueInStore(updatedIssue.id, updates);

      // Update timeline if needed
      if (updatedIssue.timeline && updatedIssue.timeline.length > 0) {
        const lastEvent = updatedIssue.timeline[updatedIssue.timeline.length - 1];
        await issuesAPI.addTimelineEvent(
          updatedIssue.id,
          lastEvent.type,
          lastEvent.description,
          lastEvent.metadata
        );
      }
      toast.success('Issue updated');
    } catch (error) {
      toast.error('Failed to update issue');
    }
  };

  const recordSupport = async (userId: string, issueId: string) => {
    try {
      await supportIssue(issueId);
      toast.success('Support recorded!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record support');
    }
  };

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      if (a.supportCount !== b.supportCount) return b.supportCount - a.supportCount;
      if (a.priorityScore !== b.priorityScore) return b.priorityScore - a.priorityScore;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [issues]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-bold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <Toaster position="top-right" richColors />
      <div className="min-h-screen relative transition-colors duration-500 bg-slate-50">
        {currentUser && (
          <div
            className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: "url('/abstract-waves.jpg')" }}
          >
            <div className="absolute inset-0 bg-black/45" />
          </div>
        )}

        <div className="relative z-10 flex flex-col min-h-screen">
          {currentUser && (
            <Navbar
              user={currentUser}
              onLogout={handleLogout}
              issues={issues}
              notifications={notifications}
              onMarkNotificationRead={markNotificationRead}
            />
          )}

          <main className={currentUser ? 'container mx-auto px-6 pt-24 pb-12 flex-grow page-enter' : 'flex-grow min-h-screen'}>
            <Routes>
              {!currentUser ? (
                <Route path="*" element={<Login onLogin={handleLogin} />} />
              ) : (
                <>
                  <Route path="/" element={
                    <Dashboard
                      issues={sortedIssues}
                      user={currentUser}
                      departments={departments}
                      supports={supports}
                      onSupportIssue={recordSupport}
                      onApproveIssue={async (id: string) => {
                        try {
                          await issuesAPI.approve(id);
                          await fetchIssues();
                          toast.success('Issue approved');
                        } catch (e) {
                          toast.error('Approval failed');
                        }
                      }}
                      onRejectIssue={async (id: string, reason?: string) => {
                        try {
                          await issuesAPI.reject(id, reason);
                          await fetchIssues();
                          toast.success('Issue rejected');
                        } catch (e) {
                          toast.error('Rejection failed');
                        }
                      }}
                    />
                  } />
                  <Route path="/report" element={<IssueForm user={currentUser} departments={departments} onAddIssue={addIssue} />} />
                  <Route path="/my-issues" element={<MyIssues issues={sortedIssues} departments={departments} user={currentUser} />} />
                  <Route path="/issues" element={<IssueList issues={sortedIssues} departments={departments} />} />
                  <Route path="/profile" element={<Profile user={currentUser} onUpdateProfile={async (uid, updates) => {
                    try {
                      await useStore.getState().loadInitialData(); // Refresh all
                      toast.success('Profile updated');
                    } catch (e) {
                      toast.error('Update failed');
                    }
                  }} />} />
                  <Route path="/issues/:id" element={
                    <IssueDetail
                      issues={issues}
                      users={allUsers}
                      user={currentUser}
                      supports={supports}
                      onUpdateIssue={updateIssue}
                      onRecordSupport={recordSupport}
                      onUpdateUser={async (uid, updates) => {
                        await useStore.getState().loadInitialData();
                        toast.success('User updated');
                      }}
                      onApproveIssue={async (id: string) => {
                        await issuesAPI.approve(id);
                        await fetchIssues();
                        toast.success('Approved');
                      }}
                      onRejectIssue={async (id: string, reason?: string) => {
                        await issuesAPI.reject(id, reason);
                        await fetchIssues();
                        toast.success('Rejected');
                      }}
                      onResolveIssue={async (id: string, summary: string, evidenceUrl?: string) => {
                        await issuesAPI.resolve(id, summary, evidenceUrl);
                        await fetchIssues();
                        toast.success('Issue marked as resolved');
                      }}
                      onContestIssue={async (id: string, reason: string) => {
                        await issuesAPI.contest(id, reason);
                        await fetchIssues();
                        toast.success('Contest submitted');
                      }}
                      onContestDecision={async (id: string, decision: 'ACCEPT' | 'REJECT', explanation?: string) => {
                        await issuesAPI.contestDecision(id, decision, explanation);
                        await fetchIssues();
                        toast.success(`Contest ${decision.toLowerCase()}ed`);
                      }}
                      onReResolve={async (id: string, summary: string, evidenceUrl?: string) => {
                        await issuesAPI.reResolve(id, summary, evidenceUrl);
                        await fetchIssues();
                        toast.success('Issue re-resolved');
                      }}
                      onRevalidationVote={async (id: string, voteType: 'confirm' | 'reject') => {
                        await issuesAPI.revalidationVote(id, voteType);
                        await fetchIssues();
                        toast.success('Vote submitted');
                      }}
                      onAddComment={async (id: string, text: string) => {
                        await issuesAPI.addComment(id, text);
                        await fetchIssues();
                        toast.success('Comment added');
                      }}
                      onAddProposal={async (id: string, text: string) => {
                        await issuesAPI.addProposal(id, text);
                        await fetchIssues();
                        toast.success('Proposal added');
                      }}
                    />
                  } />
                  <Route path="*" element={<Navigate to="/" />} />
                </>
              )}
            </Routes>
          </main>

          <footer className="bg-white/5 backdrop-blur-md border-t border-white/10 py-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-black relative z-10">
            &copy; {new Date().getFullYear()} Nexus Platform • Student Issue Resolution & Accountability
          </footer>
        </div>
      </div>
    </HashRouter>
  );
};

export default App;

