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
      <div className="space-y-6 pt-2">
        {/* Add Staff Form */}
        <form onSubmit={handleAddStaff} className="flex flex-col sm:flex-row items-end gap-3 p-4 bg-slate-900/60 rounded-2xl border border-white/5">
          <div className="flex-1 w-full">
            <Input
              label="Staff Google Email Address"
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="e.g. nurse.sarah@clinic.com"
              leftIcon={<Mail size={16} />}
              error={error}
              required
            />
          </div>

          <Button
            type="submit"
            variant="emerald"
            size="md"
            isLoading={actionLoading}
            leftIcon={<Plus size={16} />}
            className="w-full sm:w-auto font-bold"
          >
            Assign Email
          </Button>
        </form>

        {/* Assigned Staff List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            Active Assigned Staff ({staffList.length})
          </h4>

          {loading ? (
            <Spinner size="md" className="py-8" />
          ) : staffList.length === 0 ? (
            <div className="text-center py-8 border border-dashed border-white/10 rounded-2xl p-4 text-xs text-slate-400">
              No staff emails assigned yet. Any admin can operate this counter, or assign emails above.
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.map((st) => (
                <div
                  key={st.ASSIGNMENT_ID}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/80 border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-300">
                      <User size={16} />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white block">{st.STAFF_EMAIL}</span>
                      <span className="text-[10px] text-slate-400 font-mono">OPERATOR • Assigned to {queue.COUNTER_LABEL || 'Counter 1'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveStaff(st.ASSIGNMENT_ID, st.STAFF_EMAIL)}
                    className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Revoke access"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-white/10 text-right">
          <Button variant="secondary" size="md" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
