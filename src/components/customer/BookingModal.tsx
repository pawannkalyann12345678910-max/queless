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

      confetti({
        particleCount: 70,
        spread: 60,
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
      title="Book Digital Token Pass"
      subtitle={`${queue.NAME} (${queue.COUNTER_LABEL || 'Counter 1'})`}
      maxWidth="md"
    >
      <form onSubmit={handleBook} className="space-y-4 pt-1">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-bold">
            {error}
          </div>
        )}

        <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Queue Prefix</span>
            <span className="text-lg font-black font-mono text-black">{queue.PREFIX}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-zinc-500 block">Est. Wait Speed</span>
            <span className="text-xs font-bold text-amber-700 font-mono">~{queue.AVG_SERVICE_MINS}m / person</span>
          </div>
        </div>

        {!user ? (
          <div className="text-center py-4 space-y-3">
            <p className="text-xs text-zinc-600">
              Sign in with your Google account to secure your live digital turn pass.
            </p>
            <Button
              type="button"
              variant="primary"
              size="md"
              className="w-full font-bold bg-black text-white"
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
              leftIcon={<User size={16} />}
              required
            />

            <Input
              label="Mobile Phone Number (For Turn Alerts)"
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              leftIcon={<Phone size={16} />}
              required
            />

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
                Service Purpose / Note (Optional)
              </label>
              <div className="relative">
                <div className="absolute top-2.5 left-3 text-zinc-400 pointer-events-none">
                  <FileText size={16} />
                </div>
                <textarea
                  rows={2}
                  value={serviceNote}
                  onChange={(e) => setServiceNote(e.target.value)}
                  placeholder="e.g. Fever & consultation, Account opening..."
                  className="block w-full rounded-lg bg-white border border-zinc-300 pl-9 pr-3 py-2 text-sm text-black placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="emerald"
                size="md"
                className="flex-1 font-bold"
                isLoading={loading}
                leftIcon={<Sparkles size={15} />}
              >
                Confirm & Issue Pass
              </Button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
};
