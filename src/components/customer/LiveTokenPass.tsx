import React, { useState, useEffect } from 'react';
import type { Token, ProximityAlert } from '../../types';
import { api } from '../../services/api';
import { audioService } from '../../services/audio';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle2, 
  Hourglass, 
  Calendar, 
  XCircle,
  Volume2
} from 'lucide-react';

interface LiveTokenPassProps {
  token: Token;
  onRefresh: () => void;
}

export const LiveTokenPass: React.FC<LiveTokenPassProps> = ({ token, onRefresh }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  // Audio trigger on CALLED status
  useEffect(() => {
    if (token.STATUS === 'CALLED') {
      audioService.announceToken(token.TOKEN_NUMBER, token.COUNTER_LABEL || 'the counter');
    }
  }, [token.STATUS, token.TOKEN_NUMBER, token.COUNTER_LABEL]);

  // Calculate proximity alerts
  const position = token.POSITION_IN_QUEUE || 0;
  const avgMins = token.AVG_SERVICE_MINS || 10;
  const etaMins = position > 0 ? position * avgMins : 0;

  let proximityAlert: ProximityAlert = {
    level: 'NONE',
    message: '',
    peopleAhead: Math.max(0, position - 1),
    estimatedMinutes: etaMins
  };

  if (token.STATUS === 'WAITING') {
    if (position <= 1 || etaMins <= 5) {
      proximityAlert = {
        level: 'URGENT_5M',
        message: '🚨 URGENT: You are next in line! Please be present right near the counter area immediately.',
        peopleAhead: 0,
        estimatedMinutes: Math.max(1, etaMins)
      };
    } else if (position <= 5 || etaMins <= 10) {
      proximityAlert = {
        level: 'ADVANCE_10M',
        message: `⚠️ Heads Up: You have ${position} tokens ahead (~${etaMins} mins left). Please start heading towards the counter area.`,
        peopleAhead: position - 1,
        estimatedMinutes: etaMins
      };
    }
  }

  // Action handlers
  const handleRequestDelay = async () => {
    setActionLoading(true);
    try {
      await api.requestDelay(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not request delay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!window.confirm('Do you want to reschedule your token pass to tomorrow?')) return;
    setActionLoading(true);
    try {
      await api.rescheduleToken(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not reschedule');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel your digital token pass?')) return;
    setActionLoading(true);
    try {
      await api.cancelToken(token.TOKEN_ID);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not cancel');
    } finally {
      setActionLoading(false);
    }
  };

  const isCalled = token.STATUS === 'CALLED';
  const isServing = token.STATUS === 'SERVING';
  const isCompleted = token.STATUS === 'COMPLETED';

  return (
    <div className={`glass-panel rounded-3xl p-6 sm:p-8 border transition-all duration-300 relative overflow-hidden ${
      isCalled 
        ? 'border-indigo-500 shadow-2xl shadow-indigo-500/30 ring-2 ring-indigo-500/50' 
        : isServing
        ? 'border-emerald-500/50 shadow-2xl shadow-emerald-500/20'
        : 'border-white/15'
    }`}>
      {/* Background ambient glow for CALLED state */}
      {isCalled && (
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 via-purple-600/10 to-cyan-600/10 animate-pulse pointer-events-none" />
      )}

      {/* Proximity Banner Alert */}
      {proximityAlert.level !== 'NONE' && !alertDismissed && (
        <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3.5 animate-bounce-short ${
          proximityAlert.level === 'URGENT_5M'
            ? 'bg-rose-500/20 border-rose-500/40 text-rose-200'
            : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
        }`}>
          <AlertTriangle className="shrink-0 mt-0.5" size={20} />
          <div className="flex-1 text-xs sm:text-sm font-semibold leading-snug">
            {proximityAlert.message}
          </div>
          <button 
            onClick={() => setAlertDismissed(true)} 
            className="text-xs opacity-70 hover:opacity-100 font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delay Status Rejection Notice */}
      {token.DELAY_STATUS === 'REJECTED_5M' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3">
          <XCircle className="shrink-0 text-rose-400 mt-0.5" size={20} />
          <div>
            <span className="font-bold block mb-1">Staff Notice: Delay Request Rejected</span>
            Counter staff was unable to approve your +5 min delay request. Please proceed to the counter immediately, reschedule to tomorrow, or cancel your pass.
          </div>
        </div>
      )}

      {/* Delay Approved Notice */}
      {token.DELAY_STATUS === 'APPROVED_5M' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="shrink-0 text-emerald-400" size={18} />
          <span>Delay Approved: Your pass was shifted down by ~5 minutes.</span>
        </div>
      )}

      {/* Delay Pending Notice */}
      {token.DELAY_STATUS === 'REQUESTED_5M' && (
        <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center gap-2.5 animate-pulse">
          <Hourglass className="shrink-0 text-amber-400" size={18} />
          <span>Delay Request Pending: Waiting for counter staff approval...</span>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          {token.ORG_LOGO_URL ? (
            <img src={token.ORG_LOGO_URL} alt={token.ORG_NAME} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-lg">
              {token.ORG_NAME ? token.ORG_NAME.charAt(0) : 'Q'}
            </div>
          )}
          <div>
            <h4 className="text-base font-bold text-white tracking-tight">{token.ORG_NAME}</h4>
            <p className="text-xs text-slate-400">{token.QUEUE_NAME} • {token.COUNTER_LABEL || 'Counter 1'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge status={token.STATUS} size="lg" dot />
        </div>
      </div>

      {/* Token Hero Section */}
      <div className="py-8 text-center relative">
        <span className="text-xs uppercase tracking-widest font-bold text-slate-400 block mb-2">
          Your Digital Token Pass
        </span>
        
        {/* Token Number Card */}
        <div className="inline-block relative">
          <div className="text-5xl sm:text-7xl font-black font-mono tracking-tight bg-gradient-to-br from-white via-indigo-100 to-indigo-300 bg-clip-text text-transparent px-6 py-2">
            {token.TOKEN_NUMBER}
          </div>
          {isCalled && (
            <div className="absolute -top-3 -right-3">
              <span className="flex h-6 w-6 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-6 w-6 bg-indigo-500 text-white items-center justify-center text-[10px] font-bold">
                  <Volume2 size={12} />
                </span>
              </span>
            </div>
          )}
        </div>

        {isCalled ? (
          <div className="mt-4 p-4 bg-indigo-600/20 border border-indigo-500/40 rounded-2xl max-w-sm mx-auto animate-pulse">
            <span className="text-sm sm:text-base font-black text-indigo-300 block">
              🔔 IT'S YOUR TURN!
            </span>
            <span className="text-xs text-indigo-200">
              Please proceed immediately to <strong>{token.COUNTER_LABEL || 'Counter 1'}</strong>
            </span>
          </div>
        ) : isServing ? (
          <div className="mt-4 p-3.5 bg-emerald-600/20 border border-emerald-500/40 rounded-2xl max-w-sm mx-auto">
            <span className="text-sm font-bold text-emerald-300 block">
              ▶️ Service in Progress
            </span>
            <span className="text-xs text-emerald-200">
              You are currently being attended to at {token.COUNTER_LABEL}
            </span>
          </div>
        ) : isCompleted ? (
          <div className="mt-4 p-3.5 bg-cyan-600/20 border border-cyan-500/40 rounded-2xl max-w-sm mx-auto">
            <span className="text-sm font-bold text-cyan-300 block">
              ✅ Service Completed
            </span>
            <span className="text-xs text-cyan-200">
              Thank you for using Queless!
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto mt-6 bg-slate-900/80 p-4 rounded-2xl border border-white/5">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Position in Line</span>
              <span className="text-xl sm:text-2xl font-bold text-white flex items-center justify-center gap-1.5">
                <Users size={18} className="text-indigo-400" />
                {position > 0 ? `${position} ahead` : 'Next!'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block mb-0.5">Estimated Wait</span>
              <span className="text-xl sm:text-2xl font-bold text-amber-400 flex items-center justify-center gap-1.5 font-mono">
                <Clock size={18} />
                ~{etaMins} mins
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details & QR verification */}
      <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300 mb-6">
        <div>
          <span className="text-slate-400 block mb-1">Pass Holder:</span>
          <span className="font-semibold text-white">{token.CUSTOMER_NAME} ({token.CUSTOMER_PHONE})</span>
        </div>
        {token.SERVICE_NOTE && (
          <div>
            <span className="text-slate-400 block mb-1">Purpose / Note:</span>
            <span className="font-semibold text-slate-200">{token.SERVICE_NOTE}</span>
          </div>
        )}
      </div>

      {/* Action Controls for Customer */}
      {token.STATUS === 'WAITING' && (
        <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-white/10">
          {token.DELAY_STATUS === 'NONE' && (
            <Button
              variant="glass"
              size="sm"
              isLoading={actionLoading}
              onClick={handleRequestDelay}
              leftIcon={<Hourglass size={14} />}
              className="text-amber-300 hover:text-amber-200 border-amber-500/20"
            >
              Request +5 Min Delay
            </Button>
          )}

          <Button
            variant="glass"
            size="sm"
            isLoading={actionLoading}
            onClick={handleReschedule}
            leftIcon={<Calendar size={14} />}
            className="text-purple-300 hover:text-purple-200 border-purple-500/20"
          >
            Reschedule to Tomorrow
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isLoading={actionLoading}
            onClick={handleCancel}
            className="text-slate-400 hover:text-rose-400 ml-auto"
          >
            Cancel Pass
          </Button>
        </div>
      )}
    </div>
  );
};
