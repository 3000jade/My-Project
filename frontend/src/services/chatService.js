import apiClient from './apiClient';

/**
 * Normalize backend chat responses (structured v1 payloads or legacy strings)
 * into a uniform { message, cards, comparison, nearby, handoffDraft } shape.
 *
 * @param {string | object} raw
 * @returns {{ message: string, cards: Array, comparison: object | null, nearby: object | null, handoffDraft: object | null }}
 */
function normalizeChatResponse(raw) {
  if (typeof raw === 'string') {
    return {
      message: raw,
      cards: [],
      comparison: null,
      nearby: null,
      handoffDraft: null,
    };
  }

  return {
    message: typeof raw?.message === 'string' ? raw.message : '',
    cards: Array.isArray(raw?.cards) ? raw.cards : [],
    comparison: raw?.comparison ?? null,
    nearby: raw?.nearby ?? null,
    handoffDraft: raw?.handoffDraft ?? null,
  };
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
};

export default chatService;
