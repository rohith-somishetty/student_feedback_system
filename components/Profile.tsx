
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
    setMessage({ text: 'Identity data updated successfully.', type: 'success' });
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <header>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Identity Workspace</h1>
        <p className="text-slate-500 font-medium">Manage your active session details and identity footprint.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-sm text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600"></div>
            <div className="w-24 h-24 bg-slate-900 rounded-3xl mx-auto flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-slate-100">
              {user.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900">{user.name}</h2>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mt-1">{user.role}</p>
            </div>
            <div className="pt-6 grid grid-cols-2 gap-4 border-t border-slate-50">
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">Credibility</div>
                <div className="text-xl font-black text-indigo-600">{user.credibility}</div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">ID Profile</div>
                <div className="text-xs font-black text-slate-800 break-all">{user.role === UserRole.STUDENT ? user.rollNumber : user.adminId}</div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 font-black text-xs uppercase tracking-widest">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              <span>Demo Mode</span>
            </div>
            <p className="text-[11px] text-amber-600 font-bold leading-relaxed">
              Authentication is currently disabled for this hackathon preview. Session persistence relies on browser local storage.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-10 rounded-3xl border-2 border-slate-100 shadow-sm space-y-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Public Profile Details</h3>
            </div>

            <form onSubmit={handleUpdate} className="space-y-6">
              {message && (
                <div className={`p-5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all animate-fadeIn ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'
                  }`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                <input
                  type="text"
                  className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 focus:outline-none focus:border-indigo-600 font-bold text-slate-700 transition-all shadow-sm"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-50">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Email</label>
                  <input
                    type="email"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-400 cursor-not-allowed"
                    value={user.email}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Role</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold text-slate-400 cursor-not-allowed uppercase"
                    value={user.role}
                    disabled
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                <button
                  type="submit"
                  className="bg-indigo-600 text-white font-black px-12 py-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 uppercase tracking-widest text-xs"
                >
                  Save Profile Changes
                </button>
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Locked ID Verification</span>
              </div>
            </form>
          </div>

          <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.9L10 1.55l7.834 3.35a1 1 0 01.666.945V14a2 2 0 01-2 2h-12a2 2 0 01-2-2V5.845a1 1 0 01.666-.945zM10 3.35L3.5 6.133V14h13V6.133L10 3.35zM10 6a1 1 0 00-1 1v2a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            </div>
            <h4 className="font-black text-indigo-400 uppercase tracking-widest text-xs mb-3">Blockchain Integrity Note</h4>
            <p className="text-sm text-slate-400 font-medium leading-relaxed">
              Every action you perform on Nexus is cryptographically linked to your Roll Number. Your credibility index determines the weight of your votes in the public resolution algorithm.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
