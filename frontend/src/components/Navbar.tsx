import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import beeLogo from '../assets/bee-logo.svg';
import type { ThemeMode } from '../hooks/useTheme';
import type { DeviceStatus } from '../types/telemetry';
import { getWifiLabel } from '../utils/formatters';

interface NavbarProps {
  device: DeviceStatus;
  activeAlertsCount: number;
  isBackendConnected: boolean;
  theme: ThemeMode;
  onChangeTheme: (theme: ThemeMode) => void;
}

export const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: 'lucide:layout-dashboard', end: true },
  { to: '/controls', label: 'Controls', icon: 'lucide:sliders-horizontal', end: false },
  { to: '/charts', label: 'Charts', icon: 'lucide:trending-up', end: false },
  { to: '/logs', label: 'Logs', icon: 'lucide:history', end: false },
];

export const Navbar: React.FC<NavbarProps> = ({
  device,
  activeAlertsCount,
  isBackendConnected,
  theme,
  onChangeTheme,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setSettingsOpen(false);
      }
    };
    if (settingsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [settingsOpen]);
  return (
    <>
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur border-b border-zinc-200 dark:border-zinc-800 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand + Connection Status */}
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
            <img src={beeLogo} alt="ApisGuard Logo" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="leading-tight truncate">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-white tracking-tight text-sm sm:text-base">
                  ApisGuard
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Hive 01</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    device.online
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  <Icon
                    icon={device.online ? 'lucide:radio' : 'lucide:wifi-off'}
                    className="w-3 h-3"
                  />
                  {device.online ? 'Online' : 'Offline'}
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">/</span>
                <span className="text-zinc-500">
                  {isBackendConnected ? 'Live' : 'Preview'}
                </span>
              </div>
            </div>
          </NavLink>

          {/* Desktop Navigation Tabs */}
          <nav aria-label="Primary pages" className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-amber-600 border border-zinc-300 dark:bg-zinc-900 dark:text-amber-400 dark:border-zinc-700'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/80 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/60'
                  }`
                }
              >
                <Icon icon={item.icon} className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Device Status Pills + Theme Switch */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 text-xs font-medium"
              title={`INA219: ${device.batteryVoltage.toFixed(2)} V · ${device.batteryCurrentMa.toFixed(0)} mA`}
            >
              <Icon
                icon={device.batteryPct > 25 ? 'lucide:battery-charging' : 'lucide:battery-warning'}
                className={`w-4 h-4 ${
                  device.batteryPct > 25
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              />
              <span>{device.batteryPct}%</span>
            </div>

            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300 text-xs font-medium"
              title={`Wi-Fi Signal: ${getWifiLabel(device.wifiRssi)}`}
            >
              <Icon icon="lucide:wifi" className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
              <span>{device.wifiRssi} dBm</span>
            </div>

            {activeAlertsCount > 0 && (
              <NavLink
                to="/logs"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold"
                title="View active alerts"
              >
                <Icon icon="lucide:bell-ring" className="w-3.5 h-3.5" />
                <span>{activeAlertsCount}</span>
              </NavLink>
            )}

            <div ref={settingsRef} className="relative">
              <button
                type="button"
                onClick={() => setSettingsOpen((prev) => !prev)}
                aria-label="Open settings"
                aria-expanded={settingsOpen}
                title="Settings"
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  settingsOpen
                    ? 'bg-amber-500/15 text-amber-600 border-amber-500/40 dark:text-amber-400'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:border-zinc-800 dark:text-zinc-200'
                }`}
              >
                <Icon icon="lucide:settings" className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-xl p-3.5 space-y-3 z-50">
                  <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
                    <span className="text-xs font-semibold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Icon icon="lucide:settings" className="w-3.5 h-3.5 text-amber-500" />
                      Settings
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                      aria-label="Close settings"
                    >
                      <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                      Theme
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onChangeTheme('dark')}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          theme === 'dark'
                            ? 'bg-zinc-900 text-amber-400 border-amber-500/40 dark:bg-zinc-800'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-black dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Icon icon="lucide:moon" className="w-3.5 h-3.5" />
                        Dark
                      </button>

                      <button
                        type="button"
                        onClick={() => onChangeTheme('light')}
                        className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          theme === 'light'
                            ? 'bg-amber-500 text-black border-amber-400 font-semibold'
                            : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-black dark:text-zinc-400 dark:border-zinc-800 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <Icon icon="lucide:sun" className="w-3.5 h-3.5" />
                        Light
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 space-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <div className="flex justify-between">
                      <span>Geofence Radius</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">50 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harvest Threshold</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">4.20 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Temp Alert</span>
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">36.0 °C</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 dark:bg-black/95 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] transition-colors"
      >
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300'
                }`
              }
            >
              <Icon icon={item.icon} className="w-5 h-5" />
              <span>{item.label}</span>
              {item.to === '/logs' && activeAlertsCount > 0 && (
                <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-rose-500" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
