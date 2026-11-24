import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';
import logger from '../utils/logger';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: '"messages" array is required in request body.',
        timestamp: new Date().toISOString(),
      });
    }
    const aiResponseText = await chatService.generateChatResponse(messages);

    return res.json({
      success: true,
      data: {
        message: aiResponseText,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('[ChatController] Error generating chat response:', error?.message || error);
    // Never leak upstream provider keys, URLs, or raw stack traces to clients (OWASP LLM02/06)
    return res.status(500).json({
      success: false,
      error: 'Unable to process chat request right now. Please try again or connect with a licensed agent.',
      timestamp: new Date().toISOString(),
    });
  }
};
