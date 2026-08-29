import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Compass, Ticket, Users, Building2 } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { user, role } = useAuth();
  const location = useLocation();

  // Don't render on HDMI display page
  if (location.pathname.startsWith('/hdmi/')) {
    return null;
  }

  const isExplore = location.pathname === '/';
  const isPasses = location.pathname === '/my-tokens';
  const isStaff = location.pathname.startsWith('/staff');
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <Link
        to="/"
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
          isExplore ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
        }`}
      >
        <Compass size={18} className={isExplore ? 'text-black' : 'text-zinc-400'} />
        <span className="text-[10px] mt-0.5">Explore</span>
      </Link>

      {user && (
        <Link
          to="/my-tokens"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            isPasses ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <Ticket size={18} className={isPasses ? 'text-black' : 'text-zinc-400'} />
          <span className="text-[10px] mt-0.5">Passes</span>
        </Link>
      )}

      {user && (role === 'STAFF' || role === 'ADMIN') && (
        <Link
          to="/staff"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            isStaff ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <Users size={18} className={isStaff ? 'text-black' : 'text-zinc-400'} />
          <span className="text-[10px] mt-0.5">Staff</span>
        </Link>
      )}

      {user && role === 'ADMIN' && (
        <Link
          to="/admin"
          className={`flex flex-col items-center justify-center py-1 px-3 rounded-lg transition-colors ${
            isAdmin ? 'text-black font-bold' : 'text-zinc-500 hover:text-black'
          }`}
        >
          <Building2 size={18} className={isAdmin ? 'text-black' : 'text-zinc-400'} />
          <span className="text-[10px] mt-0.5">Admin</span>
        </Link>
      )}
    </nav>
  );
};
