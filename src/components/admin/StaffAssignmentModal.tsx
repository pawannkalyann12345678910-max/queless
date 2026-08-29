import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { Queue, StaffAssignment } from '../../types';
import { Modal } from '../common/Modal';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { Mail, Plus, Trash2, User } from 'lucide-react';

interface StaffAssignmentModalProps {
  queue: Queue;
  isOpen: boolean;
  onClose: () => void;
}

export const StaffAssignmentModal: React.FC<StaffAssignmentModalProps> = ({
  queue,
  isOpen,
  onClose
}) => {
  const [staffList, setStaffList] = useState<StaffAssignment[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadStaff = async () => {
    try {
      setLoading(true);
      const res = await api.getQueueStaff(queue.QUEUE_ID);
      setStaffList(res.staff);
    } catch (err: any) {
      setError(err.message || 'Failed to load staff list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStaff();
    }
  }, [isOpen, queue.QUEUE_ID]);

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      await api.assignStaff(queue.QUEUE_ID, newEmail.trim().toLowerCase(), 'OPERATOR');
      setNewEmail('');
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to assign staff email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStaff = async (assignmentId: string, email: string) => {
    if (!window.confirm(`Revoke staff access for ${email}?`)) return;

    try {
      await api.removeStaff(assignmentId);
      await loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to remove staff');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Staff Email Assignments — ${queue.NAME}`}
      subtitle={`Authorized staff who log in with these Google emails will auto-route to ${queue.COUNTER_LABEL || 'Counter 1'}`}
      maxWidth="lg"
    >
      <div className="space-y-5 pt-2">
        {/* Add Staff Form */}
        <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row items-end gap-2.5 p-3.5 bg-zinc-50 rounded-xl border border-zinc-200">
          <div className="flex-1 w-full">
            <Input
              label="Staff Google Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. nurse.sarah@clinic.com"
              leftIcon={<Mail size={15} />}
              error={error}
              required
            />
          </div>

          <Button
            type="submit"
            variant="emerald"
            size="md"
            isLoading={actionLoading}
            leftIcon={<Plus size={15} />}
            className="w-full sm:w-auto font-bold"
          >
            Assign Email
          </Button>
        </form>

        {/* Assigned Staff List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-2.5">
            Active Assigned Staff ({staffList.length})
          </h4>

          {loading ? (
            <Spinner size="md" className="py-8" />
          ) : staffList.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-zinc-300 rounded-xl p-4 text-xs text-zinc-500 bg-zinc-50">
              No staff emails assigned yet. Any admin can operate this counter, or assign emails above.
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.map((st) => (
                <div
                  key={st.ASSIGNMENT_ID}
                  className="flex items-center justify-between p-3 rounded-lg bg-white border border-zinc-200 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
                      <User size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-black block">{st.STAFF_EMAIL}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">OPERATOR • {queue.COUNTER_LABEL || 'Counter 1'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStaff(st.ASSIGNMENT_ID, st.STAFF_EMAIL)}
                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                    title="Revoke access"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-100 text-right">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
