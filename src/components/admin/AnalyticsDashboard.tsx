import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import type { AnalyticsSummary } from '../../types';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { 
  BarChart3, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertOctagon, 
  Download, 
  TrendingUp 
} from 'lucide-react';

interface AnalyticsDashboardProps {
  orgId: string;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ orgId }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics(orgId);
        setAnalytics(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [orgId]);

  if (loading) return <Spinner size="lg" className="py-16" />;
  if (!analytics) return null;

  const { kpis, queueStats, hourlyTraffic } = analytics;
  const maxHourlyVolume = Math.max(...hourlyTraffic.map(h => h.volume), 10);

  const handleExportCsv = () => {
    window.open(api.getExportCsvUrl(orgId), '_blank');
  };

  return (
    <div className="space-y-8">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="text-indigo-400" size={22} />
            Queue Performance & Real-Time Analytics
          </h3>
          <p className="text-xs text-slate-400 mt-1">Live tracking of visitor throughput, wait durations, and staff efficiency.</p>
        </div>

        <Button
          variant="glass"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download size={15} />}
          className="border-emerald-500/30 text-emerald-300 hover:text-white"
        >
          Export CSV History
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Tokens */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Visitors</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white font-mono">{kpis.totalTokens}</span>
            <Users size={16} className="text-indigo-400" />
          </div>
        </div>

        {/* Avg Wait Duration */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Avg Wait Duration</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-400 font-mono">~{kpis.avgWaitMins}m</span>
            <Clock size={16} className="text-amber-400" />
          </div>
        </div>

        {/* Completed Visits */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Served Successfully</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-400 font-mono">{kpis.completedTokens}</span>
            <CheckCircle size={16} className="text-emerald-400" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Completion Rate</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-cyan-400 font-mono">{kpis.completionRate}%</span>
            <TrendingUp size={16} className="text-cyan-400" />
          </div>
        </div>

        {/* No-Shows */}
        <div className="glass-panel rounded-2xl p-4 border border-white/10">
          <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">No-Show / Abandoned</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-rose-400 font-mono">{kpis.noShowTokens}</span>
            <AlertOctagon size={16} className="text-rose-400" />
          </div>
        </div>
      </div>

      {/* Hourly Traffic Distribution Bar Chart */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
          <Clock size={16} className="text-indigo-400" /> Hourly Queue Load & Rush Hours
        </h4>

        <div className="grid grid-cols-8 gap-3 sm:gap-6 items-end h-48 pt-4 pb-2 border-b border-white/10">
          {hourlyTraffic.map((item) => {
            const heightPercent = Math.round((item.volume / maxHourlyVolume) * 100);
            return (
              <div key={item.hour} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-mono font-bold text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.volume}
                </span>
                <div
                  className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xl transition-all duration-500 group-hover:brightness-125 shadow-lg shadow-indigo-600/20"
                  style={{ height: `${Math.max(12, heightPercent)}%` }}
                />
                <span className="text-[10px] sm:text-xs font-mono text-slate-400 whitespace-nowrap">
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter Breakdown Table */}
      <div className="glass-panel rounded-3xl p-6 sm:p-7 border border-white/10">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Counter Efficiency Breakdown
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Counter</th>
                <th className="py-3 px-3">Avg Mins / Person</th>
                <th className="py-3 px-3">Total Issued</th>
                <th className="py-3 px-3">Served</th>
                <th className="py-3 px-3">No-Shows</th>
                <th className="py-3 px-3">Waiting Now</th>
              </tr>
            </thead>
            <tbody>
              {queueStats.map(q => (
                <tr key={q.QUEUE_ID} className="border-b border-white/5 text-xs">
                  <td className="py-3 px-3 font-bold text-white">
                    {q.QUEUE_NAME} <span className="text-slate-400 font-normal">({q.COUNTER_LABEL})</span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300">~{q.AVG_SERVICE_MINS}m</td>
                  <td className="py-3 px-3 font-mono font-bold text-white">{q.TOTAL_ISSUED}</td>
                  <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{q.COMPLETED}</td>
                  <td className="py-3 px-3 font-mono text-rose-400 font-bold">{q.NO_SHOW}</td>
                  <td className="py-3 px-3 font-mono text-amber-400 font-bold">{q.WAITING}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
