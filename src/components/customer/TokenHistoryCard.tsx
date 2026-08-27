import React from 'react';
import type { Token } from '../../types';
import { Badge } from '../common/Badge';

export const TokenHistoryCard: React.FC<{ token: Token }> = ({ token }) => {
  return (
    <div className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-mono font-bold text-slate-200">
          {token.TOKEN_NUMBER}
        </div>
        <div>
          <h5 className="text-sm font-bold text-white line-clamp-1">{token.ORG_NAME}</h5>
          <p className="text-xs text-slate-400">{token.QUEUE_NAME} • {token.COUNTER_LABEL || 'Counter 1'}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">{token.BOOKING_DATE}</p>
        </div>
      </div>

      <div className="text-right">
        <Badge status={token.STATUS} size="sm" />
      </div>
    </div>
  );
};
