/**
 * Chats Routes
 * /api/chats
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as chatsController from '../controllers/chatsController.js';

const router = Router();

// GET /api/chats - Get all chats
router.get('/', asyncHandler(chatsController.listChats));

// POST /api/chats - Create new chat
router.post('/', asyncHandler(chatsController.createChat));

// GET /api/chats/:id - Get single chat
router.get('/:id', asyncHandler(chatsController.getChat));

// PUT /api/chats/:id - Update chat
router.put('/:id', asyncHandler(chatsController.updateChat));

// DELETE /api/chats/:id - Delete chat
router.delete('/:id', asyncHandler(chatsController.deleteChat));

// POST /api/chats/:id/messages - Add message to chat
router.post('/:id/messages', asyncHandler(chatsController.addMessage));

// DELETE /api/chats/:id/messages - Clear chat messages
router.delete('/:id/messages', asyncHandler(chatsController.clearMessages));

export default router;
