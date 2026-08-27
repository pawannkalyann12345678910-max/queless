import React, { useState } from 'react';
import type { Token, Queue } from '../../types';
import { TokenRow } from './TokenRow';
import { TransferTokenModal } from './TransferTokenModal';
import { Search, Inbox } from 'lucide-react';

interface TokenQueueBoardProps {
  queue: Queue;
  tokens: Token[];
  availableQueues: Queue[];
  onRefresh: () => void;
}

export const TokenQueueBoard: React.FC<TokenQueueBoardProps> = ({
  queue,
  tokens,
  availableQueues,
  onRefresh
}) => {
  const [filterTab, setFilterTab] = useState<'ALL' | 'WAITING' | 'SERVING' | 'COMPLETED' | 'NO_SHOW'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedTokenForTransfer, setSelectedTokenForTransfer] = useState<Token | null>(null);

  // Filter tokens based on tab & search
  const filteredTokens = tokens.filter(token => {
    // Search match
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const match = 
        token.TOKEN_NUMBER.toLowerCase().includes(q) ||
        token.CUSTOMER_NAME.toLowerCase().includes(q) ||
        token.CUSTOMER_PHONE.includes(q);
      if (!match) return false;
    }

    // Tab match
    if (filterTab === 'WAITING') return token.STATUS === 'WAITING';
    if (filterTab === 'SERVING') return token.STATUS === 'CALLED' || token.STATUS === 'SERVING';
    if (filterTab === 'COMPLETED') return token.STATUS === 'COMPLETED';
    if (filterTab === 'NO_SHOW') return token.STATUS === 'NO_SHOW';

    // Default 'ALL': active queue tokens first
    return token.STATUS !== 'CANCELLED';
  });

  const waitingCount = tokens.filter(t => t.STATUS === 'WAITING').length;
  const servingCount = tokens.filter(t => t.STATUS === 'CALLED' || t.STATUS === 'SERVING').length;
  const completedCount = tokens.filter(t => t.STATUS === 'COMPLETED').length;
  const noShowCount = tokens.filter(t => t.STATUS === 'NO_SHOW').length;

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10">
      {/* Board Header with Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterTab === 'ALL' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Active ({tokens.length})
          </button>
          <button
            onClick={() => setFilterTab('WAITING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterTab === 'WAITING' ? 'bg-amber-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Waiting ({waitingCount})
          </button>
          <button
            onClick={() => setFilterTab('SERVING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterTab === 'SERVING' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Called / Serving ({servingCount})
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterTab === 'COMPLETED' ? 'bg-cyan-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterTab('NO_SHOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${
              filterTab === 'NO_SHOW' ? 'bg-rose-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            No-Show ({noShowCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search token / name / phone..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Table Content */}
      {filteredTokens.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-3">
            <Inbox size={32} />
          </div>
          <h4 className="text-base font-bold text-slate-300">No Tokens in this View</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            {search ? 'Try adjusting your search query' : 'New tokens booked online or issued at the counter will show up here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Line Position</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTokens.map(token => (
                <TokenRow
                  key={token.TOKEN_ID}
                  token={token}
                  counterLabel={queue.COUNTER_LABEL || 'Counter 1'}
                  onRefresh={onRefresh}
                  onTransferClick={(t) => setSelectedTokenForTransfer(t)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTokenForTransfer && (
        <TransferTokenModal
          token={selectedTokenForTransfer}
          availableQueues={availableQueues}
          isOpen={!!selectedTokenForTransfer}
          onClose={() => setSelectedTokenForTransfer(null)}
          onSuccess={() => {
            setSelectedTokenForTransfer(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
