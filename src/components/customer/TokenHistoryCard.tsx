import React from 'react';
import type { Token } from '../../types';
import { Badge } from '../common/Badge';
import { XCircle, CheckCircle2, AlertOctagon } from 'lucide-react';

export const TokenHistoryCard: React.FC<{ token: Token }> = ({ token }) => {
  const isCancelled = token.STATUS === 'CANCELLED';
  const isNoShow = token.STATUS === 'NO_SHOW';
  const isCompleted = token.STATUS === 'COMPLETED';

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#EAE5DE] shadow-xs flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center font-mono font-bold text-[#141312]">
            {token.TOKEN_NUMBER}
          </div>
          <div>
            <h5 className="text-sm font-bold text-[#141312] line-clamp-1">{token.ORG_NAME}</h5>
            <p className="text-xs text-[#736E66]">{token.QUEUE_NAME} • {token.COUNTER_LABEL || 'Counter 1'}</p>
            <p className="text-[11px] text-[#9E988E] mt-0.5">{token.BOOKING_DATE}</p>
          </div>
        </div>

        <div className="text-right">
          <Badge status={token.STATUS} size="sm" />
        </div>
      </div>

      {/* Staff Declined / Cancelled Explanation Banner */}
      {isCancelled && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2 shadow-2xs">
          <XCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Pass Cancelled / Declined</span>
            The counter staff was unable to accept this request or the pass was cancelled. Please try again later.
          </div>
        </div>
      )}

      {isNoShow && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2 shadow-2xs">
          <AlertOctagon size={14} className="text-amber-600 shrink-0" />
          <span>Marked as No-Show. Please book a new pass when present.</span>
        </div>
      )}

      {isCompleted && (
        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-1.5 shadow-2xs">
          <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
          <span>Service completed successfully.</span>
        </div>
      )}
    </div>
  );
};
