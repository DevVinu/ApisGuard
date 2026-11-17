import React, { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Icon } from '@iconify/react';
import beeLogo from '../assets/bee-logo.svg';
import type { ThemeMode } from '../hooks/useTheme';
import type { DeviceStatus } from '../types/telemetry';
import { getWifiLabel } from '../utils/formatters';
import { InkFrame } from './InkFrame';

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
      <header className="sticky top-0 z-40 ll-paper border-b-2 border-[var(--ll-pencil-mark)] transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand + Connection Status */}
          <NavLink to="/" className="flex items-center gap-2.5 min-w-0">
            <img
              src={beeLogo}
              alt="ApisGuard Logo"
              className="w-8 h-8 rounded-[4px] shrink-0 border-[1.5px] border-[var(--ll-ink)]"
            />
            <div className="leading-tight truncate">
              <div className="flex items-center gap-2">
                <span className="font-script font-bold text-[var(--ll-ink)] tracking-wide text-xl sm:text-2xl leading-none">
                  ApisGuard
                </span>
                <span className="text-[11px] text-[var(--ll-ink-muted)] font-medium">
                  Hive 01
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={`inline-flex items-center gap-1 font-semibold ${
                    device.online ? 'text-[var(--ll-green)]' : 'text-[var(--ll-red)]'
                  }`}
                >
                  <Icon
                    icon={device.online ? 'lucide:radio' : 'lucide:wifi-off'}
                    className="w-3 h-3"
                  />
                  {device.online ? 'Online' : 'Offline'}
                </span>
                <span className="text-[var(--ll-pencil-mark)]">/</span>
                <span className="text-[var(--ll-ink-muted)]">
                  {isBackendConnected ? 'Live' : 'Preview'}
                </span>
              </div>
            </div>
          </NavLink>

          {/* Desktop Navigation Tabs */}
          <nav aria-label="Primary pages" className="hidden md:flex items-center gap-1.5">
            {NAV_ITEMS.map((item, idx) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `relative isolate inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold ll-btn ${
                    isActive
                      ? 'bg-[var(--ll-hi)]/65 text-[var(--ll-ink)]'
                      : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)] hover:bg-[var(--ll-paper-shade)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <InkFrame seed={40 + idx * 13} strokeWidth={1.5} className="text-[var(--ll-ink)]" />
                    )}
                    <Icon icon={item.icon} className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Device Status Pills + Settings */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="relative isolate inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--ll-slip)] text-[var(--ll-ink)] text-xs font-semibold"
              title={`INA219: ${device.batteryVoltage.toFixed(2)} V · ${device.batteryCurrentMa.toFixed(0)} mA`}
            >
              <InkFrame seed={101} strokeWidth={1.3} className="text-[var(--ll-pencil-mark)]" />
              <Icon
                icon={device.batteryPct > 25 ? 'lucide:battery-charging' : 'lucide:battery-warning'}
                className={`w-4 h-4 ${
                  device.batteryPct > 25 ? 'text-[var(--ll-green)]' : 'text-[var(--ll-red)]'
                }`}
              />
              <span>{device.batteryPct}%</span>
            </div>

            <div
              className="relative isolate hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--ll-slip)] text-[var(--ll-ink)] text-xs font-semibold"
              title={`Wi-Fi Signal: ${getWifiLabel(device.wifiRssi)}`}
            >
              <InkFrame seed={102} strokeWidth={1.3} className="text-[var(--ll-pencil-mark)]" />
              <Icon icon="lucide:wifi" className="w-3.5 h-3.5 text-[var(--ll-ink-muted)]" />
              <span>{device.wifiRssi} dBm</span>
            </div>

            {activeAlertsCount > 0 && (
              <NavLink
                to="/logs"
                className="relative isolate inline-flex items-center gap-1 px-2.5 py-1 bg-[var(--ll-sticky-pink)] text-[var(--ll-red)] text-xs font-bold ll-btn"
                title="View active alerts"
              >
                <InkFrame seed={103} strokeWidth={1.5} className="text-[var(--ll-red)]" />
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
                className={`relative isolate inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold ll-btn ${
                  settingsOpen
                    ? 'bg-[var(--ll-hi)]/70 text-[var(--ll-ink)]'
                    : 'bg-[var(--ll-slip)] text-[var(--ll-ink)] hover:bg-[var(--ll-paper-shade)]'
                }`}
              >
                <InkFrame seed={104} strokeWidth={1.5} className="text-[var(--ll-ink)]" />
                <Icon icon="lucide:settings" className="w-4 h-4" />
                <span className="hidden sm:inline">Settings</span>
              </button>

              {settingsOpen && (
                <div className="absolute right-0 mt-2 w-64 ll-slip p-3.5 space-y-3 z-50">
                  <InkFrame seed={105} strokeWidth={1.7} doublePass className="text-[var(--ll-ink)]" />
                  <div className="flex items-center justify-between border-b border-dashed border-[var(--ll-pencil-mark)] pb-2">
                    <span className="font-hand text-base font-bold text-[var(--ll-ink)] flex items-center gap-1.5">
                      <Icon icon="lucide:settings" className="w-3.5 h-3.5 text-[var(--ll-marker)]" />
                      Settings
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettingsOpen(false)}
                      className="text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]"
                      aria-label="Close settings"
                    >
                      <Icon icon="lucide:x" className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-[11px] font-medium text-[var(--ll-ink-muted)]">
                      Paper Theme
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onChangeTheme('dark')}
                        className={`relative isolate flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold ll-btn ${
                          theme === 'dark'
                            ? 'bg-[var(--ll-hi)]/70 text-[var(--ll-ink)]'
                            : 'bg-[var(--ll-paper)] text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
                        }`}
                      >
                        <InkFrame seed={106} strokeWidth={1.4} className="text-[var(--ll-ink)]" />
                        <Icon icon="lucide:moon" className="w-3.5 h-3.5" />
                        Dark
                      </button>

                      <button
                        type="button"
                        onClick={() => onChangeTheme('light')}
                        className={`relative isolate flex items-center justify-center gap-1.5 px-2.5 py-2 text-xs font-semibold ll-btn ${
                          theme === 'light'
                            ? 'bg-[var(--ll-hi)] text-[var(--ll-ink)]'
                            : 'bg-[var(--ll-paper)] text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
                        }`}
                      >
                        <InkFrame seed={107} strokeWidth={1.4} className="text-[var(--ll-ink)]" />
                        <Icon icon="lucide:sun" className="w-3.5 h-3.5" />
                        Light
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-dashed border-[var(--ll-pencil-mark)] space-y-1 text-[11px] text-[var(--ll-ink-muted)]">
                    <div className="flex justify-between">
                      <span>Geofence Radius</span>
                      <span className="font-semibold text-[var(--ll-ink)]">50 m</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Harvest Threshold</span>
                      <span className="font-semibold text-[var(--ll-ink)]">4.20 kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span>High Temp Alert</span>
                      <span className="font-semibold text-[var(--ll-ink)]">36.0 °C</span>
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
        className="md:hidden fixed bottom-0 inset-x-0 z-40 ll-paper border-t-2 border-[var(--ll-pencil-mark)] pb-[env(safe-area-inset-bottom)] transition-colors"
      >
        <div className="grid grid-cols-4 h-16">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors ${
                  isActive
                    ? 'text-[var(--ll-marker)]'
                    : 'text-[var(--ll-ink-muted)] hover:text-[var(--ll-ink)]'
                }`
              }
            >
              <Icon icon={item.icon} className="w-5 h-5" />
              <span>{item.label}</span>
              {item.to === '/logs' && activeAlertsCount > 0 && (
                <span className="absolute top-2.5 right-4 w-2 h-2 rounded-full bg-[var(--ll-red)]" />
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
