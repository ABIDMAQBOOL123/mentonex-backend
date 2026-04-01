/**
 * MCP Routes
 * /api/mcp
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as mcpController from '../controllers/mcpController.js';

const router = Router();

// GET /api/mcp/clients - Get all MCP clients
router.get('/clients', asyncHandler(mcpController.listClients));

// POST /api/mcp/clients - Create new MCP client
router.post('/clients', asyncHandler(mcpController.createClient));

// GET /api/mcp/clients/:key - Get single MCP client
router.get('/clients/:key', asyncHandler(mcpController.getClient));

// PUT /api/mcp/clients/:key - Update MCP client
router.put('/clients/:key', asyncHandler(mcpController.updateClient));

// PATCH /api/mcp/clients/:key/toggle - Toggle MCP client enabled
router.patch('/clients/:key/toggle', asyncHandler(mcpController.toggleClient));

// DELETE /api/mcp/clients/:key - Delete MCP client
router.delete('/clients/:key', asyncHandler(mcpController.deleteClient));

export default router;
