import React, { useState } from 'react';
import { User, UserRole } from '../types';

interface ProfileProps {
  user: User;
  onUpdateProfile: (userId: string, updates: Partial<User>) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateProfile }) => {
  const [name, setName] = useState(user.name);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onUpdateProfile(user.id, { name: name.trim() });
    setMessage({ text: 'Profile updated successfully.', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fadeIn font-outfit">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/60">
        <div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">User Profile</h1>
          <p className="text-slate-500 font-medium tracking-wide">Manage your account details and view your platform impact.</p>
        </div>
        <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl border border-slate-200 shadow-sm">
          <div className={`w-3 h-3 rounded-full ${user.role === UserRole.ADMIN ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          <span className="text-xs font-black text-slate-600 uppercase tracking-widest">
            Active · {user.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Stats Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-2xl shadow-indigo-500/10 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500"></div>

            <div className="flex flex-col items-center text-center space-y-6 relative z-10 pt-4">
              <div className="w-32 h-32 bg-slate-900 rounded-[2rem] flex items-center justify-center text-5xl font-black text-white shadow-2xl shadow-slate-200 group-hover:scale-105 transition-transform duration-500">
                {user.name.charAt(0)}
              </div>

              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">{user.name}</h2>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-2 bg-indigo-50 inline-block px-3 py-1 rounded-lg">
                  {user.role} Account
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-slate-100/50">
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reputation</div>
                  <div className="text-3xl font-black text-indigo-600">{user.credibility}</div>
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md transition-all">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Number</div>
                  <div className="text-sm font-black text-slate-700 truncate" title={user.role === UserRole.STUDENT ? user.rollNumber : user.adminId}>
                    {user.role === UserRole.STUDENT ? user.rollNumber : user.adminId}
                  </div>
                </div>
              </div>
            </div>

            {/* Ambient decoration */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          </div>

          <div className="bg-amber-50 rounded-3xl p-6 border border-amber-100/50 relative overflow-hidden">
            <div className="flex items-start gap-3 relative z-10">
              <svg className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-1">Demo Mode Active</h4>
                <p className="text-[11px] font-bold text-amber-600/80 leading-relaxed">
                  Changes to your profile in this demo environment are temporary and rely on browser storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm h-full">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Edit Profile Details</h3>
            </div>

            <form onSubmit={handleUpdate} className="space-y-8">
              {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-bold animate-fadeIn ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                  {message.type === 'success' ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all text-lg"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-500 cursor-not-allowed"
                    value={user.email}
                    disabled
                  />
                  <p className="text-[10px] font-bold text-slate-300 ml-1">Email cannot be changed in demo mode</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">System Role</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-500 cursor-not-allowed uppercase"
                    value={user.role}
                    disabled
                  />
                  <p className="text-[10px] font-bold text-slate-300 ml-1">Role is assigned by administration</p>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="submit"
                  className="bg-slate-900 text-white font-black px-10 py-4 rounded-2xl hover:bg-indigo-600 transition-all shadow-xl hover:shadow-indigo-500/30 uppercase tracking-widest text-xs transform active:scale-95"
                >
                  Save Changes
                </button>
                <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest hidden md:block">
                  Secure Identity 2.0
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
