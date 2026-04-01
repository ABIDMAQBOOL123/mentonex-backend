/**
 * Integrations Index
 * Export all third-party integrations
 */

export { default as discordService } from './discord.js';
export { default as telegramService } from './telegram.js';
export { default as twilioService } from './twilio.js';

// Re-export individual functions for convenience
export {
  startDiscordBot,
  stopDiscordBot,
  getDiscordStatus,
  testDiscordToken,
} from './discord.js';

export {
  startTelegramBot,
  stopTelegramBot,
  getTelegramStatus,
  testTelegramToken,
} from './telegram.js';

export {
  initTwilio,
  getTwilioStatus,
  handleIncomingCall,
  processSpeech,
  handleIncomingSMS,
  sendSMS,
  makeCall,
  testTwilioCredentials,
} from './twilio.js';
