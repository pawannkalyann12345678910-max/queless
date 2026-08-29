import React, { useState } from 'react';
import { api } from '../../services/api';
import type { Token, Queue } from '../../types';
import { Modal } from '../common/Modal';
import { Select } from '../common/Select';
import { Button } from '../common/Button';
import { ArrowRightLeft } from 'lucide-react';

interface TransferTokenModalProps {
  token: Token | null;
  availableQueues: Queue[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TransferTokenModal: React.FC<TransferTokenModalProps> = ({
  token,
  availableQueues,
  isOpen,
  onClose,
  onSuccess
}) => {
  if (!token) return null;

  const filteredQueues = availableQueues.filter(q => q.QUEUE_ID !== token.QUEUE_ID);
  const [selectedQueueId, setSelectedQueueId] = useState(filteredQueues.length > 0 ? filteredQueues[0].QUEUE_ID : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQueueId) {
      setError('Please select a destination queue');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.transferToken(token.TOKEN_ID, selectedQueueId);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to transfer token');
    } finally {
      setLoading(false);
    }
  };

  const queueOptions = filteredQueues.map(q => ({
    value: q.QUEUE_ID,
    label: `${q.NAME} (${q.COUNTER_LABEL || 'Counter'})`
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transfer Token ${token.TOKEN_NUMBER}`}
      subtitle={`Customer: ${token.CUSTOMER_NAME}`}
      maxWidth="md"
    >
      <form onSubmit={handleTransfer} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        <p className="text-xs text-zinc-600">
          Transferring this customer will move their token into the waiting line of the target counter while preserving their customer profile.
        </p>

        {filteredQueues.length === 0 ? (
          <p className="text-xs text-amber-700 font-medium bg-amber-50 p-3 rounded-lg border border-amber-200">
            No other active counters available under this organization.
          </p>
        ) : (
          <Select
            label="Destination Counter / Queue"
            value={selectedQueueId}
            onChange={(e) => setSelectedQueueId(e.target.value)}
            options={queueOptions}
            required
          />
        )}

        <div className="pt-3 flex items-center gap-3 border-t border-zinc-100">
          <Button type="button" variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="flex-1 font-bold bg-black text-white"
            disabled={filteredQueues.length === 0}
            isLoading={loading}
            leftIcon={<ArrowRightLeft size={16} />}
          >
            Confirm Transfer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
