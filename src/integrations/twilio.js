/**
 * Twilio Integration Service
 * Handles voice calls and SMS via Twilio
 */

import twilio from 'twilio';
import config from '../config/index.js';
import aiService from '../services/aiService.js';

let twilioClient = null;
let isInitialized = false;

// Store conversation history per call
const callHistory = new Map();

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize Twilio client
 */
export function initTwilio(credentials = null) {
  const accountSid = credentials?.accountSid || config.channels.twilio.accountSid;
  const authToken = credentials?.authToken || config.channels.twilio.authToken;

  if (!accountSid || !authToken) {
    console.log('⚠️  Twilio credentials not configured');
    return { success: false, message: 'Twilio credentials not configured' };
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    isInitialized = true;
    console.log('✅ Twilio client initialized');
    return { success: true, message: 'Twilio client initialized' };
  } catch (error) {
    console.error('❌ Twilio initialization error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get Twilio status
 */
export function getTwilioStatus() {
  return {
    initialized: isInitialized,
    configured: !!(config.channels.twilio.accountSid && config.channels.twilio.authToken),
    phoneNumber: config.channels.twilio.phoneNumber || null,
  };
}

// ============================================================
// VOICE HANDLING
// ============================================================

/**
 * Handle incoming voice call - Returns TwiML
 */
export function handleIncomingCall(callSid, from) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  // Welcome message
  twiml.say({
    voice: 'Polly.Joanna',
  }, 'Hello! Welcome to Mentonex AI assistant. How can I help you today?');

  // Gather speech input
  twiml.gather({
    input: 'speech',
    action: '/api/twilio/process-speech',
    method: 'POST',
    speechTimeout: 'auto',
    language: 'en-US',
  });

  // If no input
  twiml.say({
    voice: 'Polly.Joanna',
  }, "I didn't hear anything. Goodbye!");

  // Initialize conversation history for this call
  callHistory.set(callSid, []);

  return twiml.toString();
}

/**
 * Process speech input and respond
 */
export async function processSpeech(callSid, speechResult, from) {
  const VoiceResponse = twilio.twiml.VoiceResponse;
  const twiml = new VoiceResponse();

  if (!speechResult) {
    twiml.say({
      voice: 'Polly.Joanna',
    }, "I didn't catch that. Could you please repeat?");
    
    twiml.gather({
      input: 'speech',
      action: '/api/twilio/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
    });

    return twiml.toString();
  }

  try {
    // Get conversation history for this call
    const history = callHistory.get(callSid) || [];

    // Check for end call commands
    const lowerSpeech = speechResult.toLowerCase();
    if (lowerSpeech.includes('goodbye') || lowerSpeech.includes('bye') || lowerSpeech.includes('end call')) {
      twiml.say({
        voice: 'Polly.Joanna',
      }, 'Thank you for calling Mentonex. Goodbye!');
      twiml.hangup();
      callHistory.delete(callSid);
      return twiml.toString();
    }

    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: 'You are Mentonex, a helpful AI assistant on a phone call. Keep responses concise and conversational, suitable for text-to-speech. Avoid using special characters, code blocks, or formatting. Limit responses to 2-3 sentences when possible.',
      },
      ...history,
      { role: 'user', content: speechResult },
    ];

    // Get AI response
    const response = await aiService.chat(messages, {
      maxTokens: 300,
      temperature: 0.7,
    });

    let aiContent = response.content || "I'm sorry, I couldn't process that. Could you try again?";

    // Clean response for TTS
    aiContent = cleanForTTS(aiContent);

    // Update history
    history.push({ role: 'user', content: speechResult });
    history.push({ role: 'assistant', content: aiContent });
    
    // Keep history manageable
    while (history.length > 10) {
      history.shift();
    }
    callHistory.set(callSid, history);

    // Speak response
    twiml.say({
      voice: 'Polly.Joanna',
    }, aiContent);

    // Continue gathering speech
    twiml.gather({
      input: 'speech',
      action: '/api/twilio/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
    });

    // Timeout fallback
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'Are you still there?');
    
    twiml.gather({
      input: 'speech',
      action: '/api/twilio/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
    });

    return twiml.toString();

  } catch (error) {
    console.error('❌ Twilio speech processing error:', error.message);
    
    twiml.say({
      voice: 'Polly.Joanna',
    }, 'I encountered an error. Let me try again.');
    
    twiml.gather({
      input: 'speech',
      action: '/api/twilio/process-speech',
      method: 'POST',
      speechTimeout: 'auto',
    });

    return twiml.toString();
  }
}

