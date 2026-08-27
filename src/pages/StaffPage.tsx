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
  PlayCircle 
} from 'lucide-react';

export const StaffPage: React.FC = () => {
  const { user } = useAuth();
  const [assignedQueues, setAssignedQueues] = useState<Queue[]>([]);
  const [selectedQueueId, setSelectedQueueId] = useState<string>('');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWalkInOpen, setIsWalkInOpen] = useState(false);

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
    loadStaffQueues();
  }, [user]);

  // Poll active queue every 3 seconds
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
      <div className="text-center py-20 glass-panel rounded-3xl p-8 max-w-lg mx-auto border border-white/10">
        <h3 className="text-xl font-bold text-white">Staff Authentication Required</h3>
        <p className="text-xs text-slate-400 mt-2">Please sign in with your authorized staff Google email address.</p>
      </div>
    );
  }

  if (assignedQueues.length === 0) {
    return (
      <div className="text-center py-20 glass-panel rounded-3xl p-8 max-w-lg mx-auto border border-white/10">
        <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400 mb-4">
          <Users size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">No Assigned Service Counters</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Your Google email (<strong>{user.EMAIL}</strong>) is not currently assigned to any active service counter. Ask your organization admin to assign your email in the Admin Console.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Queue Switcher */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Queue Info */}
          <div className="flex items-start sm:items-center gap-4">
            {activeQueue?.ORG_LOGO_URL ? (
              <img
                src={activeQueue.ORG_LOGO_URL}
                alt={activeQueue.ORG_NAME}
                className="w-16 h-16 rounded-2xl object-cover border border-white/15 bg-slate-900 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 border border-indigo-400 flex items-center justify-center text-white font-black text-2xl shadow-md">
                {activeQueue?.ORG_NAME ? activeQueue.ORG_NAME.charAt(0) : 'Q'}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <Badge variant="indigo" size="sm">Staff Control Room</Badge>
                <Badge variant="emerald" size="sm">{activeQueue?.ORG_NAME}</Badge>
                {activeQueue?.IS_PAUSED === 1 && (
                  <Badge variant="rose" size="sm" dot>Intake Paused</Badge>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {activeQueue?.NAME} ({activeQueue?.COUNTER_LABEL || 'Counter 1'})
              </h1>
              <p className="text-xs text-slate-400 mt-1">Logged in operator: {user.EMAIL}</p>
            </div>
          </div>

          {/* Right: Actions Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            {/* HDMI Cast Button */}
            {activeQueue && (
              <HDMICastButton queueId={activeQueue.QUEUE_ID} queueName={activeQueue.NAME} />
            )}

            {/* Issue Walk-In Token */}
            <Button
              variant="emerald"
              size="sm"
              onClick={() => setIsWalkInOpen(true)}
              leftIcon={<Plus size={16} />}
              className="font-bold shadow-emerald-600/20"
            >
              Issue Walk-In Token
            </Button>

            {/* Pause / Resume */}
            <Button
              variant={activeQueue?.IS_PAUSED === 1 ? "amber" : "secondary"}
              size="sm"
              onClick={handleTogglePause}
              leftIcon={activeQueue?.IS_PAUSED === 1 ? <PlayCircle size={16} /> : <PauseCircle size={16} />}
            >
              {activeQueue?.IS_PAUSED === 1 ? "Resume Intake" : "Pause Intake"}
            </Button>
          </div>
        </div>

        {/* Multi-queue selector tabs if staff manages > 1 counter */}
        {assignedQueues.length > 1 && (
          <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider mr-2">Switch Counter:</span>
            {assignedQueues.map((q) => (
              <button
                key={q.QUEUE_ID}
                onClick={() => setSelectedQueueId(q.QUEUE_ID)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedQueueId === q.QUEUE_ID
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
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
