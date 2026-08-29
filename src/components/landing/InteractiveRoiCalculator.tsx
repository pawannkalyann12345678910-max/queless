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
    <div className="bg-white rounded-2xl p-6 sm:p-10 border border-zinc-200 shadow-sm space-y-8 max-w-7xl mx-auto">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider border border-blue-200">
          <Sparkles size={13} className="text-blue-600" />
          Interactive Queue & ROI Estimator
        </span>
        <h3 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
          Calculate Your Organization's Time & Revenue Recovery
        </h3>
        <p className="text-xs sm:text-sm text-zinc-500">
          Adjust the sliders below to calculate how Queless transforms your lobby operations.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left: Interactive Controls (Cols 1-7) */}
        <div className="lg:col-span-7 space-y-6 bg-zinc-50 p-6 rounded-xl border border-zinc-200">
          {/* Slider 1: Daily Visitors */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
              <span>Daily Visitors / Patients:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-zinc-200 text-blue-600 font-black">
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
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>20</span>
              <span>400</span>
              <span>800+</span>
            </div>
          </div>

          {/* Slider 2: Current Physical Wait Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
              <span>Average In-Lobby Wait Time:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-zinc-200 text-amber-700 font-black">
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
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
              <span>10 mins</span>
              <span>45 mins</span>
              <span>75 mins</span>
            </div>
          </div>

          {/* Slider 3: Counters */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-800">
              <span>Active Service Counters / Desks:</span>
              <span className="font-mono text-sm px-2.5 py-0.5 bg-white rounded-md border border-zinc-200 text-emerald-700 font-black">
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
              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
          </div>
        </div>

        {/* Right: Calculated Metrics Summary (Cols 8-12) */}
        <div className="lg:col-span-5 grid grid-cols-1 gap-4">
          <div className="p-5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-blue-700">Visitor Time Saved</span>
              <Clock size={16} className="text-blue-600" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-blue-700 font-mono">
              {hoursSavedPerMonth.toLocaleString()} hrs
            </div>
            <p className="text-[11px] text-blue-900/80">
              Saved from standing idle in crowded waiting rooms every month.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-emerald-800">Walkaways Prevented</span>
              <Users size={16} className="text-emerald-700" />
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-700 font-mono">
              ~{walkawayPreventedPerMonth.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-900/80">
              Customers retained who would have abandoned the physical line.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-black text-white space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-zinc-400">Monthly Value Protected</span>
              <TrendingUp size={16} className="text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono">
              ${estimatedRevenueProtected.toLocaleString()}
            </div>
            <p className="text-[11px] text-zinc-400">
              Protected operational throughput and retained appointment revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
