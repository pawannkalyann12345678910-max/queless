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
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-black text-black tracking-tight flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            Queue Performance & Real-Time Analytics
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Live tracking of visitor throughput, wait durations, and staff efficiency.</p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleExportCsv}
          leftIcon={<Download size={14} />}
          className="font-bold"
        >
          Export CSV History
        </Button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Total Tokens */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Total Visitors</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-black font-mono">{kpis.totalTokens}</span>
            <Users size={16} className="text-zinc-400" />
          </div>
        </div>

        {/* Avg Wait Duration */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Avg Wait Duration</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-600 font-mono">~{kpis.avgWaitMins}m</span>
            <Clock size={16} className="text-amber-500" />
          </div>
        </div>

        {/* Completed Visits */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Served Successfully</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-600 font-mono">{kpis.completedTokens}</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Completion Rate</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-blue-600 font-mono">{kpis.completionRate}%</span>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
        </div>

        {/* No-Shows */}
        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">No-Show / Cancelled</span>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-red-600 font-mono">{kpis.noShowTokens}</span>
            <AlertOctagon size={16} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Hourly Traffic Distribution Bar Chart */}
      <div className="bg-white rounded-xl p-6 border border-zinc-200 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-black mb-5 flex items-center gap-2">
          <Clock size={15} className="text-zinc-500" /> Hourly Queue Load & Rush Hours
        </h4>

        <div className="grid grid-cols-8 gap-3 sm:gap-6 items-end h-44 pt-4 pb-2 border-b border-zinc-100">
          {hourlyTraffic.map((item) => {
            const heightPercent = Math.round((item.volume / maxHourlyVolume) * 100);
            return (
              <div key={item.hour} className="flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[11px] font-mono font-bold text-zinc-900 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.volume}
                </span>
                <div
                  className="w-full bg-black hover:bg-zinc-800 rounded-t-md transition-all duration-300 shadow-xs"
                  style={{ height: `${Math.max(10, heightPercent)}%` }}
                />
                <span className="text-[10px] font-mono text-zinc-500 whitespace-nowrap font-medium">
                  {item.hour}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Counter Breakdown Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-zinc-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-black">
            Counter Efficiency Breakdown
          </h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-[11px] font-bold uppercase tracking-wider text-zinc-600 bg-zinc-50">
                <th className="py-3 px-4">Counter</th>
                <th className="py-3 px-4">Avg Mins / Person</th>
                <th className="py-3 px-4">Total Issued</th>
                <th className="py-3 px-4">Served</th>
                <th className="py-3 px-4">No-Shows</th>
                <th className="py-3 px-4">Waiting Now</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-xs font-medium">
              {queueStats.map(q => (
                <tr key={q.QUEUE_ID} className="hover:bg-zinc-50/70">
                  <td className="py-3 px-4 font-bold text-black">
                    {q.QUEUE_NAME} <span className="text-zinc-500 font-normal">({q.COUNTER_LABEL})</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-zinc-600">~{q.AVG_SERVICE_MINS}m</td>
                  <td className="py-3 px-4 font-mono font-bold text-black">{q.TOTAL_ISSUED}</td>
                  <td className="py-3 px-4 font-mono text-emerald-600 font-bold">{q.COMPLETED}</td>
                  <td className="py-3 px-4 font-mono text-red-600 font-bold">{q.NO_SHOW}</td>
                  <td className="py-3 px-4 font-mono text-amber-600 font-bold">{q.WAITING}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
