const API_URL = 'http://localhost:3001/api';

// Get auth token from localStorage
const getAuthToken = () => localStorage.getItem('nexus_token');

// Set auth token
export const setAuthToken = (token: string | null) => {
    if (token) {
        localStorage.setItem('nexus_token', token);
    } else {
        localStorage.removeItem('nexus_token');
    }
};

// API request helper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();

    const config: RequestInit = {
        ...options,
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers,
        },
    };

    if (options.body && !(options.body instanceof FormData)) {
        config.body = JSON.stringify(options.body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401) {
            // Token expired or invalid
            setAuthToken(null);
            window.location.href = '/#/login';
            throw new Error('Unauthorized');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }

        return data;
    } catch (error: any) {
        console.error('API Error:', error);
        throw error;
    }
};

// Auth API
export const authAPI = {
    login: (email: string, password: string) =>
        apiRequest('/auth/login', {
            method: 'POST',
            body: { email, password } as any,
        }),

    register: (name: string, email: string, password: string, rollNumber: string) =>
        apiRequest('/auth/register', {
            method: 'POST',
            body: { name, email, password, rollNumber } as any,
        }),
};

// Users API
export const usersAPI = {
    getAll: () => apiRequest('/users'),

    getMe: () => apiRequest('/users/me'),

    update: (id: string, data: any) =>
        apiRequest(`/users/${id}`, {
            method: 'PUT',
            body: data as any,
        }),

    getSupports: (userId: string) => apiRequest(`/users/${userId}/supports`),
};

// Issues API
export const issuesAPI = {
    getAll: () => apiRequest('/issues'),

    create: (formData: FormData) => {
        // formData should be FormData if there's a file, otherwise plain object
        return apiRequest('/issues', {
            method: 'POST',
            body: formData as any,
        });
    },

    update: (id: string, data: any) =>
        apiRequest(`/issues/${id}`, {
            method: 'PUT',
            body: data as any,
        }),

    support: (id: string) =>
        apiRequest(`/issues/${id}/support`, {
            method: 'POST',
        }),

    addComment: (id: string, text: string) =>
        apiRequest(`/issues/${id}/comments`, {
            method: 'POST',
            body: { text } as any,
        }),

    addProposal: (id: string, text: string) =>
        apiRequest(`/issues/${id}/proposals`, {
            method: 'POST',
            body: { text } as any,
        }),

    addTimelineEvent: (id: string, type: string, description: string, metadata?: any) =>
        apiRequest(`/issues/${id}/timeline`, {
            method: 'POST',
            body: { type, description, metadata } as any,
        }),

    approve: (id: string) =>
        apiRequest(`/issues/${id}/approve`, {
            method: 'POST',
        }),

    reject: (id: string, reason?: string) =>
        apiRequest(`/issues/${id}/reject`, {
            method: 'POST',
            body: { reason } as any,
        }),
};

// Departments API
export const departmentsAPI = {
    getAll: () => apiRequest('/departments'),
    getSupports: () => apiRequest('/departments/supports'),
};
