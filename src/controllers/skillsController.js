/**
 * Skills Controller
 * Handles skill operations with MongoDB
 */

import { Skill } from '../services/database.js';

/**
 * GET /api/skills - List all skills
 */
export async function listSkills(req, res) {
  try {
    const { agent_id, enabled } = req.query;
    
    const query = {};
    if (agent_id) query.agent_id = agent_id;
    if (enabled !== undefined) query.enabled = enabled === 'true';
    
    const skills = await Skill.find(query).sort({ name: 1 });
    
    res.json({
      success: true,
      data: skills.map(skill => ({
        id: skill._id,
        name: skill.name,
        description: skill.description,
        code: skill.code,
        enabled: skill.enabled,
        builtin: skill.builtin,
        version: skill.version,
        agent_id: skill.agent_id,
        created_at: skill.createdAt,
        updated_at: skill.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/skills/:id - Get skill by ID
 */
export async function getSkill(req, res) {
  try {
    const { id } = req.params;
    const skill = await Skill.findById(id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        code: skill.code,
        enabled: skill.enabled,
        builtin: skill.builtin,
        version: skill.version,
        agent_id: skill.agent_id,
        created_at: skill.createdAt,
        updated_at: skill.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/skills - Create new skill
 */
export async function createSkill(req, res) {
  try {
    const { name, description, code, enabled, builtin, version, agent_id } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'name is required',
      });
    }
    
    const skill = await Skill.create({
      name,
      description: description || '',
      code: code || '',
      enabled: enabled !== false,
      builtin: builtin || false,
      version: version || '1.0.0',
      agent_id: agent_id || null,
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        code: skill.code,
        enabled: skill.enabled,
        builtin: skill.builtin,
        version: skill.version,
        agent_id: skill.agent_id,
        created_at: skill.createdAt,
        updated_at: skill.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/skills/:id - Update skill
 */
export async function updateSkill(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const skill = await Skill.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: skill._id,
        name: skill.name,
        description: skill.description,
        code: skill.code,
        enabled: skill.enabled,
        builtin: skill.builtin,
        version: skill.version,
        agent_id: skill.agent_id,
        created_at: skill.createdAt,
        updated_at: skill.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PATCH /api/skills/:id/toggle - Toggle skill enabled state
 */
export async function toggleSkill(req, res) {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findById(id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }
    
    skill.enabled = !skill.enabled;
    await skill.save();
    
    res.json({
      success: true,
      data: {
        id: skill._id,
        name: skill.name,
        enabled: skill.enabled,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/skills/:id - Delete skill
 */
export async function deleteSkill(req, res) {
  try {
    const { id } = req.params;
    
    const skill = await Skill.findById(id);
    
    if (!skill) {
      return res.status(404).json({
        success: false,
        message: 'Skill not found',
      });
    }
    
    // Don't allow deleting builtin skills
    if (skill.builtin) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete built-in skill',
      });
    }
    
    await Skill.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: 'Skill deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  toggleSkill,
  deleteSkill,
};
