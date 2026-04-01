/**
 * Auth Routes
 * /api/auth
 */

import { Router } from 'express';
import { asyncHandler } from '../middlewares/index.js';
import * as authController from '../controllers/authController.js';

const router = Router();

// POST /api/auth/register - Register new user
router.post('/register', asyncHandler(authController.register));

// POST /api/auth/login - Login
router.post('/login', asyncHandler(authController.login));

// GET /api/auth/me - Get current user
router.get('/me', asyncHandler(authController.getCurrentUser));

// PUT /api/auth/me - Update current user
router.put('/me', asyncHandler(authController.updateCurrentUser));

// POST /api/auth/change-password - Change password
router.post('/change-password', asyncHandler(authController.changePassword));

export default router;
