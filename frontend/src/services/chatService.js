import apiClient from './apiClient';

/**
 * Normalize backend chat responses (structured v1/v2 payloads or legacy strings)
 * into a uniform { message, cards, comparison, nearby, handoffDraft, suggestHandoff, handoffReason, followUpSuggestions } shape.
 *
 * @param {string | object} raw
 * @returns {{ message: string, cards: Array, comparison: object | null, nearby: object | null, handoffDraft: object | null, suggestHandoff: boolean, handoffReason: string | null, followUpSuggestions: string[] }}
 */
function normalizeChatResponse(raw) {
  if (typeof raw === 'string') {
    return {
      message: raw,
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
      suggestHandoff: false,
      handoffReason: null,
      followUpSuggestions: [],
    };
  }

  return {
    message: typeof raw?.message === 'string' ? raw.message : '',
    cards: Array.isArray(raw?.cards) ? raw.cards : [],
    comparison: raw?.comparison ?? null,
    nearby: raw?.nearby ?? null,
    handoffDraft: raw?.handoffDraft ?? null,
    suggestHandoff: Boolean(raw?.suggestHandoff),
    handoffReason: typeof raw?.handoffReason === 'string' ? raw.handoffReason : null,
    followUpSuggestions: Array.isArray(raw?.followUpSuggestions)
      ? raw.followUpSuggestions
          .filter((s) => typeof s === 'string' && s.trim())
          .map((s) => s.trim())
      : [],
  };
}

function createAbortError() {
  const err = new Error('The operation was aborted.');
  err.name = 'AbortError';
  return err;
}

function isAbortError(error, signal) {
  return Boolean(signal?.aborted || error?.name === 'AbortError');
}

function getOptionalAuthToken() {
  try {
    return localStorage.getItem('cp_auth_token');
  } catch {
    return null;
  }
}

function getApiBaseUrl() {
  const rawBaseUrl = apiClient.defaults?.baseURL || '/api';
  return String(rawBaseUrl).replace(/\/+$/, '');
}

/**
 * Build a sanitized pageContext object when route or propertyId is present.
 * Returns undefined when neither field has a non-empty value.
 *
 * @param {{ route?: string, propertyId?: string } | undefined | null} pageContext
 */
function buildPageContext(pageContext) {
  if (!pageContext || typeof pageContext !== 'object') {
    return undefined;
  }

  const route =
    typeof pageContext.route === 'string' && pageContext.route.trim()
      ? pageContext.route.trim()
      : undefined;
  const propertyId =
    typeof pageContext.propertyId === 'string' && pageContext.propertyId.trim()
      ? pageContext.propertyId.trim()
      : undefined;

  if (!route && !propertyId) {
    return undefined;
  }

  return {
    ...(route ? { route } : {}),
    ...(propertyId ? { propertyId } : {}),
  };
}

