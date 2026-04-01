/**
 * Authentication Middleware
 */

import config from '../config/index.js';
import { ApiError } from './errorHandler.js';

// Simple token verification (replace with JWT in production)
export function authenticate(req, res, next) {
  // Skip auth if disabled
  if (!config.auth.enabled) {
    return next();
  }

  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    throw ApiError.unauthorized('No authorization header provided');
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : authHeader;

  if (!token) {
    throw ApiError.unauthorized('No token provided');
  }

  // TODO: Implement proper JWT verification
  // For now, just check if token exists
  try {
    // Decode and verify token here
    // const decoded = jwt.verify(token, config.auth.jwtSecret);
    // req.user = decoded;
    req.user = { id: 'default', role: 'user' };
    next();
  } catch (error) {
    throw ApiError.unauthorized('Invalid token');
  }
}

// Optional auth - doesn't fail if no token
export function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;
    
    if (token) {
      // TODO: Verify token and set user
      req.user = { id: 'default', role: 'user' };
    }
  }
  
  next();
}

// Role-based access control
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized();
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Insufficient permissions');
    }

    next();
  };
}
