import React from 'react';
import { Link } from 'react-router-dom';
import type { Organization } from '../../types';
import { MapPin, ArrowRight, Layers } from 'lucide-react';

export const OrgCard: React.FC<{ organization: Organization }> = ({ organization }) => {
  return (
    <Link to={`/org/${organization.ORG_ID}`} className="block group">
      <div className="bg-white rounded-2xl p-5 sm:p-6 h-full flex flex-col justify-between border border-[#EAE5DE] shadow-2xs hover:border-[#C4BDAF] hover:shadow-md transition-all">
        {/* Top header */}
        <div className="flex items-start gap-3.5 mb-3">
          {organization.LOGO_URL ? (
            <img
              src={organization.LOGO_URL}
              alt={organization.NAME}
              className="w-12 h-12 rounded-xl object-cover border border-[#EAE5DE] bg-[#FAF7F2]"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center text-[#141312] font-black text-lg">
              {organization.NAME.charAt(0)}
            </div>
          )}

          <div className="space-y-1">
            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EAE5DE] text-[#736E66]">
              {organization.CATEGORY}
            </span>
            <h3 className="text-base font-bold text-[#141312] group-hover:text-[#C28E5C] transition-colors line-clamp-1">
              {organization.NAME}
            </h3>
          </div>
        </div>

        {organization.DESCRIPTION && (
          <p className="text-xs text-[#736E66] line-clamp-2 mb-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}

        <div className="pt-3 border-t border-[#EAE5DE] flex items-center justify-between text-xs text-[#736E66] font-medium">
          <div className="flex items-center gap-3">
            {organization.CITY && (
              <span className="flex items-center gap-1">
                <MapPin size={13} className="text-[#9E988E]" />
                {organization.CITY}
              </span>
            )}
            <span className="flex items-center gap-1 text-[#141312] font-semibold">
              <Layers size={13} className="text-[#C28E5C]" />
              {organization.TOTAL_QUEUES || 0} Counters
            </span>
          </div>

          <div className="flex items-center gap-1 font-bold text-[#141312] group-hover:translate-x-1 transition-transform">
            View <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </Link>
  );
};
