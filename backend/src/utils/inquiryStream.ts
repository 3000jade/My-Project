import type { Response } from 'express';
import { AgentPresenceService } from '../services/agentPresence.service';

export interface StreamSubscriber {
  id: string;
  userId: string;
  role: string;
  res: Response;
}

export interface InquiryStreamPayload {
  inquiryId: string;
  agentId?: string | null;
  [key: string]: unknown;
}

// shortcut: in-memory SSE registry assumes single Node instance; upgrade to Redis pub/sub when scaling horizontally
const subscribers = new Map<string, StreamSubscriber>();
const visitorSubscribers = new Map<string, Set<Response>>();

const VISITOR_SAFE_EVENTS = new Set([
  'message',
  'inquiry:message',
  'agent_reassigned',
  'fallback_offline',
  'chat_closed',
]);

export function shouldDeliverInquiryEvent(
  subscriber: Pick<StreamSubscriber, 'userId' | 'role'>,
  payload: InquiryStreamPayload
): boolean {
  if (subscriber.role === 'broker' || subscriber.role === 'admin') {
    return true;
  }
  if (subscriber.role === 'agent') {
    return Boolean(payload.agentId && String(payload.agentId) === String(subscriber.userId));
  }
  return false;
}

export function subscribeInquiryStream(
  userId: string,
  role: string,
  res: Response
): () => void {
  const id = `${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true })}\n\n`);

  const subscriber: StreamSubscriber = { id, userId, role, res };
  subscribers.set(id, subscriber);
  if (role === 'agent') {
    AgentPresenceService.setStreamConnected(userId, true);
  }

  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      subscribers.delete(id);
      if (role === 'agent') {
        AgentPresenceService.setStreamConnected(userId, false);
      }
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    subscribers.delete(id);
    if (role === 'agent') {
      AgentPresenceService.setStreamConnected(userId, false);
    }
  };
}

export function subscribeVisitorInquiryStream(inquiryId: string, res: Response): () => void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write(`event: connected\ndata: ${JSON.stringify({ ok: true, inquiryId })}\n\n`);

  if (!visitorSubscribers.has(inquiryId)) {
    visitorSubscribers.set(inquiryId, new Set());
  }
  visitorSubscribers.get(inquiryId)!.add(res);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      visitorSubscribers.get(inquiryId)?.delete(res);
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    const set = visitorSubscribers.get(inquiryId);
    if (set) {
      set.delete(res);
      if (set.size === 0) {
        visitorSubscribers.delete(inquiryId);
      }
    }
  };
}

export function publishVisitorInquiryEvent(
  inquiryId: string,
  event: string,
  payload: Record<string, unknown>
): void {
  const subs = visitorSubscribers.get(inquiryId);
  if (!subs || subs.size === 0) return;
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const res of subs) {
    try {
      res.write(frame);
    } catch {
      subs.delete(res);
    }
  }
}

export function publishInquiryEvent(event: string, payload: InquiryStreamPayload): void {
  const frame = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const [id, sub] of subscribers.entries()) {
    if (!shouldDeliverInquiryEvent(sub, payload)) continue;
    try {
      sub.res.write(frame);
    } catch {
      subscribers.delete(id);
    }
  }

  if (payload.inquiryId && VISITOR_SAFE_EVENTS.has(event)) {
    publishVisitorInquiryEvent(String(payload.inquiryId), event, payload);
  }
}

export function getInquiryStreamSubscriberCount(): number {
  return subscribers.size;
}
