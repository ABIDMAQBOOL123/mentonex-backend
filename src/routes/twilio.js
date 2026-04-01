/**
 * Twilio Webhook Routes
 * /api/twilio
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as twilioService from '../integrations/twilio.js';

const router = Router();

// ============================================================
// VOICE WEBHOOKS
// ============================================================

/**
 * POST /api/twilio/voice - Handle incoming voice call
 */
router.post('/voice', (req, res) => {
  const { CallSid, From } = req.body;
  
  console.log(`📞 Incoming call from ${From}`);
  
  const twiml = twilioService.handleIncomingCall(CallSid, From);
  
  res.type('text/xml');
  res.send(twiml);
});

/**
 * POST /api/twilio/process-speech - Process speech from call
 */
router.post('/process-speech', asyncHandler(async (req, res) => {
  const { CallSid, SpeechResult, From } = req.body;
  
  console.log(`🎤 Speech received: "${SpeechResult}"`);
  
  const twiml = await twilioService.processSpeech(CallSid, SpeechResult, From);
  
  res.type('text/xml');
  res.send(twiml);
}));

/**
 * POST /api/twilio/call-status - Handle call status updates
 */
router.post('/call-status', (req, res) => {
  const { CallSid, CallStatus } = req.body;
  
  twilioService.handleCallStatus(CallSid, CallStatus);
  
  res.sendStatus(200);
});

// ============================================================
// SMS WEBHOOKS
// ============================================================

/**
 * POST /api/twilio/sms - Handle incoming SMS
 */
router.post('/sms', asyncHandler(async (req, res) => {
  const { From, Body, MessageSid } = req.body;
  
  console.log(`📱 SMS from ${From}: "${Body}"`);
  
  const twiml = await twilioService.handleIncomingSMS(From, Body, MessageSid);
  
  res.type('text/xml');
  res.send(twiml);
}));

/**
 * POST /api/twilio/sms-status - Handle SMS status updates
 */
router.post('/sms-status', (req, res) => {
  const { MessageSid, MessageStatus } = req.body;
  
  console.log(`📱 SMS ${MessageSid}: ${MessageStatus}`);
  
  res.sendStatus(200);
});

// ============================================================
// API ENDPOINTS
// ============================================================

/**
 * GET /api/twilio/status - Get Twilio service status
 */
router.get('/status', (req, res) => {
  const status = twilioService.getTwilioStatus();
  
  res.json({
    success: true,
    data: status,
  });
});

/**
 * POST /api/twilio/init - Initialize Twilio client
 */
router.post('/init', asyncHandler(async (req, res) => {
  const { accountSid, authToken } = req.body;
  
  const result = twilioService.initTwilio({ accountSid, authToken });
  
  res.json(result);
}));

/**
 * POST /api/twilio/test - Test Twilio credentials
 */
router.post('/test', asyncHandler(async (req, res) => {
  const { accountSid, authToken } = req.body;
  
  if (!accountSid || !authToken) {
    return res.status(400).json({
      success: false,
      message: 'accountSid and authToken are required',
    });
  }
  
  const result = await twilioService.testTwilioCredentials(accountSid, authToken);
  
  res.json(result);
}));

/**
 * POST /api/twilio/send-sms - Send SMS
 */
router.post('/send-sms', asyncHandler(async (req, res) => {
  const { to, body } = req.body;
  
  if (!to || !body) {
    return res.status(400).json({
      success: false,
      message: 'to and body are required',
    });
  }
  
  const result = await twilioService.sendSMS(to, body);
  
  res.json(result);
}));

/**
 * POST /api/twilio/make-call - Make outgoing call
 */
router.post('/make-call', asyncHandler(async (req, res) => {
  const { to, message } = req.body;
  
  if (!to || !message) {
    return res.status(400).json({
      success: false,
      message: 'to and message are required',
    });
  }
  
  const result = await twilioService.makeCall(to, message);
  
  res.json(result);
}));

/**
 * GET /api/twilio/phone-numbers - Get configured phone numbers
 */
router.get('/phone-numbers', asyncHandler(async (req, res) => {
  const numbers = await twilioService.getPhoneNumbers();
  
  res.json({
    success: true,
    data: numbers,
  });
}));

export default router;
