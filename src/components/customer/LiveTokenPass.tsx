import React, { useState, useEffect } from 'react';
import type { Token, ProximityAlert } from '../../types';
import { api } from '../../services/api';
import { audioService } from '../../services/audio';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
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
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [selectedDelayMins, setSelectedDelayMins] = useState<number>(5);
  const [selectedDelayReason, setSelectedDelayReason] = useState<string>('🚗 Parking / Traffic Delay');

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

  const handleDelaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.requestDelay(token.TOKEN_ID, selectedDelayMins, selectedDelayReason);
      setIsDelayModalOpen(false);
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

  const hasPendingDelay = Boolean(
    token.DELAY_STATUS?.startsWith('REQUESTED') ||
    token.DELAY_STATUS === 'REQUESTED_5M' ||
    token.DELAY_STATUS === 'REQUESTED_10M' ||
    token.DELAY_STATUS === 'REQUESTED_15M'
  );

  const hasApprovedDelay = Boolean(
    token.DELAY_STATUS?.startsWith('APPROVED') ||
    token.DELAY_STATUS === 'APPROVED_5M' ||
    token.DELAY_STATUS === 'APPROVED_10M' ||
    token.DELAY_STATUS === 'APPROVED_15M'
  );

  return (
    <div className={`bg-white rounded-3xl p-6 sm:p-8 border shadow-xs transition-all ${
      isCalled 
        ? 'border-amber-600 ring-2 ring-amber-500/20 shadow-md bg-amber-50/10' 
        : isServing
        ? 'border-emerald-600 ring-2 ring-emerald-500/20 shadow-md bg-emerald-50/10'
        : 'border-[#EAE5DE]'
    }`}>
      {/* Proximity Alert Banner */}
      {proximityAlert.level !== 'NONE' && !alertDismissed && (
        <div className={`mb-5 p-4 rounded-2xl border flex items-start gap-3 ${
          proximityAlert.level === 'URGENT_5M'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <AlertTriangle className="shrink-0 mt-0.5" size={18} />
          <div className="flex-1 text-xs font-bold leading-snug">
            {proximityAlert.message}
          </div>
          <button 
            onClick={() => setAlertDismissed(true)} 
            className="text-xs font-bold opacity-70 hover:opacity-100 px-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Delay Status Notice — Staff Rejected Notification */}
      {token.DELAY_STATUS === 'REJECTED_5M' && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-2xs">
          <XCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
          <div>
            <span className="font-bold block text-sm">Staff Notice: Delay Request Not Accepted</span>
            The counter staff has not accepted your delay request at this time. Please proceed to the counter or try again later.
          </div>
        </div>
      )}

      {hasApprovedDelay && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
          <span><strong>Delay Approved:</strong> Your pass was shifted down by ~{token.DELAY_MINUTES || 5} minutes.</span>
        </div>
      )}

      {hasPendingDelay && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-pulse shadow-2xs">
          <Hourglass className="shrink-0 text-amber-600 mt-0.5" size={16} />
          <div>
            <span className="font-bold block">Delay Request Pending (+{token.DELAY_MINUTES || 5}m):</span>
            Waiting for staff operator approval. Reason: <em>{token.DELAY_REASON || 'Parking / Traffic'}</em>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE5DE]">
        <div className="flex items-center gap-3">
          {token.ORG_LOGO_URL ? (
            <img src={token.ORG_LOGO_URL} alt={token.ORG_NAME} className="w-11 h-11 rounded-2xl object-cover border border-[#EAE5DE] bg-[#FAF7F2]" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center font-bold text-[#141312] text-base">
              {token.ORG_NAME ? token.ORG_NAME.charAt(0) : 'Q'}
            </div>
          )}
          <div>
            <h4 className="text-sm font-black text-[#141312]">{token.ORG_NAME}</h4>
            <p className="text-xs text-[#736E66]">{token.QUEUE_NAME} • {token.COUNTER_LABEL || 'Counter 1'}</p>
          </div>
        </div>

        <div>
          <Badge status={token.STATUS} size="md" dot />
        </div>
      </div>

      {/* Token Hero Display */}
      <div className="py-6 text-center">
        <span className="text-[11px] uppercase tracking-wider font-bold text-[#736E66] block mb-1">
          Your Digital Token Pass
        </span>
        
        <div className="inline-block relative">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#141312] px-4 py-1">
            {token.TOKEN_NUMBER}
          </div>
          {isCalled && (
            <div className="absolute -top-2 -right-2">
              <span className="flex h-5 w-5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-amber-600 text-white items-center justify-center text-[10px] font-bold">
                  <Volume2 size={11} />
                </span>
              </span>
            </div>
          )}
        </div>

        {isCalled ? (
          <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl max-w-sm mx-auto shadow-2xs">
            <span className="text-sm font-black text-amber-900 block">
              🔔 IT'S YOUR TURN!
            </span>
            <span className="text-xs text-amber-800 mt-0.5 block">
              Please proceed immediately to <strong>{token.COUNTER_LABEL || 'Counter 1'}</strong>
            </span>
          </div>
        ) : isServing ? (
          <div className="mt-3 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-sm mx-auto shadow-2xs">
            <span className="text-xs font-bold text-emerald-800 block">
              ▶️ Service in Progress at {token.COUNTER_LABEL}
            </span>
          </div>
        ) : isCompleted ? (
          <div className="mt-3 p-3.5 bg-[#FAF7F2] border border-[#EAE5DE] rounded-2xl max-w-sm mx-auto shadow-2xs">
            <span className="text-xs font-bold text-[#141312] block">
              ✅ Service Completed
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto mt-4 bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#EAE5DE]">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#736E66] block">Position in Line</span>
              <span className="text-lg font-black text-[#141312] flex items-center justify-center gap-1">
                <Users size={15} className="text-[#736E66]" />
                {position > 0 ? `${position} ahead` : 'Next!'}
              </span>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-[#736E66] block">Estimated Wait</span>
              <span className="text-lg font-black text-[#C28E5C] flex items-center justify-center gap-1 font-mono">
                <Clock size={15} />
                ~{etaMins}m
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Details */}
      <div className="pt-4 border-t border-[#EAE5DE] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#736E66] mb-4">
        <div>
          <span className="text-[#9E988E] block mb-0.5">Pass Holder:</span>
          <span className="font-bold text-[#141312]">{token.CUSTOMER_NAME} ({token.CUSTOMER_PHONE})</span>
        </div>
        {token.SERVICE_NOTE && (
          <div>
            <span className="text-[#9E988E] block mb-0.5">Note:</span>
            <span className="font-medium text-[#141312]">{token.SERVICE_NOTE}</span>
          </div>
        )}
      </div>

      {/* Action Controls for Customer */}
      {token.STATUS === 'WAITING' && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#EAE5DE]">
          {!hasPendingDelay && !hasApprovedDelay && (
            <Button
              variant="secondary"
              size="sm"
              isLoading={actionLoading}
              onClick={() => setIsDelayModalOpen(true)}
              leftIcon={<Hourglass size={13} />}
              className="text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-200 rounded-xl cursor-pointer font-bold"
            >
              Request Extra Time (+5m / +10m)
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            isLoading={actionLoading}
            onClick={handleReschedule}
            leftIcon={<Calendar size={13} />}
            className="text-[#141312] bg-[#FAF7F2] hover:bg-[#F5F1E9] border-[#EAE5DE] rounded-xl cursor-pointer"
          >
            Reschedule
          </Button>

          <Button
            variant="ghost"
            size="sm"
            isLoading={actionLoading}
            onClick={handleCancel}
            className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl ml-auto cursor-pointer"
          >
            Cancel Pass
          </Button>
        </div>
      )}

      {/* Customer Delay Request Modal */}
      {isDelayModalOpen && (
        <Modal
          isOpen={isDelayModalOpen}
          onClose={() => setIsDelayModalOpen(false)}
          title="Request Extra Waiting Time"
          subtitle="Running late? Choose extra minutes and notify the counter staff"
          maxWidth="md"
        >
          <form onSubmit={handleDelaySubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141312] mb-1.5">
                Select Extra Time Needed
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {[5, 10, 15].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedDelayMins(mins)}
                    className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                      selectedDelayMins === mins
                        ? 'bg-[#141312] text-white border-[#141312] shadow-xs'
                        : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border-[#EAE5DE]'
                    }`}
                  >
                    <span className="text-base font-black font-mono">+{mins}m</span>
                    <span className="text-[10px] opacity-80">{mins === 5 ? '(Recommended)' : 'Extra Time'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#141312] mb-1.5">
                Reason (Sent Directly to Counter Staff)
              </label>
              <div className="space-y-2">
                {[
                  '🚗 Parking / Traffic Delay',
                  '☕ Grabbing Coffee / Restroom Break',
                  '💼 Consultation / Meeting Running Over',
                  '👶 Attending to Family / Companion'
                ].map(reason => (
                  <label
                    key={reason}
                    onClick={() => setSelectedDelayReason(reason)}
                    className={`flex items-center gap-3 p-3 rounded-2xl border text-xs font-medium transition-all cursor-pointer ${
                      selectedDelayReason === reason
                        ? 'bg-amber-50/80 border-amber-300 text-amber-950 font-bold'
                        : 'bg-[#FAF7F2] border-[#EAE5DE] text-[#736E66] hover:bg-[#F5F1E9]'
                    }`}
                  >
                    <input
                      type="radio"
                      name="customerDelayReason"
                      checked={selectedDelayReason === reason}
                      onChange={() => setSelectedDelayReason(reason)}
                      className="accent-[#141312]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1 border-[#EAE5DE] text-[#141312] rounded-xl cursor-pointer"
                onClick={() => setIsDelayModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="md"
                isLoading={actionLoading}
                className="flex-1 bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold cursor-pointer"
                leftIcon={<Hourglass size={15} />}
              >
                Submit to Staff (+{selectedDelayMins}m)
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
