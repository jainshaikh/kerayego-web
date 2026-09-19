'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { tripInquiriesApi, type ChatMessage } from '../../../lib/api/trip-inquiries.api';
import { useRideSocket } from '../../../hooks/useRideSocket';
import type { ChatReadPayload } from '../../../lib/realtime/ride-socket';
import { Button } from '../../ui';
import { cn } from '../../../lib/utils/cn';

interface ChatPanelProps {
  tripInquiryId: string;
  otherPartyName: string;
}

// Local-only display state layered on top of the server's ChatMessage shape —
// `pending` marks an optimistically-appended message still awaiting its
// `chat.message` ack, `failed` marks one whose ack came back {ok:false}.
interface LocalChatMessage extends ChatMessage {
  pending?: boolean;
  failed?: boolean;
}

const TYPING_THROTTLE_MS = 2500;
const TYPING_INDICATOR_TIMEOUT_MS = 4000;

function upsertMessage(list: LocalChatMessage[], incoming: ChatMessage): LocalChatMessage[] {
  const index = list.findIndex((m) => m.id === incoming.id);
  if (index === -1) return [...list, incoming];
  const next = [...list];
  next[index] = { ...incoming };
  return next;
}

function errorMessage(error: unknown): string {
  return (
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
    'Could not load messages.'
  );
}

