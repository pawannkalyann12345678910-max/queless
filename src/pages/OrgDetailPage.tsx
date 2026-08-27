import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Organization, Queue } from '../types';
import { QueueCard } from '../components/customer/QueueCard';
import { Badge } from '../components/common/Badge';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { 
  MapPin, 
  ArrowLeft, 
  Layers 
} from 'lucide-react';

export const OrgDetailPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const res = await api.getOrganizationDetails(orgId);
      setOrganization(res.organization);
      setQueues(res.queues);
    } catch (err) {
      console.error('Failed to load org details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [orgId]);

  if (loading) return <Spinner size="lg" className="py-24" />;

  if (!organization) {
    return (
      <div className="text-center py-24">
        <h3 className="text-xl font-bold text-white">Organization Not Found</h3>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Back Button */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </Link>

      {/* Organization Banner / Header */}
      <div className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {organization.LOGO_URL ? (
              <img
                src={organization.LOGO_URL}
                alt={organization.NAME}
                className="w-20 h-20 rounded-3xl object-cover border border-white/15 bg-slate-900 shadow-xl"
              />
            ) : (
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 border border-white/20 flex items-center justify-center font-black text-white text-3xl shadow-xl">
                {organization.NAME.charAt(0)}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Badge variant="indigo" size="sm">{organization.CATEGORY}</Badge>
                <Badge variant="emerald" size="sm">Verified Counter Host</Badge>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {organization.NAME}
              </h1>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                {organization.CITY && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} className="text-slate-400" />
                    {organization.CITY}
                  </span>
                )}
                {organization.ADDRESS && (
                  <span>• {organization.ADDRESS}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {organization.DESCRIPTION && (
          <p className="text-sm text-slate-300 max-w-3xl mt-6 leading-relaxed border-t border-white/10 pt-4">
            {organization.DESCRIPTION}
          </p>
        )}
      </div>

      {/* Available Counters / Queues List */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Layers className="text-indigo-400" size={24} />
              Available Service Counters ({queues.length})
            </h2>
            <p className="text-xs text-slate-400 mt-1">Select a counter below to book your digital token pass.</p>
          </div>
        </div>

        {queues.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-3xl p-8">
            <p className="text-sm text-slate-400">No active service counters found for this organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((q) => (
              <QueueCard key={q.QUEUE_ID} queue={q} onBookSuccess={loadData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
