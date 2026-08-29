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
    <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
      {/* Board Header with Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'ALL' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            All Active ({tokens.length})
          </button>
          <button
            onClick={() => setFilterTab('WAITING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'WAITING' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Waiting ({waitingCount})
          </button>
          <button
            onClick={() => setFilterTab('SERVING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'SERVING' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Called / Serving ({servingCount})
          </button>
          <button
            onClick={() => setFilterTab('COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'COMPLETED' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            Completed ({completedCount})
          </button>
          <button
            onClick={() => setFilterTab('NO_SHOW')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterTab === 'NO_SHOW' ? 'bg-black text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
            }`}
          >
            No-Show ({noShowCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search token, name, phone..."
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      {/* Table Content */}
      {filteredTokens.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-2">
            <Inbox size={24} />
          </div>
          <h4 className="text-sm font-bold text-black">No Tokens in this View</h4>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-xs mx-auto">
            {search ? 'Try adjusting your search query' : 'New tokens booked online or issued at the counter will appear here.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                <th className="py-3 px-4">Token #</th>
                <th className="py-3 px-4">Customer Details</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Line Position</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
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
