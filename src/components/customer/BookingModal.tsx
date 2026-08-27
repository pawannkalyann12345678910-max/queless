import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { User, Phone, FileText, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BookingModalProps {
  queue: Queue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  queue,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.DISPLAY_NAME || '');
  const [customerPhone, setCustomerPhone] = useState(user?.PHONE || '');
  const [serviceNote, setServiceNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.DISPLAY_NAME) setCustomerName(user.DISPLAY_NAME);
    if (user?.PHONE) setCustomerPhone(user.PHONE);
  }, [user]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      await signInWithGoogle();
      return;
    }

    if (!customerPhone || customerPhone.trim().length < 7) {
      setError('A valid mobile phone number is required for token passes.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.bookToken(queue.QUEUE_ID, {
        customerName: customerName.trim() || user.DISPLAY_NAME,
        customerPhone: customerPhone.trim(),
        serviceNote: serviceNote.trim()
      });

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onSuccess();
      onClose();
      navigate('/my-tokens');
    } catch (err: any) {
      setError(err.message || 'Failed to book token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Book Digital Token Pass`}
      subtitle={`${queue.NAME} (${queue.COUNTER_LABEL || 'Counter 1'})`}
      maxWidth="md"
    >
      <form onSubmit={handleBook} className="space-y-4 pt-2">
        {error && (
          <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Queue Prefix</span>
            <span className="text-xl font-black font-mono text-white">{queue.PREFIX}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Est. Wait Speed</span>
            <span className="text-sm font-bold text-amber-400 font-mono">~{queue.AVG_SERVICE_MINS}m / person</span>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-slate-300">
              Sign in with your Google account to secure your live digital turn pass.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full font-bold"
              onClick={() => signInWithGoogle()}
            >
              Sign In with Google to Book
            </Button>
          </div>
        ) : (
          <>
            <Input
              label="Visitor / Customer Full Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Sarah Jenkins"
              leftIcon={<User size={18} />}
              required
            />

            <Input
              label="Mobile Phone Number (For Turn Alerts)"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              leftIcon={<Phone size={18} />}
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Service Purpose / Consultation Note (Optional)
              </label>
              <div className="relative rounded-xl">
                <div className="absolute top-3 left-3.5 text-slate-400 pointer-events-none">
                  <FileText size={18} />
                </div>
                <textarea
                  rows={2}
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g. Fever & consultation, Account opening..."
                  className="block w-full rounded-xl bg-slate-900/80 border border-white/10 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center gap-3">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="md"
                className="flex-1 font-bold shadow-emerald-500/20"
                isLoading={loading}
                leftIcon={<Sparkles size={16} />}
              >
                Confirm & Issue Token
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
