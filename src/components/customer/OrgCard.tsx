import React from 'react';
import { Link } from 'react-router-dom';
import type { Organization } from '../../types';
import { MapPin, ArrowRight, Layers, Users, Ticket, CheckCircle2 } from 'lucide-react';

export const OrgCard: React.FC<{ organization: Organization; userDistance?: number }> = ({ 
  organization,
  userDistance 
}) => {
  const displayDist = userDistance !== undefined 
    ? userDistance 
    : (organization.DISTANCE_KM !== undefined ? organization.DISTANCE_KM : 1.2);

  return (
    <div className="bg-white rounded-3xl p-6 h-full flex flex-col justify-between border border-[#EAE5DE] shadow-2xs hover:border-[#141312] hover:shadow-md transition-all group relative overflow-hidden">
      <div>
        {/* Top Header: Logo + Badges */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3">
            {organization.LOGO_URL ? (
              <img
                src={organization.LOGO_URL}
                alt={organization.NAME}
                className="w-13 h-13 rounded-2xl object-cover border border-[#EAE5DE] bg-[#FAF7F2] shadow-2xs"
              />
            ) : (
              <div className="w-13 h-13 rounded-2xl bg-[#141312] text-white flex items-center justify-center font-black text-xl shadow-2xs">
                {organization.NAME.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312]">
                  {organization.CATEGORY}
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5">
                  <CheckCircle2 size={10} /> Verified
                </span>
              </div>
              <h3 className="text-base font-black text-[#141312] group-hover:text-[#C28E5C] transition-colors line-clamp-1">
                {organization.NAME}
              </h3>
            </div>
          </div>
        </div>

        {/* Location & Distance Placard */}
        <div className="bg-[#FAF7F2] rounded-2xl p-3 border border-[#EAE5DE] mb-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#141312] font-semibold truncate">
            <MapPin size={13} className="text-[#C28E5C] shrink-0" />
            <span className="truncate">{organization.ADDRESS || organization.CITY || 'Bengaluru'}</span>
          </div>

          <span className="text-[11px] font-bold text-emerald-900 bg-emerald-100/70 px-2 py-0.5 rounded-lg shrink-0 ml-2">
            📍 {displayDist} km away
          </span>
        </div>

        {/* Description */}
        {organization.DESCRIPTION && (
          <p className="text-xs text-[#736E66] line-clamp-2 mb-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}
      </div>

      <div>
        {/* Counter Info & Live Tokens */}
        <div className="pt-3 border-t border-[#EAE5DE] flex items-center justify-between text-xs text-[#736E66] mb-4">
          <span className="flex items-center gap-1 font-bold text-[#141312]">
            <Layers size={13} className="text-[#C28E5C]" />
            {organization.TOTAL_QUEUES || 1} Live Counters
          </span>

          <span className="flex items-center gap-1 text-[#736E66] font-medium">
            <Users size={13} className="text-[#9E988E]" />
            {organization.ACTIVE_WAITING_TOKENS || 0} in queue
          </span>
        </div>

        {/* Action Button: Book Digital Pass */}
        <Link to={`/org/${organization.ORG_ID}`} className="block">
          <button className="w-full py-2.5 px-4 rounded-xl bg-[#141312] hover:bg-[#262422] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs group-hover:bg-black">
            <Ticket size={14} className="text-amber-300" />
            <span>Book Digital Pass</span>
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </Link>
      </div>
    </div>
  );
};
