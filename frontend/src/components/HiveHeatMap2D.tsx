import React, { useState } from 'react';
import type { HistoricalPoint, ThermalProbes } from '../types/telemetry';

interface HiveHeatMap2DProps {
  currentProbes: ThermalProbes;
  history: HistoricalPoint[];
}

function getThermalColor(tempC: number): string {
  // Maps ~28°C (cool blue) -> 34.5–35.5°C (optimal emerald/amber) -> >=36.5°C (hot red)
  if (tempC < 31.5) return '#0284c7';
  if (tempC < 33.5) return '#0d9488';
  if (tempC < 34.5) return '#10b981';
  if (tempC <= 35.6) return '#f59e0b';
  if (tempC <= 36.2) return '#f97316';
  return '#ef4444';
}

function getZoneLabel(tempC: number): string {
  if (tempC > 36.0) return 'Hot';
  if (tempC >= 34.5 && tempC <= 35.6) return 'Ideal Brood';
  if (tempC >= 33.0) return 'Warm';
  return 'Cool';
}

export const HiveHeatMap2D: React.FC<HiveHeatMap2DProps> = ({ currentProbes, history }) => {
  const [selectedCell, setSelectedCell] = useState<{
    label: string;
    level: string;
    temp: number;
  } | null>(null);

  const levels: Array<{
    key: 'tempTop' | 'tempMiddle' | 'tempBottom';
    name: string;
    position: string;
    liveTemp: number;
  }> = [
    { key: 'tempTop', name: 'Top', position: 'Honey Super / Roof', liveTemp: currentProbes.top },
    {
      key: 'tempMiddle',
      name: 'Middle',
      position: 'Brood Core',
      liveTemp: currentProbes.middle,
    },
    {
      key: 'tempBottom',
      name: 'Bottom',
      position: 'Entrance / Floor',
      liveTemp: currentProbes.bottom,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Live 2D Vertical Hive Thermal Cross-Section */}
      <div className="rounded-xl bg-black border border-zinc-800 p-3.5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-zinc-300">Live 3-Level Vertical Profile</span>
          <span className="text-zinc-500">
            Gradient: {(currentProbes.top - currentProbes.bottom).toFixed(1)} °C spread
          </span>
        </div>

        <div
          className="rounded-xl overflow-hidden border border-zinc-800"
          style={{
            background: `linear-gradient(180deg, ${getThermalColor(currentProbes.top)}33 0%, ${getThermalColor(
              currentProbes.middle
            )}38 50%, ${getThermalColor(currentProbes.bottom)}33 100%)`,
          }}
        >
          {levels.map((lvl, index) => {
            const color = getThermalColor(lvl.liveTemp);
            return (
              <div
                key={lvl.key}
                className={`flex items-center justify-between px-3.5 py-2.5 ${
                  index < levels.length - 1 ? 'border-b border-zinc-800/70' : ''
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">{lvl.name} Probe</div>
                    <div className="text-[11px] text-zinc-400">{lvl.position}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold text-white">
                    {lvl.liveTemp.toFixed(1)} °C
                  </div>
                  <div className="text-[11px]" style={{ color }}>
                    {getZoneLabel(lvl.liveTemp)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 24-Hour 2D Heat Map Matrix (3 Levels x Time) */}
      <div className="rounded-xl bg-black border border-zinc-800 p-3.5 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-zinc-300">24-Hour 2D Heat Map (Top / Mid / Bot)</span>
          <span className="text-[11px] text-zinc-400">
            {selectedCell
              ? `${selectedCell.level} @ ${selectedCell.label}: ${selectedCell.temp.toFixed(1)} °C`
              : 'Tap or hover any cell for exact reading'}
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar">
          <div className="min-w-[440px] space-y-1.5">
            {levels.map((lvl) => (
              <div key={lvl.key} className="grid grid-cols-[56px_1fr] items-center gap-2">
                <span className="text-[11px] font-medium text-zinc-400">{lvl.name}</span>
                <div
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }}
                >
                  {history.map((point) => {
                    const tempVal = point[lvl.key];
                    const bg = getThermalColor(tempVal);
                    return (
                      <button
                        key={`${lvl.key}-${point.recordedAt}`}
                        type="button"
                        onMouseEnter={() =>
                          setSelectedCell({ label: point.label, level: lvl.name, temp: tempVal })
                        }
                        onClick={() =>
                          setSelectedCell({ label: point.label, level: lvl.name, temp: tempVal })
                        }
                        title={`${lvl.name} (${point.label}): ${tempVal.toFixed(1)} °C`}
                        className="h-6 rounded-[4px] transition-transform hover:scale-110 focus:outline-none focus:ring-1 focus:ring-white"
                        style={{ backgroundColor: bg }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Time Axis Labels */}
            <div className="grid grid-cols-[56px_1fr] items-center gap-2 pt-1">
              <span />
              <div className="flex justify-between text-[10px] text-zinc-500">
                <span>{history[0]?.label ?? ''}</span>
                <span>{history[Math.floor(history.length / 2)]?.label ?? ''}</span>
                <span>{history[history.length - 1]?.label ?? ''}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Thermal Scale Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#0284c7]" /> &lt;31.5°C
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#10b981]" /> 33.5–34.5°C
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#f59e0b]" /> 34.5–35.6°C (Ideal)
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> &gt;36.2°C
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
