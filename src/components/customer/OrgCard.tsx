import React from 'react';
import { Link } from 'react-router-dom';
import type { Organization } from '../../types';
import { Badge } from '../common/Badge';
import { MapPin, ArrowRight, Layers } from 'lucide-react';

export const OrgCard: React.FC<{ organization: Organization }> = ({ organization }) => {
  return (
    <Link to={`/org/${organization.ORG_ID}`} className="block group">
      <div className="glass-panel-interactive rounded-3xl p-6 h-full flex flex-col justify-between border border-white/10 group-hover:border-indigo-500/40 relative overflow-hidden">
        {/* Banner preview or gradient header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            {organization.LOGO_URL ? (
              <img
                src={organization.LOGO_URL}
                alt={organization.NAME}
                className="w-14 h-14 rounded-2xl object-cover border border-white/15 bg-slate-900 shadow-md"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-slate-800 border border-white/15 flex items-center justify-center text-indigo-400 font-bold text-xl shadow-md">
                {organization.NAME.charAt(0)}
              </div>
            )}

            <div>
              <Badge variant="indigo" size="sm" className="mb-1">
                {organization.CATEGORY}
              </Badge>
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                {organization.NAME}
              </h3>
            </div>
          </div>
        </div>

        {organization.DESCRIPTION && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}

        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            {organization.CITY && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-slate-400" />
                {organization.CITY}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Layers size={13} className="text-indigo-400" />
              {organization.TOTAL_QUEUES || 0} Counters
            </span>
          </div>

          <div className="flex items-center gap-1 font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
            View Counters <ArrowRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
};
