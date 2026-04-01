/**
 * MCP Controller
 * Handles MCP client operations with MongoDB
 */

import { McpClient } from '../services/database.js';

/**
 * GET /api/mcp/clients - List all MCP clients
 */
export async function listClients(req, res) {
  try {
    const clients = await McpClient.find().sort({ name: 1 });
    
    res.json({
      success: true,
      data: clients.map(client => ({
        id: client._id,
        key: client.key,
        name: client.name,
        description: client.description,
        enabled: client.enabled,
        transport: client.transport,
        command: client.command,
        args: client.args,
        env: client.env,
        url: client.url,
        headers: client.headers,
        created_at: client.createdAt,
        updated_at: client.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/mcp/clients/:key - Get MCP client by key
 */
export async function getClient(req, res) {
  try {
    const { key } = req.params;
    const client = await McpClient.findOne({ key });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'MCP client not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: client._id,
        key: client.key,
        name: client.name,
        description: client.description,
        enabled: client.enabled,
        transport: client.transport,
        command: client.command,
        args: client.args,
        env: client.env,
        url: client.url,
        headers: client.headers,
        created_at: client.createdAt,
        updated_at: client.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/mcp/clients - Create new MCP client
 */
export async function createClient(req, res) {
  try {
    const { key, name, description, enabled, transport, command, args, env, url, headers } = req.body;
    
    if (!key || !name) {
      return res.status(400).json({
        success: false,
        message: 'key and name are required',
      });
    }
    
    // Check if client already exists
    const existing = await McpClient.findOne({ key });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'MCP client with this key already exists',
      });
    }
    
    const client = await McpClient.create({
      key,
      name,
      description: description || '',
      enabled: enabled || false,
      transport: transport || 'stdio',
      command: command || '',
      args: args || [],
      env: env || {},
      url: url || '',
      headers: headers || {},
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: client._id,
        key: client.key,
        name: client.name,
        description: client.description,
        enabled: client.enabled,
        transport: client.transport,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/mcp/clients/:key - Update MCP client
 */
export async function updateClient(req, res) {
  try {
    const { key } = req.params;
    const updates = req.body;
    
    // Don't allow changing the key
    delete updates.key;
    
    const client = await McpClient.findOneAndUpdate(
      { key },
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'MCP client not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: client._id,
        key: client.key,
        name: client.name,
        description: client.description,
        enabled: client.enabled,
        transport: client.transport,
        command: client.command,
        args: client.args,
        env: client.env,
        url: client.url,
        headers: client.headers,
        created_at: client.createdAt,
        updated_at: client.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/mcp/clients/:key/toggle - Toggle MCP client enabled state
 */
export async function toggleClient(req, res) {
  try {
    const { key } = req.params;
    
    const client = await McpClient.findOne({ key });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'MCP client not found',
      });
    }
    
    client.enabled = !client.enabled;
    await client.save();
    
    res.json({
      success: true,
      data: {
        key: client.key,
        enabled: client.enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/mcp/clients/:key - Delete MCP client
 */
export async function deleteClient(req, res) {
  try {
    const { key } = req.params;
    
    const client = await McpClient.findOneAndDelete({ key });
    
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'MCP client not found',
      });
    }
    
    res.json({
      success: true,
      message: 'MCP client deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listClients,
  getClient,
  createClient,
  updateClient,
  toggleClient,
  deleteClient,
};
