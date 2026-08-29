import React, { useState } from 'react';
import type { Queue } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { HDMICastButton } from '../staff/HDMICastButton';
import { StaffAssignmentModal } from './StaffAssignmentModal';
import { EditQueueModal } from './EditQueueModal';
import { ShareQueueModal } from './ShareQueueModal';
import { 
  Settings, 
  Trash2, 
  PauseCircle, 
  PlayCircle, 
  UserPlus, 
  Clock, 
  Layers,
  Eye,
  EyeOff,
  Share2
} from 'lucide-react';

interface QueueManagerTableProps {
  queues: Queue[];
  onRefresh: () => void;
  orgId?: string;
}

export const QueueManagerTable: React.FC<QueueManagerTableProps> = ({ queues, onRefresh }) => {
  const [selectedQueueForStaff, setSelectedQueueForStaff] = useState<Queue | null>(null);
  const [selectedQueueForEdit, setSelectedQueueForEdit] = useState<Queue | null>(null);
  const [selectedQueueForShare, setSelectedQueueForShare] = useState<Queue | null>(null);
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

  const handleToggleVisibility = async (queueId: string) => {
    setActionLoadingQueueId(queueId);
    try {
      await api.toggleQueueVisibility(queueId);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle visibility');
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
      <div className="text-center py-16 border border-dashed border-zinc-300 rounded-xl p-8 bg-white shadow-xs">
        <div className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-400 mb-3">
          <Layers size={24} />
        </div>
        <h4 className="text-base font-black text-black">No Service Counters Configured</h4>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto mt-1">
          Click "New Service Counter" above to setup your first waiting queue, token prefix, and assign staff Google emails.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-base font-black text-black flex items-center gap-2">
            <Layers className="text-blue-600" size={18} />
            Service Counters ({queues.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                <th className="py-3.5 px-5">Counter / Queue Name</th>
                <th className="py-3.5 px-4">Prefix</th>
                <th className="py-3.5 px-4">Est. Speed</th>
                <th className="py-3.5 px-4">Visibility</th>
                <th className="py-3.5 px-4">Intake Status</th>
                <th className="py-3.5 px-4">HDMI Cast</th>
                <th className="py-3.5 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium">
              {queues.map((q) => {
                const isPaused = q.IS_PAUSED === 1;
                const isVisible = q.IS_ACTIVE === 1;
                const isBusy = actionLoadingQueueId === q.QUEUE_ID;

                return (
                  <tr key={q.QUEUE_ID} className="hover:bg-zinc-50/70 transition-colors">
                    {/* Name & Counter Label */}
                    <td className="py-4 px-5">
                      <div>
                        <span className="font-bold text-black text-sm block">{q.NAME}</span>
                        <span className="text-zinc-500 text-xs font-normal">{q.COUNTER_LABEL || 'Counter 1'} • {q.OPERATING_HOURS}</span>
                      </div>
                    </td>

                    {/* Prefix */}
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">
                      {q.PREFIX}
                    </td>

                    {/* Speed */}
                    <td className="py-4 px-4 text-zinc-700">
                      <span className="flex items-center gap-1.5 font-mono text-xs">
                        <Clock size={13} className="text-zinc-400" />
                        ~{q.AVG_SERVICE_MINS}m / token
                      </span>
                    </td>

                    {/* Visibility Badge */}
                    <td className="py-4 px-4">
                      {isVisible ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Eye size={12} />
                          Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200">
                          <EyeOff size={12} />
                          Hidden
                        </span>
                      )}
                    </td>

                    {/* Intake Status Badge */}
                    <td className="py-4 px-4">
                      {isPaused ? (
                        <Badge variant="rose" size="sm" dot>Paused</Badge>
                      ) : (
                        <Badge variant="emerald" size="sm" dot>Live Active</Badge>
                      )}
                    </td>

                    {/* HDMI Cast Button */}
                    <td className="py-4 px-4">
                      <HDMICastButton queueId={q.QUEUE_ID} queueName={q.NAME} />
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Share & QR Code */}
                        <Button
                          variant="emerald"
                          size="sm"
                          onClick={() => setSelectedQueueForShare(q)}
                          leftIcon={<Share2 size={12} />}
                          title="Share link & download QR code signage"
                          className="font-bold text-xs px-2.5 py-1"
                        >
                          Share
                        </Button>

                        {/* Assign Staff */}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedQueueForStaff(q)}
                          leftIcon={<UserPlus size={12} />}
                          title="Assign staff Google emails"
                          className="text-xs px-2.5 py-1"
                        >
                          Staff
                        </Button>

                        {/* Toggle Visibility */}
                        <Button
                          variant="secondary"
                          size="sm"
                          isLoading={isBusy}
                          onClick={() => handleToggleVisibility(q.QUEUE_ID)}
                          leftIcon={isVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                          title={isVisible ? "Hide from public view" : "Make publicly visible to customers"}
                          className="text-xs px-2.5 py-1"
                        >
                          {isVisible ? "Hide" : "Publish"}
                        </Button>

                        {/* Pause / Resume */}
                        <Button
                          variant={isPaused ? "amber" : "secondary"}
                          size="sm"
                          isLoading={isBusy}
                          onClick={() => handleTogglePause(q.QUEUE_ID)}
                          leftIcon={isPaused ? <PlayCircle size={12} /> : <PauseCircle size={12} />}
                          title={isPaused ? "Resume Online Intake" : "Pause Online Intake"}
                          className="text-xs px-2.5 py-1"
                        >
                          {isPaused ? "Resume" : "Pause"}
                        </Button>

                        {/* Edit Settings */}
                        <button
                          onClick={() => setSelectedQueueForEdit(q)}
                          className="p-1.5 text-zinc-500 hover:text-black hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Settings"
                        >
                          <Settings size={15} />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(q.QUEUE_ID, q.NAME)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Queue"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share & QR Code Modal */}
      {selectedQueueForShare && (
        <ShareQueueModal
          queue={selectedQueueForShare}
          isOpen={!!selectedQueueForShare}
          onClose={() => setSelectedQueueForShare(null)}
          orgName={selectedQueueForShare.ORG_NAME}
        />
      )}

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
    </>
  );
};
