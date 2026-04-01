/**
 * MongoDB Database Connection
 * Handles database connection and provides models
 */

import mongoose from 'mongoose';
import config from './index.js';

// ============================================================
// CONNECTION
// ============================================================

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  try {
    const dbUrl = config.database.url;
    
    if (!dbUrl || dbUrl.includes('localhost')) {
      console.log('⚠️  No DATABASE_URL configured. Using in-memory storage.');
      console.log('   Set DATABASE_URL in .env for persistent storage.');
      return null;
    }

    await mongoose.connect(dbUrl, {
      dbName: config.database.name,
    });

    isConnected = true;
    console.log('✅ Connected to MongoDB');
    
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Falling back to in-memory storage');
    return null;
  }
}

export async function disconnectDatabase() {
  if (!isConnected) return;
  
  await mongoose.disconnect();
  isConnected = false;
  console.log('📦 Disconnected from MongoDB');
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
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Agent Schema
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  system_prompt: { type: String, default: 'You are a helpful assistant.' },
  model: {
    provider_id: String,
    model_id: String,
  },
  enabled: { type: Boolean, default: true },
  skills: [{ type: String }],
  tools: [{ type: String }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

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
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Channel Config Schema
const channelConfigSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Provider Config Schema
const providerConfigSchema = new mongoose.Schema({
  provider_id: { type: String, required: true, unique: true },
  api_key: { type: String },
  base_url: { type: String },
  enabled: { type: Boolean, default: false },
  extra_models: [{ type: mongoose.Schema.Types.Mixed }],
  config: { type: mongoose.Schema.Types.Mixed, default: {} },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

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
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// Skill Schema
const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  code: { type: String, default: '' },
  enabled: { type: Boolean, default: true },
  builtin: { type: Boolean, default: false },
  version: { type: String, default: '1.0.0' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

// ============================================================
// MODELS
// ============================================================

export const User = mongoose.model('User', userSchema);
export const Agent = mongoose.model('Agent', agentSchema);
export const Chat = mongoose.model('Chat', chatSchema);
export const ChannelConfig = mongoose.model('ChannelConfig', channelConfigSchema);
export const ProviderConfig = mongoose.model('ProviderConfig', providerConfigSchema);
export const McpClient = mongoose.model('McpClient', mcpClientSchema);
export const Skill = mongoose.model('Skill', skillSchema);

// ============================================================
// HELPER - Check if MongoDB is available
// ============================================================

export function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export default {
  connectDatabase,
  disconnectDatabase,
  isMongoConnected,
  User,
  Agent,
  Chat,
  ChannelConfig,
  ProviderConfig,
  McpClient,
  Skill,
};
