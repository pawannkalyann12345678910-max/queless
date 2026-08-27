import React, { useState } from 'react';
import type { Queue } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { HDMICastButton } from '../staff/HDMICastButton';
import { StaffAssignmentModal } from './StaffAssignmentModal';
import { EditQueueModal } from './EditQueueModal';
import { 
  Settings, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  UserPlus, 
  Clock, 
  Layers 
} from 'lucide-react';

interface QueueManagerTableProps {
  queues: Queue[];
  onRefresh: () => void;
  orgId?: string;
}

export const QueueManagerTable: React.FC<QueueManagerTableProps> = ({ queues, onRefresh }) => {
  const [selectedQueueForStaff, setSelectedQueueForStaff] = useState<Queue | null>(null);
  const [selectedQueueForEdit, setSelectedQueueForEdit] = useState<Queue | null>(null);
  const [actionLoadingQueueId, setActionLoadingQueueId] = useState<string | null>(null);

  const handleTogglePause = async (queueId: string) => {
    setActionLoadingQueueId(queueId);
    try {
      await api.togglePauseQueue(queueId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle pause');
    } finally {
      setActionLoadingQueueId(null);
    }
  };

  const handleDelete = async (queueId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"? All associated tokens will be removed.`)) return;
    setActionLoadingQueueId(queueId);
    try {
      await api.deleteQueue(queueId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to delete queue');
    } finally {
      setActionLoadingQueueId(null);
    }
  };

  if (queues.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-8">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto text-slate-500 mb-3">
          <Layers size={28} />
        </div>
        <h4 className="text-base font-bold text-white">No Service Counters Configured</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Click "New Service Counter" above to setup your first waiting queue, token prefix, and assign staff Google emails.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="text-indigo-400" size={20} />
          Active Service Counters ({queues.length})
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/40">
              <th className="py-4 px-6">Counter / Queue Name</th>
              <th className="py-4 px-4">Prefix</th>
              <th className="py-4 px-4">Est. Speed</th>
              <th className="py-4 px-4">Live Status</th>
              <th className="py-4 px-4">HDMI Cast</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-xs">
            {queues.map((q) => {
              const isPaused = q.IS_PAUSED === 1;
              const isBusy = actionLoadingQueueId === q.QUEUE_ID;

              return (
                <tr key={q.QUEUE_ID} className="hover:bg-white/[0.02] transition-colors">
                  {/* Name & Counter Label */}
                  <td className="py-4 px-6">
                    <div>
                      <span className="font-bold text-white text-sm block">{q.NAME}</span>
                      <span className="text-slate-400 text-xs">{q.COUNTER_LABEL || 'Counter 1'} • {q.OPERATING_HOURS}</span>
                    </div>
                  </td>

                  {/* Prefix */}
                  <td className="py-4 px-4 font-mono font-bold text-indigo-300">
                    {q.PREFIX}
                  </td>

                  {/* Speed */}
                  <td className="py-4 px-4 text-slate-300">
                    <span className="flex items-center gap-1.5 font-mono">
                      <Clock size={13} className="text-slate-400" />
                      ~{q.AVG_SERVICE_MINS}m / token
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-4">
                    {isPaused ? (
                      <Badge variant="rose" size="sm" dot>Intake Paused</Badge>
                    ) : (
                      <Badge variant="emerald" size="sm" dot>Active Intake</Badge>
                    )}
                  </td>

                  {/* HDMI Cast Button */}
                  <td className="py-4 px-4">
                    <HDMICastButton queueId={q.QUEUE_ID} queueName={q.NAME} />
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Assign Staff */}
                      <Button
                        variant="glass"
                        size="sm"
                        onClick={() => setSelectedQueueForStaff(q)}
                        leftIcon={<UserPlus size={14} />}
                        title="Assign staff Google emails"
                        className="text-indigo-300 hover:text-white"
                      >
                        Staff
                      </Button>

                      {/* Pause / Resume */}
                      <Button
                        variant={isPaused ? "amber" : "secondary"}
                        size="sm"
                        isLoading={isBusy}
                        onClick={() => handleTogglePause(q.QUEUE_ID)}
                        leftIcon={isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                        title={isPaused ? "Resume Online Intake" : "Pause Online Intake"}
                      >
                        {isPaused ? "Resume" : "Pause"}
                      </Button>

                      {/* Edit Settings */}
                      <button
                        onClick={() => setSelectedQueueForEdit(q)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                        title="Edit Settings"
                      >
                        <Settings size={16} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(q.QUEUE_ID, q.NAME)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                        title="Delete Queue"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Staff Assignment Modal */}
      {selectedQueueForStaff && (
        <StaffAssignmentModal
          queue={selectedQueueForStaff}
          isOpen={!!selectedQueueForStaff}
          onClose={() => setSelectedQueueForStaff(null)}
        />
      )}

      {/* Edit Queue Settings Modal */}
      {selectedQueueForEdit && (
        <EditQueueModal
          queue={selectedQueueForEdit}
          isOpen={!!selectedQueueForEdit}
          onClose={() => setSelectedQueueForEdit(null)}
          onSuccess={() => {
            setSelectedQueueForEdit(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
