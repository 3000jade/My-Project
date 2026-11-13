import type { Response } from 'express';

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

  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      subscribers.delete(id);
    }
  }, 25000);

  return () => {
    clearInterval(heartbeat);
    subscribers.delete(id);
  };
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
}

export function getInquiryStreamSubscriberCount(): number {
  return subscribers.size;
}
