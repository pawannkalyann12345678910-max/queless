import React, { useState } from 'react';
import type { Token, Queue } from '../../types';
import { TokenRow } from './TokenRow';
import { TransferTokenModal } from './TransferTokenModal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Search, 
  Inbox, 
  Zap, 
  BellRing, 
  History, 
  Phone, 
  Mail, 
  User as UserIcon,
  Download,
  Layers,
  ArrowLeft
} from 'lucide-react';

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
  // Default to 'ACTIVE' so completed/no-show tokens are immediately cleared from the live queue
  const [filterTab, setFilterTab] = useState<'ACTIVE' | 'WAITING' | 'SERVING' | 'HISTORY'>('ACTIVE');
  const [search, setSearch] = useState('');
  const [autoNotifyEnabled, setAutoNotifyEnabled] = useState(true);
  const [selectedTokenForTransfer, setSelectedTokenForTransfer] = useState<Token | null>(null);

  // Split tokens into active queue vs previous customer history
  const activeTokens = tokens.filter(t => t.STATUS === 'WAITING' || t.STATUS === 'CALLED' || t.STATUS === 'SERVING');
  const historyTokens = tokens.filter(t => t.STATUS === 'COMPLETED' || t.STATUS === 'NO_SHOW' || t.STATUS === 'CANCELLED');

  // Filter tokens based on tab & search
  const displayedTokens = (filterTab === 'HISTORY' ? historyTokens : activeTokens).filter(token => {
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const match = 
        token.TOKEN_NUMBER.toLowerCase().includes(q) ||
        token.CUSTOMER_NAME.toLowerCase().includes(q) ||
        token.CUSTOMER_PHONE.includes(q) ||
        (token.CUSTOMER_EMAIL && token.CUSTOMER_EMAIL.toLowerCase().includes(q));
      if (!match) return false;
    }

    if (filterTab === 'WAITING') return token.STATUS === 'WAITING';
    if (filterTab === 'SERVING') return token.STATUS === 'CALLED' || token.STATUS === 'SERVING';
    return true;
  });

  const waitingCount = tokens.filter(t => t.STATUS === 'WAITING').length;
  const servingCount = tokens.filter(t => t.STATUS === 'CALLED' || t.STATUS === 'SERVING').length;
  const completedCount = tokens.filter(t => t.STATUS === 'COMPLETED').length;
  const noShowCount = tokens.filter(t => t.STATUS === 'NO_SHOW').length;

  // Export Customer History to CSV
  const handleExportCSV = () => {
    const headers = ['Token Number', 'Customer Name', 'Phone', 'Gmail / Email', 'Status', 'Date', 'Served Time', 'Service Notes'];
    const rows = historyTokens.map(t => [
      t.TOKEN_NUMBER,
      `"${t.CUSTOMER_NAME.replace(/"/g, '""')}"`,
      t.CUSTOMER_PHONE,
      t.CUSTOMER_EMAIL || '',
      t.STATUS,
      t.BOOKING_DATE || t.CREATED_AT.slice(0, 10),
      t.COMPLETED_AT || t.CALLED_AT || '',
      `"${(t.SERVICE_NOTE || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `customer_history_${queue.NAME || 'queue'}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs space-y-5">
      {/* Board Header with Tabs, Auto-Notify Switch, History Button & Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-[#EAE5DE]">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterTab('ACTIVE')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'ACTIVE' ? 'bg-[#141312] text-white shadow-xs' : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
            }`}
          >
            <Layers size={13} className={filterTab === 'ACTIVE' ? 'text-amber-300' : 'text-[#9E988E]'} />
            <span>⚡ Active Queue ({activeTokens.length})</span>
          </button>
          
          <button
            onClick={() => setFilterTab('WAITING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'WAITING' ? 'bg-[#141312] text-white shadow-xs' : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
            }`}
          >
            Waiting ({waitingCount})
          </button>
          
          <button
            onClick={() => setFilterTab('SERVING')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              filterTab === 'SERVING' ? 'bg-[#141312] text-white shadow-xs' : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
            }`}
          >
            Serving ({servingCount})
          </button>

          {/* Simple Keyword: HISTORY TAB BUTTON */}
          <button
            onClick={() => setFilterTab('HISTORY')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              filterTab === 'HISTORY' 
                ? 'bg-black text-white shadow-xs ring-2 ring-zinc-800' 
                : 'bg-[#FAF7F2] text-[#141312] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
            }`}
          >
            <History size={14} className={filterTab === 'HISTORY' ? 'text-amber-300' : 'text-[#C28E5C]'} />
            <span>📜 History ({historyTokens.length})</span>
          </button>
        </div>

        {/* Right: Auto-Notify Mode Switch, Export & Search */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Automatic vs Manual WhatsApp Alert Toggle */}
          {filterTab !== 'HISTORY' && (
            <button
              onClick={() => setAutoNotifyEnabled(!autoNotifyEnabled)}
              title={autoNotifyEnabled ? "Auto-Notify ON: WhatsApp & SMS sent automatically on Call" : "Manual Notify: Click Notify button per token"}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                autoNotifyEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
              }`}
            >
              {autoNotifyEnabled ? (
                <>
                  <Zap size={13} className="text-amber-300 animate-pulse" />
                  <span>⚡ Auto-Notify: ON</span>
                </>
              ) : (
                <>
                  <BellRing size={13} className="text-[#9E988E]" />
                  <span>✋ Manual Notify</span>
                </>
              )}
            </button>
          )}

          {/* Export CSV Button (When viewing History) */}
          {filterTab === 'HISTORY' && historyTokens.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download size={13} />}
              className="text-xs px-3 py-2 rounded-xl font-bold border-[#EAE5DE] text-[#141312] cursor-pointer"
            >
              Export CSV
            </Button>
          )}

          {/* Search input */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9E988E]" size={14} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="w-full pl-8 pr-3 py-2 bg-[#FAF7F2] border border-[#EAE5DE] rounded-xl text-xs text-[#141312] placeholder-[#9E988E] focus:outline-none focus:ring-1 focus:ring-[#141312] focus:border-[#141312]"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: ACTIVE LIVE QUEUE VIEW (Waiting & Serving ONLY) */}
      {filterTab !== 'HISTORY' ? (
        displayedTokens.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center mx-auto text-[#9E988E] mb-2">
              <Inbox size={24} />
            </div>
            <h4 className="text-sm font-bold text-[#141312]">
              {search ? 'No Tokens Matching Your Search' : 'Active Queue is All Clear!'}
            </h4>
            <p className="text-xs text-[#736E66] mt-0.5 max-w-xs mx-auto">
              {search ? 'Try searching a different name, phone or token' : 'All waiting customers have been served. Click the "📜 History" button to view past completed customer records.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#EAE5DE] text-[11px] font-bold uppercase tracking-wider text-[#736E66] bg-[#FAF7F2]">
                  <th className="py-3 px-4 rounded-l-xl">Token #</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone / WhatsApp</th>
                  <th className="py-3 px-4">Gmail ID & Details</th>
                  <th className="py-3 px-4">Queue Status</th>
                  <th className="py-3 px-4">Position</th>
                  <th className="py-3 px-4 text-right rounded-r-xl">Staff Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE5DE]">
                {displayedTokens.map(token => (
                  <TokenRow
                    key={token.TOKEN_ID}
                    token={token}
                    counterLabel={queue.COUNTER_LABEL || 'Counter 1'}
                    autoNotifyEnabled={autoNotifyEnabled}
                    onRefresh={onRefresh}
                    onTransferClick={(t) => setSelectedTokenForTransfer(t)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : (
        /* VIEW 2: SIMPLE CUSTOMER HISTORY VIEW (When History Icon / Button is clicked) */
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#FAF7F2] p-4 rounded-2xl border border-[#EAE5DE]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#141312] text-white flex items-center justify-center font-bold">
                <History size={18} className="text-[#C28E5C]" />
              </div>
              <div>
                <h4 className="text-sm font-black text-[#141312]">Customer History & Past Records</h4>
                <p className="text-xs text-[#736E66]">
                  Showing previous completed and no-show customers with separated phone, Gmail ID, and served timestamps.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                ✅ Completed: {completedCount}
              </span>
              <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                ⚠️ No-Shows: {noShowCount}
              </span>
              <button
                onClick={() => setFilterTab('ACTIVE')}
                className="px-3 py-1.5 bg-white border border-[#EAE5DE] hover:bg-zinc-100 text-black rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft size={12} /> Back to Live Queue
              </button>
            </div>
          </div>

          {displayedTokens.length === 0 ? (
            <div className="text-center py-16 text-xs text-[#736E66]">
              No previous customer history records found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#EAE5DE] text-[11px] font-bold uppercase tracking-wider text-[#736E66] bg-[#FAF7F2]">
                    <th className="py-3 px-4 rounded-l-xl">Token #</th>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Gmail / Email ID</th>
                    <th className="py-3 px-4">Date & Served Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 rounded-r-xl">Service Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE5DE]">
                  {displayedTokens.map(token => (
                    <tr key={token.TOKEN_ID} className="hover:bg-[#FAF7F2] transition-colors">
                      {/* Token # */}
                      <td className="py-3.5 px-4 font-mono font-black text-sm text-[#141312]">
                        {token.TOKEN_NUMBER}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#FAF7F2] border border-[#EAE5DE] text-[#141312] flex items-center justify-center font-bold text-xs">
                            <UserIcon size={12} />
                          </div>
                          <span className="font-bold text-sm text-[#141312]">{token.CUSTOMER_NAME}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-xs text-[#141312] font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Phone size={12} className="text-[#9E988E]" />
                          <span>{token.CUSTOMER_PHONE}</span>
                        </div>
                      </td>

                      {/* Gmail ID */}
                      <td className="py-3.5 px-4 text-xs text-[#736E66]">
                        {token.CUSTOMER_EMAIL ? (
                          <div className="flex items-center gap-1.5 truncate max-w-xs">
                            <Mail size={12} className="text-[#9E988E] shrink-0" />
                            <span className="truncate">{token.CUSTOMER_EMAIL}</span>
                          </div>
                        ) : (
                          <span className="text-[#9E988E]">-</span>
                        )}
                      </td>

                      {/* Date & Served Time */}
                      <td className="py-3.5 px-4 text-xs text-[#736E66] font-mono">
                        <div>{token.BOOKING_DATE || token.CREATED_AT.slice(0, 10)}</div>
                        <div className="text-[10px] text-[#9E988E]">
                          {token.COMPLETED_AT ? new Date(token.COMPLETED_AT).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </div>
                      </td>

                      {/* Outcome Badge */}
                      <td className="py-3.5 px-4">
                        <Badge status={token.STATUS} size="sm" dot />
                      </td>

                      {/* Notes */}
                      <td className="py-3.5 px-4 text-xs text-[#736E66] max-w-xs truncate italic">
                        {token.SERVICE_NOTE ? `"${token.SERVICE_NOTE}"` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
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
