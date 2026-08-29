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
      <div className="text-center py-24 bg-white rounded-3xl border border-[#EAE5DE] p-8 max-w-lg mx-auto my-8 shadow-xs">
        <h3 className="text-xl font-bold text-[#141312]">Organization Not Found</h3>
        <Link to="/" className="mt-4 inline-block">
          <Button variant="secondary" size="md" leftIcon={<ArrowLeft size={16} />} className="border-[#EAE5DE] bg-white text-[#141312] hover:bg-[#FAF7F2] rounded-xl cursor-pointer">
            Back to Directory
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Back Link */}
      <Link to="/" className="inline-flex items-center gap-2 text-xs font-bold text-[#736E66] hover:text-[#141312] transition-colors">
        <ArrowLeft size={14} /> Back to Directory
      </Link>

      {/* Organization Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#EAE5DE] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            {organization.LOGO_URL ? (
              <img
                src={organization.LOGO_URL}
                alt={organization.NAME}
                className="w-16 h-16 rounded-2xl object-cover border border-[#EAE5DE] bg-[#FAF7F2]"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] flex items-center justify-center font-black text-[#141312] text-2xl shadow-xs">
                {organization.NAME.charAt(0)}
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="indigo" size="sm">{organization.CATEGORY}</Badge>
                <Badge variant="emerald" size="sm">Verified Counter Host</Badge>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#141312]">
                {organization.NAME}
              </h1>

              <div className="flex items-center gap-3 text-xs text-[#736E66] flex-wrap">
                {organization.CITY && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-[#9E988E]" />
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
          <p className="text-xs sm:text-sm text-[#736E66] max-w-3xl mt-4 border-t border-[#EAE5DE] pt-4 leading-relaxed">
            {organization.DESCRIPTION}
          </p>
        )}
      </div>

      {/* Available Counters / Queues List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black text-[#141312] flex items-center gap-2">
              <Layers className="text-[#C28E5C]" size={20} />
              Available Service Counters ({queues.length})
            </h2>
            <p className="text-xs text-[#736E66] mt-0.5">Select a counter below to book your digital token pass.</p>
          </div>
        </div>

        {queues.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl p-8 border border-[#EAE5DE] shadow-xs">
            <h4 className="text-base font-bold text-[#141312]">No Active Counters</h4>
            <p className="text-xs text-[#736E66] mt-1">This organization has not published any live counters yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {queues.map((queue) => (
              <QueueCard key={queue.QUEUE_ID} queue={queue} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
