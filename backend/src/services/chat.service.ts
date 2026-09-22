import config from '../config/index';

// System prompt to define the AI persona
const SYSTEM_PROMPT = {
  role: 'system',
  content: `You are the Private Concierge for CP_kerby, an ultra-luxury architectural real estate platform.
Your tone is elegant, professional, highly knowledgeable, and discreet. You assist high-net-worth clients in discovering premium properties (mansions, penthouses, luxury estates).
Keep your responses concise but exceptionally polite. If you do not know specific property details, gently guide the user to contact a private broker.`
};

export class ChatService {
  async generateChatResponse(messages: { role: string; content: string }[]): Promise<string> {
    const groqKey = config.groqApiKey || (config.xaiApiKey?.startsWith('gsk_') ? config.xaiApiKey : '');
    const isGroq = Boolean(groqKey);
    const apiKey = isGroq ? groqKey : config.xaiApiKey;

    if (!apiKey) {
      throw new Error('AI API key (GROQ_API_KEY or XAI_API_KEY) is not configured in the environment variables.');
    }

    const apiUrl = isGroq 
      ? 'https://api.groq.com/openai/v1/chat/completions'
      : 'https://api.x.ai/v1/chat/completions';

    const defaultModel = isGroq ? 'openai/gpt-oss-120b' : 'grok-2-latest';
    const model = config.aiModel || defaultModel;

    // Prepend the system prompt if not present
    const payloadMessages = [
      SYSTEM_PROMPT,
      ...messages
    ];

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: payloadMessages,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const providerName = isGroq ? 'Groq' : 'xAI';
        console.error(`${providerName} API Error Response:`, errorText);
        throw new Error(`${providerName} API returned status ${response.status}: ${errorText}`);
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

