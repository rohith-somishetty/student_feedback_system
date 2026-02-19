
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, UserRole, Issue, IssueStatus, Notification } from '../types';
import { useState, useEffect } from 'react';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  issues?: Issue[];
  notifications?: Notification[];
  onMarkNotificationRead?: (id: string) => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, issues = [], notifications = [], onMarkNotificationRead }) => {
  const location = useLocation();
  const pendingCount = issues.filter(i => i.status === IssueStatus.PENDING_APPROVAL).length;
  const unreadNotifications = notifications.filter(n => !n.read);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down
        setIsVisible(false);
      } else {
        // Scrolling up
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Feed', path: '/issues' },
    ...(user.role === UserRole.STUDENT ? [{ label: 'Activity', path: '/my-issues' }] : []),
  ];

  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <div className={`fixed top-1 sm:top-3 inset-x-0 z-50 flex justify-center pointer-events-none px-4 transition-all duration-500 ease-in-out transform ${isVisible ? 'translate-y-0 opacity-100' : '-translate-y-32 opacity-0'}`}>
      <nav className="w-full max-w-7xl pointer-events-auto">
        <div className="bg-brand-navy rounded-2xl px-2 sm:px-6 py-3 flex justify-between items-center shadow-2xl shadow-brand-navy/20 border border-slate-700">

          {/* Logo Section */}
          <Link to="/" className="group flex items-center space-x-3 px-2">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl bg-slate-700/50 border border-slate-600/50 shadow-lg overflow-hidden group-hover:scale-105 transition-all duration-300">
              <img src="/logo.png" alt="Nexus Logo" className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="hidden sm:flex flex-col items-start -space-y-1">
              <span className="font-display font-black text-2xl tracking-[0.15em] text-[#1E6F78] uppercase flex items-center">
                NEXUS
                <span className="w-1.5 h-1.5 rounded-full bg-brand-primary ml-2 animate-pulse shadow-[0_0_12px_rgba(13,148,136,1)]"></span>
              </span>
              <span className="text-[8px] font-black text-[#9CA3AF] uppercase tracking-[0.4em] group-hover:text-white transition-colors">Student Voice Platform</span>
            </div>
          </Link>

          {/* Center Navigation (Desktop) */}
          <div className="hidden md:flex items-center bg-slate-800/50 rounded-full p-1 border border-slate-700">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    relative px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 whitespace-nowrap
                    ${isActive
                      ? 'bg-slate-dark text-white shadow-lg shadow-slate-dark/20'
                      : 'text-[#9CA3AF] hover:text-white hover:bg-nav-hover'}
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
                className="hidden sm:flex btn-elevate bg-gradient-to-r from-[#0B5F5A] to-[#14B8A6] hover:from-[#0D9488] hover:to-[#0B5F5A] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_-5px_rgba(11,95,90,0.5)] active:scale-95 items-center space-x-2 border border-white/10"
              >
                <span>New Report</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
              </Link>
            )}

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center rounded-full text-[#9CA3AF] hover:bg-white/10 hover:text-white transition-colors relative"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-slate-900 animate-pulse"></span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-[14px] shadow-dropdown border border-[#E5E7EB] overflow-hidden z-[100] dropdown-enter p-2">
                  <div className="px-3 py-2.5 bg-[#F1F5F9] rounded-[10px] mb-1 flex justify-between items-center">
                    <h3 className="font-bold text-[#334155] text-xs uppercase tracking-wider">Notifications</h3>
                    <span className="text-[10px] bg-[#0B5F5A]/10 text-[#0B5F5A] px-2 py-0.5 rounded-full font-bold">{unreadNotifications.length} new</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto space-y-1">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-[#94A3B8] text-xs font-medium">No system alerts</div>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          className={`px-3 py-2.5 rounded-[10px] dropdown-item cursor-pointer ${n.read ? 'opacity-60 hover:bg-[#F1F5F9]' : 'bg-[#0B5F5A]/5 text-[#0B5F5A] hover:bg-[#0B5F5A]/10'}`}
                          onClick={() => {
                            if (!n.read && onMarkNotificationRead) onMarkNotificationRead(n.id);
                          }}
                        >
                          <p className="text-xs font-medium mb-1">{n.message}</p>
                          <p className={`text-[9px] font-bold uppercase tracking-widest ${n.read ? 'text-[#94A3B8]' : 'text-[#0B5F5A]/60'}`}>
                            {new Date(n.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-slate-700/50 hidden sm:block"></div>

            <div className="relative group">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-3 group outline-none"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600/50 flex items-center justify-center text-[#14B8A6] font-display font-black text-sm ring-2 ring-transparent group-hover:ring-[#14B8A6]/30 transition-all shadow-lg overflow-hidden relative">
                  <div className="absolute inset-0 bg-[#14B8A6]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  {user.name.charAt(0)}
                </div>
              </button>

              {/* User Dropdown Menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-4 w-56 bg-white rounded-2xl shadow-dropdown border border-slate-100 overflow-hidden z-[100] dropdown-enter">
                  <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 truncate">{user.name}</p>
                    <p className="text-[9px] font-bold text-[#0B5F5A] mt-1 bg-[#0B5F5A]/5 px-2 py-0.5 rounded w-fit uppercase tracking-tighter">{user.role}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all group/item"
                    >
                      <div className="p-1.5 rounded-lg bg-slate-100 group-hover/item:bg-[#0B5F5A]/10 group-hover/item:text-[#0B5F5A] transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">My Profile</span>
                    </Link>

                    <button
                      onClick={onLogout}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all group/item"
                    >
                      <div className="p-1.5 rounded-lg bg-rose-50 group-hover/item:bg-rose-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
