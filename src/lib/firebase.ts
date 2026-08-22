import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
} from 'firebase/firestore';
import { GameState, ConnectedDevice, DevicePermissions, ActiveSession } from '../types';
import { getCurrentDeviceInfo, getDeviceId, addToOfflineQueue, getOfflineQueue, clearOfflineQueue } from '../utils/device';

// Load config dynamically or from bundled configuration
export const firebaseConfig = {
  projectId: "glass-interface-08gvj",
  appId: "1:155016482012:web:9dea9c5cecedb8accd7819",
  apiKey: "AIzaSyC0jAjg-0epO-CBmYnpHHJu53VDlVhBWwA",
  authDomain: "glass-interface-08gvj.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-challengeme-8322233f-aa32-4158-b277-cfcaead4dfa0",
  storageBucket: "glass-interface-08gvj.firebasestorage.app",
  messagingSenderId: "155016482012",
};

// Initialize Firebase App instance safely (singleton)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Initialize Firestore with configured custom database ID
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

/**
 * Trigger Google Sign In using popup (with fallback)
 */
export async function loginWithGoogle(): Promise<User | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Google Sign In Error:', error);
    if (error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return null;
      } catch (redirectErr) {
        throw new Error('Popups are blocked in this environment. Please open in a new window or allow popups.');
      }
    }
    if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
      return null;
    }
    throw error;
  }
}

/**
 * Handle redirect result on load if redirect flow was used
 */
export async function checkRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result ? result.user : null;
  } catch (error) {
    console.warn('Redirect auth check warning:', error);
    return null;
  }
}

/**
 * Log out user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign Out Error:', error);
    throw error;
  }
}

// In-memory hash to deduplicate redundant cloud writes and prevent quota depletion
let lastSavedSignature = '';
let isSyncing = false;

/**
 * Generate lightweight hash signature of state to prevent duplicate cloud writes
 */
function getStateSignature(state: GameState, userProfile?: any): string {
  return `${state.points}_${state.xp}_${state.done}_${state.streak}_${state.playerName}_${state.avatar}_${state.profileBanner || ''}_${state.selectedDifficulty}_${(state.unlockedAchievements || []).length}_${state.soundEnabled}_${state.hapticsEnabled}_${(state.notifications || []).length}_${state.activeSession?.currentScreen || ''}_${state.activeSession?.activeChallengeId || ''}_${userProfile?.email || ''}`;
}

/**
 * Save user game state to Cloud Firestore for cross-device synchronization instantly.
 * Includes smart deduplication, rate control, and offline queueing.
 */
export async function saveGameStateToCloud(
  userId: string,
  state: GameState,
  userProfile?: { email?: string | null; displayName?: string | null; photoURL?: string | null }
): Promise<void> {
  if (!userId) return;

  const currentSig = getStateSignature(state, userProfile);
  if (currentSig === lastSavedSignature) {
    return; // Already up to date, save Firestore write quota
  }

  if (isSyncing) return;

  try {
    isSyncing = true;
    const currentDevice = getCurrentDeviceInfo(
      state.activeSession?.activeChallengeId ? `Playing: ${state.activeSession.activeChallengeId}` : 'In Arena',
      state.activeSession?.currentScreen || 'home'
    );
    const userDocRef = doc(db, 'users', userId);
    const now = Date.now();
    
    // Read existing devices or fallback gracefully
    const existingSnap = await getDoc(userDocRef).catch(() => null);
    const existingDevices: ConnectedDevice[] = existingSnap?.exists()
      ? existingSnap.data()?.devices || []
      : [];

    const deviceMap = new Map<string, ConnectedDevice>();
    existingDevices.forEach((d) => deviceMap.set(d.id, { ...d, isCurrent: false }));
    // Update current device with latest active timestamp and activity
    deviceMap.set(currentDevice.id, {
      ...currentDevice,
      lastActive: now,
      isCurrent: true,
      currentActivity: state.activeSession?.activeChallengeId ? `Playing: ${state.activeSession.activeChallengeId}` : 'In Arena',
      activeScreen: state.activeSession?.currentScreen || 'home',
    });

    const updatedDevices = Array.from(deviceMap.values()).slice(0, 10);

    const payload = {
      email: userProfile?.email || null,
      displayName: userProfile?.displayName || state.playerName || 'Challenger',
      photoURL: userProfile?.photoURL || null,
      updatedAt: now,
      lastSyncTimestamp: now,
      updatedByDeviceId: currentDevice.id,
      devices: updatedDevices,
      activeSession: state.activeSession ? {
        currentScreen: state.activeSession.currentScreen || 'home',
        activeChallengeId: state.activeSession.activeChallengeId || null,
        lastActionTimestamp: now,
        deviceId: currentDevice.id,
      } : null,
      gameState: {
        points: typeof state.points === 'number' ? state.points : 0,
        xp: typeof state.xp === 'number' ? state.xp : 0,
        done: typeof state.done === 'number' ? state.done : 0,
        streak: typeof state.streak === 'number' ? state.streak : 0,
        lastActiveDate: state.lastActiveDate || '',
        lastBonusDate: state.lastBonusDate || '',
        history: (state.history || []).slice(0, 50),
        detailedHistory: (state.detailedHistory || []).slice(0, 30),
        unlockedAchievements: state.unlockedAchievements || [],
        playerName: state.playerName || 'Challenger',
        avatar: state.avatar || '🧑🏾‍🚀',
        profileBanner: state.profileBanner || '',
        soundEnabled: state.soundEnabled !== false,
        hapticsEnabled: state.hapticsEnabled !== false,
        friendNotificationsEnabled: state.friendNotificationsEnabled !== false,
        selectedDifficulty: state.selectedDifficulty || 'Medium',
        friendIds: state.friendIds || [],
        notifications: (state.notifications || []).slice(0, 20),
        updatedAt: now,
      },
    };

    await setDoc(userDocRef, payload, { merge: true });
    lastSavedSignature = currentSig;
    clearOfflineQueue();
  } catch (error: any) {
    // If offline or quota exceeded, quietly cache into offline actions queue
    addToOfflineQueue('SYNC_STATE', { state, userProfile });
    console.warn('Background sync saved to offline cache:', error?.message || error);
  } finally {
    isSyncing = false;
  }
}

