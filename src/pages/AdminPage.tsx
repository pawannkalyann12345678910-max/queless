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
  Sparkles
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user, adminOrgs, loading: authLoading, refreshAuth } = useAuth();
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [queues, setQueues] = useState<Queue[]>([]);
  const [loadingQueues, setLoadingQueues] = useState(false);
  const [isCreateQueueOpen, setIsCreateQueueOpen] = useState(false);
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
      <div className="text-center py-24 glass-panel rounded-3xl p-10 max-w-lg mx-auto border border-white/10">
        <div className="w-16 h-16 rounded-3xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400 mb-4">
          <ShieldAlert size={32} />
        </div>
        <h3 className="text-xl font-bold text-white">Admin Sign-In Required</h3>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          Please sign in with your organization admin Google account to access the Admin Portal.
        </p>
      </div>
    );
  }

  // ─── No admin orgs yet ───────────────────────────────────────────────────────
  if (!authLoading && adminOrgs.length === 0) {
    return (
      <div className="space-y-10">
        <div className="text-center py-16 glass-panel rounded-3xl p-10 border border-indigo-500/20 max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-cyan-500 border border-indigo-400/30 flex items-center justify-center mx-auto text-white mb-5 shadow-xl shadow-indigo-600/20">
            <Building2 size={36} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-3">
            Welcome to Queless Admin Portal
          </h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto mb-8 leading-relaxed">
            You don't have any registered organizations yet. Register your clinic, bank, university, or enterprise to start issuing digital token passes.
          </p>
          <Link to="/admin/register">
            <Button variant="emerald" size="lg" leftIcon={<Sparkles size={18} />} rightIcon={<ArrowRight size={18} />} className="font-bold shadow-emerald-500/20">
              Register Your Organization
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // ─── Main Admin Dashboard ────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="emerald" size="sm" dot>Admin Portal</Badge>
            {selectedOrg && <Badge variant="indigo" size="sm">{selectedOrg.SUBSCRIPTION_TIER} PLAN</Badge>}
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="text-emerald-400" size={28} />
            {selectedOrg?.NAME || 'Admin Dashboard'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage service counters, assign staff, view analytics, and broadcast HDMI queue screens.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* HDMI Cast for first active queue */}
          {queues.length > 0 && (
            <HDMICastButton
              queueId={queues[0].QUEUE_ID}
              queueName={queues[0].NAME}
            />
          )}

          <Link to="/admin/register">
            <Button variant="glass" size="sm" leftIcon={<Building2 size={15} />}>
              Add Organization
            </Button>
          </Link>

          <Button
            variant="emerald"
            size="sm"
            leftIcon={<Plus size={16} />}
            onClick={() => setIsCreateQueueOpen(true)}
            className="font-bold"
          >
            New Service Counter
          </Button>
        </div>
      </div>

      {/* Multi-org switcher if admin manages more than one org */}
      {adminOrgs.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">Organization:</span>
          {adminOrgs.map((org) => (
            <button
              key={org.ORG_ID}
              onClick={() => { setSelectedOrgId(org.ORG_ID); setQueues([]); }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedOrgId === org.ORG_ID
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
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
      <div className="flex items-center gap-1 bg-slate-900/80 rounded-2xl p-1 border border-white/10 w-fit">
        <button
          onClick={() => setActiveTab('queues')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'queues'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={16} /> Service Counters ({queues.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 size={16} /> Analytics
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
