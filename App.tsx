import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { User, UserRole, Issue, IssueStatus, Urgency, Department, Support } from './types';
import { MOCK_USERS, MOCK_ISSUES, DEPARTMENTS } from './constants';
import { calculatePriorityScore } from './utils/priority';
import { authAPI, usersAPI, issuesAPI, departmentsAPI, setAuthToken } from './services/api';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import IssueForm from './components/IssueForm';
import IssueList from './components/IssueList';
import IssueDetail from './components/IssueDetail';
import CredibilityStats from './components/CredibilityStats';
import Profile from './components/Profile';

const App: React.FC = () => {
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [supports, setSupports] = useState<Support[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
        const [userData, usersData, issuesData, deptsData, supportsData] = await Promise.all([
          usersAPI.getMe(),
          usersAPI.getAll(),
          issuesAPI.getAll(),
          departmentsAPI.getAll(),
          departmentsAPI.getSupports()
        ]);

        setCurrentUser(userData);
        setAllUsers(usersData);
        setIssues(issuesData);
        setDepartments(deptsData);
        setSupports(supportsData);
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
      const [usersData, issuesData, deptsData, supportsData] = await Promise.all([
        usersAPI.getAll(),
        issuesAPI.getAll(),
        departmentsAPI.getAll(),
        departmentsAPI.getSupports()
      ]);

      setAllUsers(usersData);
      setIssues(issuesData);
      setDepartments(deptsData);
      setSupports(supportsData);
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
      <div className="min-h-screen bg-slate-50">
        {currentUser && <Navbar user={currentUser} onLogout={handleLogout} issues={issues} />}

        <main className={currentUser ? 'container mx-auto px-4 py-8' : ''}>
          <Routes>
            {!currentUser ? (
              <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
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
                  />
                } />
                <Route path="/leaderboard" element={<CredibilityStats users={allUsers} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </>
            )}
          </Routes>
        </main>

        <footer className="bg-white border-t py-6 text-center text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} Nexus Platform - Student Issue Resolution & Accountability
        </footer>
      </div>
    </HashRouter>
  );
};

const LoginPage: React.FC<{ onLogin: (user: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authAPI.login(email, password);
      setAuthToken(data.token);
      onLogin(data.user);
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-indigo-600 mb-2">NEXUS</h1>
          <p className="text-slate-500 font-medium">Student Issue Resolution Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="your@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <div className="text-xs text-slate-400 text-center space-y-1">
            <p className="font-bold">Demo Accounts:</p>
            <p>Student: alex@student.edu / 000000</p>
            <p>Admin: sarah@admin.edu / 000000</p>
            <p>Leadership: leadership@institution.edu / 000000</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
