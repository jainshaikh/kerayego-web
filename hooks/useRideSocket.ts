'use client';

import { useSyncExternalStore } from 'react';
import {
  subscribeRideSocket,
  getRideSocketSnapshot,
  getRideSocketServerSnapshot,
  joinTrip,
  leaveTrip,
  emitLocation,
  onLocationUpdate,
  joinInquiry,
  leaveInquiry,
  sendMessage,
  sendTyping,
  markRead,
  onChatMessage,
  onTyping,
  onReadReceipt,
} from '../lib/realtime/ride-socket';

/**
 * Shared live-ride socket connection to the backend's `/ride` namespace.
 *
 * The underlying Socket.IO connection is a module-level singleton reused
 * across every component that calls this hook — it is NOT torn down when an
 * individual consumer unmounts, since other components may still need it
 * for the lifetime of the tab. Only this hook's own subscription to
 * connection-state changes is cleaned up on unmount (handled internally by
 * useSyncExternalStore).
 *
 * Gating rule: join/emit on `isReady`, never on bare `isConnected` — the
 * gateway only emits `ready` after JWT verify + user lookup succeeds, and
 * disconnects silently on auth failure with no error event.
 */
export function useRideSocket() {
  const { isConnected, isReady } = useSyncExternalStore(
    subscribeRideSocket,
    getRideSocketSnapshot,
    getRideSocketServerSnapshot,
  );

  return {
    isConnected,
    isReady,
    joinTrip,
    leaveTrip,
    emitLocation,
    onLocationUpdate,
    joinInquiry,
    leaveInquiry,
    sendMessage,
    sendTyping,
    markRead,
    onChatMessage,
    onTyping,
    onReadReceipt,
  };
}
