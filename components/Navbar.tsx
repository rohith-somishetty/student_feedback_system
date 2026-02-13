
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Browse Issues', path: '/issues' },
    { label: 'Leaderboard', path: '/leaderboard' },
    ...(user.role === UserRole.SUPER_ADMIN ? [{ label: 'Governance', path: '/governance' }] : []),
    { label: 'Settings', path: '/profile' },
  ];

  return (
    <nav className="bg-white border-b sticky top-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-12">
            <Link to="/" className="text-2xl font-black text-indigo-600 italic tracking-tighter">NEXUS</Link>
            <div className="hidden lg:flex space-x-8">
              {navItems.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all hover:text-indigo-600 ${location.pathname === item.path ? 'text-indigo-600 border-b-2 border-indigo-600 pb-1' : 'text-slate-400'
                    }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {user.role === UserRole.STUDENT && (
              <Link
                to="/report"
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-slate-200"
              >
                File Report
              </Link>
            )}

            <div className="flex items-center space-x-4 border-l pl-6">
              <Link to="/profile" className="flex items-center space-x-3 group">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase">{user.name}</div>
                  <div className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">{user.role}</div>
                </div>
                <div className="h-10 w-10 rounded-xl bg-indigo-50 border-2 border-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                  {user.name.charAt(0)}
                </div>
              </Link>
              <button
                onClick={onLogout}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
                title="Terminate Session"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
