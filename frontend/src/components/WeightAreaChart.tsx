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
}

export const WeightAreaChart: React.FC<WeightAreaChartProps> = ({ data }) => {
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
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#71717a' }} minTickGap={24} />
          <YAxis
            domain={['dataMin - 0.5', 'dataMax + 0.5']}
            tick={{ fontSize: 11, fill: '#71717a' }}
            unit=" kg"
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#09090b',
              borderRadius: '0.75rem',
              borderColor: '#27272a',
              color: '#f4f4f5',
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
