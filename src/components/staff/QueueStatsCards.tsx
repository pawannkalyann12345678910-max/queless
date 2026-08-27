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
      <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 bg-amber-500/5">
        <div className="flex items-center justify-between text-amber-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Waiting in Line</span>
          <Users size={18} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{waitingTokens.length}</span>
          <span className="text-xs text-slate-400">~{waitingTokens.length * (queue.AVG_SERVICE_MINS || 10)}m wait</span>
        </div>
      </div>

      {/* Currently Serving */}
      <div className="glass-panel rounded-2xl p-4 border border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-center justify-between text-indigo-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Currently Serving</span>
          <Hourglass size={18} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-indigo-300 font-mono">
            {calledTokens.length > 0 ? calledTokens[0].TOKEN_NUMBER : 'None'}
          </span>
          {calledTokens.length > 0 && (
            <span className="text-xs text-emerald-400 font-medium">{calledTokens[0].STATUS}</span>
          )}
        </div>
      </div>

      {/* Completed Today */}
      <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 bg-emerald-500/5">
        <div className="flex items-center justify-between text-emerald-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">Completed Today</span>
          <CheckCircle size={18} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{completedTokens.length}</span>
          <span className="text-xs text-emerald-400 font-medium">served</span>
        </div>
      </div>

      {/* No-Shows / Delays */}
      <div className="glass-panel rounded-2xl p-4 border border-rose-500/20 bg-rose-500/5">
        <div className="flex items-center justify-between text-rose-400 mb-2">
          <span className="text-xs font-bold uppercase tracking-wider">No-Shows / Delays</span>
          <AlertOctagon size={18} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-white font-mono">{noShowTokens.length}</span>
          {pendingDelays.length > 0 && (
            <span className="text-xs text-amber-400 font-bold px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
              {pendingDelays.length} delays pending
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
