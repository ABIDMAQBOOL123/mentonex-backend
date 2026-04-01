/**
 * Validation Middleware
 * Simple validation without external dependencies
 */

import { ApiError } from './errorHandler.js';

// Validate request body has required fields
export function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = [];
    
    for (const field of requiredFields) {
      if (req.body[field] === undefined || req.body[field] === null) {
        missing.push(field);
      }
    }

    if (missing.length > 0) {
      throw ApiError.badRequest(
        `Missing required fields: ${missing.join(', ')}`
      );
    }

    next();
  };
}

// Validate request params
export function validateParams(requiredParams) {
  return (req, res, next) => {
    const missing = [];
    
    for (const param of requiredParams) {
      if (!req.params[param]) {
        missing.push(param);
      }
    }

    if (missing.length > 0) {
      throw ApiError.badRequest(
        `Missing required parameters: ${missing.join(', ')}`
      );
    }

    next();
  };
}

// Validate channel config
export function validateChannelConfig(req, res, next) {
  const { enabled } = req.body;
  
  if (enabled !== undefined && typeof enabled !== 'boolean') {
    throw ApiError.badRequest('enabled must be a boolean');
  }

  next();
}

// Validate provider config
export function validateProviderConfig(req, res, next) {
  const { api_key } = req.body;
  
  if (req.body.enabled === true && !api_key) {
    throw ApiError.badRequest('API key is required to enable provider');
  }

  next();
}

// Validate chat message
export function validateChatMessage(req, res, next) {
  const { messages } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    throw ApiError.badRequest('messages must be an array');
  }

  if (messages.length === 0) {
    throw ApiError.badRequest('messages cannot be empty');
  }

  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      throw ApiError.badRequest('Each message must have role and content');
    }
  }

  next();
}
