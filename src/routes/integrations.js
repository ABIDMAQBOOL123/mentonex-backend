/**
 * Integrations Routes
 * /api/integrations - Control Discord, Telegram, and other integrations
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as discordService from '../integrations/discord.js';
import * as telegramService from '../integrations/telegram.js';
import * as twilioService from '../integrations/twilio.js';

const router = Router();

// ============================================================
// OVERVIEW
// ============================================================

/**
 * GET /api/integrations/status - Get status of all integrations
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    data: {
      discord: discordService.getDiscordStatus(),
      telegram: telegramService.getTelegramStatus(),
      twilio: twilioService.getTwilioStatus(),
    },
  });
});

// ============================================================
// DISCORD
// ============================================================

/**
 * GET /api/integrations/discord/status - Get Discord bot status
 */
router.get('/discord/status', (req, res) => {
  res.json({
    success: true,
    data: discordService.getDiscordStatus(),
  });
});

/**
 * POST /api/integrations/discord/start - Start Discord bot
 */
router.post('/discord/start', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  const result = await discordService.startDiscordBot(botToken);
  
  res.json(result);
}));

/**
 * POST /api/integrations/discord/stop - Stop Discord bot
 */
router.post('/discord/stop', asyncHandler(async (req, res) => {
  const result = await discordService.stopDiscordBot();
  
  res.json(result);
}));

/**
 * POST /api/integrations/discord/test - Test Discord bot token
 */
router.post('/discord/test', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  if (!botToken) {
    return res.status(400).json({
      success: false,
      message: 'botToken is required',
    });
  }
  
  const result = await discordService.testDiscordToken(botToken);
  
  res.json(result);
}));

// ============================================================
// TELEGRAM
// ============================================================

/**
 * GET /api/integrations/telegram/status - Get Telegram bot status
 */
router.get('/telegram/status', (req, res) => {
  res.json({
    success: true,
    data: telegramService.getTelegramStatus(),
  });
});

/**
 * POST /api/integrations/telegram/start - Start Telegram bot
 */
router.post('/telegram/start', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  const result = await telegramService.startTelegramBot(botToken);
  
  res.json(result);
}));

/**
 * POST /api/integrations/telegram/stop - Stop Telegram bot
 */
router.post('/telegram/stop', asyncHandler(async (req, res) => {
  const result = await telegramService.stopTelegramBot();
  
  res.json(result);
}));

/**
 * POST /api/integrations/telegram/test - Test Telegram bot token
 */
router.post('/telegram/test', asyncHandler(async (req, res) => {
  const { botToken } = req.body;
  
  if (!botToken) {
    return res.status(400).json({
      success: false,
      message: 'botToken is required',
    });
  }
  
  const result = await telegramService.testTelegramToken(botToken);
  
  res.json(result);
}));

/**
 * POST /api/integrations/telegram/send - Send message to Telegram chat
 */
router.post('/telegram/send', asyncHandler(async (req, res) => {
  const { chatId, message } = req.body;
  
  if (!chatId || !message) {
    return res.status(400).json({
      success: false,
      message: 'chatId and message are required',
    });
  }
  
  const result = await telegramService.sendMessage(chatId, message);
  
  res.json(result);
}));

// ============================================================
// TWILIO
// ============================================================

/**
 * GET /api/integrations/twilio/status - Get Twilio status
 */
router.get('/twilio/status', (req, res) => {
  res.json({
    success: true,
    data: twilioService.getTwilioStatus(),
  });
});

/**
 * POST /api/integrations/twilio/init - Initialize Twilio
 */
router.post('/twilio/init', asyncHandler(async (req, res) => {
  const { accountSid, authToken } = req.body;
  
  const result = twilioService.initTwilio({ accountSid, authToken });
  
  res.json(result);
}));

/**
 * POST /api/integrations/twilio/test - Test Twilio credentials
 */
router.post('/twilio/test', asyncHandler(async (req, res) => {
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

export default router;
