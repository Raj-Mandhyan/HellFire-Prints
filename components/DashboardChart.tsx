/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  revenue: number;
}

interface DashboardChartProps {
  data: ChartDataPoint[];
}

export default function DashboardChart({ data }: DashboardChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-80 bg-[#0F0F0F] border border-neutral-900 rounded-3xl flex items-center justify-center text-xs text-neutral-550 uppercase tracking-widest font-black">
        Loading analytics engine...
      </div>
    );
  }

  return (
    <div className="w-full h-80 bg-[#0F0F0F] border border-neutral-900 p-6 rounded-3xl relative overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#C1121F]/5 blur-3xl pointer-events-none"></div>
      
      <div className="mb-4">
        <h4 className="text-[10px] text-neutral-450 font-black uppercase tracking-widest">Revenue Velocity</h4>
        <p className="text-[9px] text-neutral-550 uppercase font-bold mt-1 tracking-wider">Last 7 calendar days of captured transactions</p>
      </div>

      <div className="w-full h-[calc(100%-3rem)] font-mono text-[9px] font-bold">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C1121F" stopOpacity={0.35}/>
                <stop offset="95%" stopColor="#C1121F" stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#161616" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#444" 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#666', fontWeight: 'bold' }}
            />
            <YAxis 
              stroke="#444" 
              tickLine={false} 
              axisLine={false}
              tickFormatter={(v) => `₹${v}`}
              tick={{ fill: '#666', fontWeight: 'bold' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0F0F0F',
                border: '1px solid #222',
                borderRadius: '16px',
                color: '#fff',
                fontSize: '11px',
                fontFamily: 'monospace',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
              }}
              formatter={(value) => [`₹${value}`, 'Revenue']}
              labelStyle={{ color: '#888', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#C1121F" 
              strokeWidth={2.5}
              fillOpacity={1} 
              fill="url(#colorRevenue)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
