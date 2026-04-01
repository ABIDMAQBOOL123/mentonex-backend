/**
 * Discord Integration Service
 * Handles Discord bot functionality
 */

import { Client, GatewayIntentBits, Events, Partials } from 'discord.js';
import config from '../config/index.js';
import aiService from '../services/aiService.js';

let discordClient = null;
let isRunning = false;

// Store conversation history per channel/user
const conversationHistory = new Map();

// ============================================================
// BOT CONFIGURATION
// ============================================================

const BOT_CONFIG = {
  prefix: config.channels.discord.prefix || '!',
  maxHistoryLength: 10,
  typingDelay: 50, // ms per character for realistic typing
};

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Start the Discord bot
 */
export async function startDiscordBot(botToken = null) {
  const token = botToken || config.channels.discord.botToken;

  if (!token) {
    console.log('⚠️  Discord bot token not configured');
    return { success: false, message: 'Bot token not configured' };
  }

  if (isRunning) {
    console.log('⚠️  Discord bot is already running');
    return { success: true, message: 'Bot already running' };
  }

  try {
    discordClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
      ],
      partials: [
        Partials.Message,
        Partials.Channel,
        Partials.User,
      ],
    });

    // Setup event handlers
    setupEventHandlers();

    // Login
    await discordClient.login(token);
    isRunning = true;

    return { success: true, message: 'Discord bot started successfully' };
  } catch (error) {
    console.error('❌ Discord bot error:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Stop the Discord bot
 */
export async function stopDiscordBot() {
  if (!discordClient || !isRunning) {
    return { success: true, message: 'Bot not running' };
  }

  try {
    await discordClient.destroy();
    discordClient = null;
    isRunning = false;
    conversationHistory.clear();
    
    console.log('✅ Discord bot stopped');
    return { success: true, message: 'Bot stopped successfully' };
  } catch (error) {
    console.error('❌ Error stopping Discord bot:', error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get bot status
 */
export function getDiscordStatus() {
  return {
    running: isRunning,
    connected: discordClient?.isReady() || false,
    username: discordClient?.user?.tag || null,
    guilds: discordClient?.guilds?.cache?.size || 0,
  };
}

// ============================================================
// EVENT HANDLERS
// ============================================================

function setupEventHandlers() {
  // Ready event
  discordClient.on(Events.ClientReady, (client) => {
    console.log(`✅ Discord bot logged in as ${client.user.tag}`);
    console.log(`   Connected to ${client.guilds.cache.size} server(s)`);
    
    // Set bot status
    client.user.setActivity('for messages', { type: 3 }); // Watching
  });

  // Message event
  discordClient.on(Events.MessageCreate, handleMessage);

  // Error event
  discordClient.on(Events.Error, (error) => {
    console.error('❌ Discord client error:', error.message);
  });

  // Disconnect event
  discordClient.on(Events.ShardDisconnect, () => {
    console.log('⚠️  Discord bot disconnected');
    isRunning = false;
  });

  // Reconnect event
  discordClient.on(Events.ShardReconnecting, () => {
    console.log('🔄 Discord bot reconnecting...');
  });
}

// ============================================================
// MESSAGE HANDLING
// ============================================================

async function handleMessage(message) {
  // Ignore bot messages
  if (message.author.bot) return;

  // Check if message starts with prefix or mentions the bot
  const prefix = BOT_CONFIG.prefix;
  const mentionPrefix = `<@${discordClient.user.id}>`;
  
  let content = message.content.trim();
  let shouldRespond = false;

  if (content.startsWith(prefix)) {
    content = content.slice(prefix.length).trim();
    shouldRespond = true;
  } else if (content.startsWith(mentionPrefix)) {
    content = content.slice(mentionPrefix.length).trim();
    shouldRespond = true;
  } else if (message.channel.type === 1) {
    // DM - always respond
    shouldRespond = true;
  }

  if (!shouldRespond || !content) return;

  // Check for special commands
  if (await handleCommand(message, content)) return;

  // Get AI response
  try {
    // Show typing indicator
    await message.channel.sendTyping();

    // Get conversation history
    const historyKey = `${message.channel.id}-${message.author.id}`;
    const history = conversationHistory.get(historyKey) || [];

    // Build messages array
    const messages = [
      {
        role: 'system',
        content: `You are Mentonex, a helpful AI assistant on Discord. You're chatting with ${message.author.username}. Be friendly, helpful, and concise. Use Discord markdown formatting when appropriate.`,
      },
      ...history,
      { role: 'user', content },
    ];

    // Get AI response
    const response = await aiService.chat(messages, {
      maxTokens: 1500,
      temperature: 0.7,
    });

    const aiContent = response.content || "I'm sorry, I couldn't generate a response.";

    // Update conversation history
    history.push({ role: 'user', content });
    history.push({ role: 'assistant', content: aiContent });
    
    // Keep only recent messages
    while (history.length > BOT_CONFIG.maxHistoryLength * 2) {
      history.shift();
    }
    conversationHistory.set(historyKey, history);

    // Send response (split if too long)
    await sendLongMessage(message.channel, aiContent, message);

  } catch (error) {
    console.error('❌ Discord message handling error:', error.message);
    
    // Send error message
    await message.reply({
      content: '❌ Sorry, I encountered an error processing your message. Please try again.',
    }).catch(() => {});
  }
}

// ============================================================
// COMMANDS
// ============================================================

async function handleCommand(message, content) {
  const args = content.split(' ');
  const command = args[0].toLowerCase();

  switch (command) {
    case 'help':
      await message.reply({
        embeds: [{
          title: '🤖 Mentonex Bot Help',
          description: 'I\'m an AI assistant powered by advanced language models.',
          color: 0x5865F2,
          fields: [
            {
              name: '📝 Chat with me',
              value: `Use \`${BOT_CONFIG.prefix}<message>\` or mention me`,
            },
            {
              name: '🔄 Clear history',
              value: `\`${BOT_CONFIG.prefix}clear\` - Reset conversation`,
            },
            {
              name: '📊 Status',
              value: `\`${BOT_CONFIG.prefix}status\` - Check bot status`,
            },
            {
              name: '❓ Help',
              value: `\`${BOT_CONFIG.prefix}help\` - Show this message`,
            },
          ],
          footer: { text: 'Mentonex AI Assistant' },
        }],
      });
      return true;

    case 'clear':
    case 'reset':
      const historyKey = `${message.channel.id}-${message.author.id}`;
      conversationHistory.delete(historyKey);
      await message.reply('🔄 Conversation history cleared!');
      return true;

    case 'status':
      const status = aiService.getProviderStatus();
      const provider = status.openai.initialized ? 'OpenAI' : 
                      status.anthropic.initialized ? 'Anthropic' : 'None';
      
      await message.reply({
        embeds: [{
          title: '📊 Bot Status',
          color: 0x00FF00,
          fields: [
            { name: 'Status', value: '🟢 Online', inline: true },
            { name: 'AI Provider', value: provider, inline: true },
            { name: 'Servers', value: String(discordClient.guilds.cache.size), inline: true },
          ],
        }],
      });
      return true;

    case 'ping':
      const ping = discordClient.ws.ping;
      await message.reply(`🏓 Pong! Latency: ${ping}ms`);
      return true;

    default:
      return false;
  }
}

// ============================================================
// UTILITIES
// ============================================================

/**
 * Send long message (Discord has 2000 char limit)
 */
async function sendLongMessage(channel, content, replyTo = null) {
  const maxLength = 1900;
  
  if (content.length <= maxLength) {
    if (replyTo) {
      await replyTo.reply(content);
    } else {
      await channel.send(content);
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
  for (let i = 0; i < chunks.length; i++) {
    if (i === 0 && replyTo) {
      await replyTo.reply(chunks[i]);
    } else {
      await channel.send(chunks[i]);
    }
  }
}

/**
 * Test Discord bot token
 */
export async function testDiscordToken(token) {
  try {
    const testClient = new Client({
      intents: [GatewayIntentBits.Guilds],
    });

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        testClient.destroy();
        reject(new Error('Connection timeout'));
      }, 10000);

      testClient.once('ready', () => {
        clearTimeout(timeout);
        testClient.destroy();
        resolve(true);
      });

      testClient.login(token).catch(reject);
    });

    return { success: true, message: 'Token is valid' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  startDiscordBot,
  stopDiscordBot,
  getDiscordStatus,
  testDiscordToken,
};
