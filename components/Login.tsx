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
        <div className="min-h-screen w-full flex font-outfit relative overflow-hidden">
            {/* Global Background Image and Overlay */}
            <div
                className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
                style={{
                    backgroundImage: "url('/abstract-waves.jpg')",
                }}
            >
                <div className="absolute inset-0 bg-black/45" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 pointer-events-none"></div>
            </div>

            <div className="relative z-10 w-full flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-[440px] bg-[#0F172A]/60 backdrop-blur-[24px] p-10 rounded-2xl border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.7)] animate-fadeIn space-y-8">
                    <div className="flex flex-col items-center text-center space-y-5">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 p-3 shadow-2xl overflow-hidden border border-white/10 backdrop-blur-md">
                            <img src="/logo.png" alt="Nexus Logo" className="w-full h-full object-contain opacity-90 transition-opacity" />
                        </div>
                        <div className="space-y-2">
                            <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#94A3B8] text-[9px] font-black uppercase tracking-[0.25em] mb-1">
                                Authorization Layer
                            </div>
                            <h2 className="text-3xl font-display font-bold text-[#E5E7EB] leading-tight tracking-tight drop-shadow-sm">
                                <span className="flex items-center justify-center">
                                    Welcome to <span className="ml-3 font-black tracking-[0.05em] uppercase text-[#14B8A6] drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">Nexus</span>
                                    <span className="w-2 h-2 rounded-full bg-[#14B8A6] ml-2 shadow-[0_0_12px_rgba(20,184,166,0.6)]"></span>
                                </span>
                            </h2>
                        </div>
                    </div>

                    <div className="flex p-1 bg-white/5 rounded-xl mb-8 border border-white/5">
                        {(['student', 'admin'] as const).map((role) => (
                            <button
                                key={role}
                                onClick={() => handleDemoClick(role)}
                                className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === role
                                    ? 'bg-[#14B8A6] text-[#FFFFFF] shadow-[0_0_15px_rgba(20,184,166,0.25)]'
                                    : 'text-[#94A3B8] hover:text-[#E5E7EB] hover:bg-white/5'
                                    }`}
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
                                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-[#E5E7EB] font-bold focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all placeholder:text-[#475569] shadow-inner"
                                    placeholder="name@university.edu"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.15em] ml-1">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-xl bg-white/5 border border-white/10 text-[#E5E7EB] font-bold focus:outline-none focus:ring-4 focus:ring-[#14B8A6]/20 focus:border-[#14B8A6] transition-all placeholder:text-[#475569] shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#14B8A6] text-white rounded-full font-bold uppercase tracking-widest text-xs btn-elevate shadow-btn-teal active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Authenticating...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-[10px] text-[#475569] uppercase tracking-[0.2em] font-black">
                        Nexus Security Protocols v3.2
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
