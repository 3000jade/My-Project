import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import logger from '../utils/logger';

const MASKED_CHAT_ERROR_MESSAGE =
  'Unable to process chat request right now. Please try again or connect with a licensed agent.';

function writeSseEvent(res: Response, eventName: string, data: unknown): void {
  if (res.writableEnded || res.destroyed) return;
  res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
}

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { messages, pageContext } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: '"messages" array is required in request body.',
        timestamp: new Date().toISOString(),
      });
    }

    const responsePayload = await chatService.generateChatResponse(messages, pageContext);

    return res.json({
      success: true,
      data: responsePayload,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[ChatController] Error generating chat response:', error?.message || error);
    // Never leak upstream provider keys, URLs, or raw stack traces to clients (OWASP LLM02/06)
    return res.status(500).json({
      success: false,
      error: MASKED_CHAT_ERROR_MESSAGE,
      timestamp: new Date().toISOString(),
    });
  }
};

export const sendMessageStream = async (req: Request, res: Response) => {
  const { messages, pageContext } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({
      success: false,
      error: '"messages" array is required in request body.',
      timestamp: new Date().toISOString(),
    });
  }

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const abortController = new AbortController();
  const handleReqClose = () => {
    if (!req.complete && !res.writableEnded) {
      abortController.abort();
    }
  };
  const handleResClose = () => {
    if (!res.writableEnded) {
      abortController.abort();
    }
  };
  req.on?.('close', handleReqClose);
  res.on?.('close', handleResClose);

  try {
    const responsePayload = await chatService.generateChatResponseStream(
      messages,
      pageContext,
      {
        onStatus: (status) => writeSseEvent(res, 'status', status),
        onDelta: (text) => writeSseEvent(res, 'delta', { text }),
      },
      abortController.signal
    );

    if (!abortController.signal.aborted && !res.writableEnded) {
      writeSseEvent(res, 'result', responsePayload);
      writeSseEvent(res, 'done', {});
    }
  } catch (error: any) {
    if (abortController.signal.aborted) {
      if (!res.writableEnded) {
        writeSseEvent(res, 'done', { stopped: true });
      }
    } else {
      logger.error('[ChatController] Error streaming chat response:', error?.message || error);
      // Never leak upstream provider keys, URLs, or raw stack traces to clients (OWASP LLM02/06)
      writeSseEvent(res, 'error', { error: MASKED_CHAT_ERROR_MESSAGE });
      writeSseEvent(res, 'done', {});
    }
  } finally {
    req.off?.('close', handleReqClose);
    res.off?.('close', handleResClose);
    if (!res.writableEnded) {
      res.end();
    }
  }
};
