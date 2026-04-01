/**
 * Providers/Models Routes
 * /api/models
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as providersController from '../controllers/providersController.js';

const router = Router();

// GET /api/models - Get all available models
router.get('/', asyncHandler(providersController.listModels));

// GET /api/models/providers - Get all providers
router.get('/providers', asyncHandler(providersController.listProviders));

// POST /api/models/providers - Create provider
router.post('/providers', asyncHandler(providersController.createProvider));

// GET /api/models/providers/:id - Get single provider
router.get('/providers/:id', asyncHandler(providersController.getProvider));

// PUT /api/models/providers/:id - Update provider
router.put('/providers/:id', asyncHandler(providersController.updateProvider));

// POST /api/models/providers/:id/test - Test provider connection
router.post('/providers/:id/test', asyncHandler(providersController.testProviderConnection));

// DELETE /api/models/providers/:id - Delete provider
router.delete('/providers/:id', asyncHandler(providersController.deleteProvider));

export default router;
