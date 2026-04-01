/**
 * AI Service
 * Handles communication with AI providers (OpenAI, Anthropic)
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import config from '../config/index.js';

// ============================================================
// PROVIDER CLIENTS
// ============================================================

let openaiClient = null;
let anthropicClient = null;

/**
 * Initialize OpenAI client
 */
export function initOpenAI(apiKey = null) {
  const key = apiKey || config.ai.openai.apiKey;
  
  if (!key) {
    console.log('⚠️  OpenAI API key not configured');
    return null;
  }

  openaiClient = new OpenAI({ apiKey: key });
  console.log('✅ OpenAI client initialized');
  return openaiClient;
}

/**
 * Initialize Anthropic client
 */
export function initAnthropic(apiKey = null) {
  const key = apiKey || config.ai.anthropic.apiKey;
  
  if (!key) {
    console.log('⚠️  Anthropic API key not configured');
    return null;
  }

  anthropicClient = new Anthropic({ apiKey: key });
  console.log('✅ Anthropic client initialized');
  return anthropicClient;
}

// ============================================================
// CHAT COMPLETION
// ============================================================

/**
 * Send chat completion request to OpenAI
 */
export async function chatWithOpenAI(messages, options = {}) {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Set OPENAI_API_KEY in .env');
  }

  const {
    model = config.ai.openai.model || 'gpt-4',
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
  } = options;

  try {
    if (stream) {
      // Return streaming response
      const response = await openaiClient.chat.completions.create({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      });
      return response;
    }

    // Regular response
    const response = await openaiClient.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage,
      model: response.model,
      finishReason: response.choices[0]?.finish_reason,
    };
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    throw error;
  }
}

/**
 * Send chat completion request to Anthropic
 */
export async function chatWithAnthropic(messages, options = {}) {
  if (!anthropicClient) {
    throw new Error('Anthropic client not initialized. Set ANTHROPIC_API_KEY in .env');
  }

  const {
    model = config.ai.anthropic.model || 'claude-3-sonnet-20240229',
    temperature = 0.7,
    maxTokens = 2048,
    stream = false,
    systemPrompt = 'You are a helpful assistant.',
  } = options;

  // Convert messages format (OpenAI -> Anthropic)
  const anthropicMessages = messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

  // Get system prompt from messages if present
  const systemMsg = messages.find(m => m.role === 'system');
  const system = systemMsg?.content || systemPrompt;

  try {
    if (stream) {
      // Return streaming response
      const response = await anthropicClient.messages.stream({
        model,
        max_tokens: maxTokens,
        system,
        messages: anthropicMessages,
      });
      return response;
    }

    // Regular response
    const response = await anthropicClient.messages.create({
      model,
      max_tokens: maxTokens,
      system,
      messages: anthropicMessages,
    });

    return {
      content: response.content[0]?.text || '',
      usage: {
        prompt_tokens: response.usage?.input_tokens,
        completion_tokens: response.usage?.output_tokens,
        total_tokens: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      },
      model: response.model,
      finishReason: response.stop_reason,
    };
  } catch (error) {
    console.error('Anthropic API error:', error.message);
    throw error;
  }
}

// ============================================================
// UNIFIED CHAT INTERFACE
// ============================================================

/**
 * Send chat to any configured provider
 */
export async function chat(messages, options = {}) {
  const { provider = 'auto', ...restOptions } = options;

  // Auto-detect provider based on what's configured
  let selectedProvider = provider;
  
  if (provider === 'auto') {
    if (openaiClient) {
      selectedProvider = 'openai';
    } else if (anthropicClient) {
      selectedProvider = 'anthropic';
    } else {
      throw new Error('No AI provider configured. Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env');
    }
  }

  switch (selectedProvider) {
    case 'openai':
      return chatWithOpenAI(messages, restOptions);
    case 'anthropic':
      return chatWithAnthropic(messages, restOptions);
    default:
      throw new Error(`Unknown provider: ${selectedProvider}`);
  }
}

/**
 * Stream chat response
 */
export async function* streamChat(messages, options = {}) {
  const { provider = 'auto', ...restOptions } = options;

  let selectedProvider = provider;
  
  if (provider === 'auto') {
    if (openaiClient) selectedProvider = 'openai';
    else if (anthropicClient) selectedProvider = 'anthropic';
    else throw new Error('No AI provider configured');
  }

  if (selectedProvider === 'openai') {
    const stream = await chatWithOpenAI(messages, { ...restOptions, stream: true });
    
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield { content, done: false };
      }
    }
    yield { content: '', done: true };
    
  } else if (selectedProvider === 'anthropic') {
    const stream = await chatWithAnthropic(messages, { ...restOptions, stream: true });
    
    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        yield { content: event.delta?.text || '', done: false };
      }
    }
    yield { content: '', done: true };
  }
}

// ============================================================
// PROVIDER STATUS
// ============================================================

/**
 * Test provider connection
 */
export async function testProvider(providerName, apiKey = null) {
  try {
    switch (providerName) {
      case 'openai': {
        const client = apiKey ? new OpenAI({ apiKey }) : openaiClient;
        if (!client) return { success: false, message: 'API key not configured' };
        
        // Test with a simple request
        await client.models.list();
        return { success: true, message: 'Connection successful' };
      }
      
      case 'anthropic': {
        const client = apiKey ? new Anthropic({ apiKey }) : anthropicClient;
        if (!client) return { success: false, message: 'API key not configured' };
        
        // Test with a minimal request
        await client.messages.create({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hi' }],
        });
        return { success: true, message: 'Connection successful' };
      }
      
      default:
        return { success: false, message: `Unknown provider: ${providerName}` };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get available models for a provider
 */
export async function getModels(providerName) {
  switch (providerName) {
    case 'openai':
      return [
        { id: 'gpt-4', name: 'GPT-4', supports_multimodal: true },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', supports_multimodal: true },
        { id: 'gpt-4o', name: 'GPT-4o', supports_multimodal: true },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', supports_multimodal: true },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', supports_multimodal: false },
      ];
      
    case 'anthropic':
      return [
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', supports_multimodal: true },
        { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet', supports_multimodal: true },
        { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', supports_multimodal: true },
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', supports_multimodal: true },
      ];
      
    default:
      return [];
  }
}

/**
 * Get provider status
 */
export function getProviderStatus() {
  return {
    openai: {
      initialized: !!openaiClient,
      configured: !!config.ai.openai.apiKey,
    },
    anthropic: {
      initialized: !!anthropicClient,
      configured: !!config.ai.anthropic.apiKey,
    },
  };
}

// ============================================================
// INITIALIZATION
// ============================================================

/**
 * Initialize all configured providers
 */
export function initializeProviders() {
  if (config.ai.openai.apiKey) {
    initOpenAI();
  }
  
  if (config.ai.anthropic.apiKey) {
    initAnthropic();
  }
  
  const status = getProviderStatus();
  
  if (!status.openai.initialized && !status.anthropic.initialized) {
    console.log('⚠️  No AI providers configured. Chat will return placeholder responses.');
    console.log('   Set OPENAI_API_KEY or ANTHROPIC_API_KEY in .env');
  }
}

export default {
  initOpenAI,
  initAnthropic,
  initializeProviders,
  chat,
  streamChat,
  chatWithOpenAI,
  chatWithAnthropic,
  testProvider,
  getModels,
  getProviderStatus,
};
