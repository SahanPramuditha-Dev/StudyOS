import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { Clock, BookOpen, Layout, Flame, Zap, CalendarCheck2 } from 'lucide-react';

export const WatchChart = ({ data }) => (
  <div className="card h-full flex flex-col min-h-[320px]">
    <div className="flex items-center justify-between mb-6">
      <div>
        <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
          <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500">
            <Clock size={20} />
          </div>
          Watch Time Analytics
        </h3>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 ml-11">Weekly Engagement Overview</p>
      </div>
      <div className="px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
        <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Minutes / Day</span>
      </div>
    </div>
    <div className="flex-1 min-h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
            dy={15}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(14, 165, 233, 0.05)', radius: 8 }}
            contentStyle={{ 
              borderRadius: '20px', 
              border: 'none', 
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              padding: '12px 16px'
            }}
            itemStyle={{ fontWeight: 800, color: '#0ea5e9', fontSize: '14px' }}
            labelStyle={{ fontWeight: 800, color: '#1e293b', marginBottom: '4px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
          />
          <Bar 
            dataKey="minutes" 
            fill="url(#colorMinutes)" 
            radius={[10, 10, 4, 4]} 
            barSize={32}
            animationDuration={1500}
            animationEasing="ease-out"
          >
            <defs>
              <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={1}/>
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.8}/>
              </linearGradient>
            </defs>
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const ConsistencyPanel = ({ data }) => {
  const activeDays = data.filter((d) => Number(d.minutes) > 0).length;
  const totalMinutes = data.reduce((acc, d) => acc + Number(d.minutes || 0), 0);
  const avgMinutes = Math.round(totalMinutes / Math.max(1, data.length));

  return (
    <div className="card h-full flex flex-col min-h-[320px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black flex items-center gap-3 dark:text-white">
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
            <CalendarCheck2 size={18} />
          </div>
          Daily Consistency
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
          Last 7 Days
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Active</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{activeDays}/7</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Avg/Day</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{avgMinutes}m</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-black">Total</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-100">{totalMinutes}m</p>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 mt-auto">
        {data.map((day) => {
          const level = day.minutes > 90 ? 'h-9 bg-emerald-500/90' : day.minutes > 45 ? 'h-7 bg-emerald-400/80' : day.minutes > 0 ? 'h-5 bg-emerald-300/80' : 'h-3 bg-slate-200 dark:bg-slate-700';
          return (
            <div key={day.name} className="flex flex-col items-center gap-1">
              <div className={`w-full rounded-md ${level}`} title={`${day.name}: ${day.minutes} min`} />
              <span className="text-[9px] font-black text-slate-400">{day.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BasePieChart = ({ data, title, icon: Icon, label }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  
  return (
    <div className="card h-full flex flex-col group transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/5">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-lg font-black flex items-center gap-3 dark:text-white">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-primary-500 group-hover:bg-primary-500 group-hover:text-white transition-colors duration-300">
            <Icon size={18} />
          </div>
          {title}
        </h3>
      </div>
      <div className="h-56 w-full relative mb-6">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={85}
              paddingAngle={10}
              dataKey="value"
              animationBegin={200}
              animationDuration={1200}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color} 
                  stroke="none"
                  className="transition-all duration-300 hover:opacity-80"
                />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-1">
          <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">{total}</span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">{label}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-auto">
        {data.map((stat, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: stat.color }}></div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">{stat.name}</span>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white ml-2">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const CourseChart = ({ data }) => (
  <BasePieChart data={data} title="Course Distribution" icon={BookOpen} label="Streams" />
);

export const ProjectChart = ({ data }) => (
  <BasePieChart data={data} title="Project Status" icon={Layout} label="Builds" />
);

export const StreakChart = ({ data }) => (
  <div className="card h-full flex flex-col min-h-[400px]">
    <div className="flex items-center justify-between mb-10">
      <div>
        <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
          <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500">
            <Flame size={20} />
          </div>
          Streak Momentum
        </h3>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 ml-11">30-Day Velocity Trend</p>
      </div>
    </div>
    <div className="flex-1 min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorStreak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
          <XAxis 
            dataKey="name" 
            hide={true}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#f97316" 
            strokeWidth={4}
            fillOpacity={1} 
            fill="url(#colorStreak)" 
            animationDuration={2000}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CohortChart = ({ data }) => (
  <div className="card h-full flex flex-col min-h-[400px]">
    <div className="flex items-center justify-between mb-10">
      <div>
        <h3 className="text-xl font-black flex items-center gap-3 dark:text-white">
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500">
            <Zap size={20} />
          </div>
          Weekly Retention
        </h3>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5 ml-11">Active Days per Week</p>
      </div>
    </div>
    <div className="flex-1 min-h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
          <XAxis 
            dataKey="week" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
          <YAxis 
            domain={[0, 7]}
            ticks={[0, 2, 4, 7]}
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }}
          />
          <Tooltip 
            cursor={{ fill: 'rgba(168, 85, 247, 0.05)', radius: 8 }}
            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
          />
          <Bar 
            dataKey="days" 
            fill="#a855f7" 
            radius={[10, 10, 4, 4]} 
            barSize={40}
            animationDuration={1500}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);
