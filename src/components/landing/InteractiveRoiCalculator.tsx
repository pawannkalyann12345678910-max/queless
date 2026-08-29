import React, { useState } from 'react';
import { Clock, TrendingUp, Users, Sparkles } from 'lucide-react';

export const InteractiveRoiCalculator: React.FC = () => {
  const [dailyVisitors, setDailyVisitors] = useState<number>(120);
  const [currentWaitMins, setCurrentWaitMins] = useState<number>(35);
  const [counters, setCounters] = useState<number>(4);

  // Computational Model
  const hoursSavedPerMonth = Math.round((dailyVisitors * (currentWaitMins - 4) * 26) / 60);
  const walkawayPreventedPerMonth = Math.round(dailyVisitors * 0.18 * 26);
  const estimatedRevenueProtected = walkawayPreventedPerMonth * 45; // $45 average service value

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-[#EAE5DE] shadow-xs space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF7F2] text-[#141312] text-xs font-bold uppercase tracking-wider border border-[#EAE5DE] shadow-2xs">
          <Sparkles size={13} className="text-[#C28E5C]" />
          Interactive Queue & ROI Estimator
        </span>
        <h3 className="text-2xl sm:text-4xl font-black text-[#141312] tracking-tight">
          Calculate Your Organization's Time & Revenue Recovery
        </h3>
        <p className="text-xs sm:text-sm text-[#736E66]">
          Adjust the sliders below to calculate how Queless transforms your lobby operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Controls (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-6 bg-[#FAF7F2] p-6 sm:p-8 rounded-2xl border border-[#EAE5DE]">
          {/* Slider 1: Daily Visitors */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#141312]">
              <span>Daily Visitors / Patients:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-[#EAE5DE] text-[#141312] font-black shadow-2xs">
                {dailyVisitors} visitors/day
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={800}
              step={10}
              value={dailyVisitors}
              onChange={(e) => setDailyVisitors(Number(e.target.value))}
              className="w-full h-2 bg-[#EAE5DE] rounded-lg appearance-none cursor-pointer accent-[#141312]"
            />
            <div className="flex justify-between text-[10px] text-[#9E988E] font-mono">
              <span>20</span>
              <span>400</span>
              <span>800+</span>
            </div>
          </div>

          {/* Slider 2: Current Physical Wait Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#141312]">
              <span>Average In-Lobby Wait Time:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-[#EAE5DE] text-[#C28E5C] font-black shadow-2xs">
                {currentWaitMins} minutes
              </span>
            </div>
            <input
              type="range"
              min={10}
              max={75}
              step={5}
              value={currentWaitMins}
              onChange={(e) => setCurrentWaitMins(Number(e.target.value))}
              className="w-full h-2 bg-[#EAE5DE] rounded-lg appearance-none cursor-pointer accent-[#C28E5C]"
            />
            <div className="flex justify-between text-[10px] text-[#9E988E] font-mono">
              <span>10 mins</span>
              <span>45 mins</span>
              <span>75 mins</span>
            </div>
          </div>

          {/* Slider 3: Counters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-[#141312]">
              <span>Active Service Counters / Desks:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-[#EAE5DE] text-emerald-700 font-black shadow-2xs">
                {counters} counters
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={15}
              step={1}
              value={counters}
              onChange={(e) => setCounters(Number(e.target.value))}
              className="w-full h-2 bg-[#EAE5DE] rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Right: Calculated Metrics Summary (Cols 8-12) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#EAE5DE] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-[#736E66]">Visitor Time Saved</span>
              <Clock size={16} className="text-[#141312]" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[#141312] font-mono">
              {hoursSavedPerMonth.toLocaleString()} hrs
            </div>
            <p className="text-[11px] text-[#736E66]">
              Saved from standing idle in crowded waiting rooms every month.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-1 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-800">Walkaways Prevented</span>
              <Users size={16} className="text-emerald-700" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-800 font-mono">
              {walkawayPreventedPerMonth.toLocaleString()} patients
            </div>
            <p className="text-[11px] text-emerald-800/80">
              Retained customers who would have abandoned long physical queues.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#141312] text-white border border-[#262422] space-y-1 shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-amber-400">Protected Value / Mo</span>
              <TrendingUp size={16} className="text-amber-400" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-white font-mono">
              ${estimatedRevenueProtected.toLocaleString()}
            </div>
            <p className="text-[11px] text-[#9E988E]">
              Preserved service throughput and customer lifetime value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
