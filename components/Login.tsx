import React, { useState } from 'react';
import { User } from '../types';
import { authAPI, setAuthToken } from '../services/api';

interface LoginProps {
    onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'student' | 'admin'>('student');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const data = await authAPI.login(email, password);
            setAuthToken(data.token);
            onLogin(data.user);
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    const handleDemoClick = (role: 'student' | 'admin') => {
        setActiveTab(role);
        if (role === 'student') {
            setEmail('alex@student.edu');
            setPassword('000000');
        } else {
            setEmail('sarah@admin.edu');
            setPassword('000000');
        }
    };

    return (
        <div className="min-h-screen w-full flex font-outfit">
            {/* Visual Side (Left) */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                {/* Abstract Background */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                </div>

                <div className="relative z-10 max-w-lg space-y-12">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/10 backdrop-blur-md text-white/80 text-[10px] uppercase tracking-widest font-bold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            System Operational
                        </div>
                        <h1 className="text-7xl font-display font-bold text-white leading-[0.9] tracking-tight">
                            Voice.<br />
                            Impact.<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-indigo-400">Change.</span>
                        </h1>
                        <p className="text-lg text-slate-400 font-medium leading-relaxed max-w-sm">
                            The centralized platform for student feedback, campus integrity, and rapid issue resolution.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-3xl font-display font-bold text-white mb-1">98%</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Resolution Rate</div>
                        </div>
                        <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                            <div className="text-3xl font-display font-bold text-emerald-400 mb-1">24h</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Avg Response</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Form Side (Right) */}
            <div className="w-full lg:w-1/2 bg-white flex items-center justify-center p-8 relative">
                <div className="w-full max-w-md space-y-8 animate-fadeIn">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-display font-bold text-slate-900">Welcome Back</h2>
                        <p className="text-slate-500 text-sm">Sign in to access your dashboard</p>
                    </div>

                    <div className="flex p-1 bg-slate-50 rounded-xl mb-8 border border-slate-100">
                        {(['student', 'admin'] as const).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleDemoClick(role)}
                                className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === role ? 'bg-white text-indigo-600 shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                {role}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="name@university.edu"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-brand-primary hover:shadow-lg hover:shadow-brand-primary/25 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                        Secure Authentication System v2.0
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
