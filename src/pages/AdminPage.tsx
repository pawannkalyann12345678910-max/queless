import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePolling } from '../hooks/usePolling';
import { api } from '../services/api';
import type { Queue } from '../types';
import { OrgOverviewCard } from '../components/admin/OrgOverviewCard';
import { QueueManagerTable } from '../components/admin/QueueManagerTable';
import { CreateQueueModal } from '../components/admin/CreateQueueModal';
import { AnalyticsDashboard } from '../components/admin/AnalyticsDashboard';
import { HDMICastButton } from '../components/staff/HDMICastButton';
import { Spinner } from '../components/common/Spinner';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import {
  Building2,
  Plus,
  BarChart3,
  Layers,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import { AdminWhatsAppModal } from '../components/admin/AdminWhatsAppModal';

export const AdminPage: React.FC = () => {
  const { user, adminOrgs, loading: authLoading, refreshAuth } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'queues' | 'analytics'>('queues');

  // When adminOrgs loads, auto-select first org
  useEffect(() => {
    if (adminOrgs.length > 0 && !selectedOrgId) {
      setSelectedOrgId(adminOrgs[0].ORG_ID);
    }
  }, [adminOrgs, selectedOrgId]);

  const loadQueues = async () => {
    if (!selectedOrgId) return;
    try {
      setLoadingQueues(true);
      const res = await api.getOrganizationDetails(selectedOrgId);
      setQueues(res.queues);
    } catch (err) {
      console.error('Failed to load queues:', err);
    } finally {
      setLoadingQueues(false);
    }
  };

  usePolling(loadQueues, 6000, !!selectedOrgId);

  const selectedOrg = adminOrgs.find(o => o.ORG_ID === selectedOrgId);

  // ─── Not logged in ───────────────────────────────────────────────────────────
  if (authLoading) return <Spinner size="lg" className="py-24" />;

  if (!user) {
    return (
      <div className="text-center py-24 bg-white rounded-3xl p-10 max-w-lg mx-auto border border-[#EAE5DE] shadow-xs my-8">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700 mb-4 font-bold">
          <ShieldAlert size={28} />
        </div>
        <h3 className="text-xl font-black text-[#141312]">Admin Sign-In Required</h3>
        <p className="text-xs text-[#736E66] mt-2 mb-6">
          Please sign in with your organization admin Google account to access the Admin Portal.
        </p>
      </div>
    );
  }

  // ─── No admin orgs yet ───────────────────────────────────────────────────────
  if (!authLoading && adminOrgs.length === 0) {
    return (
      <div className="space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-16 bg-white rounded-3xl p-10 border border-[#EAE5DE] max-w-2xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#141312] text-white flex items-center justify-center mx-auto mb-4 font-black text-2xl shadow-sm">
            <Building2 size={30} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#141312] tracking-tight mb-2">
            Welcome to Queless Admin Console
          </h2>
          <p className="text-sm text-[#736E66] max-w-md mx-auto mb-8 leading-relaxed">
            You don't have any registered organizations yet. Register your clinic, bank, university, or enterprise to start issuing digital token passes.
          </p>
          <Link to="/admin/register">
            <Button variant="primary" size="lg" leftIcon={<Sparkles size={16} />} rightIcon={<ArrowRight size={16} />} className="font-bold bg-[#141312] hover:bg-[#262422] text-white px-8 rounded-xl shadow-xs cursor-pointer">
              Register Your Organization
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Admin Dashboard ────────────────────────────────────────────────────
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="emerald" size="sm" dot>Admin Console</Badge>
            {selectedOrg && <Badge variant="neutral" size="sm">{selectedOrg.SUBSCRIPTION_TIER.toLowerCase()} plan</Badge>}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#141312] tracking-tight flex items-center gap-2.5">
            <Building2 className="text-[#141312] shrink-0" size={26} />
            <span className="truncate">{selectedOrg?.NAME || 'Admin Dashboard'}</span>
          </h1>
          <p className="text-xs text-[#736E66] mt-0.5">
            Manage service counters, assign staff, view analytics, and broadcast HDMI queue screens.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 w-full sm:w-auto shrink-0">
          {/* WhatsApp Gateway Button */}
          {selectedOrg && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<MessageSquare size={14} className="text-emerald-700" />}
              onClick={() => setIsWhatsAppModalOpen(true)}
              className="font-bold shrink-0 border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100 text-emerald-950 rounded-xl cursor-pointer"
            >
              WhatsApp Bot
            </Button>
          )}

          {/* HDMI Cast for first active queue */}
          {queues.length > 0 && (
            <HDMICastButton
              queueId={queues[0].QUEUE_ID}
              queueName={queues[0].NAME}
            />
          )}

          <Link to="/admin/register" className="shrink-0">
            <Button variant="secondary" size="sm" leftIcon={<Building2 size={14} />} className="border-[#EAE5DE] bg-white text-[#141312] hover:bg-[#FAF7F2] rounded-xl shadow-2xs cursor-pointer">
              Add Org
            </Button>
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-mono font-bold text-[#141312] bg-white px-2.5 py-1.5 rounded-xl border border-[#EAE5DE] shadow-2xs">
              {queues.length} / {selectedOrg?.SUBSCRIPTION_TIER === 'ENTERPRISE' ? 4 : selectedOrg?.SUBSCRIPTION_TIER === 'PROFESSIONAL' ? 2 : 1} Counters
            </span>
            <Button
              variant="emerald"
              size="sm"
              leftIcon={<Plus size={15} />}
              onClick={() => setIsCreateQueueOpen(true)}
              className="font-bold shrink-0 rounded-xl cursor-pointer"
            >
              New Counter
            </Button>
          </div>
        </div>
      </div>

      {/* Multi-org switcher */}
      {adminOrgs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-[#736E66] font-bold uppercase tracking-wider shrink-0 mr-1">Organization:</span>
          {adminOrgs.map((org) => (
            <button
              key={org.ORG_ID}
              onClick={() => { setSelectedOrgId(org.ORG_ID); setQueues([]); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedOrgId === org.ORG_ID
                  ? 'bg-[#141312] text-white shadow-xs'
                  : 'bg-[#FAF7F2] text-[#736E66] hover:bg-[#F5F1E9] border border-[#EAE5DE]'
              }`}
            >
              {org.NAME}
            </button>
          ))}
        </div>
      )}

      {/* Organization Overview Card */}
      {selectedOrg && (
        <OrgOverviewCard organization={selectedOrg} onRefresh={refreshAuth} />
      )}

      {/* Tab switcher */}
      <div className="flex items-center gap-1.5 bg-white rounded-2xl p-1 border border-[#EAE5DE] w-fit shadow-2xs">
        <button
          onClick={() => setActiveTab('queues')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'queues'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'text-[#736E66] hover:text-[#141312] hover:bg-[#FAF7F2]'
          }`}
        >
          <Layers size={14} /> Service Counters ({queues.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#141312] text-white shadow-xs'
              : 'text-[#736E66] hover:text-[#141312] hover:bg-[#FAF7F2]'
          }`}
        >
          <BarChart3 size={14} /> Analytics & Flow
        </button>
      </div>

      {/* Tab content */}
      {activeTab === 'queues' && (
        <>
          {loadingQueues && queues.length === 0 ? (
            <Spinner size="lg" className="py-16" />
          ) : (
            <QueueManagerTable
              queues={queues}
              orgId={selectedOrgId}
              onRefresh={loadQueues}
            />
          )}
        </>
      )}

      {activeTab === 'analytics' && selectedOrgId && (
        <AnalyticsDashboard orgId={selectedOrgId} />
      )}

      {/* WhatsApp Gateway Modal */}
      {isWhatsAppModalOpen && selectedOrg && (
        <AdminWhatsAppModal
          orgId={selectedOrg.ORG_ID}
          orgName={selectedOrg.NAME}
          isOpen={isWhatsAppModalOpen}
          onClose={() => setIsWhatsAppModalOpen(false)}
        />
      )}

      {/* Create Queue Modal */}
      {isCreateQueueOpen && selectedOrgId && (
        <CreateQueueModal
          orgId={selectedOrgId}
          isOpen={isCreateQueueOpen}
          onClose={() => setIsCreateQueueOpen(false)}
          onSuccess={() => {
            setIsCreateQueueOpen(false);
            loadQueues();
          }}
        />
      )}
    </div>
  );
};
