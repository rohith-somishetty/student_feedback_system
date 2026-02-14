import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, Issue, IssueStatus, Urgency, Department, Support, Notification } from './types';
import { MOCK_USERS, MOCK_ISSUES, DEPARTMENTS } from './constants';
import { calculatePriorityScore } from './utils/priority';
import { authAPI, usersAPI, issuesAPI, departmentsAPI, notificationsAPI, setAuthToken } from './services/api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IssueForm from './components/IssueForm';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import MyIssues from './components/MyIssues';

import Profile from './components/Profile';
import Archive from './components/Archive';
import Login from './components/Login';

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load data from backend
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem('nexus_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Load user data
        const [userData, usersData, issuesData, deptsData, supportsData, notifsData] = await Promise.all([
          usersAPI.getMe(),
          usersAPI.getAll(),
          issuesAPI.getAll(),
          departmentsAPI.getAll(),
          departmentsAPI.getSupports(),
          notificationsAPI.getAll()
        ]);

        setCurrentUser(userData);
        setAllUsers(usersData);
        setIssues(issuesData);
        setDepartments(deptsData);
        setSupports(supportsData);
        setNotifications(notifsData.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        // If error, clear token and show login
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    // Reload all data after login
    try {
      const [usersData, issuesData, deptsData, supportsData, notifsData] = await Promise.all([
        usersAPI.getAll(),
        issuesAPI.getAll(),
        departmentsAPI.getAll(),
        departmentsAPI.getSupports(),
        notificationsAPI.getAll()
      ]);

      setAllUsers(usersData);
      setIssues(issuesData);
      setDepartments(deptsData);
      setSupports(supportsData);
      setNotifications(notifsData.data || []);
    } catch (error) {
      console.error('Failed to load data after login:', error);
    }
  };

  const handleLogout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setAllUsers([]);
    setIssues([]);
    setSupports([]);
    setNotifications([]);
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

      const result = await issuesAPI.create(formData);

      // Reload issues
      const updatedIssues = await issuesAPI.getAll();
      setIssues(updatedIssues);
    } catch (error) {
      console.error('Failed to create issue:', error);
      alert('Failed to create issue');
    }
  };

  const updateIssue = async (updatedIssue: Issue) => {
    try {
      await issuesAPI.update(updatedIssue.id, {
        status: updatedIssue.status,
        priorityScore: updatedIssue.priorityScore,
        supportCount: updatedIssue.supportCount,
        contestCount: updatedIssue.contestCount,
        resolutionEvidenceUrl: updatedIssue.resolutionEvidenceUrl
      });

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

      // Reload issues
      const updatedList = await issuesAPI.getAll();
      setIssues(updatedList);

    } catch (error) {
      console.error('Failed to update issue:', error);
      alert('Failed to update issue');
    }
  };

  const recordSupport = async (userId: string, issueId: string) => {
    try {
      await issuesAPI.support(issueId);

      // Reload issues and supports
      const [updatedIssues, updatedSupports] = await Promise.all([
        issuesAPI.getAll(),
        departmentsAPI.getSupports()
      ]);

      setIssues(updatedIssues);
      setSupports(updatedSupports);
    } catch (error) {
      console.error('Failed to record support:', error);
      alert(error.message || 'Failed to record support');
    }
  };

  const updateProfile = async (userId: string, updates: Partial<User>) => {
    try {
      await usersAPI.update(userId, updates);

      // Reload users and current user
      const [updatedUsers, updatedCurrentUser] = await Promise.all([
        usersAPI.getAll(),
        usersAPI.getMe()
      ]);

      setAllUsers(updatedUsers);
      setCurrentUser(updatedCurrentUser);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Failed to mark notification read:', error);
    }
  };

  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
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
      <div className="min-h-screen bg-slate-50 transition-colors duration-500">
        {currentUser && (
          <Navbar
            user={currentUser}
            onLogout={handleLogout}
            issues={issues}
            notifications={notifications}
            onMarkNotificationRead={markNotificationRead}
          />
        )}

        <main className={currentUser ? 'container mx-auto px-6 pt-24 pb-12' : ''}>
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
                    onApproveIssue={async (id: string) => {
                      await issuesAPI.approve(id);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onRejectIssue={async (id: string, reason?: string) => {
                      await issuesAPI.reject(id, reason);
                      setIssues(await issuesAPI.getAll());
                    }}
                  />
                } />
                <Route path="/report" element={<IssueForm user={currentUser} departments={departments} onAddIssue={addIssue} />} />
                <Route path="/my-issues" element={<MyIssues issues={sortedIssues} departments={departments} user={currentUser} />} />
                <Route path="/issues" element={<IssueList issues={sortedIssues} departments={departments} />} />
                <Route path="/profile" element={<Profile user={currentUser} onUpdateProfile={updateProfile} />} />
                <Route path="/issues/:id" element={
                  <IssueDetail
                    issues={issues}
                    users={allUsers}
                    user={currentUser}
                    supports={supports}
                    onUpdateIssue={updateIssue}
                    onRecordSupport={recordSupport}
                    onUpdateUser={updateProfile}
                    onApproveIssue={async (id: string) => {
                      await issuesAPI.approve(id);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onRejectIssue={async (id: string, reason?: string) => {
                      await issuesAPI.reject(id, reason);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onResolveIssue={async (id: string, summary: string, evidenceUrl?: string) => {
                      await issuesAPI.resolve(id, summary, evidenceUrl);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onContestIssue={async (id: string, reason: string) => {
                      await issuesAPI.contest(id, reason);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onContestDecision={async (id: string, decision: 'ACCEPT' | 'REJECT', explanation?: string) => {
                      await issuesAPI.contestDecision(id, decision, explanation);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onReResolve={async (id: string, summary: string, evidenceUrl?: string) => {
                      await issuesAPI.reResolve(id, summary, evidenceUrl);
                      setIssues(await issuesAPI.getAll());
                    }}
                    onRevalidationVote={async (id: string, voteType: 'confirm' | 'reject') => {
                      await issuesAPI.revalidationVote(id, voteType);
                      setIssues(await issuesAPI.getAll());
                    }}
                  />
                } />

                <Route path="/archive" element={<Archive issues={issues} departments={departments} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>

        <footer className="bg-white border-t py-8 text-center text-slate-400 text-[10px] uppercase tracking-widest font-black">
          &copy; {new Date().getFullYear()} Nexus Platform • Student Issue Resolution & Accountability
        </footer>
      </div>
    </HashRouter>
  );
};

export default App;
