import { io, type Socket } from 'socket.io-client';
import { getAccessToken, refreshAccessToken, API_BASE_URL } from '../api/client';
import type { ChatMessage } from '../api/trip-inquiries.api';

// Port of kerayego-mobile/src/features/liveRide/socket.ts for kerayego-web.
// Same gateway, same event contract — only the delivery mechanism to React
// differs (useSyncExternalStore here vs. a tick-counter there) because this
// module also has to be safe to import from a server-rendered 'use client'
// component (see getSocket()'s window guard below).

export interface AckResult {
  ok: boolean;
  error?: string;
}

export interface LocationUpdatePayload {
  tripId: string;
  lat: number;
  lng: number;
  headingDeg?: number;
  speedKmh?: number;
  accuracyM?: number;
  isMockLocation?: boolean;
  ts: number;
}

// `id` is client-generated (crypto.randomUUID()) — the server upserts by this
// id, so resending the same id after a dropped connection is a safe no-op
// re-affirmation rather than a duplicate message.
export interface SendMessagePayload {
  id: string;
  tripInquiryId: string;
  body: string;
}

export interface SendMessageResult {
  ok: boolean;
  error?: string;
  message?: ChatMessage;
}

export interface ChatTypingPayload {
  tripInquiryId: string;
  userId: string;
}

export interface ChatReadPayload {
  tripInquiryId: string;
  readerId: string;
  lastReadMessageId: string;
}

interface ServerToClientEvents {
  ready: () => void;
  'location.update': (payload: LocationUpdatePayload) => void;
  'chat.message': (payload: ChatMessage) => void;
  'chat.typing': (payload: ChatTypingPayload) => void;
  'chat.read': (payload: ChatReadPayload) => void;
}

interface ClientToServerEvents {
  'trip.join': (dto: { tripId: string }, ack: (result: AckResult) => void) => void;
  'trip.leave': (dto: { tripId: string }, ack: (result: { ok: boolean }) => void) => void;
  'location.update': (payload: LocationUpdatePayload, ack?: (result: AckResult) => void) => void;
  'inquiry.join': (dto: { tripInquiryId: string }, ack: (result: AckResult) => void) => void;
  'inquiry.leave': (dto: { tripInquiryId: string }, ack: (result: { ok: boolean }) => void) => void;
  'chat.message': (payload: SendMessagePayload, ack: (result: SendMessageResult) => void) => void;
  'chat.typing': (dto: { tripInquiryId: string }) => void;
  'chat.read': (dto: { tripInquiryId: string; lastReadMessageId: string }) => void;
}

type RideSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// How long an emitted ack-based event waits for the server's response before
// giving up — protects a caller from hanging forever if the connection drops
// mid-flight between the emit and the ack.
const ACK_TIMEOUT_MS = 8000;

interface RideSocketSnapshot {
  isConnected: boolean;
  isReady: boolean;
}

const SERVER_SNAPSHOT: RideSocketSnapshot = { isConnected: false, isReady: false };

// --- module-level singleton state ---------------------------------------
// One shared connection for the tab's lifetime — lazily created on first
// subscribe (see subscribeRideSocket), reused across every consumer of
// useRideSocket() rather than a socket per component instance.
let socket: RideSocket | null = null;
let snapshot: RideSocketSnapshot = SERVER_SNAPSHOT;

type Listener = () => void;
const listeners = new Set<Listener>();

function setSnapshot(next: Partial<RideSocketSnapshot>): void {
  snapshot = { ...snapshot, ...next };
  listeners.forEach((fn) => fn());
}

// API_BASE_URL includes a "/v1" REST path suffix (e.g. ".../v1"); the
// Socket.IO gateway's namespace lives at the bare server origin, not under
// /v1, so that suffix must be stripped before appending "/ride".
function getSocketOrigin(): string {
  return API_BASE_URL.replace(/\/v1\/?$/, '');
}

function getSocket(): RideSocket {
  if (socket) return socket;
  if (typeof window === 'undefined') {
    throw new Error('ride-socket is client-only — do not call it during server rendering');
  }

  // `io()` itself always returns the untyped `Socket` (DefaultEventsMap) —
  // the cast below is what actually pins this connection to our event maps.
  const instance = io(`${getSocketOrigin()}/ride`, {
    transports: ['websocket'],
    // `reconnection` stays at its default (true, with Socket.IO's default
    // backoff) — a live-ride session needs automatic reconnection.
    //
    // Passing `auth` as a FUNCTION (not a plain object) means Socket.IO
    // re-invokes it on every (re)connection attempt, so a reconnect after a
    // token refresh automatically picks up the fresh token without having to
    // manually recreate the socket. Do not regress this to a static object.
    auth: (cb) => cb({ token: getAccessToken() }),
  }) as RideSocket;

  instance.on('connect', () => setSnapshot({ isConnected: true }));

  instance.on('disconnect', () => {
    // A fresh connection needs its own fresh 'ready' — the server only emits
    // it once per successful handshake.
    setSnapshot({ isConnected: false, isReady: false });
  });

  instance.on('ready', () => setSnapshot({ isReady: true }));

  instance.on('connect_error', () => {
    // Best-effort: by the time Socket.IO's own reconnection timer fires the
    // next attempt, maximize the odds the new handshake's auth succeeds by
    // refreshing the token now. This is NOT a manual retry loop — we never
    // call `instance.connect()` ourselves; Socket.IO's built-in reconnection
    // continues to drive attempts, we're just improving what token is
    // available by the time it does.
    refreshAccessToken().catch(() => {
      // Swallow — if refresh fails, the next reconnection attempt just fails
      // again and surfaces as another connect_error, which is fine.
    });
  });

  socket = instance;
  return instance;
}

