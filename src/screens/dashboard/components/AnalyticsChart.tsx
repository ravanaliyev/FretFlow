import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

export interface AnalyticsChartProps {
  stats: Record<string, number>;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ stats }) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = days.map(day => stats[day] || 0);
  const max = Math.max(...data, 60);
  const hasData = data.some(v => v > 0);

  // SVG dimensions
  const width = 500;
  const height = 160;
  const padding = 20;

  // Calculate points for the line
  const points = data.map((val, i) => ({
    x: padding + (i * (width - 2 * padding)) / (days.length - 1),
    y: height - padding - (val / max) * (height - 2 * padding)
  }));

  // Generate path string (simple linear for now, could be curved)
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  const activeDays = data.filter(v => v > 0).length;
  const totalMins = Math.round(data.reduce((acc, v) => acc + v, 0));
  const avgMins = activeDays > 0 ? Math.round(totalMins / activeDays) : 0;
  const bestDayIdx = data.indexOf(Math.max(...data));
  const bestDayName = data[bestDayIdx] > 0 ? days[bestDayIdx] : 'None';

  return (
    <div className="glass-panel p-6 rounded-3xl bg-white/[0.02] border-white/5 mb-8 relative overflow-hidden group/chart">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Activity size={100} />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">Practice Momentum</h4>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Performance analytics curve</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Avg/Day</p>
            <p className="text-sm font-bold text-primary-400">{avgMins}m</p>
          </div>
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Weekly</p>
            <p className="text-sm font-bold text-white">{totalMins}m</p>
          </div>
          <div className="px-3 border-l border-white/10">
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-tighter">Peak</p>
            <p className="text-sm font-bold text-amber-500">{bestDayName}</p>
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-40 gap-2 border border-dashed border-white/5 rounded-2xl">
          <p className="text-gray-600 font-bold text-sm italic">"The secret of getting ahead is getting started."</p>
          <button className="text-[10px] text-primary-500/50 uppercase font-black tracking-widest mt-2 hover:text-primary-500 transition-colors">Begin Training</button>
        </div>
      ) : (
        <div className="relative h-48 w-full">
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10 py-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full border-t border-white/20" />
            ))}
          </div>

          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-40 drop-shadow-[0_0_15px_rgba(57,255,20,0.15)]"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39FF14" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#39FF14" stopOpacity="0" />
              </linearGradient>
            </defs>

            <motion.path
              initial={{ d: `M ${points[0].x} ${height - padding} L ${points[0].x} ${height - padding} Z` }}
              animate={{ d: areaPath }}
              fill="url(#areaGradient)"
              transition={{ duration: 1, ease: "easeOut" }}
            />

            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              d={linePath}
              fill="none"
              stroke="#39FF14"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />

            {points.map((p, i) => (
              <g key={i} className="cursor-pointer group/point">
                <motion.circle
                  initial={{ r: 0 }}
                  animate={{ r: 4 }}
                  cx={p.x}
                  cy={p.y}
                  fill="#39FF14"
                  className="group-hover/point:r-6 transition-all"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="12"
                  fill="transparent"
                  className="pointer-events-auto"
                />
              </g>
            ))}
          </svg>

          <div className="flex justify-between items-center mt-4 px-1">
            {days.map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1 group/label">
                <span className={`text-[10px] font-black transition-all ${data[i] > 0 ? 'text-primary-500' : 'text-gray-700'}`}>
                  {day}
                </span>
                {data[i] > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="text-[9px] text-gray-500 font-bold"
                  >
                    {Math.round(data[i])}m
                  </motion.span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsChart;
