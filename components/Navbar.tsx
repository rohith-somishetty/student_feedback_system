
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole, Issue, IssueStatus } from '../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  issues?: Issue[];
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, issues = [] }) => {
  const location = useLocation();
  const pendingCount = issues.filter(i => i.status === IssueStatus.PENDING_APPROVAL).length;

  const navItems = [
    { label: 'Dashboard', path: '/' },
    { label: 'Browse Issues', path: '/issues' },
    { label: 'Archive', path: '/archive' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'Settings', path: '/profile' },
  ];

  return (
    <div className="fixed top-2 sm:top-6 inset-x-0 z-50 flex justify-center pointer-events-none px-4">
      <nav className="w-full max-w-6xl pointer-events-auto">
        <div className="glass-morphism rounded-2xl px-2 sm:px-6 py-3 flex justify-between items-center shadow-2xl shadow-brand-primary/10 border border-white/40 backdrop-blur-xl bg-white/60">

          {/* Logo Section */}
          <Link to="/" className="group flex items-center space-x-3 px-2">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-brand-primary to-violet-600 text-white shadow-lg shadow-indigo-500/30 overflow-hidden group-hover:scale-105 transition-all duration-300">
              <span className="font-display font-bold text-lg italic relative z-10">N</span>
              <div className="absolute inset-0 bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            </div>
            <span className="hidden sm:block font-display font-bold text-xl tracking-tight text-slate-800 group-hover:text-brand-primary transition-colors">
              Nexus
            </span>
          </Link>

          {/* Center Navigation (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-100/50 rounded-full p-1 border border-white/50 shadow-inner">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300
                    ${isActive
                      ? 'bg-white text-brand-primary shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/60'}
                  `}
                >
                  {item.label}
                  {item.path === '/' && user.role === UserRole.ADMIN && pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-white animate-pulse"></span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {user.role === UserRole.STUDENT && (
              <Link
                to="/report"
                className="hidden sm:flex bg-slate-900 hover:bg-brand-primary text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 items-center space-x-2"
              >
                <span>Report</span>
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </Link>
            )}

            <div className="h-8 w-px bg-slate-200/50 hidden sm:block"></div>

            <div className="flex items-center space-x-3 pl-0 sm:pl-2">
              <Link to="/profile" className="flex items-center space-x-3 group">
                <div className="text-right hidden lg:block">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 group-hover:text-brand-primary transition-colors">Account</div>
                  <div className="text-sm font-bold text-slate-800 leading-none group-hover:text-brand-primary transition-colors">{user.name}</div>
                </div>
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-slate-100 to-white border border-white shadow-sm flex items-center justify-center text-brand-primary font-bold text-sm ring-2 ring-transparent group-hover:ring-brand-primary/20 transition-all">
                  {user.name.charAt(0)}
                </div>
              </Link>

              <button
                onClick={onLogout}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                title="Logout"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
