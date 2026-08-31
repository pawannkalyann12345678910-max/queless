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
import confetti from 'canvas-confetti';

interface LiveTokenPassProps {
  token: Token;
  onRefresh: () => void;
}

export const LiveTokenPass: React.FC<LiveTokenPassProps> = ({ token, onRefresh }) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);
  const [isDelayModalOpen, setIsDelayModalOpen] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
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
      confetti({ particleCount: 40, spread: 50 });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not request delay');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteReschedule = async (choice: 'NEXT_DAY' | 'NEXT_WEEK') => {
    setActionLoading(true);
    try {
      await api.rescheduleToken(token.TOKEN_ID, choice);
      setIsRescheduleModalOpen(false);
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Could not reschedule pass');
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

  const hasRescheduleOffered = token.DELAY_STATUS === 'RESCHEDULE_OFFERED';
  const isRescheduled = token.DELAY_STATUS === 'RESCHEDULED';

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

      {/* Staff Notice: Reschedule Offered by Counter Staff */}
      {hasRescheduleOffered && (
        <div className="mb-5 p-5 rounded-3xl bg-blue-50 border border-blue-200 text-blue-950 text-xs shadow-xs space-y-3">
          <div className="flex items-center gap-2 font-black text-sm text-blue-900">
            <Calendar size={18} className="text-blue-600" />
            <span>Staff Action: Reschedule Suggested for You</span>
          </div>
          <p className="leading-relaxed text-blue-800">
            The counter staff reviewed your request. Due to today's queue schedule: <em>"{token.DELAY_REASON || 'Please select Next Day or Next Week'}"</em>. 
            Please choose when you'd like to arrive:
          </p>
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <button
              onClick={() => handleExecuteReschedule('NEXT_DAY')}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Calendar size={13} /> Tomorrow (Next Day)
            </button>
            <button
              onClick={() => handleExecuteReschedule('NEXT_WEEK')}
              disabled={actionLoading}
              className="px-4 py-2.5 bg-[#141312] hover:bg-[#262422] text-white rounded-xl font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
            >
              <Calendar size={13} className="text-amber-300" /> Next Week (+7 Days)
            </button>
          </div>
        </div>
      )}

      {/* Rescheduled Confirmation Banner */}
      {isRescheduled && (
        <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs shadow-xs flex items-center gap-3">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold block text-sm">Pass Rescheduled Successfully!</span>
            <span className="text-emerald-800">Your pass is confirmed for <strong>{token.BOOKING_DATE}</strong>. Arrive at the counter on that day to hold your turn.</span>
          </div>
        </div>
      )}

      {/* Delay Status Notice — Staff Rejected Notification */}
      {token.DELAY_STATUS === 'REJECTED_5M' && (
        <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-3 shadow-2xs">
          <XCircle className="shrink-0 text-rose-600 mt-0.5" size={18} />
          <div>
            <span className="font-bold block text-sm">Staff Notice: Extra Time Not Approved</span>
            The counter staff was unable to grant extra wait time today due to queue volume. Please proceed to the counter or reschedule for another date below.
          </div>
        </div>
      )}

      {hasApprovedDelay && (
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 shadow-2xs">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={16} />
          <span><strong>Extra Time Approved:</strong> Counter staff shifted your pass down by ~{token.DELAY_MINUTES || 5} minutes.</span>
        </div>
      )}

      {hasPendingDelay && (
        <div className="mb-5 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 animate-pulse shadow-2xs">
          <Hourglass className="shrink-0 text-amber-600 mt-0.5" size={16} />
          <div>
            <span className="font-bold block">Extra Time Request Sent to Staff (+{token.DELAY_MINUTES || 5}m):</span>
            Waiting for staff response. Reason: <em>{token.DELAY_REASON || 'Parking / Traffic'}</em>
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

      {/* Big Token Number Display */}
      <div className="py-6 text-center space-y-1">
        <span className="text-[11px] uppercase tracking-wider text-[#736E66] font-bold">Your Digital Token Pass</span>
        <div className="text-5xl sm:text-6xl font-black tracking-tight text-[#141312] font-mono">
          {token.TOKEN_NUMBER}
        </div>
        {token.BOOKING_DATE && (
          <span className="text-xs font-semibold text-[#736E66] block pt-1">
            Scheduled for: <strong>{token.BOOKING_DATE}</strong>
          </span>
        )}
      </div>

      {/* Queue Progress & Timing Indicators */}
      {token.STATUS === 'WAITING' && (
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] mb-6">
          <div className="text-center border-r border-[#EAE5DE] pr-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#736E66] block">
              People Ahead
            </span>
            <span className="text-2xl font-black text-[#141312] flex items-center justify-center gap-1">
              <Users size={18} className="text-[#C28E5C]" />
              {position > 0 ? position - 1 : 0}
            </span>
          </div>

          <div className="text-center pl-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#736E66] block">
              Est. Turn Countdown
            </span>
            <span className="text-2xl font-black text-[#141312] flex items-center justify-center gap-1 font-mono">
              <Clock size={18} className="text-[#C28E5C]" />
              ~{etaMins}m
            </span>
          </div>
        </div>
      )}

      {isCalled && (
        <div className="p-4 rounded-2xl bg-amber-500 text-white text-center mb-6 animate-pulse shadow-md">
          <div className="flex items-center justify-center gap-2 font-black text-lg">
            <Volume2 size={22} />
            <span>NOW BEING CALLED!</span>
          </div>
          <p className="text-xs text-amber-100 mt-1">
            Please proceed immediately to <strong>{token.COUNTER_LABEL || 'Counter 1'}</strong>.
          </p>
        </div>
      )}

      {isServing && (
        <div className="p-4 rounded-2xl bg-emerald-600 text-white text-center mb-6 shadow-md">
          <div className="flex items-center justify-center gap-2 font-black text-lg">
            <CheckCircle2 size={22} />
            <span>CURRENTLY AT COUNTER</span>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Service in progress at <strong>{token.COUNTER_LABEL || 'Counter 1'}</strong>.
          </p>
        </div>
      )}

      {isCompleted && (
        <div className="p-4 rounded-2xl bg-zinc-100 text-[#141312] text-center mb-6 border border-[#EAE5DE]">
          <span className="font-bold text-sm">Pass Completed</span>
          <p className="text-xs text-[#736E66] mt-0.5">Thank you for visiting {token.ORG_NAME}!</p>
        </div>
      )}

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
            onClick={() => setIsRescheduleModalOpen(true)}
            leftIcon={<Calendar size={13} />}
            className="text-[#141312] bg-[#FAF7F2] hover:bg-[#F5F1E9] border-[#EAE5DE] rounded-xl cursor-pointer font-bold"
          >
            Reschedule Pass
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

      {/* Customer Reschedule Choice Modal (Next Day vs Next Week) */}
      {isRescheduleModalOpen && (
        <Modal
          isOpen={isRescheduleModalOpen}
          onClose={() => setIsRescheduleModalOpen(false)}
          title="Reschedule Your Digital Pass"
          subtitle="Choose your preferred date to hold your turn"
          maxWidth="md"
        >
          <div className="space-y-4 pt-2">
            <p className="text-xs text-[#736E66] leading-relaxed">
              If you cannot make it today, you can hold your spot and reschedule your pass for tomorrow or next week without rebooking.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => handleExecuteReschedule('NEXT_DAY')}
                disabled={actionLoading}
                className="p-4 bg-[#FAF7F2] hover:bg-[#F5F1E9] border border-[#EAE5DE] hover:border-[#141312] rounded-2xl text-left transition-all cursor-pointer space-y-1.5 shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Calendar size={16} />
                </div>
                <div className="text-sm font-black text-[#141312] group-hover:text-blue-600 transition-colors">
                  Tomorrow (Next Day)
                </div>
                <p className="text-[11px] text-[#736E66]">
                  Move your pass to the next morning queue.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleExecuteReschedule('NEXT_WEEK')}
                disabled={actionLoading}
                className="p-4 bg-[#FAF7F2] hover:bg-[#F5F1E9] border border-[#EAE5DE] hover:border-[#141312] rounded-2xl text-left transition-all cursor-pointer space-y-1.5 shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-xl bg-[#141312] text-white flex items-center justify-center font-bold">
                  <Calendar size={16} className="text-amber-300" />
                </div>
                <div className="text-sm font-black text-[#141312] group-hover:text-[#C28E5C] transition-colors">
                  Next Week (+7 Days)
                </div>
                <p className="text-[11px] text-[#736E66]">
                  Pick the same day next week for your turn.
                </p>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-6 rounded-xl border-[#EAE5DE]"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

    </div>
  );
};
