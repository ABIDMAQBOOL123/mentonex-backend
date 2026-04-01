/**
 * Console Routes
 * /api/console - Real-time chat endpoints
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import { chat, streamChat, getProviderStatus } from '../services/aiService.js';
import { Chat, Agent } from '../services/database.js';

const router = Router();

/**
 * POST /api/console/chat - Send message with SSE streaming
 */
router.post('/chat', async (req, res) => {
  const { message, chat_id, agent_id, stream = true } = req.body;

  if (!message) {
    return res.status(400).json({
      success: false,
      message: 'message is required',
    });
  }

  try {
    // Get or create chat
    let chatDoc;
    if (chat_id) {
      chatDoc = await Chat.findById(chat_id);
    }
    
    if (!chatDoc) {
      chatDoc = await Chat.create({
        title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
        channel: 'console',
        messages: [],
      });
    }

    // Get agent system prompt
    let systemPrompt = 'You are Mentonex, a helpful AI assistant.';
    if (agent_id) {
      const agent = await Agent.findById(agent_id);
      if (agent?.system_prompt) {
        systemPrompt = agent.system_prompt;
      }
    }

    // Add user message to history
    chatDoc.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    // Build messages array for AI
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatDoc.messages.map(m => ({ role: m.role, content: m.content })),
    ];

    // Check if streaming is requested
    if (stream) {
      // Set SSE headers
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      let fullResponse = '';

      try {
        // Stream the response
        for await (const chunk of streamChat(messages)) {
          if (chunk.content) {
            fullResponse += chunk.content;
            res.write(`data: ${JSON.stringify({ content: chunk.content, done: false })}\n\n`);
          }
          if (chunk.done) {
            res.write(`data: ${JSON.stringify({ content: '', done: true, chat_id: chatDoc._id })}\n\n`);
          }
        }

        // Save assistant response
        chatDoc.messages.push({
          role: 'assistant',
          content: fullResponse,
          timestamp: new Date(),
        });
        await chatDoc.save();

      } catch (streamError) {
        res.write(`data: ${JSON.stringify({ error: streamError.message, done: true })}\n\n`);
      }

      res.end();

    } else {
      // Non-streaming response
      const response = await chat(messages);
      
      // Save assistant response
      chatDoc.messages.push({
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
      });
      await chatDoc.save();

      res.json({
        success: true,
        data: {
          chat_id: chatDoc._id,
          message: response.content,
          usage: response.usage,
        },
      });
    }

  } catch (error) {
    // Check if headers already sent (streaming)
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message, done: true })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
});

/**
 * POST /api/console/chat/stop - Stop generation (placeholder)
 */
router.post('/chat/stop', (req, res) => {
  // In a real implementation, this would cancel the stream
  res.json({
    success: true,
    message: 'Stop requested',
  });
});

/**
 * GET /api/console/status - Get AI status
 */
router.get('/status', (req, res) => {
  const status = getProviderStatus();
  
  res.json({
    success: true,
    data: {
      ready: status.openai.initialized || status.anthropic.initialized,
      providers: status,
    },
  });
});

export default router;