// Port of kerayego-mobile's ChatPanel — one rider↔driver thread scoped to a
// single TripInquiry. Mounted fresh each time ChatModal opens (Radix unmounts
// Dialog.Content on close), so there's no mobile-style "active" prop needed —
// mount/unmount effects do the same job.
export function ChatPanel({ tripInquiryId, otherPartyName }: ChatPanelProps) {
  const { user } = useAuth();
  const currentUserId = user?.id;
  const {
    isReady,
    joinInquiry,
    leaveInquiry,
    sendMessage,
    sendTyping,
    markRead,
    onChatMessage,
    onTyping,
    onReadReceipt,
  } = useRideSocket();

  const [messages, setMessages] = useState<LocalChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);

  const lastMarkedReadIdRef = useRef<string | null>(null);
  const lastTypingSentAtRef = useRef(0);
  const typingClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listEndRef = useRef<HTMLDivElement>(null);

  // --- initial history fetch ------------------------------------------------
  useEffect(() => {
    let cancelled = false;
    setMessages([]);
    setLoadError(null);
    setLoading(true);
    tripInquiriesApi
      .getMessages(tripInquiryId)
      .then((result) => {
        if (!cancelled) setMessages(result);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(errorMessage(error));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tripInquiryId]);

  // --- join/leave this inquiry's chat room ----------------------------------
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    joinInquiry(tripInquiryId).then((result) => {
      if (!cancelled && !result.ok) {
        console.warn('[ChatPanel] joinInquiry failed:', result.error);
      }
    });
    return () => {
      cancelled = true;
      leaveInquiry(tripInquiryId);
    };
    // joinInquiry/leaveInquiry omitted deliberately: useRideSocket() returns a
    // new function identity every render (it reads live module state, not a
    // stale closure), so including them would tear down/rejoin the room on
    // every render instead of only when isReady/tripInquiryId change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, tripInquiryId]);

  // --- incoming chat messages ------------------------------------------------
  useEffect(() => {
    const unsubscribe = onChatMessage((payload) => {
      // The socket connection is a shared singleton — this listener fires for
      // EVERY inquiry's chat.message event app-wide, so filter to this
      // thread first.
      if (payload.tripInquiryId !== tripInquiryId) return;
      setMessages((prev) => upsertMessage(prev, payload));
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripInquiryId]);

  // --- typing indicator --------------------------------------------------------
  useEffect(() => {
    const unsubscribe = onTyping((payload) => {
      if (payload.tripInquiryId !== tripInquiryId || payload.userId === currentUserId) return;
      setOtherTyping(true);
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_INDICATOR_TIMEOUT_MS);
    });
    return () => {
      unsubscribe();
      if (typingClearTimerRef.current) clearTimeout(typingClearTimerRef.current);
      typingClearTimerRef.current = null;
      setOtherTyping(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripInquiryId, currentUserId]);

  // --- read receipts for my own sent messages ---------------------------------
  useEffect(() => {
    const unsubscribe = onReadReceipt((payload: ChatReadPayload) => {
      if (payload.tripInquiryId !== tripInquiryId) return;
      setMessages((prev) => {
        const reference = prev.find((m) => m.id === payload.lastReadMessageId);
        const cutoff = reference ? reference.createdAt : null;
        return prev.map((m) =>
          m.senderId === currentUserId && !m.readAt && (cutoff === null || m.createdAt <= cutoff)
            ? { ...m, readAt: new Date().toISOString() }
            : m,
        );
      });
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripInquiryId, currentUserId]);

  // --- mark-as-read: whenever the latest message is a NEW one from the other party ---
  useEffect(() => {
    if (messages.length === 0) return;
    const last = messages[messages.length - 1];
    if (last.senderId === currentUserId) return;
    if (lastMarkedReadIdRef.current === last.id) return;
    lastMarkedReadIdRef.current = last.id;
    markRead(tripInquiryId, last.id);
    // markRead omitted deliberately — same reasoning as joinInquiry/leaveInquiry above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, currentUserId, tripInquiryId]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length]);

  const handleChangeDraft = (text: string) => {
    setDraft(text);
    const now = Date.now();
    if (text.trim().length > 0 && now - lastTypingSentAtRef.current > TYPING_THROTTLE_MS) {
      lastTypingSentAtRef.current = now;
      sendTyping(tripInquiryId);
    }
  };

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || !currentUserId) return;
    setSendError(null);
    setDraft('');

    // Client-generated id doubles as the reconciliation key: the optimistic
    // entry below and the server-confirmed one from the ack share this same
    // id, so "reconcile on ack" is just an in-place replace, not an id-swap.
    const id = crypto.randomUUID();
    const optimisticMessage: LocalChatMessage = {
      id,
      tripInquiryId,
      senderId: currentUserId,
      body,
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
      pending: true,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    const result = await sendMessage({ id, tripInquiryId, body });
    if (result.ok && result.message) {
      const confirmed = result.message;
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...confirmed } : m)));
    } else {
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pending: false, failed: true } : m)));
      setSendError(result.error ?? 'Message failed to send.');
    }
  };

  return (
    <div className="flex h-[65vh] flex-col">
      <div className="min-h-[16px] pb-2">
        {otherTyping && <p className="text-xs text-text-faint">{otherPartyName} is typing…</p>}
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          </div>
        ) : loadError ? (
          <div className="flex h-full items-center justify-center text-sm text-red-600">{loadError}</div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-faint">
            No messages yet — say hello.
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} isOwn={message.senderId === currentUserId} />
            ))}
            <div ref={listEndRef} />
          </div>
        )}
      </div>

      {sendError && <p className="mt-2 text-xs text-red-600">{sendError}</p>}

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(e) => handleChangeDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message…"
          rows={1}
          className="max-h-24 flex-1 resize-none rounded-control border border-border-strong px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
        />
        <Button size="md" disabled={!draft.trim()} onClick={handleSend}>
          Send
        </Button>
      </div>
    </div>
  );
}

function ChatBubble({ message, isOwn }: { message: LocalChatMessage; isOwn: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const statusLabel = !isOwn
    ? null
    : message.failed
      ? 'Failed to send'
      : message.pending
        ? 'Sending…'
        : message.readAt
          ? 'Read'
          : message.deliveredAt
            ? 'Delivered'
            : 'Sent';

  return (
    <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[80%] rounded-card px-3.5 py-2 text-sm leading-relaxed',
          isOwn ? 'bg-brand text-white' : 'bg-page text-ink',
          message.pending && 'opacity-60',
        )}
      >
        {message.body}
      </div>
      <p className="mt-1 text-[11px] text-text-faint">
        {time}
        {statusLabel ? ` · ${statusLabel}` : ''}
      </p>
    </div>
  );
}
