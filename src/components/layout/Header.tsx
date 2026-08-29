import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginButton } from '../auth/LoginButton';
import { 
  Ticket, 
  LogOut, 
  Building2, 
  Users, 
  Compass,
  Menu,
  X
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
            <Ticket size={18} className="transform -rotate-12" />
          </div>
          <span className="text-lg font-black tracking-tight text-black">
            Queless
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              location.pathname === '/' 
                ? 'bg-black text-white font-bold' 
                : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <Compass size={14} />
            Explore
          </Link>

          {user && (
            <Link
              to="/my-tokens"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname === '/my-tokens' 
                  ? 'bg-black text-white font-bold' 
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Ticket size={14} />
              My Passes
            </Link>
          )}

          {user && (role === 'STAFF' || role === 'ADMIN') && (
            <Link
              to="/staff"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/staff') 
                  ? 'bg-black text-white font-bold' 
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Users size={14} />
              Staff Desk
            </Link>
          )}

          {user && role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin') 
                  ? 'bg-black text-white font-bold' 
                  : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <Building2 size={14} />
              Admin Portal
            </Link>
          )}
        </nav>

        {/* User Actions / Hamburger */}
        <div className="flex items-center gap-2">
          {!user ? (
            <LoginButton />
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1">
                {user.PHOTO_URL ? (
                  <img
                    src={user.PHOTO_URL}
                    alt={user.DISPLAY_NAME}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-black text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                    {user.DISPLAY_NAME ? user.DISPLAY_NAME.charAt(0) : 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-black truncate max-w-[110px]">
                  {user.DISPLAY_NAME}
                </span>
                <span className="text-[10px] font-medium text-zinc-500 font-mono">
                  {role.toLowerCase()}
                </span>
              </div>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2.5">
                {user.PHOTO_URL ? (
                  <img
                    src={user.PHOTO_URL}
                    alt={user.DISPLAY_NAME}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-black text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.DISPLAY_NAME ? user.DISPLAY_NAME.charAt(0) : 'U'}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-black block">{user.DISPLAY_NAME}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{user.EMAIL}</span>
                </div>
              </div>

              <span className="text-[10px] font-bold text-zinc-600 uppercase px-2 py-0.5 rounded bg-zinc-100">
                {role}
              </span>
            </div>
          )}

          <nav className="space-y-1 text-sm font-semibold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                location.pathname === '/' ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Compass size={16} /> Explore Directory
            </Link>

            {user && (
              <Link
                to="/my-tokens"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  location.pathname === '/my-tokens' ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Ticket size={16} /> My Active Passes
              </Link>
            )}

            {user && (role === 'STAFF' || role === 'ADMIN') && (
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  location.pathname.startsWith('/staff') ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Users size={16} /> Staff Desk
              </Link>
            )}

            {user && role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${
                  location.pathname.startsWith('/admin') ? 'bg-black text-white' : 'text-zinc-700 hover:bg-zinc-100'
                }`}
              >
                <Building2 size={16} /> Admin Portal
              </Link>
            )}
          </nav>

          {user && (
            <div className="pt-3 border-t border-zinc-100">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
