/**
 * Auth Controller
 * Handles authentication operations with MongoDB
 */

import crypto from 'crypto';
import { User } from '../services/database.js';
import config from '../config/index.js';

// Simple JWT-like token (for production, use proper JWT library)
function generateToken(payload) {
  const data = JSON.stringify({ ...payload, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  const signature = crypto.createHmac('sha256', config.auth.jwtSecret).update(data).digest('hex');
  return Buffer.from(data).toString('base64') + '.' + signature;
}

function verifyToken(token) {
  try {
    const [dataB64, signature] = token.split('.');
    const data = Buffer.from(dataB64, 'base64').toString();
    const expectedSig = crypto.createHmac('sha256', config.auth.jwtSecret).update(data).digest('hex');
    
    if (signature !== expectedSig) return null;
    
    const payload = JSON.parse(data);
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + config.auth.jwtSecret).digest('hex');
}

/**
 * POST /api/auth/register - Register new user
 */
export async function register(req, res) {
  try {
    const { username, password, email } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required',
      });
    }
    
    // Check if user already exists
    const existing = await User.findOne({ username });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
      });
    }
    
    // Create user
    const user = await User.create({
      username,
      password: hashPassword(password),
      email: email || '',
      role: 'user',
    });
    
    // Generate token
    const token = generateToken({ id: user._id, username: user.username, role: user.role });
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/login - Login user
 */
export async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'username and password are required',
      });
    }
    
    // Find user
    const user = await User.findOne({ username });
    
    if (!user || user.password !== hashPassword(password)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }
    
    // Generate token
    const token = generateToken({ id: user._id, username: user.username, role: user.role });
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * GET /api/auth/me - Get current user
 */
export async function getCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    
    const user = await User.findById(payload.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * PUT /api/auth/me - Update current user
 */
export async function updateCurrentUser(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    
    const updates = req.body;
    
    // Don't allow updating sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates._id;
    
    const user = await User.findByIdAndUpdate(
      payload.id,
      { $set: updates },
      { new: true }
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    
    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        settings: user.settings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * POST /api/auth/change-password - Change password
 */
export async function changePassword(req, res) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }
    
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'currentPassword and newPassword are required',
      });
    }
    
    const user = await User.findById(payload.id);
    
    if (!user || user.password !== hashPassword(currentPassword)) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }
    
    user.password = hashPassword(newPassword);
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

export { verifyToken };

export default {
  register,
  login,
  getCurrentUser,
  updateCurrentUser,
  changePassword,
  verifyToken,
};
