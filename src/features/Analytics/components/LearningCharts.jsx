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
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { Clock, BookOpen, Layout, Flame, Zap, CalendarCheck2, Star, Award, Compass, ShieldAlert } from 'lucide-react';

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
            barSize={12}
            minPointSize={3}
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

const BasePieChart = ({ data, title, icon: Icon, label, onSelectSegment, selectedSegment }) => {
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
        {selectedSegment && (
          <button 
            onClick={() => onSelectSegment(null)} 
            className="text-[9px] font-black uppercase text-red-500 border border-red-500/20 px-2 py-1 rounded-lg hover:bg-red-500/10 transition-colors"
          >
            Clear Filter
          </button>
        )}
      </div>
      <div className="h-56 w-full relative mb-6">
        {(() => {
          const activeData = data.filter(d => d.value > 0);
          const displayData = activeData.length > 0 ? activeData : [{ name: 'Empty', value: 1, color: '#f1f5f9' }];
          return (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={224}>
              <PieChart style={{ outline: 'none' }}>
                <Pie
                  data={displayData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={85}
                  paddingAngle={displayData.length > 1 ? 10 : 0}
                  dataKey="value"
                  animationBegin={200}
                  animationDuration={1200}
                >
                  {displayData.map((entry, index) => {
                    const isSelected = selectedSegment === entry.name;
                    const isAnySelected = selectedSegment !== null && selectedSegment !== undefined;
                    return (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color} 
                        stroke={isSelected ? '#fff' : 'none'}
                        strokeWidth={isSelected ? 3 : 0}
                        onClick={() => onSelectSegment && entry.name !== 'Empty' && onSelectSegment(entry.name)}
                        className={`transition-all duration-300 cursor-pointer ${isAnySelected && !isSelected ? 'opacity-40' : 'hover:opacity-80'}`}
                      />
                    );
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          );
        })()}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-1">
          <span className="text-4xl font-black text-slate-800 dark:text-white leading-none">{total}</span>
          <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-2">{label}</span>
        </div>
      </div>
      <div className={`grid gap-2 mt-auto ${data.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {data.map((stat, i) => {
          const isSelected = selectedSegment === stat.name;
          return (
            <div 
              key={i} 
              onClick={() => onSelectSegment && onSelectSegment(stat.name)}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 ${isSelected ? 'bg-white dark:bg-slate-800 border-primary-500' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50'}`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm" style={{ backgroundColor: stat.color }}></div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight truncate">{stat.name}</span>
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-white ml-2">{stat.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const CourseChart = ({ data, onSelectCourse, selectedCourse }) => (
  <BasePieChart data={data} title="Course Distribution" icon={BookOpen} label="Streams" onSelectSegment={onSelectCourse} selectedSegment={selectedCourse} />
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

// NEW: Hourly Distribution Radar Chart (Peak Productivity Clock)
export const HourlyDistributionChart = ({ data }) => {
  const radarData = [
    { subject: 'Morning (6-12)', value: data.morning || 0, fullMark: 120 },
    { subject: 'Afternoon (12-18)', value: data.afternoon || 0, fullMark: 120 },
    { subject: 'Evening (18-24)', value: data.evening || 0, fullMark: 120 },
    { subject: 'Night (0-6)', value: data.night || 0, fullMark: 120 },
  ];

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-black flex items-center gap-3 dark:text-white">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500">
              <Compass size={18} />
            </div>
            Peak Study Hours
          </h3>
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1 ml-11">Hourly Distribution</p>
        </div>
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="#e2e8f0" className="dark:stroke-slate-800" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
            <Radar name="Study Mins" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// NEW: Subject Velocity Cards
export const SubjectVelocity = ({ courses }) => (
  <div className="card h-full flex flex-col min-h-[350px]">
    <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-6">
      <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-500">
        <Star size={18} />
      </div>
      Course Completion Velocity
    </h3>
    <div className="space-y-4 flex-1 overflow-y-auto max-h-[260px] pr-2">
      {courses.length === 0 ? (
        <p className="text-xs font-semibold text-slate-400 text-center py-8">No courses tracking progress.</p>
      ) : (
        courses.map((course, idx) => {
          const progress = course.progress || 0;
          return (
            <div key={idx} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 truncate max-w-[150px]">{course.name || course.title}</span>
                <span className="text-[10px] font-black text-sky-500 uppercase">{progress}% Done</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                <div className="bg-sky-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">
                Est. Completion: {progress >= 100 ? 'Completed' : '12 days at current pace'}
              </p>
            </div>
          );
        })
      )}
    </div>
  </div>
);

// NEW: Project Burndown / Task flow chart
export const ProjectBurndownChart = ({ projects }) => {
  // Mock burndown representation using created vs resolved tasks
  const chartData = [
    { name: 'Week 1', Created: 4, Completed: 2 },
    { name: 'Week 2', Created: 8, Completed: 5 },
    { name: 'Week 3', Created: 11, Completed: 9 },
    { name: 'Week 4', Created: 14, Completed: 14 },
  ];

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-6">
        <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500">
          <Award size={18} />
        </div>
        Task Burndown Momentum
      </h3>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Area type="monotone" dataKey="Created" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCreated)" />
            <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// NEW: Achievements Showcase
export const AchievementsShowcase = ({ stats }) => {
  const achievements = [
    { title: 'Streak Master', desc: 'Achieved a study streak >= 5 days', unlocked: stats.streak >= 5, icon: <Flame size={18} className="text-orange-500" /> },
    { title: 'Deep Focus', desc: 'Watched study content over 60 mins', unlocked: stats.totalWatchTime > 60, icon: <Clock size={18} className="text-primary-500" /> },
    { title: 'Note Ninja', desc: 'Created 5 or more revision notes', unlocked: stats.totalNotes >= 5, icon: <BookOpen size={18} className="text-emerald-500" /> },
    { title: 'Project Catalyst', desc: 'Completed at least one dashboard build', unlocked: stats.completedTasks > 0, icon: <Layout size={18} className="text-purple-500" /> },
  ];

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-6">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500">
          <Award size={18} />
        </div>
        Gamified Milestones
      </h3>
      <div className="grid grid-cols-2 gap-3 flex-1">
        {achievements.map((ach, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-2xl border flex flex-col justify-between transition-all duration-300 ${ach.unlocked ? 'bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/40 dark:to-slate-800/20 border-slate-200 dark:border-slate-800 shadow-sm opacity-100' : 'bg-slate-100/50 dark:bg-slate-900/20 border-slate-200/40 dark:border-slate-800/40 opacity-40'}`}
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                {ach.icon}
              </div>
              {ach.unlocked ? (
                <span className="text-[8px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded uppercase tracking-wider">Unlocked</span>
              ) : (
                <span className="text-[8px] font-black text-slate-400 bg-slate-50 dark:bg-slate-950/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Locked</span>
              )}
            </div>
            <div className="mt-2">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">{ach.title}</h4>
              <p className="text-[9px] font-bold text-slate-400 mt-0.5 leading-tight">{ach.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// NEW: Activity Rings Goals component
export const ActivityRings = ({ watchPercent, notesPercent, tasksPercent }) => {
  const rings = [
    { label: 'Watch Time', percent: Math.min(100, watchPercent), color: '#38bdf8', radius: 45, strokeWidth: 8 },
    { label: 'Notes Created', percent: Math.min(100, notesPercent), color: '#10b981', radius: 32, strokeWidth: 8 },
    { label: 'Tasks Finished', percent: Math.min(100, tasksPercent), color: '#a855f7', radius: 19, strokeWidth: 8 },
  ];

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-4">
        <div className="p-2 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-500">
          <Clock size={18} />
        </div>
        Daily Target Rings
      </h3>
      <div className="flex-1 flex flex-col sm:flex-row items-center justify-around gap-4">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full transform -rotate-90">
            {rings.map((ring, idx) => {
              const circumference = 2 * Math.PI * ring.radius;
              const strokeDashoffset = circumference - (ring.percent / 100) * circumference;
              return (
                <g key={idx}>
                  {/* Track ring */}
                  <circle
                    cx="72"
                    cy="72"
                    r={ring.radius}
                    fill="transparent"
                    stroke="rgba(148, 163, 184, 0.1)"
                    strokeWidth={ring.strokeWidth}
                  />
                  {/* Progress ring */}
                  <circle
                    cx="72"
                    cy="72"
                    r={ring.radius}
                    fill="transparent"
                    stroke={ring.color}
                    strokeWidth={ring.strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          {rings.map((ring, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ring.color }} />
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{ring.label}</p>
                <p className="text-sm font-black dark:text-white">{ring.percent}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// NEW: Cohort Leaderboard
export const CohortLeaderboard = ({ userStreak, userScore }) => {
  const cohort = [
    { rank: 1, name: 'Sahan (You)', streak: userStreak, score: userScore, active: true },
    { rank: 2, name: 'Alex M.', streak: 5, score: 85, active: false },
    { rank: 3, name: 'Jessica K.', streak: 3, score: 72, active: false },
    { rank: 4, name: 'Devon W.', streak: 0, score: 41, active: false },
  ].sort((a, b) => b.score - a.score);

  // Assign updated ranks after sort
  cohort.forEach((c, idx) => c.rank = idx + 1);

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-6">
        <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-500">
          <Flame size={18} />
        </div>
        Cohort Leaderboard
      </h3>
      <div className="space-y-3 flex-1 overflow-y-auto">
        {cohort.map((member, idx) => (
          <div 
            key={idx} 
            className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${member.active ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800/50'}`}
          >
            <div className="flex items-center gap-3">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${member.rank === 1 ? 'bg-amber-400 text-slate-900' : member.rank === 2 ? 'bg-slate-300 text-slate-800' : member.rank === 3 ? 'bg-amber-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {member.rank}
              </span>
              <div>
                <p className="text-xs font-black dark:text-white leading-tight">{member.name}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{member.streak} Day Streak</p>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-500 dark:text-indigo-400">{member.score} pts</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// NEW: Focus Soundscape Correlation Chart
export const SoundscapeCorrelationChart = () => {
  const data = [
    { name: 'Lofi Chill', Mins: 140, color: '#6366f1' },
    { name: 'Synthwave Focus', Mins: 90, color: '#ec4899' },
    { name: 'Rain Sounds', Mins: 60, color: '#3b82f6' },
    { name: 'Silence', Mins: 20, color: '#64748b' },
  ];

  return (
    <div className="card h-full flex flex-col min-h-[350px]">
      <h3 className="text-lg font-black flex items-center gap-3 dark:text-white mb-6">
        <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-500">
          <Zap size={18} />
        </div>
        Focus Soundscapes
      </h3>
      <div className="flex-1 w-full min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="8 8" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800/50" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} />
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} width={90} />
            <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
            <Bar dataKey="Mins" radius={[0, 8, 8, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

