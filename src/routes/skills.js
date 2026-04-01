/**
 * Skills Routes
 * /api/skills
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as skillsController from '../controllers/skillsController.js';

const router = Router();

// GET /api/skills - Get all skills
router.get('/', asyncHandler(skillsController.listSkills));

// POST /api/skills - Create new skill
router.post('/', asyncHandler(skillsController.createSkill));

// GET /api/skills/:id - Get single skill
router.get('/:id', asyncHandler(skillsController.getSkill));

// PUT /api/skills/:id - Update skill
router.put('/:id', asyncHandler(skillsController.updateSkill));

// PATCH /api/skills/:id/toggle - Toggle skill enabled
router.patch('/:id/toggle', asyncHandler(skillsController.toggleSkill));

// DELETE /api/skills/:id - Delete skill
router.delete('/:id', asyncHandler(skillsController.deleteSkill));

export default router;
