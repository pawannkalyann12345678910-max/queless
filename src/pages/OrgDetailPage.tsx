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
      <div className="text-center py-24 bg-white rounded-xl border border-zinc-200 p-8 max-w-lg mx-auto">
        <h3 className="text-xl font-bold text-black">Organization Not Found</h3>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />}>
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-black transition-colors">
        <ArrowLeft size={14} /> Back to Directory
      </Link>

      {/* Organization Header */}
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-zinc-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {organization.LOGO_URL ? (
              <img
                src={organization.LOGO_URL}
                alt={organization.NAME}
                className="w-16 h-16 rounded-xl object-cover border border-zinc-200 bg-zinc-50"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center font-black text-black text-2xl">
                {organization.NAME.charAt(0)}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="indigo" size="sm">{organization.CATEGORY}</Badge>
                <Badge variant="emerald" size="sm">Verified Counter Host</Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-black">
                {organization.NAME}
              </h1>

              <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                {organization.CITY && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-zinc-400" />
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
          <p className="text-xs sm:text-sm text-zinc-600 max-w-3xl mt-4 border-t border-zinc-100 pt-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}
      </div>

      {/* Available Counters / Queues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-black flex items-center gap-2">
              <Layers className="text-blue-600" size={20} />
              Available Service Counters ({queues.length})
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">Select a counter below to book your digital token pass.</p>
          </div>
        </div>

        {queues.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-300 rounded-xl p-8 bg-white">
            <p className="text-xs text-zinc-500">No active service counters found for this organization.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {queues.map((q) => (
              <QueueCard key={q.QUEUE_ID} queue={q} onBookSuccess={loadData} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
