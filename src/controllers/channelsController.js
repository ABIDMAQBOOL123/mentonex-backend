/**
 * Channels Controller
 * Handles channel configuration operations with MongoDB
 */

import { ChannelConfig } from '../services/database.js';

/**
 * GET /api/config/channels - List all channels
 */
export async function listChannels(req, res) {
  try {
    const channels = await ChannelConfig.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: channels.map(channel => ({
        id: channel._id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config,
        created_at: channel.createdAt,
        updated_at: channel.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/config/channels/:name - Get channel by name
 */
export async function getChannel(req, res) {
  try {
    const { name } = req.params;
    const channel = await ChannelConfig.findOne({ name });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config,
        created_at: channel.createdAt,
        updated_at: channel.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/config/channels - Create new channel
 */
export async function createChannel(req, res) {
  try {
    const { name, type, enabled, config } = req.body;
    
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'name and type are required',
      });
    }
    
    // Check if channel already exists
    const existing = await ChannelConfig.findOne({ name });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Channel already exists',
      });
    }
    
    const channel = await ChannelConfig.create({
      name,
      type,
      enabled: enabled || false,
      config: config || {},
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config,
        created_at: channel.createdAt,
        updated_at: channel.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/config/channels/:name - Update channel
 */
export async function updateChannel(req, res) {
  try {
    const { name } = req.params;
    const updates = req.body;
    
    // Don't allow changing the name
    delete updates.name;
    
    const channel = await ChannelConfig.findOneAndUpdate(
      { name },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: channel._id,
        name: channel.name,
        type: channel.type,
        enabled: channel.enabled,
        config: channel.config,
        created_at: channel.createdAt,
        updated_at: channel.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/config/channels/:name/toggle - Toggle channel enabled state
 */
export async function toggleChannel(req, res) {
  try {
    const { name } = req.params;
    
    const channel = await ChannelConfig.findOne({ name });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }
    
    channel.enabled = !channel.enabled;
    await channel.save();
    
    res.json({
      success: true,
      data: {
        id: channel._id,
        name: channel.name,
        enabled: channel.enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/config/channels/:name - Delete channel
 */
export async function deleteChannel(req, res) {
  try {
    const { name } = req.params;
    
    // Don't allow deleting console channel
    if (name === 'console') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete console channel',
      });
    }
    
    const channel = await ChannelConfig.findOneAndDelete({ name });
    
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listChannels,
  getChannel,
  createChannel,
  updateChannel,
  toggleChannel,
  deleteChannel,
};
