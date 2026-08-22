import { ConnectedDevice, DevicePermissions } from '../types';

/**
 * Get or generate a persistent unique ID for this device/browser session
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem('cm_device_id');
  if (!deviceId) {
    deviceId = 'dev_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
    localStorage.setItem('cm_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Detect device type, OS, browser, screen, timezone and status
 */
export function getCurrentDeviceInfo(customActivity?: string, activeScreen?: string): ConnectedDevice {
  const userAgent = navigator.userAgent || '';
  const platform = (navigator as any).userAgentData?.platform || navigator.platform || '';
  const id = getDeviceId();

  // Detect Type
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  const isTablet = /(ipad|tablet|(android(?!.*mobile))|(windows(?!.*phone)(.*touch))|kindle|playbook|silk)/i.test(userAgent);
  const isMobile = /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);

  if (isTablet) {
    type = 'tablet';
  } else if (isMobile) {
    type = 'mobile';
  } else {
    type = 'desktop';
  }

  // Detect OS
  let os = 'Unknown OS';
  if (/iPad|iPhone|iPod/.test(userAgent)) {
    os = 'iOS';
  } else if (/Android/.test(userAgent)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X|MacIntel/.test(platform) || /Macintosh|Mac OS X/.test(userAgent)) {
    os = 'macOS';
  } else if (/Win32|Win64|Windows/.test(platform) || /Windows/.test(userAgent)) {
    os = 'Windows';
  } else if (/Linux/.test(platform) || /Linux/.test(userAgent)) {
    os = 'Linux';
  } else if (/CrOS/.test(userAgent)) {
    os = 'ChromeOS';
  }

  // Detect Browser
  let browser = 'Browser';
  if (/Edg\//.test(userAgent)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//.test(userAgent) && !/Chromium|Edg\//.test(userAgent)) {
    browser = 'Google Chrome';
  } else if (/Safari\//.test(userAgent) && !/Chrome|Chromium|Edg\//.test(userAgent)) {
    browser = 'Apple Safari';
  } else if (/Firefox\//.test(userAgent)) {
    browser = 'Mozilla Firefox';
  } else if (/Opera|OPR\//.test(userAgent)) {
    browser = 'Opera';
  }

  // Friendly name
  let name = '';
  if (type === 'mobile') {
    name = os === 'iOS' ? 'iPhone' : os === 'Android' ? 'Android Phone' : 'Mobile Device';
  } else if (type === 'tablet') {
    name = os === 'iOS' ? 'iPad' : 'Tablet';
  } else {
    name = os === 'macOS' ? 'Mac' : os === 'Windows' ? 'Windows PC' : 'Computer';
  }
  name += ` • ${browser}`;

  // Location / Timezone
  let location = 'Local';
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    location = tz.replace(/_/g, ' ');
  } catch {}

  // Screen resolution
  let screenResolution = '1920x1080';
  if (typeof window !== 'undefined' && window.screen) {
    screenResolution = `${window.screen.width}x${window.screen.height}`;
  }

  // Permissions state
  const permissions: DevicePermissions = {
    audio: true,
    haptics: true,
    notifications: true,
    cloudSync: true,
  };

  return {
    id,
    name,
    type,
    browser,
    os,
    lastActive: Date.now(),
    isCurrent: true,
    location,
    screenResolution,
    onlineStatus: typeof navigator !== 'undefined' ? navigator.onLine : true,
    currentActivity: customActivity || 'In Arena',
    activeScreen: activeScreen || 'home',
    permissions,
  };
}

export function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  if (diff < 30 * 1000) {
    return 'Active now';
  }
  const minutes = Math.floor(diff / (60 * 1000));
  if (minutes < 60) {
    return `Active ${minutes}m ago`;
  }
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 24) {
    return `Active ${hours}h ago`;
  }
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `Active ${days}d ago`;
}

/**
 * Offline Actions Cache for resilient offline-first synchronization
 */
const OFFLINE_QUEUE_KEY = 'cm_offline_sync_queue';

export interface QueuedAction {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export function addToOfflineQueue(type: string, payload: any): void {
  try {
    const existingStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue: QueuedAction[] = existingStr ? JSON.parse(existingStr) : [];
    queue.push({
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      type,
      payload,
      timestamp: Date.now(),
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue.slice(-50)));
  } catch (e) {
    console.warn('Could not write to offline queue:', e);
  }
}

export function getOfflineQueue(): QueuedAction[] {
  try {
    const existingStr = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

export function clearOfflineQueue(): void {
  try {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  } catch {}
}
