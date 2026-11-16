import React from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoricalPoint } from '../types/telemetry';

interface WeightAreaChartProps {
  data: HistoricalPoint[];
  theme: 'dark' | 'light';
}

export const WeightAreaChart: React.FC<WeightAreaChartProps> = ({ data, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#52525b' }}
            minTickGap={24}
          />
          <YAxis
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#52525b' }}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: isDark ? '#09090b' : '#ffffff',
              borderRadius: '0.75rem',
              borderColor: isDark ? '#27272a' : '#e4e4e7',
              color: isDark ? '#f4f4f5' : '#18181b',
              fontSize: '12px',
            }}
          />
          <Area
            type="monotone"
            dataKey="weightKg"
            name="Hive Weight (kg)"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#weightFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
