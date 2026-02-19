import { create } from 'zustand';
import { User, Issue, Department, Support, Notification } from '../types';
import { usersAPI, issuesAPI, departmentsAPI, notificationsAPI, setAuthToken } from '../services/api';

interface AppState {
    allUsers: User[];
    currentUser: User | null;
    issues: Issue[];
    supports: Support[];
    departments: Department[];
    notifications: Notification[];
    loading: boolean;

    // Actions
    setLoading: (loading: boolean) => void;
    setCurrentUser: (user: User | null) => void;
    loadInitialData: () => Promise<void>;
    login: (user: User) => Promise<void>;
    logout: () => void;
    fetchIssues: () => Promise<void>;
    addIssue: (newIssue: FormData) => Promise<void>;
    updateIssue: (id: string, updates: any) => Promise<void>;
    supportIssue: (issueId: string) => Promise<void>;
    markNotificationRead: (id: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
    allUsers: [],
    currentUser: null,
    issues: [],
    supports: [],
    departments: [],
    notifications: [],
    loading: true,

    setLoading: (loading) => set({ loading }),
    setCurrentUser: (user) => set({ currentUser: user }),

    loadInitialData: async () => {
        set({ loading: true });
        try {
            const token = localStorage.getItem('nexus_token');
            if (!token) {
                set({ loading: false });
                return;
            }

            const results = await Promise.allSettled([
                usersAPI.getMe(),
                usersAPI.getAll(),
                issuesAPI.getAll(),
                departmentsAPI.getAll(),
                departmentsAPI.getSupports(),
                notificationsAPI.getAll()
            ]);

            const [userData, usersData, issuesData, deptsData, supportsData, notifsData] = results.map(r => r.status === 'fulfilled' ? r.value : null);

            set({
                currentUser: userData,
                allUsers: usersData || [],
                issues: issuesData ? (Array.isArray(issuesData) ? issuesData : (issuesData.issues || [])) : [],
                departments: deptsData || [],
                supports: supportsData || [],
                notifications: Array.isArray(notifsData) ? notifsData : (notifsData?.data || []),
                loading: false
            });
        } catch (error) {
            console.error('Failed to load initial data:', error);
            setAuthToken(null);
            set({ loading: false });
        }
    },

    login: async (user) => {
        set({ currentUser: user });
        try {
            const results = await Promise.allSettled([
                usersAPI.getAll(),
                issuesAPI.getAll(),
                departmentsAPI.getAll(),
                departmentsAPI.getSupports(),
                notificationsAPI.getAll()
            ]);

            const [usersData, issuesData, deptsData, supportsData, notifsData] = results.map(r => r.status === 'fulfilled' ? r.value : null);

            set({
                allUsers: usersData || [],
                issues: issuesData ? (Array.isArray(issuesData) ? issuesData : (issuesData.issues || [])) : [],
                departments: deptsData || [],
                supports: supportsData || [],
                notifications: Array.isArray(notifsData) ? notifsData : (notifsData?.data || [])
            });
        } catch (error) {
            console.error('Failed to load data after login:', error);
        }
    },

    logout: () => {
        setAuthToken(null);
        set({
            currentUser: null,
            allUsers: [],
            issues: [],
            supports: [],
            notifications: []
        });
    },

    fetchIssues: async () => {
        try {
            const data = await issuesAPI.getAll();
            // Handle both old array format and new paginated object format
            const issueList = Array.isArray(data) ? data : (data.issues || []);
            set({ issues: issueList });
        } catch (error) {
            console.error('Failed to fetch issues:', error);
        }
    },

    addIssue: async (formData: FormData) => {
        try {
            await issuesAPI.create(formData);
            await get().fetchIssues();
        } catch (error) {
            console.error('Failed to add issue:', error);
            throw error;
        }
    },

    updateIssue: async (id, updates) => {
        try {
            await issuesAPI.update(id, updates);
            await get().fetchIssues();
        } catch (error) {
            console.error('Failed to update issue:', error);
            throw error;
        }
    },

    supportIssue: async (issueId) => {
        try {
            await issuesAPI.support(issueId);
            const [updatedIssues, updatedSupports] = await Promise.all([
                issuesAPI.getAll(),
                departmentsAPI.getSupports()
            ]);
            set({ issues: updatedIssues, supports: updatedSupports });
        } catch (error: any) {
            console.error('Failed to support issue:', error);
            throw error;
        }
    },

    markNotificationRead: async (id) => {
        try {
            await notificationsAPI.markRead(id);
            set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            }));
        } catch (error) {
            console.error('Failed to mark notification read:', error);
        }
    }
}));