/**
 * Handle call status updates
 */
export function handleCallStatus(callSid, callStatus) {
  console.log(`📞 Call ${callSid}: ${callStatus}`);

  if (callStatus === 'completed' || callStatus === 'failed' || callStatus === 'busy' || callStatus === 'no-answer') {
    callHistory.delete(callSid);
  }

  return { success: true };
}

// ============================================================
// SMS HANDLING
// ============================================================

/**
 * Handle incoming SMS
 */
export async function handleIncomingSMS(from, body, messageSid) {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const twiml = new MessagingResponse();

  if (!body || !body.trim()) {
    twiml.message('Hello! I\'m Mentonex AI assistant. Send me a message and I\'ll help you!');
    return twiml.toString();
  }

  try {
    // Build messages for AI
    const messages = [
      {
        role: 'system',
        content: 'You are Mentonex, a helpful AI assistant responding via SMS. Keep responses very concise (under 160 characters when possible) but helpful.',
      },
      { role: 'user', content: body },
    ];

    // Get AI response
    const response = await aiService.chat(messages, {
      maxTokens: 200,
      temperature: 0.7,
    });

    let aiContent = response.content || "Sorry, I couldn't process that.";
    
    // Truncate for SMS
    if (aiContent.length > 1500) {
      aiContent = aiContent.slice(0, 1497) + '...';
    }

    twiml.message(aiContent);
    return twiml.toString();

  } catch (error) {
    console.error('❌ Twilio SMS processing error:', error.message);
    twiml.message('Sorry, I encountered an error. Please try again later.');
    return twiml.toString();
  }
}

/**
 * Send SMS
 */
export async function sendSMS(to, body) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  const from = config.channels.twilio.phoneNumber;
  if (!from) {
    throw new Error('Twilio phone number not configured');
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from,
      to,
    });

    return { 
      success: true, 
      messageSid: message.sid,
    };
  } catch (error) {
    console.error('❌ Twilio SMS send error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Make outgoing call
 */
export async function makeCall(to, message) {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  const from = config.channels.twilio.phoneNumber;
  if (!from) {
    throw new Error('Twilio phone number not configured');
  }

  try {
    const call = await twilioClient.calls.create({
      twiml: `<Response><Say voice="Polly.Joanna">${message}</Say></Response>`,
      from,
      to,
    });

    return {
      success: true,
      callSid: call.sid,
    };
  } catch (error) {
    console.error('❌ Twilio call error:', error.message);
    return { success: false, message: error.message };
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Clean text for TTS
 */
function cleanForTTS(text) {
  return text
    // Remove markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/`/g, '')
    .replace(/#+\s/g, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, 'code block omitted')
    // Remove URLs
    .replace(/https?:\/\/\S+/g, 'link')
    // Remove special characters
    .replace(/[<>]/g, '')
    // Clean up whitespace
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Test Twilio credentials
 */
export async function testTwilioCredentials(accountSid, authToken) {
  try {
    const testClient = twilio(accountSid, authToken);
    const account = await testClient.api.accounts(accountSid).fetch();
    
    return {
      success: true,
      message: 'Credentials are valid',
      accountName: account.friendlyName,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get phone numbers
 */
export async function getPhoneNumbers() {
  if (!twilioClient) {
    throw new Error('Twilio client not initialized');
  }

  try {
    const numbers = await twilioClient.incomingPhoneNumbers.list();
    return numbers.map(n => ({
      sid: n.sid,
      phoneNumber: n.phoneNumber,
      friendlyName: n.friendlyName,
    }));
  } catch (error) {
    console.error('❌ Error fetching phone numbers:', error.message);
    return [];
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  initTwilio,
  getTwilioStatus,
  handleIncomingCall,
  processSpeech,
  handleCallStatus,
  handleIncomingSMS,
  sendSMS,
  makeCall,
  testTwilioCredentials,
  getPhoneNumbers,
};
