import React from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import beeLogo from '../assets/bee-logo.svg';
import type { DeviceStatus } from '../types/telemetry';
import { getWifiLabel } from '../utils/formatters';

interface NavbarProps {
  device: DeviceStatus;
  activeAlertsCount: number;
  isBackendConnected: boolean;
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
}) => {
  return (
    <>
      {/* Top Sticky Bar */}
      <header className="sticky top-0 z-40 bg-black/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand + Connection Status */}
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
            <img src={beeLogo} alt="ApisGuard Logo" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="leading-tight truncate">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white tracking-tight text-sm sm:text-base">
                  ApisGuard
                </span>
                <span className="text-[11px] text-zinc-500 font-medium">Hive 01</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 font-medium ${
                    device.online ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  <Icon
                    icon={device.online ? 'lucide:radio' : 'lucide:wifi-off'}
                    className="w-3 h-3"
                  />
                  {device.online ? 'Online' : 'Offline'}
                </span>
                <span className="text-zinc-700">/</span>
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
                      ? 'bg-zinc-900 text-amber-400 border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                  }`
                }
              >
                <Icon icon={item.icon} className="w-3.5 h-3.5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Device Status Pills */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300"
              title={`INA219: ${device.batteryVoltage.toFixed(2)} V · ${device.batteryCurrentMa.toFixed(0)} mA`}
            >
              <Icon
                icon={device.batteryPct > 25 ? 'lucide:battery-charging' : 'lucide:battery-warning'}
                className={`w-4 h-4 ${
                  device.batteryPct > 25 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              />
              <span>{device.batteryPct}%</span>
            </div>

            <div
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300"
              title={`Wi-Fi Signal: ${getWifiLabel(device.wifiRssi)}`}
            >
              <Icon icon="lucide:wifi" className="w-3.5 h-3.5 text-zinc-400" />
              <span>{device.wifiRssi} dBm</span>
            </div>

            {activeAlertsCount > 0 && (
              <NavLink
                to="/logs"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-400 border border-rose-500/30 text-xs font-semibold"
                title="View active alerts"
              >
                <Icon icon="lucide:bell-ring" className="w-3.5 h-3.5" />
                <span>{activeAlertsCount}</span>
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-black/95 backdrop-blur border-t border-zinc-800 pb-[env(safe-area-inset-bottom)]"
      >
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-amber-400' : 'text-zinc-500 hover:text-zinc-300'
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
