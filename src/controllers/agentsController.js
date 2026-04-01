/**
 * Agents Controller
 * Handles agent CRUD operations with MongoDB
 */

import { Agent } from '../services/database.js';

/**
 * GET /api/agents - List all agents
 */
export async function listAgents(req, res) {
  try {
    const agents = await Agent.find().sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: agents.map(agent => ({
        id: agent._id,
        name: agent.name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        model: agent.model,
        enabled: agent.enabled,
        skills: agent.skills,
        tools: agent.tools,
        config: agent.config,
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/agents/:id - Get agent by ID
 */
export async function getAgent(req, res) {
  try {
    const { id } = req.params;
    const agent = await Agent.findById(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        model: agent.model,
        enabled: agent.enabled,
        skills: agent.skills,
        tools: agent.tools,
        config: agent.config,
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/agents - Create new agent
 */
export async function createAgent(req, res) {
  try {
    const { name, description, system_prompt, model, enabled, skills, tools, config } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }
    
    const agent = await Agent.create({
      name,
      description: description || '',
      system_prompt: system_prompt || 'You are a helpful assistant.',
      model: model || { provider_id: 'openai', model_id: 'gpt-4' },
      enabled: enabled !== false,
      skills: skills || [],
      tools: tools || [],
      config: config || {},
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        model: agent.model,
        enabled: agent.enabled,
        skills: agent.skills,
        tools: agent.tools,
        config: agent.config,
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/agents/:id - Update agent
 */
export async function updateAgent(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const agent = await Agent.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: agent._id,
        name: agent.name,
        description: agent.description,
        system_prompt: agent.system_prompt,
        model: agent.model,
        enabled: agent.enabled,
        skills: agent.skills,
        tools: agent.tools,
        config: agent.config,
        created_at: agent.createdAt,
        updated_at: agent.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/agents/:id - Delete agent
 */
export async function deleteAgent(req, res) {
  try {
    const { id } = req.params;
    
    const agent = await Agent.findByIdAndDelete(id);
    
    if (!agent) {
      return res.status(404).json({
        success: false,
        message: 'Agent not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listAgents,
  getAgent,
  createAgent,
  updateAgent,
  deleteAgent,
};