function withAckTimeout<T extends { ok: boolean; error?: string }>(
  executor: (resolve: (value: T) => void) => void,
  timeoutResult: T,
): Promise<T> {
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(timeoutResult);
    }, ACK_TIMEOUT_MS);

    executor((value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    });
  });
}

// --- useSyncExternalStore glue -------------------------------------------

export function subscribeRideSocket(listener: Listener): () => void {
  // Only ever called client-side (React invokes `subscribe` in an effect,
  // never during render/SSR), so it's safe to establish the connection here.
  getSocket();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getRideSocketSnapshot(): RideSocketSnapshot {
  return snapshot;
}

export function getRideSocketServerSnapshot(): RideSocketSnapshot {
  return SERVER_SNAPSHOT;
}

// --- trip room presence ----------------------------------------------------

export function joinTrip(tripId: string): Promise<AckResult> {
  if (!snapshot.isReady) return Promise.resolve({ ok: false, error: 'not ready' });
  const activeSocket = getSocket();
  return withAckTimeout<AckResult>(
    (resolve) => activeSocket.emit('trip.join', { tripId }, resolve),
    { ok: false, error: 'timeout' },
  );
}

export function leaveTrip(tripId: string): Promise<{ ok: boolean }> {
  if (!snapshot.isReady) return Promise.resolve({ ok: false });
  const activeSocket = getSocket();
  return withAckTimeout<{ ok: boolean }>(
    (resolve) => activeSocket.emit('trip.leave', { tripId }, resolve),
    { ok: false },
  );
}

// Fire-and-forget: only meaningful for the trip's driver, but nothing stops a
// non-driver from calling it client-side — the server already rejects it if
// the caller isn't the trip's driver (or the trip isn't IN_PROGRESS), so
// there's no need to duplicate that check here. Just log a rejected ack.
export function emitLocation(payload: LocationUpdatePayload): void {
  getSocket().emit('location.update', payload, (result) => {
    if (!result?.ok) {
      console.warn('[ride-socket] location.update rejected:', result?.error);
    }
  });
}

export function onLocationUpdate(callback: (payload: LocationUpdatePayload) => void): () => void {
  const activeSocket = getSocket();
  activeSocket.on('location.update', callback);
  return () => {
    activeSocket.off('location.update', callback);
  };
}

// --- chat --------------------------------------------------------------
// joinInquiry/leaveInquiry mirror joinTrip/leaveTrip exactly (same
// not-ready-yet guard, same ack-timeout wrapper) — just a different room,
// scoped to one TripInquiry's chat thread instead of a whole trip.

export function joinInquiry(tripInquiryId: string): Promise<AckResult> {
  if (!snapshot.isReady) return Promise.resolve({ ok: false, error: 'not ready' });
  const activeSocket = getSocket();
  return withAckTimeout<AckResult>(
    (resolve) => activeSocket.emit('inquiry.join', { tripInquiryId }, resolve),
    { ok: false, error: 'timeout' },
  );
}

export function leaveInquiry(tripInquiryId: string): Promise<{ ok: boolean }> {
  if (!snapshot.isReady) return Promise.resolve({ ok: false });
  const activeSocket = getSocket();
  return withAckTimeout<{ ok: boolean }>(
    (resolve) => activeSocket.emit('inquiry.leave', { tripInquiryId }, resolve),
    { ok: false },
  );
}

// Unlike emitLocation, the ack here is NOT swallowed — the caller (ChatPanel)
// needs the real result to reconcile its optimistic local message (replace
// the optimistic entry with the server-confirmed one, or surface a failure).
export function sendMessage(payload: SendMessagePayload): Promise<SendMessageResult> {
  if (!snapshot.isReady) return Promise.resolve({ ok: false, error: 'not ready' });
  const activeSocket = getSocket();
  return withAckTimeout<SendMessageResult>(
    (resolve) => activeSocket.emit('chat.message', payload, resolve),
    { ok: false, error: 'timeout' },
  );
}

// Fire-and-forget, same convention as emitLocation — no ack callback needed.
export function sendTyping(tripInquiryId: string): void {
  getSocket().emit('chat.typing', { tripInquiryId });
}

export function markRead(tripInquiryId: string, lastReadMessageId: string): void {
  getSocket().emit('chat.read', { tripInquiryId, lastReadMessageId });
}

export function onChatMessage(callback: (payload: ChatMessage) => void): () => void {
  const activeSocket = getSocket();
  activeSocket.on('chat.message', callback);
  return () => {
    activeSocket.off('chat.message', callback);
  };
}

export function onTyping(callback: (payload: ChatTypingPayload) => void): () => void {
  const activeSocket = getSocket();
  activeSocket.on('chat.typing', callback);
  return () => {
    activeSocket.off('chat.typing', callback);
  };
}

export function onReadReceipt(callback: (payload: ChatReadPayload) => void): () => void {
  const activeSocket = getSocket();
  activeSocket.on('chat.read', callback);
  return () => {
    activeSocket.off('chat.read', callback);
  };
}
