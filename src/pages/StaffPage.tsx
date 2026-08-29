import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import type { Queue, Token } from '../types';
import { QueueStatsCards } from '../components/staff/QueueStatsCards';
import { TokenQueueBoard } from '../components/staff/TokenQueueBoard';
import { WalkInTokenModal } from '../components/staff/WalkInTokenModal';
import { HDMICastButton } from '../components/staff/HDMICastButton';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { 
  Users, 
  Plus, 
  PauseCircle, 
  PlayCircle,
  MessageSquare
} from 'lucide-react';
import { StaffWhatsAppModal } from '../components/staff/StaffWhatsAppModal';

export const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const [assignedQueues, setAssignedQueues] = useState<Queue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  // Load assigned queues for the logged-in staff email
  const loadStaffQueues = async () => {
    try {
      const res = await api.getMyStaffQueues();
      setAssignedQueues(res.queues);
      if (res.queues.length > 0 && !selectedQueueId) {
        setSelectedQueueId(res.queues[0].QUEUE_ID);
      }
    } catch (err) {
      console.error('Failed to load staff queues:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load tokens for the active queue
  const loadQueueTokens = async () => {
    if (!selectedQueueId) return;
    try {
      const res = await api.getQueueTokens(selectedQueueId);
      setTokens(res.tokens);
    } catch (err) {
      console.error('Failed to load queue tokens:', err);
    }
  };

  useEffect(() => {
    if (user?.USER_ID) {
      loadStaffQueues();
    }
  }, [user?.USER_ID]);

  usePolling(() => {
    loadQueueTokens();
  }, 3000, !!selectedQueueId);

  const activeQueue = assignedQueues.find(q => q.QUEUE_ID === selectedQueueId);

  const handleTogglePause = async () => {
    if (!selectedQueueId) return;
    try {
      await api.togglePauseQueue(selectedQueueId);
      await loadStaffQueues();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle pause');
    }
  };

  if (loading) return <Spinner size="lg" className="py-24" />;

  if (!user) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl p-8 max-w-lg mx-auto border border-[#EAE5DE] shadow-xs my-8">
        <h3 className="text-xl font-bold text-[#141312]">Staff Authentication Required</h3>
        <p className="text-xs text-[#736E66] mt-2">Please sign in with your authorized staff Google email address.</p>
      </div>
    );
  }

  if (assignedQueues.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl p-8 max-w-lg mx-auto border border-[#EAE5DE] shadow-xs my-8">
        <div className="w-14 h-14 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center mx-auto text-[#141312] mb-3">
          <Users size={28} />
        </div>
        <h3 className="text-xl font-black text-[#141312]">No Assigned Service Counters</h3>
        <p className="text-xs text-[#736E66] mt-2 mb-6">
          Your Google email (<strong>{user.EMAIL}</strong>) is not currently assigned to any active service counter. Ask your organization admin to assign your email in the Admin Console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header & Queue Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Queue Info */}
          <div className="flex items-start sm:items-center gap-4">
            {activeQueue?.ORG_LOGO_URL ? (
              <img
                src={activeQueue.ORG_LOGO_URL}
                alt={activeQueue.ORG_NAME}
                className="w-14 h-14 rounded-2xl object-cover border border-[#EAE5DE] bg-[#FAF7F2]"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-[#141312] text-white flex items-center justify-center font-black text-xl shadow-xs">
                {activeQueue?.ORG_NAME ? activeQueue.ORG_NAME.charAt(0) : 'Q'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <Badge variant="indigo" size="sm">Staff Desk</Badge>
                <Badge variant="emerald" size="sm">{activeQueue?.ORG_NAME}</Badge>
                {activeQueue?.IS_PAUSED === 1 && (
                  <Badge variant="rose" size="sm" dot>Intake Paused</Badge>
                )}
              </div>
              <h1 className="text-2xl font-black text-[#141312]">
                {activeQueue?.NAME} ({activeQueue?.COUNTER_LABEL || 'Counter 1'})
              </h1>
              <p className="text-xs text-[#736E66] mt-0.5">Operator: {user.EMAIL}</p>
            </div>
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Staff WhatsApp Connection Button (If permitted by Admin for this queue) */}
            {activeQueue && activeQueue.ALLOW_STAFF_WHATSAPP === 1 && (
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<MessageSquare size={14} className="text-emerald-700" />}
                onClick={() => setIsWhatsAppOpen(true)}
                className="font-bold border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-950 rounded-xl cursor-pointer"
              >
                Connect WhatsApp
              </Button>
            )}

            {activeQueue && (
              <HDMICastButton queueId={activeQueue.QUEUE_ID} queueName={activeQueue.NAME} />
            )}

            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsWalkInOpen(true)}
              leftIcon={<Plus size={15} />}
              className="font-bold rounded-xl cursor-pointer"
            >
              Issue Walk-In Token
            </Button>

            <Button
              variant={activeQueue?.IS_PAUSED === 1 ? "amber" : "secondary"}
              size="sm"
              onClick={handleTogglePause}
              leftIcon={activeQueue?.IS_PAUSED === 1 ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
              className="rounded-xl border-[#EAE5DE] cursor-pointer"
            >
              {activeQueue?.IS_PAUSED === 1 ? "Resume Intake" : "Pause Intake"}
            </Button>
          </div>
        </div>

        {/* Multi-queue selector tabs */}
        {assignedQueues.length > 1 && (
          <div className="flex items-center gap-2 mt-5 pt-4 border-t border-[#EAE5DE] overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-[#736E66] font-bold uppercase tracking-wider mr-2">Switch Counter:</span>
            {assignedQueues.map((q) => (
              <button
                key={q.QUEUE_ID}
                onClick={() => setSelectedQueueId(q.QUEUE_ID)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedQueueId === q.QUEUE_ID
                    ? 'bg-[#141312] text-white shadow-xs'
                    : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
                }`}
              >
                {q.NAME} ({q.COUNTER_LABEL})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      {activeQueue && (
        <QueueStatsCards queue={activeQueue} tokens={tokens} />
      )}

      {/* Main Queue Management Board */}
      {activeQueue && (
        <TokenQueueBoard
          queue={activeQueue}
          tokens={tokens}
          availableQueues={assignedQueues}
          onRefresh={loadQueueTokens}
        />
      )}

      {/* Staff WhatsApp modal */}
      {activeQueue && isWhatsAppOpen && (
        <StaffWhatsAppModal
          queueId={activeQueue.QUEUE_ID}
          counterLabel={activeQueue.COUNTER_LABEL || activeQueue.NAME}
          isOpen={isWhatsAppOpen}
          onClose={() => setIsWhatsAppOpen(false)}
        />
      )}

      {/* Walk-in token modal */}
      {activeQueue && isWalkInOpen && (
        <WalkInTokenModal
          queue={activeQueue}
          isOpen={isWalkInOpen}
          onClose={() => setIsWalkInOpen(false)}
          onSuccess={() => {
            setIsWalkInOpen(false);
            loadQueueTokens();
          }}
        />
      )}
    </div>
  );
};
