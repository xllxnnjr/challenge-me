import React, { useState } from 'react';
import {
  Laptop,
  Smartphone,
  Tablet,
  Trash2,
  CheckCircle2,
  Shield,
  Monitor,
  Wifi,
  Sparkles,
  RefreshCw,
  Edit2,
  Check,
  X,
  Lock,
  Radio,
  KeyRound,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { ConnectedDevice, DevicePermissions } from '../types';
import { formatTimeAgo, getCurrentDeviceInfo } from '../utils/device';
import { haptics } from '../utils/haptics';

interface Props {
  devices?: ConnectedDevice[];
  onRemoveDevice?: (deviceId: string) => Promise<void> | void;
  onRefresh?: () => void;
  onUpdatePermissions?: (deviceId: string, permissions: DevicePermissions) => Promise<void> | void;
  onToast?: (msg: string) => void;
}

export function ConnectedDevicesSection({
  devices = [],
  onRemoveDevice,
  onRefresh,
  onUpdatePermissions,
  onToast,
}: Props) {
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [deviceCustomNames, setDeviceCustomNames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('challenge_me_device_names');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const currentDevice = getCurrentDeviceInfo();

  const allDevices: ConnectedDevice[] =
    devices && devices.length > 0 ? devices : [currentDevice];

  const handleRemove = async (e: React.MouseEvent, deviceId: string) => {
    e.stopPropagation();
    if (!onRemoveDevice) return;
    try {
      haptics.selection();
      setRemovingId(deviceId);
      await onRemoveDevice(deviceId);
      haptics.success();
      onToast?.('Device disconnected successfully');
    } catch (err) {
      console.error('Failed to remove device:', err);
      onToast?.('Failed to disconnect device');
    } finally {
      setRemovingId(null);
    }
  };

  const handleSyncNow = () => {
    haptics.medium();
    setIsSyncing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsSyncing(false);
      haptics.success();
      onToast?.('Cloud state synchronized with active devices ☁️');
    }, 600);
  };

  const handleStartRename = (dev: ConnectedDevice) => {
    haptics.light();
    setRenamingId(dev.id);
    setRenameInput(deviceCustomNames[dev.id] || dev.name);
  };

  const handleSaveRename = (deviceId: string) => {
    if (!renameInput.trim()) {
      setRenamingId(null);
      return;
    }
    const updated = { ...deviceCustomNames, [deviceId]: renameInput.trim() };
    setDeviceCustomNames(updated);
    try {
      localStorage.setItem('challenge_me_device_names', JSON.stringify(updated));
    } catch {}
    setRenamingId(null);
    haptics.success();
    onToast?.('Device nickname updated! ✓');
  };

  const getDeviceIcon = (type: ConnectedDevice['type']) => {
    switch (type) {
      case 'mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'tablet':
        return <Tablet className="w-4 h-4 text-indigo-400" />;
      case 'desktop':
      default:
        return <Laptop className="w-4 h-4 text-cyan-400" />;
    }
  };

  const otherDevices = allDevices.filter(
    (dev) => !dev.isCurrent && dev.id !== currentDevice.id
  );

  return (
    <div className="w-full rounded-[26px] bg-[#0c1322]/90 border border-white/10 p-4 sm:p-5 space-y-4 shadow-md">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20" />
          <span className="text-xs font-black uppercase text-slate-200 tracking-wider">
            Connected Devices ({allDevices.length})
          </span>
        </div>

        <button
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing}
          className="text-[11px] text-indigo-300 hover:text-white font-bold flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 transition cursor-pointer active:scale-95"
        >
          <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
        </button>
      </div>

      {/* Current Device Card */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#0e1629] to-[#0c1322] border border-indigo-500/35 flex items-center justify-between gap-3 shadow-inner">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center shrink-0 shadow-inner">
            {getDeviceIcon(currentDevice.type)}
          </div>
          <div className="min-w-0 flex-1">
            {renamingId === currentDevice.id ? (
              <div className="flex items-center gap-1.5 py-0.5">
                <input
                  type="text"
                  value={renameInput}
                  onChange={(e) => setRenameInput(e.target.value)}
                  className="px-2 py-1 text-xs rounded-lg bg-black/50 border border-indigo-400/50 text-white font-bold focus:outline-none max-w-[140px]"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(currentDevice.id)}
                  className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setRenamingId(null)}
                  className="p-1 rounded-md bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {deviceCustomNames[currentDevice.id] || currentDevice.name}
                </span>
                <button
                  type="button"
                  onClick={() => handleStartRename(currentDevice)}
                  title="Rename device nickname"
                  className="text-slate-500 hover:text-slate-300 p-0.5"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                  Current
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Active Now
              </span>
              <span>•</span>
              <span className="truncate">{currentDevice.os} ({currentDevice.browser})</span>
            </div>
          </div>
        </div>
      </div>

      {/* Other Connected Devices List */}
      {otherDevices.length > 0 ? (
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider block px-1">
            Other Active Sessions ({otherDevices.length})
          </span>

          <div className="space-y-2">
            {otherDevices.map((dev) => (
              <div
                key={dev.id}
                className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {getDeviceIcon(dev.type)}
                  </div>
                  <div className="min-w-0 flex-1">
                    {renamingId === dev.id ? (
                      <div className="flex items-center gap-1.5 py-0.5">
                        <input
                          type="text"
                          value={renameInput}
                          onChange={(e) => setRenameInput(e.target.value)}
                          className="px-2 py-1 text-xs rounded-lg bg-black/50 border border-indigo-400/50 text-white font-bold focus:outline-none max-w-[140px]"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(dev.id)}
                          className="p-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-500"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setRenamingId(null)}
                          className="p-1 rounded-md bg-white/10 text-slate-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate block">
                          {deviceCustomNames[dev.id] || dev.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleStartRename(dev)}
                          className="text-slate-500 hover:text-slate-300 p-0.5"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      <span>{dev.os}</span>
                      <span>•</span>
                      <span>Last active {formatTimeAgo(dev.lastActive)}</span>
                    </div>
                  </div>
                </div>

                {onRemoveDevice && (
                  <button
                    type="button"
                    onClick={(e) => handleRemove(e, dev.id)}
                    disabled={removingId === dev.id}
                    title="Disconnect this session"
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 text-rose-400 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
          <span className="text-[11px] text-slate-400">
            No other active sessions detected. Log in on another tablet or phone to sync in real-time.
          </span>
        </div>
      )}

      {/* Account Security & Linked Cloud Info */}
      <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Encrypted Cloud Sync</span>
          </div>
          <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Enabled
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Your game progression, scores, achievements, and friends list are synced across all your verified devices.
        </p>
      </div>
    </div>
  );
}
