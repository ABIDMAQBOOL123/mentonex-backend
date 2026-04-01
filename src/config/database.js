/**
 * Database Configuration
 * Handles database connection and setup
 */

import config from './index.js';

// In-memory database for development (replace with MongoDB/PostgreSQL in production)
class InMemoryDB {
  constructor() {
    this.collections = {
      users: [],
      chats: [],
      messages: [],
      agents: [
        {
          id: 'default',
          name: 'Default Agent',
          description: 'Main Mentonex assistant',
          enabled: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ],
      channels: {
        console: { enabled: true, bot_prefix: '', filter_tool_messages: false },
        discord: { enabled: false, bot_token: '', bot_prefix: '!', require_mention: true },
        telegram: { enabled: false, bot_token: '', bot_prefix: '/' },
        twilio: { enabled: false, account_sid: '', auth_token: '', phone_number: '' },
        slack: { enabled: false, bot_token: '', signing_secret: '' },
      },
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          enabled: false,
          configured: false,
          models: [
            { id: 'gpt-4', name: 'GPT-4', supports_multimodal: true },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supports_multimodal: true },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', supports_multimodal: false },
          ],
        },
        {
          id: 'anthropic',
          name: 'Anthropic',
          enabled: false,
          configured: false,
          models: [
            { id: 'claude-3-opus', name: 'Claude 3 Opus', supports_multimodal: true },
            { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', supports_multimodal: true },
            { id: 'claude-3-haiku', name: 'Claude 3 Haiku', supports_multimodal: true },
          ],
        },
        {
          id: 'ollama',
          name: 'Ollama (Local)',
          enabled: false,
          configured: false,
          models: [],
        },
      ],
      mcp_clients: [],
      skills: [],
      cron_jobs: [],
    };
  }

  // Generic CRUD operations
  find(collection) {
    return this.collections[collection] || [];
  }

  findOne(collection, query) {
    const items = this.collections[collection] || [];
    return items.find(item => {
      return Object.keys(query).every(key => item[key] === query[key]);
    });
  }

  findById(collection, id) {
    const items = this.collections[collection] || [];
    return items.find(item => item.id === id);
  }

  insert(collection, data) {
    if (!this.collections[collection]) {
      this.collections[collection] = [];
    }
    const newItem = {
      ...data,
      id: data.id || this.generateId(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.collections[collection].push(newItem);
    return newItem;
  }

  update(collection, id, data) {
    const items = this.collections[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = {
      ...items[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return items[index];
  }

  delete(collection, id) {
    const items = this.collections[collection] || [];
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return false;
    
    items.splice(index, 1);
    return true;
  }

  // For non-array collections (like channels config)
  get(key) {
    return this.collections[key];
  }

  set(key, value) {
    this.collections[key] = value;
    return value;
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
const db = new InMemoryDB();

export default db;
