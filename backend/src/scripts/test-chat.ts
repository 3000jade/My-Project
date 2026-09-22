import { chatService } from '../services/chat.service';
import config from '../config/index';

async function runSimulation() {
  console.log('=============================================');
  console.log('   Simulating AI Concierge Chatbot Request');
  console.log('=============================================');

  console.log(`\nGROQ_API_KEY status: ${config.groqApiKey ? '[CONFIGURED]' : '[MISSING/EMPTY]'}`);
  console.log(`XAI_API_KEY status: ${config.xaiApiKey ? '[CONFIGURED]' : '[MISSING/EMPTY]'}`);

  const mockMessages = [
    { role: 'user', content: 'What penthouses do you have available in Makati?' }
  ];

  console.log('\nSending Messages Payload:');
  console.log(JSON.stringify(mockMessages, null, 2));

  try {
    console.log('\nWaiting for ChatService response...');
    const response = await chatService.generateChatResponse(mockMessages);
    
    console.log('\n=============================================');
    console.log('[SUCCESS] AI Response Received:');
    console.log('=============================================');
    console.log(response);
  } catch (error: any) {
    console.log('\n=============================================');
    console.log(`[CAUGHT ERROR]: ${error.message}`);
    console.log('=============================================');
    console.log('Note: This is expected if the XAI_API_KEY is not set or invalid.');
  }
}

runSimulation();
