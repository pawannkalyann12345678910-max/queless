import React from 'react';
import type { Queue, Token } from '../../types';
import { Users, CheckCircle, AlertOctagon, Hourglass } from 'lucide-react';

interface QueueStatsCardsProps {
  queue: Queue;
  tokens: Token[];
}

export const QueueStatsCards: React.FC<QueueStatsCardsProps> = ({ queue, tokens }) => {
  const waitingTokens = tokens.filter(t => t.STATUS === 'WAITING');
  const calledTokens = tokens.filter(t => t.STATUS === 'CALLED' || t.STATUS === 'SERVING');
  const completedTokens = tokens.filter(t => t.STATUS === 'COMPLETED');
  const noShowTokens = tokens.filter(t => t.STATUS === 'NO_SHOW');
  const pendingDelays = tokens.filter(t => t.DELAY_STATUS === 'REQUESTED_5M');

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Waiting Count */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">Waiting in Line</span>
          <Users size={16} className="text-amber-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-black font-mono">{waitingTokens.length}</span>
          <span className="text-xs text-zinc-500 font-medium">~{waitingTokens.length * (queue.AVG_SERVICE_MINS || 10)}m wait</span>
        </div>
      </div>

      {/* Currently Serving */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">Currently Serving</span>
          <Hourglass size={16} className="text-blue-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-blue-600 font-mono">
            {calledTokens.length > 0 ? calledTokens[0].TOKEN_NUMBER : 'None'}
          </span>
          {calledTokens.length > 0 && (
            <span className="text-xs text-emerald-700 font-bold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">{calledTokens[0].STATUS}</span>
          )}
        </div>
      </div>

      {/* Completed Today */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">Completed Today</span>
          <CheckCircle size={16} className="text-emerald-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-black font-mono">{completedTokens.length}</span>
          <span className="text-xs text-emerald-700 font-medium">served</span>
        </div>
      </div>

      {/* No-Shows / Delays */}
      <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
        <div className="flex items-center justify-between text-zinc-500 mb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider">No-Shows / Delays</span>
          <AlertOctagon size={16} className="text-red-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-black font-mono">{noShowTokens.length}</span>
          {pendingDelays.length > 0 && (
            <span className="text-xs text-amber-800 font-bold px-2 py-0.5 rounded bg-amber-50 border border-amber-200">
              {pendingDelays.length} delay req
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
