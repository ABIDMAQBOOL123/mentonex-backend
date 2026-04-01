/**
 * Telegram Integration Service
 * Handles Telegram bot functionality
 */

import { Telegraf, Markup } from 'telegraf';
import config from '../config/index.js';
import aiService from '../services/aiService.js';

let telegramBot = null;
let isRunning = false;

// Store conversation history per chat
const conversationHistory = new Map();

// ============================================================
// BOT CONFIGURATION
// ============================================================

const BOT_CONFIG = {
  maxHistoryLength: 10,
  maxMessageLength: 4096,
  parseMode: 'Markdown',
};

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Start the Telegram bot
 */
export async function startTelegramBot(botToken = null) {
  const token = botToken || config.channels.telegram.botToken;

  if (!token) {
    console.log('⚠️  Telegram bot token not configured');
    return { success: false, message: 'Bot token not configured' };
  }

  if (isRunning) {
    console.log('⚠️  Telegram bot is already running');
    return { success: true, message: 'Bot already running' };
  }

  try {
    telegramBot = new Telegraf(token);

    // Setup handlers
    setupHandlers();

    // Start bot
    await telegramBot.launch();
    isRunning = true;

    // Get bot info
    const botInfo = await telegramBot.telegram.getMe();
    console.log(`✅ Telegram bot started as @${botInfo.username}`);

    // Enable graceful stop
    process.once('SIGINT', () => stopTelegramBot());
    process.once('SIGTERM', () => stopTelegramBot());

    return { 
      success: true, 
      message: 'Telegram bot started successfully',
      username: botInfo.username,
    };
  } catch (error) {
    console.error('❌ Telegram bot error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Stop the Telegram bot
 */
export async function stopTelegramBot() {
  if (!telegramBot || !isRunning) {
    return { success: true, message: 'Bot not running' };
  }

  try {
    telegramBot.stop('SIGTERM');
    telegramBot = null;
    isRunning = false;
    conversationHistory.clear();

    console.log('✅ Telegram bot stopped');
    return { success: true, message: 'Bot stopped successfully' };
  } catch (error) {
    console.error('❌ Error stopping Telegram bot:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get bot status
 */
export function getTelegramStatus() {
  return {
    running: isRunning,
    connected: isRunning && telegramBot !== null,
  };
}

// ============================================================
// HANDLERS
// ============================================================

function setupHandlers() {
  // Start command
  telegramBot.start((ctx) => {
    const username = ctx.from.first_name || 'there';
    ctx.reply(
      `👋 Hello ${username}!\n\n` +
      `I'm *Mentonex*, your AI assistant.\n\n` +
      `Just send me a message and I'll help you!\n\n` +
      `Commands:\n` +
      `/help - Show help\n` +
      `/clear - Clear conversation history\n` +
      `/status - Check bot status`,
      { parse_mode: 'Markdown' }
    );
  });

  // Help command
  telegramBot.help((ctx) => {
    ctx.reply(
      `🤖 *Mentonex Bot Help*\n\n` +
      `I'm an AI assistant powered by advanced language models.\n\n` +
      `*How to use:*\n` +
      `Simply send me any message and I'll respond!\n\n` +
      `*Commands:*\n` +
      `/start - Start the bot\n` +
      `/help - Show this help\n` +
      `/clear - Clear conversation history\n` +
      `/status - Check bot status\n` +
      `/settings - View settings`,
      { parse_mode: 'Markdown' }
    );
  });

  // Clear command
  telegramBot.command('clear', (ctx) => {
    const chatId = ctx.chat.id;
    conversationHistory.delete(chatId);
    ctx.reply('🔄 Conversation history cleared!');
  });

  // Status command
  telegramBot.command('status', (ctx) => {
    const status = aiService.getProviderStatus();
    const provider = status.openai.initialized ? 'OpenAI' : 
                    status.anthropic.initialized ? 'Anthropic' : 'None';

    ctx.reply(
      `📊 *Bot Status*\n\n` +
      `• Status: 🟢 Online\n` +
      `• AI Provider: ${provider}\n` +
      `• Chat ID: \`${ctx.chat.id}\``,
      { parse_mode: 'Markdown' }
    );
  });

  // Settings command
  telegramBot.command('settings', (ctx) => {
    ctx.reply(
      `⚙️ *Settings*\n\n` +
      `• Max history: ${BOT_CONFIG.maxHistoryLength} messages\n` +
      `• Parse mode: ${BOT_CONFIG.parseMode}`,
      { parse_mode: 'Markdown' }
    );
  });

  // Handle text messages
  telegramBot.on('text', handleTextMessage);

  // Handle photos
  telegramBot.on('photo', (ctx) => {
    ctx.reply('📷 I can see you sent a photo! Currently, I can only process text messages.');
  });

  // Handle documents
  telegramBot.on('document', (ctx) => {
    ctx.reply('📎 I can see you sent a document! Currently, I can only process text messages.');
  });

  // Handle voice messages
  telegramBot.on('voice', (ctx) => {
    ctx.reply('🎤 I can see you sent a voice message! Currently, I can only process text messages.');
  });

  // Error handler
  telegramBot.catch((err, ctx) => {
    console.error('❌ Telegram bot error:', err.message);
    ctx.reply('❌ Sorry, an error occurred. Please try again.').catch(() => {});
  });
}

// ============================================================
// MESSAGE HANDLING
// ============================================================

async function handleTextMessage(ctx) {
  const chatId = ctx.chat.id;
  const userId = ctx.from.id;
  const username = ctx.from.first_name || 'User';
  const userMessage = ctx.message.text;

  // Ignore commands (they're handled separately)
  if (userMessage.startsWith('/')) return;

  try {
    // Show typing indicator
    await ctx.sendChatAction('typing');

    // Get conversation history
    const history = conversationHistory.get(chatId) || [];

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: `You are Mentonex, a helpful AI assistant on Telegram. You're chatting with ${username}. Be friendly, helpful, and concise. Use Telegram markdown formatting when appropriate (*bold*, _italic_, \`code\`).`,
      },
      ...history,
      { role: 'user', content: userMessage },
    ];

    // Get AI response
    const response = await aiService.chat(messages, {
      maxTokens: 2000,
      temperature: 0.7,
    });

    let aiContent = response.content || "I'm sorry, I couldn't generate a response.";

    // Update conversation history
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: aiContent });

    // Keep only recent messages
    while (history.length > BOT_CONFIG.maxHistoryLength * 2) {
      history.shift();
    }
    conversationHistory.set(chatId, history);

    // Send response (handle long messages)
    await sendLongMessage(ctx, aiContent);

  } catch (error) {
    console.error('❌ Telegram message handling error:', error.message);
    
    // Check if it's an AI configuration error
    if (error.message.includes('not initialized') || error.message.includes('not configured')) {
      await ctx.reply(
        '⚠️ AI service is not configured. Please set up an AI provider.',
        { parse_mode: 'Markdown' }
      );
    } else {
      await ctx.reply('❌ Sorry, I encountered an error. Please try again.');
    }
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Send long message (Telegram has 4096 char limit)
 */
async function sendLongMessage(ctx, content) {
  const maxLength = BOT_CONFIG.maxMessageLength - 100; // Buffer for formatting

  if (content.length <= maxLength) {
    try {
      await ctx.reply(content, { parse_mode: BOT_CONFIG.parseMode });
    } catch (error) {
      // If markdown fails, try plain text
      await ctx.reply(content);
    }
    return;
  }

  // Split message
  const chunks = [];
  let remaining = content;

  while (remaining.length > 0) {
    let chunk = remaining.slice(0, maxLength);

    // Try to split at a natural break point
    if (remaining.length > maxLength) {
      const lastNewline = chunk.lastIndexOf('\n');
      const lastSpace = chunk.lastIndexOf(' ');
      const splitPoint = lastNewline > maxLength * 0.5 ? lastNewline :
                        lastSpace > maxLength * 0.5 ? lastSpace : maxLength;
      chunk = remaining.slice(0, splitPoint);
    }

    chunks.push(chunk.trim());
    remaining = remaining.slice(chunk.length).trim();
  }

  // Send chunks
  for (const chunk of chunks) {
    try {
      await ctx.reply(chunk, { parse_mode: BOT_CONFIG.parseMode });
    } catch (error) {
      await ctx.reply(chunk);
    }
    // Small delay between messages
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Test Telegram bot token
 */
export async function testTelegramToken(token) {
  try {
    const testBot = new Telegraf(token);
    const botInfo = await testBot.telegram.getMe();
    
    return { 
      success: true, 
      message: 'Token is valid',
      username: botInfo.username,
    };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Send message to specific chat
 */
export async function sendMessage(chatId, message) {
  if (!telegramBot || !isRunning) {
    throw new Error('Telegram bot is not running');
  }

  try {
    await telegramBot.telegram.sendMessage(chatId, message, {
      parse_mode: BOT_CONFIG.parseMode,
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  startTelegramBot,
  stopTelegramBot,
  getTelegramStatus,
  testTelegramToken,
  sendMessage,
};
