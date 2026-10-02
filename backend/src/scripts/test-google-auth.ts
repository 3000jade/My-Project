import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env before imports
config({ path: resolve(__dirname, '../../.env') });

import GoogleAuthService from '../services/googleAuth.service';
import logger from '../utils/logger';

async function testGoogleAuth() {
  logger.info('Starting Google Auth Service test...');
  
  try {
    // We send a dummy token. If mock mode is active or client ID is missing,
    // this will succeed with a mock user.
    // If client ID is present, it will try to verify and likely fail because 'dummy-token' is invalid.
    const result = await GoogleAuthService.verifyAndAuthenticate('dummy-token', 'client');
    
    logger.info('Test Successful!');
    logger.info('Auth Result:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    logger.error('Test Failed!');
    if (error instanceof Error) {
      logger.error(`Error: ${error.message}`);
    } else {
      logger.error(error);
    }
  }
}

testGoogleAuth();
