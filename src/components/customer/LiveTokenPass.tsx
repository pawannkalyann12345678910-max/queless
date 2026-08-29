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

  // Audio announcement when CALLED
  useEffect(() => {
    if (token.STATUS === 'CALLED') {
      audioService.announceToken(token.TOKEN_NUMBER, token.COUNTER_LABEL || 'the counter');
    }
  }, [token.STATUS, token.TOKEN_NUMBER, token.COUNTER_LABEL]);

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
        message: '🚨 URGENT: You are next in line! Please proceed near the counter area immediately.',
        peopleAhead: 0,
        estimatedMinutes: Math.max(1, etaMins)
      };
    } else if (position <= 5 || etaMins <= 10) {
      proximityAlert = {
        level: 'ADVANCE_10M',
        message: `⚠️ Heads Up: ${position} tokens ahead (~${etaMins} mins). Please start heading towards the counter area.`,
        peopleAhead: position - 1,
        estimatedMinutes: etaMins
      };
    }
  }

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
    <div className={`bg-white rounded-xl p-6 sm:p-7 border shadow-xs transition-all ${
      isCalled 
        ? 'border-blue-600 ring-2 ring-blue-600 shadow-md' 
        : isServing
        ? 'border-emerald-500 shadow-md'
        : 'border-zinc-200'
    }`}>
      {/* Proximity Alert Banner */}
      {proximityAlert.level !== 'NONE' && !alertDismissed && (
        <div className={`mb-5 p-3.5 rounded-lg border flex items-start gap-3 ${
          proximityAlert.level === 'URGENT_5M'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div className="flex-1 text-xs font-bold leading-snug">
            {proximityAlert.message}
          </div>
          <button 
            onClick={() => setAlertDismissed(true)} 
            className="text-xs font-bold opacity-70 hover:opacity-100 px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delay Status Notices */}
      {token.DELAY_STATUS === 'REJECTED_5M' && (
        <div className="mb-5 p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <XCircle className="shrink-0 text-red-600 mt-0.5" size={18} />
          <div>
            <span className="font-bold block">Staff Notice: Delay Request Rejected</span>
            Counter staff was unable to approve your delay request. Please proceed to the counter immediately.
          </div>
        </div>
      )}

      {token.DELAY_STATUS === 'APPROVED_5M' && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
          <span>Delay Approved: Your pass was shifted down by ~5 minutes.</span>
        </div>
      )}

      {token.DELAY_STATUS === 'REQUESTED_5M' && (
        <div className="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-pulse">
          <Hourglass className="shrink-0 text-amber-600" size={16} />
          <span>Delay Request Pending: Waiting for counter staff approval...</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-100">
        <div className="flex items-center gap-3">
          {token.ORG_LOGO_URL ? (
            <img src={token.ORG_LOGO_URL} alt={token.ORG_NAME} className="w-10 h-10 rounded-lg object-cover border border-zinc-200" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-black text-base">
              {token.ORG_NAME ? token.ORG_NAME.charAt(0) : 'Q'}
            </div>
          )}
          <div>
            <h4 className="text-sm font-black text-black">{token.ORG_NAME}</h4>
            <p className="text-xs text-zinc-500">{token.QUEUE_NAME} • {token.COUNTER_LABEL || 'Counter 1'}</p>
          </div>
        </div>

        <div>
          <Badge status={token.STATUS} size="md" dot />
        </div>
      </div>

      {/* Token Hero Display */}
      <div className="py-6 text-center">
        <span className="text-[11px] uppercase tracking-wider font-bold text-zinc-500 block mb-1">
          Your Digital Token Pass
        </span>
        
        <div className="inline-block relative">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-black px-4 py-1">
            {token.TOKEN_NUMBER}
          </div>
          {isCalled && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-600 text-white items-center justify-center text-[10px] font-bold">
                  <Volume2 size={11} />
                </span>
              </span>
            </div>
          )}
        </div>

        {isCalled ? (
          <div className="mt-3 p-3.5 bg-blue-50 border border-blue-200 rounded-lg max-w-sm mx-auto">
            <span className="text-sm font-black text-blue-900 block">
              🔔 IT'S YOUR TURN!
            </span>
            <span className="text-xs text-blue-800">
              Please proceed immediately to <strong>{token.COUNTER_LABEL || 'Counter 1'}</strong>
            </span>
          </div>
        ) : isServing ? (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg max-w-sm mx-auto">
            <span className="text-xs font-bold text-emerald-800 block">
              ▶️ Service in Progress at {token.COUNTER_LABEL}
            </span>
          </div>
        ) : isCompleted ? (
          <div className="mt-3 p-3 bg-zinc-100 border border-zinc-200 rounded-lg max-w-sm mx-auto">
            <span className="text-xs font-bold text-zinc-800 block">
              ✅ Service Completed
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Position in Line</span>
              <span className="text-lg font-black text-black flex items-center justify-center gap-1">
                <Users size={15} className="text-zinc-500" />
                {position > 0 ? `${position} ahead` : 'Next!'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-500 block">Estimated Wait</span>
              <span className="text-lg font-black text-amber-700 flex items-center justify-center gap-1 font-mono">
                <Clock size={15} />
                ~{etaMins}m
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details */}
      <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-zinc-600 mb-4">
        <div>
          <span className="text-zinc-400 block mb-0.5">Pass Holder:</span>
          <span className="font-bold text-zinc-900">{token.CUSTOMER_NAME} ({token.CUSTOMER_PHONE})</span>
        </div>
        {token.SERVICE_NOTE && (
          <div>
            <span className="text-zinc-400 block mb-0.5">Note:</span>
            <span className="font-medium text-zinc-700">{token.SERVICE_NOTE}</span>
          </div>
        )}
      </div>

      {/* Action Controls for Customer */}
      {token.STATUS === 'WAITING' && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-zinc-100">
          {token.DELAY_STATUS === 'NONE' && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={actionLoading}
              onClick={handleRequestDelay}
              leftIcon={<Hourglass size={13} />}
              className="text-amber-800 bg-amber-50 border-amber-200"
            >
              Request +5 Min Delay
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            isLoading={actionLoading}
            onClick={handleReschedule}
            leftIcon={<Calendar size={13} />}
            className="text-purple-800 bg-purple-50 border-purple-200"
          >
            Reschedule
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isLoading={actionLoading}
            onClick={handleCancel}
            className="text-zinc-400 hover:text-red-600 ml-auto"
          >
            Cancel Pass
          </Button>
        </div>
      )}
    </div>
  );
};
