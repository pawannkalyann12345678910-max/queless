import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginButton } from '../auth/LoginButton';
import { 
  Ticket, 
  LogOut, 
  Building2, 
  Users, 
  Compass
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
            <Ticket className="text-white transform -rotate-12" size={22} />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              Queless
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Live Token
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          <Link
            to="/"
            className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
              location.pathname === '/' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Compass size={16} />
            Explore Queues
          </Link>

          {user && (
            <Link
              to="/my-tokens"
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname === '/my-tokens' ? 'bg-white/10 text-white font-semibold' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Ticket size={16} />
              My Passes
            </Link>
          )}

          {user && (role === 'STAFF' || role === 'ADMIN') && (
            <Link
              to="/staff"
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/staff') ? 'bg-indigo-600/30 text-indigo-300 font-semibold border border-indigo-500/30' : 'text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/10'
              }`}
            >
              <Users size={16} />
              Staff Control
            </Link>
          )}

          {user && role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin') ? 'bg-emerald-600/30 text-emerald-300 font-semibold border border-emerald-500/30' : 'text-emerald-400 hover:text-emerald-200 hover:bg-emerald-500/10'
              }`}
            >
              <Building2 size={16} />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User Profile / Google Sign-In Actions */}
        <div className="flex items-center gap-3">
          {!user ? (
            <LoginButton />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2.5 bg-slate-900/80 border border-white/10 rounded-2xl px-3 py-1.5">
                {user.PHOTO_URL ? (
                  <img
                    src={user.PHOTO_URL}
                    alt={user.DISPLAY_NAME}
                    className="w-7 h-7 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                    {user.DISPLAY_NAME ? user.DISPLAY_NAME.charAt(0) : 'U'}
                  </div>
                )}
                <div className="text-left leading-tight">
                  <p className="text-xs font-bold text-white truncate max-w-[130px]">{user.DISPLAY_NAME}</p>
                  <p className="text-[10px] text-indigo-400 font-mono uppercase tracking-wider">{role}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl border border-white/5 transition-colors"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
