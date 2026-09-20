import config from '../config/index';

const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-2-latest';

// System prompt to define the AI persona
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are the Private Concierge for CP_kerby, an ultra-luxury architectural real estate platform.
Your tone is elegant, professional, highly knowledgeable, and discreet. You assist high-net-worth clients in discovering premium properties (mansions, penthouses, luxury estates).
Keep your responses concise but exceptionally polite. If you do not know specific property details, gently guide the user to contact a private broker.`
};

export class ChatService {
  async generateChatResponse(messages: { role: string; content: string }[]): Promise<string> {
    if (!config.xaiApiKey) {
      throw new Error('XAI_API_KEY is not configured in the environment variables.');
    }

    // Prepend the system prompt if not present
    const payloadMessages = [
      SYSTEM_PROMPT,
      ...messages
    ];

    try {
      const response = await fetch(GROK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.xaiApiKey}`,
        },
        body: JSON.stringify({
          model: GROK_MODEL,
          messages: payloadMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('XAI API Error Response:', errorText);
        throw new Error(`XAI API returned status ${response.status}`);
      }

      const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
      return data.choices?.[0]?.message?.content || "I apologize, but I am unable to process your request at this moment.";
    } catch (error) {
      console.error('Error in ChatService:', error);
      throw error;
    }
  }
}

export const chatService = new ChatService();
