/**
 * Agents Routes
 * /api/agents
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as agentsController from '../controllers/agentsController.js';

const router = Router();

// GET /api/agents - Get all agents
router.get('/', asyncHandler(agentsController.listAgents));

// POST /api/agents - Create new agent
router.post('/', asyncHandler(agentsController.createAgent));

// GET /api/agents/:id - Get single agent
router.get('/:id', asyncHandler(agentsController.getAgent));

// PUT /api/agents/:id - Update agent
router.put('/:id', asyncHandler(agentsController.updateAgent));

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', asyncHandler(agentsController.deleteAgent));

export default router;
