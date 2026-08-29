import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { User, Phone, FileText, Ticket } from 'lucide-react';

interface WalkInTokenModalProps {
  queue: Queue;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WalkInTokenModal: React.FC<WalkInTokenModalProps> = ({
  queue,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceNote, setServiceNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      setError('Customer name and phone number are required for walk-in pass');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.issueWalkInToken(queue.QUEUE_ID, {
        customerName: name.trim(),
        customerPhone: phone.trim(),
        serviceNote: serviceNote.trim()
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to issue walk-in token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Walk-In Token"
      subtitle={`Queue: ${queue.NAME} (${queue.COUNTER_LABEL || 'Counter 1'})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <Input
          label="Customer Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Robert Smith"
          leftIcon={<User size={16} />}
          required
          autoFocus
        />

        <Input
          label="Mobile Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +1 (555) 432-8765"
          leftIcon={<Phone size={16} />}
          required
        />

        <Input
          label="Purpose / Note (Optional)"
          value={serviceNote}
          onChange={(e) => setServiceNote(e.target.value)}
          placeholder="e.g. Offline walk-in visitor"
          leftIcon={<FileText size={16} />}
        />

        <div className="pt-3 flex items-center gap-3 border-t border-zinc-100">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="emerald"
            size="md"
            className="flex-1 font-bold"
            isLoading={loading}
            leftIcon={<Ticket size={16} />}
          >
            Issue Token Now
          </Button>
        </div>
      </form>
    </Modal>
  );
};
