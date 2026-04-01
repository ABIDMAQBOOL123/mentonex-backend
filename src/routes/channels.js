/**
 * Channels Routes
 * /api/config/channels
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as channelsController from '../controllers/channelsController.js';

const router = Router();

// GET /api/config/channels - Get all channels
router.get('/', asyncHandler(channelsController.listChannels));

// POST /api/config/channels - Create channel
router.post('/', asyncHandler(channelsController.createChannel));

// GET /api/config/channels/:name - Get single channel
router.get('/:name', asyncHandler(channelsController.getChannel));

// PUT /api/config/channels/:name - Update channel
router.put('/:name', asyncHandler(channelsController.updateChannel));

// PATCH /api/config/channels/:name/toggle - Toggle channel
router.patch('/:name/toggle', asyncHandler(channelsController.toggleChannel));

// DELETE /api/config/channels/:name - Delete channel
router.delete('/:name', asyncHandler(channelsController.deleteChannel));

export default router;