/**
 * Load user game state from Cloud Firestore when logging in from any device
 */
export async function loadGameStateFromCloud(
  userId: string
): Promise<{ state: GameState | null; devices: ConnectedDevice[]; lastSyncTimestamp: number | null }> {
  if (!userId) return { state: null, devices: [], lastSyncTimestamp: null };
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    const currentDeviceId = getDeviceId();

    if (docSnap.exists()) {
      const data = docSnap.data();
      const rawDevices: ConnectedDevice[] = data?.devices || [];
      const devices = rawDevices.map((d) => ({
        ...d,
        isCurrent: d.id === currentDeviceId,
      }));

      if (data && data.gameState) {
        return {
          state: {
            ...data.gameState,
            connectedDevices: devices,
            activeSession: data.activeSession || undefined,
            lastCloudSync: data.lastSyncTimestamp || data.updatedAt || Date.now(),
          } as GameState,
          devices,
          lastSyncTimestamp: data.lastSyncTimestamp || data.updatedAt || Date.now(),
        };
      }
      return { state: null, devices, lastSyncTimestamp: data?.updatedAt || null };
    }
    return { state: null, devices: [], lastSyncTimestamp: null };
  } catch (error) {
    console.warn('Quiet background load warning:', error);
    return { state: null, devices: [], lastSyncTimestamp: null };
  }
}

/**
 * Subscribe to real-time cloud changes with instant sync across all connected devices
 */
export function subscribeToCloudSave(
  userId: string,
  onUpdate: (cloudState: GameState, devices: ConnectedDevice[], updatedAt?: number, updatedByDeviceId?: string) => void
): () => void {
  if (!userId) return () => {};

  const currentDeviceId = getDeviceId();
  const userDocRef = doc(db, 'users', userId);

  const unsubscribe = onSnapshot(
    userDocRef,
    (docSnap) => {
      // Ignore local optimistic writes to prevent re-render loops
      if (docSnap.metadata.hasPendingWrites) {
        return;
      }

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && data.gameState) {
          // If updated by this device, skip propagating to avoid echo loops
          if (data.updatedByDeviceId === currentDeviceId) {
            return;
          }

          const rawDevices: ConnectedDevice[] = data.devices || [];
          const devices = rawDevices.map((d) => ({
            ...d,
            isCurrent: d.id === currentDeviceId,
          }));

          const cloudState: GameState = {
            ...data.gameState,
            connectedDevices: devices,
            activeSession: data.activeSession || undefined,
            lastCloudSync: data.lastSyncTimestamp || data.updatedAt || Date.now(),
          };
          onUpdate(cloudState, devices, data.updatedAt, data.updatedByDeviceId);
        }
      }
    },
    (error) => {
      console.warn('Quiet background live sync listener notice:', error);
    }
  );

  return unsubscribe;
}

/**
 * Update permissions for a specific device in the cloud
 */
export async function updateDevicePermissionsInCloud(
  userId: string,
  deviceId: string,
  permissions: DevicePermissions
): Promise<ConnectedDevice[]> {
  if (!userId || !deviceId) return [];
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) return [];

    const data = docSnap.data();
    const existingDevices: ConnectedDevice[] = data?.devices || [];
    const updatedDevices = existingDevices.map((d) => {
      if (d.id === deviceId) {
        return { ...d, permissions };
      }
      return d;
    });

    await updateDoc(userDocRef, {
      devices: updatedDevices,
      updatedAt: Date.now(),
    });

    const currentDeviceId = getDeviceId();
    return updatedDevices.map((d) => ({
      ...d,
      isCurrent: d.id === currentDeviceId,
    }));
  } catch (error) {
    console.error('Failed to update device permissions:', error);
    throw error;
  }
}

/**
 * Disconnect/remove a device from the connected devices registry
 */
export async function removeDeviceFromCloud(userId: string, deviceIdToRemove: string): Promise<ConnectedDevice[]> {
  if (!userId || !deviceIdToRemove) return [];
  try {
    const userDocRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userDocRef);
    if (!docSnap.exists()) return [];

    const data = docSnap.data();
    const existingDevices: ConnectedDevice[] = data?.devices || [];
    const updatedDevices = existingDevices.filter((d) => d.id !== deviceIdToRemove);

    await updateDoc(userDocRef, {
      devices: updatedDevices,
      updatedAt: Date.now(),
    });

    const currentDeviceId = getDeviceId();
    return updatedDevices.map((d) => ({
      ...d,
      isCurrent: d.id === currentDeviceId,
    }));
  } catch (error) {
    console.error('Failed to remove device:', error);
    throw error;
  }
}
