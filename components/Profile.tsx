import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole } from '../types';

interface ProfileProps {
  user: User;
  onUpdateProfile: (userId: string, updates: Partial<User>) => void;
}

/* ─── Circular Progress Ring ─── */
const TrustRing: React.FC<{ value: number; size?: number; stroke?: number }> = ({
  value,
  size = 120,
  stroke = 8,
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (animatedValue / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedValue(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const color =
    animatedValue >= 80 ? '#0D9488' : animatedValue >= 50 ? '#F59E0B' : '#EF4444';

  return (
    <div className="relative group cursor-pointer" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.34, 1.56, 0.64, 1), stroke 0.5s' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-display font-black text-[#0F172A] leading-none">{animatedValue}</span>
        <span className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mt-1">Trust</span>
      </div>
      {/* Tooltip */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
        <div className="bg-[#0F172A] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg whitespace-nowrap shadow-xl">
          Community Trust Score
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F172A] rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    // Simulate save delay
    await new Promise(resolve => setTimeout(resolve, 1200));

    onUpdateProfile(user.id, { name: name.trim() });
    setSaving(false);
    setSaved(true);
    setMessage({ text: 'Profile updated successfully!', type: 'success' });

    setTimeout(() => {
      setSaved(false);
      setMessage(null);
    }, 3000);
  };

  const recentActions = [
    { icon: '📝', label: 'Profile Updated', time: '2 hours ago' },
    { icon: '🔐', label: 'Logged in from Chrome', time: '5 hours ago' },
    { icon: '📊', label: 'Report #47 submitted', time: '1 day ago' },
    { icon: '✅', label: 'Email verified', time: '3 days ago' },
  ];

  return (
    <div className="max-w-7xl mx-auto pt-24 pb-16 px-4 sm:px-8 font-outfit animate-fadeIn">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[#E5E7EB] text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] shadow-[0_0_8px_rgba(20,184,166,0.4)]"></span>
            <span>Secure Identity</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold text-[#E5E7EB] tracking-tight leading-none">
            Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#14B8A6] to-[#0B5F5A]">Profile</span>
          </h1>
          <p className="text-[#9CA3AF] font-medium tracking-wide text-lg max-w-lg">
            Your digital identity, reputation, and account settings — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-3 bg-white/5 px-5 py-2.5 rounded-full border border-white/10 backdrop-blur-sm self-start md:self-auto">
          <div className={`w-2.5 h-2.5 rounded-full ${user.role === UserRole.ADMIN ? 'bg-indigo-400 animate-pulse' : 'bg-[#14B8A6]'} shadow-[0_0_10px_currentColor]`}></div>
          <span className="text-[10px] font-black text-[#E5E7EB] uppercase tracking-[0.15em]">
            Active · {user.role === UserRole.ADMIN ? 'Administrator' : 'Student'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ═══════════════ LEFT PANEL ═══════════════ */}
        <div className="lg:col-span-4 space-y-6">

          {/* ── Profile Card ── */}
          <div className="profile-card-hover bg-white/80 backdrop-blur-xl rounded-[28px] p-8 border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.06)] relative overflow-hidden group">
            {/* Top gradient bar */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#14B8A6] via-[#0B5F5A] to-[#0D9488]"></div>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10 pt-4">
              {/* Avatar with hover upload */}
              <div className="relative group/avatar">
                <div className="w-28 h-28 bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-2xl flex items-center justify-center text-4xl font-display font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.3)] group-hover/avatar:shadow-[0_16px_40px_rgba(15,23,42,0.4)] transition-all duration-300 group-hover/avatar:scale-105">
                  {user.name.charAt(0)}
                </div>
                <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-200 cursor-pointer">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
              </div>

              {/* Name + Badge */}
              <div>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <h2 className="text-2xl font-display font-bold text-[#0F172A] tracking-tight">{user.name}</h2>
                  {/* Verified Badge */}
                  <div className="group/badge relative">
                    <svg className="w-5 h-5 text-[#14B8A6]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover/badge:opacity-100 transition-opacity bg-[#0F172A] text-white text-[9px] font-bold px-2 py-1 rounded-md whitespace-nowrap">Verified</div>
                  </div>
                </div>
                <span className="text-[9px] font-black text-[#0B5F5A] uppercase tracking-[0.2em] bg-[#0B5F5A]/8 px-3 py-1 rounded-full">
                  {user.role === UserRole.ADMIN ? 'Administrator' : 'Student'} Account
                </span>
              </div>

              {/* Trust Ring */}
              <div className="pt-4">
                <TrustRing value={user.credibility} />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 w-full pt-4 border-t border-slate-100">
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100/80 shadow-sm text-center">
                  <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1">Member Since</div>
                  <div className="text-sm font-bold text-[#0F172A]">Jan 2026</div>
                </div>
                <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-100/80 shadow-sm text-center">
                  <div className="text-[8px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-1">ID Code</div>
                  <div className="text-sm font-bold text-[#0F172A] truncate" title={user.role === UserRole.STUDENT ? user.rollNumber : user.adminId}>
                    {user.role === UserRole.STUDENT ? user.rollNumber : user.adminId}
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient glow */}
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#14B8A6]/10 transition-colors duration-700"></div>
          </div>

          {/* ── Verification Status ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Verification Status</h4>
            <div className="space-y-3">
              {[
                { label: 'Email Verified', done: true },
                { label: 'Identity Confirmed', done: true },
                { label: 'Two-Factor Auth', done: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${item.done ? 'bg-[#14B8A6]/10 text-[#14B8A6]' : 'bg-slate-100 text-slate-400'}`}>
                      {item.done ? (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      ) : (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                      )}
                    </div>
                    <span className={`text-sm font-semibold ${item.done ? 'text-[#0F172A]' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${item.done ? 'text-[#14B8A6]' : 'text-slate-400'}`}>
                    {item.done ? 'Done' : 'Setup'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Recent Activity ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[22px] p-6 border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em]">Recent Activity</h4>
            <div className="space-y-1">
              {recentActions.map((action, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group/action">
                  <span className="text-lg group-hover/action:scale-110 transition-transform">{action.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0F172A] truncate">{action.label}</p>
                    <p className="text-[10px] font-bold text-[#94A3B8]">{action.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════ RIGHT PANEL ═══════════════ */}
        <div className="lg:col-span-8 space-y-6">

          {/* ── Form Card ── */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-8 md:p-10 border border-slate-200/80 shadow-[0_20px_60px_rgba(0,0,0,0.04)] relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-72 h-72 bg-[#14B8A6]/3 rounded-full blur-[100px] pointer-events-none"></div>

            <form ref={formRef} onSubmit={handleUpdate} className="space-y-10 relative z-10">

              {/* Success / Error Banner */}
              {message && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-bold profile-message-enter ${message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                  {message.type === 'success' ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                      <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  )}
                  {message.text}
                </div>
              )}

              {/* ─── Section: Basic Info ─── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-[#14B8A6]/10 flex items-center justify-center text-[#14B8A6]">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-[#0F172A]">Basic Information</h3>
                    <p className="text-[11px] font-medium text-[#94A3B8]">Your public display name</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Display Name</label>
                  <input
                    type="text"
                    className="w-full px-5 py-4 rounded-2xl border-2 border-transparent bg-[#F8FAFC] focus:bg-white focus:outline-none focus:border-[#14B8A6] focus:ring-4 focus:ring-[#14B8A6]/10 font-semibold text-[#0F172A] transition-all duration-200 text-base placeholder:text-[#CBD5E1]"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your display name"
                    required
                  />
                  <p className="text-[10px] font-medium text-[#94A3B8] ml-1">This is how other users will see you across the platform</p>
                </div>
              </div>

              {/* ─── Section: Account Info ─── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-[#0F172A]">Account Details</h3>
                    <p className="text-[11px] font-medium text-[#94A3B8]">Managed by your institution</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Email Address</label>
                    <div className="relative">
                      <input
                        type="email"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-[#94A3B8] cursor-not-allowed pr-12"
                        value={user.email}
                        disabled
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-[#CBD5E1] ml-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Locked — managed by administration
                    </p>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-[#64748B] uppercase tracking-[0.15em] ml-1">Assigned Role</label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-5 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-semibold text-[#94A3B8] cursor-not-allowed uppercase tracking-wider pr-12"
                        value={user.role === UserRole.ADMIN ? 'Administrator' : 'Student'}
                        disabled
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                    </div>
                    <p className="text-[10px] font-medium text-[#CBD5E1] ml-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      Assigned by your institution
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── Section: Security ─── */}
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-[#0F172A]">Security</h3>
                    <p className="text-[11px] font-medium text-[#94A3B8]">Authentication managed via Supabase SSO</p>
                  </div>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-[#F8FAFC] border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <svg className="w-5 h-5 text-[#14B8A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">Password & Authentication</p>
                      <p className="text-[10px] font-medium text-[#94A3B8]">Managed through your SSO provider</p>
                    </div>
                  </div>
                  <button type="button" className="text-[10px] font-black text-[#14B8A6] uppercase tracking-wider hover:text-[#0B5F5A] transition-colors px-4 py-2 rounded-xl hover:bg-[#14B8A6]/5">
                    Manage →
                  </button>
                </div>
              </div>

              {/* ─── CTA ─── */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="submit"
                  disabled={saving || name.trim() === user.name}
                  className={`
                    relative overflow-hidden w-full sm:w-auto px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-[0.15em]
                    transition-all duration-300 transform
                    ${saving
                      ? 'bg-[#14B8A6] text-white animate-pulse cursor-wait'
                      : saved
                        ? 'bg-emerald-500 text-white shadow-[0_8px_25px_rgba(16,185,129,0.3)]'
                        : name.trim() === user.name
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#14B8A6] to-[#0B5F5A] text-white shadow-[0_8px_25px_rgba(20,184,166,0.3)] hover:shadow-[0_12px_35px_rgba(20,184,166,0.4)] hover:-translate-y-0.5 active:scale-[0.98]'
                    }
                  `}
                >
                  {saving ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Saving...
                    </span>
                  ) : saved ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      Saved!
                    </span>
                  ) : (
                    'Save Changes'
                  )}
                </button>

                <p className="text-[10px] font-bold text-[#CBD5E1] uppercase tracking-[0.15em] hidden sm:block">
                  Nexus Identity v2.0
                </p>
              </div>
            </form>
          </div>

          {/* ── Demo Mode Notice ── */}
          <div className="bg-amber-50/80 backdrop-blur-sm rounded-2xl p-5 border border-amber-100/60 relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
              <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-0.5">Demo Mode Active</h4>
                <p className="text-[11px] font-semibold text-amber-600/80 leading-relaxed">
                  Profile changes in this environment are temporary and stored locally in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
