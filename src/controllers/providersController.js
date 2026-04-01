/**
 * Providers Controller
 * Handles AI provider configuration with MongoDB
 */

import { ProviderConfig } from '../services/database.js';
import { testProvider, initOpenAI, initAnthropic } from '../services/aiService.js';

/**
 * GET /api/models/providers - List all providers
 */
export async function listProviders(req, res) {
  try {
    const providers = await ProviderConfig.find().sort({ provider_id: 1 });
    
    res.json({
      success: true,
      data: providers.map(provider => ({
        id: provider._id,
        provider_id: provider.provider_id,
        name: provider.name,
        enabled: provider.enabled,
        has_api_key: !!provider.api_key,
        base_url: provider.base_url,
        models: provider.models,
        config: provider.config,
        created_at: provider.createdAt,
        updated_at: provider.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/models/providers/:id - Get provider by ID
 */
export async function getProvider(req, res) {
  try {
    const { id } = req.params;
    const provider = await ProviderConfig.findOne({ provider_id: id });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: provider._id,
        provider_id: provider.provider_id,
        name: provider.name,
        enabled: provider.enabled,
        has_api_key: !!provider.api_key,
        base_url: provider.base_url,
        models: provider.models,
        config: provider.config,
        created_at: provider.createdAt,
        updated_at: provider.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/models/providers - Create new provider
 */
export async function createProvider(req, res) {
  try {
    const { provider_id, name, api_key, base_url, enabled, models, config } = req.body;
    
    if (!provider_id || !name) {
      return res.status(400).json({
        success: false,
        message: 'provider_id and name are required',
      });
    }
    
    // Check if provider already exists
    const existing = await ProviderConfig.findOne({ provider_id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Provider already exists',
      });
    }
    
    const provider = await ProviderConfig.create({
      provider_id,
      name,
      api_key: api_key || '',
      base_url: base_url || '',
      enabled: enabled || false,
      models: models || [],
      config: config || {},
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: provider._id,
        provider_id: provider.provider_id,
        name: provider.name,
        enabled: provider.enabled,
        has_api_key: !!provider.api_key,
        models: provider.models,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/models/providers/:id - Update provider
 */
export async function updateProvider(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Don't allow changing provider_id
    delete updates.provider_id;
    
    const provider = await ProviderConfig.findOneAndUpdate(
      { provider_id: id },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }
    
    // Re-initialize the provider if API key changed
    if (updates.api_key) {
      if (id === 'openai') {
        initOpenAI(updates.api_key);
      } else if (id === 'anthropic') {
        initAnthropic(updates.api_key);
      }
    }
    
    res.json({
      success: true,
      data: {
        id: provider._id,
        provider_id: provider.provider_id,
        name: provider.name,
        enabled: provider.enabled,
        has_api_key: !!provider.api_key,
        models: provider.models,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/models/providers/:id/test - Test provider connection
 */
export async function testProviderConnection(req, res) {
  try {
    const { id } = req.params;
    const { api_key } = req.body;
    
    // Get provider config
    const provider = await ProviderConfig.findOne({ provider_id: id });
    const keyToTest = api_key || provider?.api_key;
    
    if (!keyToTest) {
      return res.json({
        success: false,
        message: 'API key not configured',
      });
    }
    
    const result = await testProvider(id, keyToTest);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/models/providers/:id - Delete provider
 */
export async function deleteProvider(req, res) {
  try {
    const { id } = req.params;
    
    // Don't allow deleting built-in providers
    if (['openai', 'anthropic'].includes(id)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete built-in provider',
      });
    }
    
    const provider = await ProviderConfig.findOneAndDelete({ provider_id: id });
    
    if (!provider) {
      return res.status(404).json({
        success: false,
        message: 'Provider not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Provider deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/models - List all available models
 */
export async function listModels(req, res) {
  try {
    const providers = await ProviderConfig.find({ enabled: true });
    
    const models = [];
    
    for (const provider of providers) {
      for (const model of provider.models || []) {
        if (model.enabled !== false) {
          models.push({
            id: model.id,
            name: model.name,
            provider_id: provider.provider_id,
            provider_name: provider.name,
          });
        }
      }
    }
    
    res.json({
      success: true,
      data: models,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listProviders,
  getProvider,
  createProvider,
  updateProvider,
  testProviderConnection,
  deleteProvider,
  listModels,
};
