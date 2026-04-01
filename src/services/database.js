/**
 * Database Service
 * Provides unified data access layer using MongoDB
 */

import mongoose from 'mongoose';
import config from '../config/index.js';

let isConnected = false;

// ============================================================
// CONNECTION
// ============================================================

export async function connectDatabase() {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return mongoose.connection;
  }

  try {
    const dbUrl = config.database.url;
    
    await mongoose.connect(dbUrl, {
      dbName: config.database.name,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB:', config.database.name);
    
    // Create indexes
    await createIndexes();
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  console.log('📦 Disconnected from MongoDB');
}

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

// ============================================================
// SCHEMAS
// ============================================================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'user', enum: ['user', 'admin'] },
  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Agent Schema
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  system_prompt: { type: String, default: 'You are a helpful assistant.' },
  model: {
    provider_id: { type: String, default: 'openai' },
    model_id: { type: String, default: 'gpt-4' },
  },
  enabled: { type: Boolean, default: true },
  skills: [{ type: String }],
  tools: [{ type: String }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Chat Schema
const chatSchema = new mongoose.Schema({
  title: { type: String, default: 'New Chat' },
  user_id: { type: String, default: 'default' },
  agent_id: { type: String, default: 'default' },
  channel: { type: String, default: 'console' },
  messages: [{
    role: { type: String, enum: ['user', 'assistant', 'system', 'tool'] },
    content: { type: String },
    timestamp: { type: Date, default: Date.now },
    metadata: { type: mongoose.Schema.Types.Mixed },
  }],
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Channel Config Schema
const channelConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  enabled: { type: Boolean, default: false },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Provider Config Schema
const providerConfigSchema = new mongoose.Schema({
  provider_id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  api_key: { type: String },
  base_url: { type: String },
  enabled: { type: Boolean, default: false },
  models: [{ 
    id: String, 
    name: String, 
    enabled: { type: Boolean, default: true },
  }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// MCP Client Schema
const mcpClientSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  enabled: { type: Boolean, default: false },
  transport: { type: String, enum: ['stdio', 'http'], default: 'stdio' },
  command: { type: String },
  args: [{ type: String }],
  env: { type: mongoose.Schema.Types.Mixed, default: {} },
  url: { type: String },
  headers: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  code: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  builtin: { type: Boolean, default: false },
  version: { type: String, default: '1.0.0' },
  agent_id: { type: String },
}, { timestamps: true });

// ============================================================
// MODELS
// ============================================================

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);
export const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);
export const ChannelConfig = mongoose.models.ChannelConfig || mongoose.model('ChannelConfig', channelConfigSchema);
export const ProviderConfig = mongoose.models.ProviderConfig || mongoose.model('ProviderConfig', providerConfigSchema);
export const McpClient = mongoose.models.McpClient || mongoose.model('McpClient', mcpClientSchema);
export const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);

// ============================================================
// INDEXES
// ============================================================

async function createIndexes() {
  try {
    await Chat.collection.createIndex({ user_id: 1, createdAt: -1 });
    await Chat.collection.createIndex({ channel: 1 });
    await Skill.collection.createIndex({ agent_id: 1 });
    console.log('✅ Database indexes created');
  } catch (error) {
    // Indexes may already exist
    console.log('📦 Indexes already exist or created');
  }
}

// ============================================================
// SEED DATA
// ============================================================

export async function seedDefaultData() {
  try {
    // Seed default agent if none exists
    const agentCount = await Agent.countDocuments();
    if (agentCount === 0) {
      await Agent.create({
        name: 'Default Agent',
        description: 'Default AI assistant',
        system_prompt: 'You are Mentonex, a helpful AI assistant. Be friendly, concise, and helpful.',
        model: {
          provider_id: 'openai',
          model_id: 'gpt-4',
        },
        enabled: true,
      });
      console.log('✅ Default agent created');
    }

    // Seed default providers if none exist
    const providerCount = await ProviderConfig.countDocuments();
    if (providerCount === 0) {
      await ProviderConfig.insertMany([
        {
          provider_id: 'openai',
          name: 'OpenAI',
          enabled: !!config.ai.openai.apiKey,
          api_key: config.ai.openai.apiKey || '',
          models: [
            { id: 'gpt-4', name: 'GPT-4', enabled: true },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', enabled: true },
            { id: 'gpt-4o', name: 'GPT-4o', enabled: true },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', enabled: true },
          ],
        },
        {
          provider_id: 'anthropic',
          name: 'Anthropic',
          enabled: !!config.ai.anthropic.apiKey,
          api_key: config.ai.anthropic.apiKey || '',
          models: [
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', enabled: true },
            { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', enabled: true },
            { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', enabled: true },
          ],
        },
      ]);
      console.log('✅ Default providers created');
    }

    // Seed default channels if none exist
    const channelCount = await ChannelConfig.countDocuments();
    if (channelCount === 0) {
      await ChannelConfig.insertMany([
        { name: 'console', type: 'console', enabled: true, config: {} },
        { name: 'discord', type: 'discord', enabled: false, config: { bot_token: '', prefix: '!' } },
        { name: 'telegram', type: 'telegram', enabled: false, config: { bot_token: '' } },
        { name: 'twilio', type: 'twilio', enabled: false, config: { account_sid: '', auth_token: '', phone_number: '' } },
        { name: 'slack', type: 'slack', enabled: false, config: { bot_token: '', signing_secret: '' } },
      ]);
      console.log('✅ Default channels created');
    }

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  connectDatabase,
  disconnectDatabase,
  isMongoConnected,
  seedDefaultData,
  User,
  Agent,
  Chat,
  ChannelConfig,
  ProviderConfig,
  McpClient,
  Skill,
};
