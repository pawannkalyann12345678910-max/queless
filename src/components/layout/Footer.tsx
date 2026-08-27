import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, Shield, Cpu, Database } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/10 bg-slate-950/60 backdrop-blur-md mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Ticket className="text-white transform -rotate-12" size={18} />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">Queless</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Enterprise digital token & queue elimination platform. Removing physical waiting lines from clinics, banks, universities, and public counters worldwide.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="flex items-center gap-1"><Database size={14} className="text-amber-400" /> Oracle SQL Protocol</span>
              <span className="flex items-center gap-1"><Cpu size={14} className="text-indigo-400" /> Real-Time Engine</span>
              <span className="flex items-center gap-1"><Shield size={14} className="text-emerald-400" /> Firebase Auth</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">Portals</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/" className="hover:text-white transition-colors">Explore Queues</Link></li>
              <li><Link to="/my-tokens" className="hover:text-white transition-colors">My Active Passes</Link></li>
              <li><Link to="/staff" className="hover:text-white transition-colors">Staff Control Room</Link></li>
              <li><Link to="/admin" className="hover:text-white transition-colors">Admin Dashboard</Link></li>
            </ul>
          </div>

          {/* Business Onboarding */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-3">For Businesses</h4>
            <p className="text-xs text-slate-400 mb-3">Eliminate waiting lines at your hospital, branch, or campus.</p>
            <Link
              to="/admin/register"
              className="inline-flex items-center justify-center w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/20"
            >
              Register Your Business
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 Queless Platform. Built for zero physical queues.</p>
          <p className="flex items-center gap-1">Powered by Oracle Database & Cloud Architecture</p>
        </div>
      </div>
    </footer>
  );
};
