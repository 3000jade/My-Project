import { Request, Response } from 'express';
import { chatService } from '../services/chat.service';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format. "messages" array is required.',
        timestamp: new Date().toISOString()
      });
    }

    const aiResponseText = await chatService.generateChatResponse(messages);

    return res.json({
      success: true,
      data: {
        message: aiResponseText
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Chat Controller Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate chat response',
      timestamp: new Date().toISOString()
    });
  }
};
