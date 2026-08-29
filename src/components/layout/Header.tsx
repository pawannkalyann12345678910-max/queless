import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginButton } from '../auth/LoginButton';
import { CustomerSettingsModal } from '../customer/CustomerSettingsModal';
import { 
  Ticket, 
  LogOut, 
  Building2, 
  Users, 
  Compass,
  Menu,
  X,
  Settings
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#EAE5DE] bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link to="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-[#141312] text-white flex items-center justify-center font-bold shadow-xs">
            <Ticket size={18} className="transform -rotate-12" />
          </div>
          <span className="text-lg font-black tracking-tight text-[#141312]">
            Queless
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-[#736E66]">
          <Link
            to="/"
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
              location.pathname === '/' 
                ? 'bg-[#141312] text-white font-bold' 
                : 'text-[#736E66] hover:text-[#141312] hover:bg-[#F5F1E9]'
            }`}
          >
            <Compass size={14} />
            Explore
          </Link>

          {user && (
            <Link
              to="/my-tokens"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/my-tokens') 
                  ? 'bg-[#141312] text-white font-bold' 
                  : 'text-[#736E66] hover:text-[#141312] hover:bg-[#F5F1E9]'
              }`}
            >
              <Ticket size={14} />
              My Passes
            </Link>
          )}

          {user && (role === 'STAFF' || role === 'ADMIN') && (
            <Link
              to="/staff"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/staff') 
                  ? 'bg-[#141312] text-white font-bold' 
                  : 'text-[#736E66] hover:text-[#141312] hover:bg-[#F5F1E9]'
              }`}
            >
              <Users size={14} />
              Staff Desk
            </Link>
          )}

          {user && role === 'ADMIN' && (
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 ${
                location.pathname.startsWith('/admin') 
                  ? 'bg-[#141312] text-white font-bold' 
                  : 'text-[#736E66] hover:text-[#141312] hover:bg-[#F5F1E9]'
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
            <div className="hidden md:flex items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                title="Account & Profile Settings"
                className="flex items-center gap-2 border border-[#EAE5DE] hover:border-[#C4BDAF] rounded-full py-1 px-2.5 bg-[#FAF7F2] hover:bg-[#F5F1E9] transition-all cursor-pointer shadow-2xs"
              >
                {user.PHOTO_URL ? (
                  <img
                    src={user.PHOTO_URL}
                    alt={user.DISPLAY_NAME}
                    className="w-6 h-6 rounded-full object-cover shrink-0 border border-[#EAE5DE]"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-[#141312] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.DISPLAY_NAME ? user.DISPLAY_NAME.charAt(0) : 'U'}
                  </div>
                )}
                <span className="text-xs font-bold text-[#141312] max-w-[120px] truncate">
                  {user.DISPLAY_NAME}
                </span>
                <Settings size={13} className="text-[#9E988E] hover:text-[#141312]" />
              </button>

              <button
                onClick={handleSignOut}
                title="Sign Out"
                className="text-[#736E66] hover:text-red-600 p-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#141312] hover:bg-[#F5F1E9] border border-[#EAE5DE] transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EAE5DE] bg-white/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-150">
          {user && (
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE5DE]">
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="flex items-center gap-2.5 text-left cursor-pointer"
              >
                {user.PHOTO_URL ? (
                  <img
                    src={user.PHOTO_URL}
                    alt={user.DISPLAY_NAME}
                    className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#EAE5DE]"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#141312] text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {user.DISPLAY_NAME ? user.DISPLAY_NAME.charAt(0) : 'U'}
                  </div>
                )}
                <div>
                  <span className="text-xs font-bold text-[#141312] flex items-center gap-1">
                    {user.DISPLAY_NAME} <Settings size={12} className="text-[#9E988E]" />
                  </span>
                  <span className="text-[10px] text-[#736E66] font-mono">{user.EMAIL}</span>
                </div>
              </button>

              <span className="text-[10px] font-bold text-[#736E66] uppercase px-2 py-0.5 rounded-lg bg-[#FAF7F2] border border-[#EAE5DE]">
                {role}
              </span>
            </div>
          )}

          <nav className="space-y-1 text-sm font-semibold">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2 rounded-xl transition-colors ${
                location.pathname === '/' 
                  ? 'bg-[#141312] text-white' 
                  : 'text-[#736E66] hover:bg-[#F5F1E9]'
              }`}
            >
              Explore Queues
            </Link>

            {user && (
              <Link
                to="/my-tokens"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl transition-colors ${
                  location.pathname.startsWith('/my-tokens') 
                    ? 'bg-[#141312] text-white' 
                    : 'text-[#736E66] hover:bg-[#F5F1E9]'
                }`}
              >
                My Digital Passes
              </Link>
            )}

            {user && (role === 'STAFF' || role === 'ADMIN') && (
              <Link
                to="/staff"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl transition-colors ${
                  location.pathname.startsWith('/staff') 
                    ? 'bg-[#141312] text-white' 
                    : 'text-[#736E66] hover:bg-[#F5F1E9]'
                }`}
              >
                Staff Desk
              </Link>
            )}

            {user && role === 'ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-xl transition-colors ${
                  location.pathname.startsWith('/admin') 
                    ? 'bg-[#141312] text-white' 
                    : 'text-[#736E66] hover:bg-[#F5F1E9]'
                }`}
              >
                Admin Portal
              </Link>
            )}
          </nav>

          {user && (
            <div className="pt-2 border-t border-[#EAE5DE] flex items-center justify-between">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsSettingsOpen(true);
                }}
                className="text-xs font-bold text-[#141312] flex items-center gap-1.5 p-1 cursor-pointer"
              >
                <Settings size={14} /> Edit Profile
              </button>

              <button
                onClick={handleSignOut}
                className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 p-1 cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Profile Settings Modal */}
      {isSettingsOpen && (
        <CustomerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </header>
  );
};
