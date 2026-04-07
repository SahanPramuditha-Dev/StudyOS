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
  Cell
} from 'recharts';
import { Clock, BookOpen } from 'lucide-react';

export const WatchChart = ({ data }) => (
  <div className="card h-full flex flex-col">
    <div className="flex items-center justify-between mb-8">
      <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white">
        <Clock className="text-primary-500" size={20} />
        Watch Time Analytics
      </h3>
      <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Minutes / Day</span>
    </div>
    <div className="flex-1 min-h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
          />
          <Tooltip 
            cursor={{ fill: '#f8fafc' }}
            contentStyle={{ 
              borderRadius: '16px', 
              border: 'none', 
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              backgroundColor: 'white'
            }}
            itemStyle={{ fontWeight: 700 }}
          />
          <Bar dataKey="minutes" fill="#0ea5e9" radius={[6, 6, 0, 0]} barSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export const CourseChart = ({ data }) => {
  const total = data.reduce((a, b) => a + b.value, 0);
  
  return (
    <div className="card h-full flex flex-col">
      <h3 className="text-lg font-bold mb-8 flex items-center gap-2 dark:text-white">
        <BookOpen className="text-accent-500" size={20} />
        Course Distribution
      </h3>
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={8}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-black text-slate-800 dark:text-white">{total}</span>
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Streams</span>
        </div>
      </div>
      <div className="space-y-3 mt-auto">
        {data.map((stat, i) => (
          <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stat.color }}></div>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{stat.name}</span>
            </div>
            <span className="text-xs font-black text-slate-800 dark:text-white">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