export const chatService = {
  /**
   * Send a message to the AI Chatbot backend.
   *
   * @param {Array<{role: string, content: string}>} messages
   * @param {{ route?: string, propertyId?: string }} [pageContext]
   * @returns {Promise<{ message: string, cards: Array, comparison: object | null, nearby: object | null, handoffDraft: object | null }>}
   */
  async sendMessage(messages, pageContext) {
    try {
      const normalizedContext = buildPageContext(pageContext);
      const payload = normalizedContext
        ? { messages, pageContext: normalizedContext }
        : { messages };

      const response = await apiClient.post('/chat', payload, { timeout: 25000 });

      // apiClient interceptor unwraps response.data directly:
      // Backend returns { success: boolean, data: ChatResponsePayload | string, error?: string }
      if (response?.success && response.data !== undefined && response.data !== null) {
        if (typeof response.data === 'string' || typeof response.data?.message === 'string') {
          return normalizeChatResponse(response.data);
        }
      }

      // Fallback for standard Axios response if interceptor was bypassed:
      if (
        response?.data?.success &&
        response.data.data !== undefined &&
        response.data.data !== null
      ) {
        const inner = response.data.data;
        if (typeof inner === 'string' || typeof inner?.message === 'string') {
          return normalizeChatResponse(inner);
        }
      }

      const errorMessage =
        response?.error ||
        response?.data?.error ||
        response?.data?.message ||
        'Failed to get chat response';

      throw new Error(errorMessage);
    } catch (error) {
      console.error('Chat Service Error:', error);
      throw error;
    }
  },

  /**
   * Stream a message from POST /api/chat/stream over Server-Sent Events (SSE),
   * falling back once to POST /api/chat if the stream fails before any delta
   * or result arrives (unless aborted or an explicit SSE error event arrived).
   *
   * @param {Array<{role: string, content: string}>} messages
   * @param {{ route?: string, propertyId?: string }} [pageContext]
   * @param {{ onStatus?: Function, onDelta?: Function, onResult?: Function, signal?: AbortSignal }} [options]
   */
  async streamMessage(messages, pageContext, { onStatus, onDelta, onResult, signal } = {}) {
    if (signal?.aborted) {
      throw createAbortError();
    }

    const normalizedContext = buildPageContext(pageContext);
    const payload = normalizedContext
      ? { messages, pageContext: normalizedContext }
      : { messages };

    const baseUrl = getApiBaseUrl();
    const token = getOptionalAuthToken();
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    let receivedDeltaOrResult = false;
    let accumulatedText = '';
    let finalResult = null;
    let sseError = null;
    let reader = null;

    const processFrame = (rawFrame) => {
      const normalizedFrame = rawFrame.replace(/\r\n/g, '\n');
      if (!normalizedFrame.trim()) {
        return;
      }

      let eventName = 'message';
      const dataLines = [];

      for (const line of normalizedFrame.split('\n')) {
        if (!line || line.startsWith(':')) continue;
        if (line.startsWith('event:')) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
          const value = line.slice(5);
          dataLines.push(value.startsWith(' ') ? value.slice(1) : value);
        }
      }

      if (dataLines.length === 0) {
        return;
      }

      const rawData = dataLines.join('\n');
      let parsedData;
      try {
        parsedData = JSON.parse(rawData);
      } catch {
        parsedData = rawData;
      }

      if (eventName === 'status') {
        onStatus?.(parsedData);
      } else if (eventName === 'delta') {
        const textChunk = typeof parsedData?.text === 'string' ? parsedData.text : '';
        if (textChunk) {
          receivedDeltaOrResult = true;
          accumulatedText += textChunk;
          onDelta?.(textChunk);
        }
      } else if (eventName === 'result') {
        receivedDeltaOrResult = true;
        finalResult = normalizeChatResponse(parsedData);
        onResult?.(finalResult);
      } else if (eventName === 'error') {
        const message =
          (parsedData && typeof parsedData === 'object' && typeof parsedData.error === 'string' && parsedData.error.trim())
            ? parsedData.error
            : 'Failed to get chat response';
        sseError = new Error(message);
      }
    };

    try {
      const response = await fetch(`${baseUrl}/chat/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal,
      });

      if (!response?.ok || !response.body || typeof response.body.getReader !== 'function') {
        throw new Error(`Stream request failed with status ${response?.status ?? 'unknown'}`);
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (signal?.aborted) {
          throw createAbortError();
        }

        const { value, done } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        buffer = buffer.replace(/\r\n/g, '\n');

        let separatorIndex = buffer.indexOf('\n\n');
        while (separatorIndex !== -1) {
          const frame = buffer.slice(0, separatorIndex);
          buffer = buffer.slice(separatorIndex + 2);
          processFrame(frame);
          if (sseError) {
            throw sseError;
          }
          separatorIndex = buffer.indexOf('\n\n');
        }
      }

      buffer += decoder.decode();
      buffer = buffer.replace(/\r\n/g, '\n');
      if (buffer.trim()) {
        processFrame(buffer);
        if (sseError) {
          throw sseError;
        }
      }

      if (finalResult) {
        return finalResult;
      }

      if (receivedDeltaOrResult) {
        return normalizeChatResponse(accumulatedText);
      }

      throw new Error('Chat stream closed without a response');
    } catch (error) {
      if (isAbortError(error, signal)) {
        throw error?.name === 'AbortError' ? error : createAbortError();
      }

      if (sseError && error === sseError) {
        throw error;
      }

      if (!receivedDeltaOrResult) {
        const fallback = await chatService.sendMessage(messages, pageContext);
        onResult?.(fallback);
        return fallback;
      }

      throw error;
    } finally {
      if (reader) {
        try {
          reader.releaseLock?.();
        } catch {
          // Ignore lock release errors
        }
      }
    }
  },
};

export default chatService;
