/**
 * Chats Controller
 * Handles chat session operations with MongoDB
 */

import { Chat } from '../services/database.js';

/**
 * GET /api/chats - List all chats
 */
export async function listChats(req, res) {
  try {
    const { user_id, channel, agent_id, limit = 50 } = req.query;
    
    const query = {};
    if (user_id) query.user_id = user_id;
    if (channel) query.channel = channel;
    if (agent_id) query.agent_id = agent_id;
    
    const chats = await Chat.find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .select('-messages'); // Exclude messages for list view
    
    res.json({
      success: true,
      data: chats.map(chat => ({
        id: chat._id,
        title: chat.title,
        user_id: chat.user_id,
        agent_id: chat.agent_id,
        channel: chat.channel,
        message_count: chat.messages?.length || 0,
        metadata: chat.metadata,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/chats/:id - Get chat by ID with messages
 */
export async function getChat(req, res) {
  try {
    const { id } = req.params;
    const chat = await Chat.findById(id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: chat._id,
        title: chat.title,
        user_id: chat.user_id,
        agent_id: chat.agent_id,
        channel: chat.channel,
        messages: chat.messages,
        metadata: chat.metadata,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/chats - Create new chat session
 */
export async function createChat(req, res) {
  try {
    const { title, user_id, agent_id, channel, messages, metadata } = req.body;
    
    const chat = await Chat.create({
      title: title || 'New Chat',
      user_id: user_id || 'default',
      agent_id: agent_id || 'default',
      channel: channel || 'console',
      messages: messages || [],
      metadata: metadata || {},
    });
    
    res.status(201).json({
      success: true,
      data: {
        id: chat._id,
        title: chat.title,
        user_id: chat.user_id,
        agent_id: chat.agent_id,
        channel: chat.channel,
        messages: chat.messages,
        metadata: chat.metadata,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/chats/:id - Update chat
 */
export async function updateChat(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const chat = await Chat.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: chat._id,
        title: chat.title,
        user_id: chat.user_id,
        agent_id: chat.agent_id,
        channel: chat.channel,
        messages: chat.messages,
        metadata: chat.metadata,
        created_at: chat.createdAt,
        updated_at: chat.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/chats/:id/messages - Add message to chat
 */
export async function addMessage(req, res) {
  try {
    const { id } = req.params;
    const { role, content, metadata } = req.body;
    
    if (!role || !content) {
      return res.status(400).json({
        success: false,
        message: 'role and content are required',
      });
    }
    
    const message = {
      role,
      content,
      timestamp: new Date(),
      metadata: metadata || {},
    };
    
    const chat = await Chat.findByIdAndUpdate(
      id,
      { 
        $push: { messages: message },
        $set: { updatedAt: new Date() }
      },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    // Update title from first user message if still default
    if (chat.title === 'New Chat' && role === 'user') {
      const title = content.slice(0, 50) + (content.length > 50 ? '...' : '');
      await Chat.findByIdAndUpdate(id, { $set: { title } });
      chat.title = title;
    }
    
    res.json({
      success: true,
      data: {
        id: chat._id,
        title: chat.title,
        messages: chat.messages,
        updated_at: chat.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/chats/:id - Delete chat
 */
export async function deleteChat(req, res) {
  try {
    const { id } = req.params;
    
    const chat = await Chat.findByIdAndDelete(id);
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Chat deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * DELETE /api/chats/:id/messages - Clear chat messages
 */
export async function clearMessages(req, res) {
  try {
    const { id } = req.params;
    
    const chat = await Chat.findByIdAndUpdate(
      id,
      { $set: { messages: [], updatedAt: new Date() } },
      { new: true }
    );
    
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'Chat not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Messages cleared',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export default {
  listChats,
  getChat,
  createChat,
  updateChat,
  addMessage,
  deleteChat,
  clearMessages,
};
