import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ShieldCheck, Zap } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-200 bg-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center font-bold">
                <Ticket size={18} className="transform -rotate-12" />
              </div>
              <span className="text-lg font-black text-black tracking-tight">Queless</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-sm leading-relaxed">
              Enterprise digital token & queue elimination platform. Removing physical waiting lines from clinics, banks, universities, and public counters worldwide.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-600 pt-2 font-semibold">
              <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> 256-Bit Encrypted</span>
              <span className="flex items-center gap-1"><Zap size={14} className="text-amber-500" /> Instant Digital Pass</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">Portals</h4>
            <ul className="space-y-2 text-xs font-semibold text-zinc-600">
              <li><Link to="/" className="hover:text-black transition-colors">Explore Queues</Link></li>
              <li><Link to="/my-tokens" className="hover:text-black transition-colors">My Active Passes</Link></li>
              <li><Link to="/staff" className="hover:text-black transition-colors">Staff Control Room</Link></li>
              <li><Link to="/admin" className="hover:text-black transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Business Onboarding */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-3">For Organizations</h4>
            <p className="text-xs text-zinc-500 mb-3">Eliminate waiting lines at your hospital, branch, or campus.</p>
            <Link
              to="/admin/register"
              className="inline-flex items-center justify-center w-full px-3.5 py-2.5 rounded-lg text-xs font-bold bg-black hover:bg-zinc-800 text-white transition-colors shadow-xs"
            >
              Register Your Business
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© 2026 Queless Platform Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">Zero App Install Required • Privacy-First Design</p>
        </div>
      </div>
    </footer>
  );
};
