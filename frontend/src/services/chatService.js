import apiClient from './apiClient';

export const chatService = {
  /**
   * Send a message to the AI Chatbot backend
   * @param {Array<{role: string, content: string}>} messages
   * @returns {Promise<string>} The AI response text
   */
  async sendMessage(messages) {
    try {
      const response = await apiClient.post('/chat', { messages });

      // apiClient interceptor unwraps response.data directly:
      // Backend returns { success: boolean, data: { message: string }, error?: string }
      if (response?.success) {
        if (typeof response.data === 'string') {
          return response.data;
        }
        if (response.data?.message) {
          return response.data.message;
        }
      }

      // Fallback for standard Axios response if interceptor was bypassed:
      if (response?.data?.success) {
        return response.data.data?.message || response.data.data;
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
  }
};

export default chatService;

