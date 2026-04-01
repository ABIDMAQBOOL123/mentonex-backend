/**
 * Application Configuration
 * Centralizes all environment variables and config settings
 */

import dotenv from 'dotenv';
dotenv.config();

const config = {
  // Server
  server: {
    port: process.env.PORT || 8088,
    env: process.env.NODE_ENV || 'development',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  },

  // Database
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/mentonex',
    name: process.env.DATABASE_NAME || 'mentonex',
  },

  // Authentication
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    jwtExpiry: process.env.JWT_EXPIRY || '7d',
    enabled: process.env.AUTH_ENABLED === 'true',
  },

  // AI Providers
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    },
  },

  // Channel Integrations
  channels: {
    discord: {
      botToken: process.env.DISCORD_BOT_TOKEN || '',
      prefix: process.env.DISCORD_PREFIX || '!',
    },
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    slack: {
      botToken: process.env.SLACK_BOT_TOKEN || '',
      signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    },
  },

  // Rate Limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  },

  // File Upload
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  },
};

export default config;
