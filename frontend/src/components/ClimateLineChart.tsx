import React from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { HistoricalPoint } from '../types/telemetry';

interface ClimateLineChartProps {
  data: HistoricalPoint[];
  theme: 'dark' | 'light';
}

export const ClimateLineChart: React.FC<ClimateLineChartProps> = ({ data, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 4, left: -12, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#52525b' }}
            minTickGap={24}
          />
          <YAxis
            yAxisId="temp"
            tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#52525b' }}
            unit="°C"
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <YAxis
            yAxisId="hum"
            orientation="right"
            tick={{ fontSize: 11, fill: isDark ? '#71717a' : '#52525b' }}
            unit="%"
            domain={[30, 95]}
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
          <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? '#a1a1aa' : '#52525b' }} />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            name="DHT22 Temp (°C)"
            stroke="#10b981"
            strokeWidth={2.2}
            dot={false}
          />
          <Line
            yAxisId="hum"
            type="monotone"
            dataKey="humidity"
            name="DHT22 Humidity (%)"
            stroke="#38bdf8"
            strokeWidth={2}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
