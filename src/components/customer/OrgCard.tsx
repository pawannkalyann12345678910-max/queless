import React from 'react';
import { Link } from 'react-router-dom';
import type { Organization } from '../../types';
import { MapPin, ArrowRight, Layers } from 'lucide-react';

export const OrgCard: React.FC<{ organization: Organization }> = ({ organization }) => {
  return (
    <Link to={`/org/${organization.ORG_ID}`} className="block group">
      <div className="bg-white rounded-xl p-5 h-full flex flex-col justify-between border border-zinc-200 shadow-xs hover:border-zinc-400 hover:shadow-md transition-all">
        {/* Top header */}
        <div className="flex items-start gap-3.5 mb-3">
          {organization.LOGO_URL ? (
            <img
              src={organization.LOGO_URL}
              alt={organization.NAME}
              className="w-12 h-12 rounded-lg object-cover border border-zinc-200 bg-zinc-50"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-black font-bold text-lg">
              {organization.NAME.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-700">
              {organization.CATEGORY}
            </span>
            <h3 className="text-base font-bold text-black group-hover:text-blue-600 transition-colors line-clamp-1">
              {organization.NAME}
            </h3>
          </div>
        </div>

        {organization.DESCRIPTION && (
          <p className="text-xs text-zinc-500 line-clamp-2 mb-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}

        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
          <div className="flex items-center gap-3">
            {organization.CITY && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-zinc-400" />
                {organization.CITY}
              </span>
            )}
            <span className="flex items-center gap-1 text-zinc-700">
              <Layers size={13} className="text-blue-600" />
              {organization.TOTAL_QUEUES || 0} Counters
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
            View <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
};
