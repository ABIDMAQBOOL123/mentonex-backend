/**
 * Logger Utility
 * Simple logging for the application (no external dependencies)
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  gray: '\x1b[90m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  magenta: '\x1b[35m',
};

function formatTime() {
  return new Date().toISOString();
}

function formatMessage(level, message, data) {
  const time = formatTime();
  const dataStr = data ? ` ${JSON.stringify(data)}` : '';
  return `[${time}] ${level.toUpperCase().padEnd(5)}: ${message}${dataStr}`;
}

// Main logger object
const logger = {
  error(message, data) {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(`${colors.red}${formatMessage('error', message, data)}${colors.reset}`);
    }
  },

  warn(message, data) {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(`${colors.yellow}${formatMessage('warn', message, data)}${colors.reset}`);
    }
  },

  info(message, data) {
    if (currentLevel >= LOG_LEVELS.info) {
      console.log(`${colors.blue}${formatMessage('info', message, data)}${colors.reset}`);
    }
  },

  debug(message, data) {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.log(`${colors.gray}${formatMessage('debug', message, data)}${colors.reset}`);
    }
  },

  trace(message, data) {
    if (currentLevel >= LOG_LEVELS.trace) {
      console.log(`${colors.gray}${formatMessage('trace', message, data)}${colors.reset}`);
    }
  },

  // Create a child logger with a prefix
  child(options = {}) {
    const prefix = options.module || options.name || '';
    return {
      error: (msg, data) => logger.error(`[${prefix}] ${msg}`, data),
      warn: (msg, data) => logger.warn(`[${prefix}] ${msg}`, data),
      info: (msg, data) => logger.info(`[${prefix}] ${msg}`, data),
      debug: (msg, data) => logger.debug(`[${prefix}] ${msg}`, data),
      trace: (msg, data) => logger.trace(`[${prefix}] ${msg}`, data),
    };
  },

  // HTTP request logger middleware
  requestLogger(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const color = status >= 500 ? colors.red : status >= 400 ? colors.yellow : colors.green;
      console.log(`${color}${req.method.padEnd(6)} ${req.url} ${status} - ${duration}ms${colors.reset}`);
    });

    next();
  },
};

// Create pre-configured child loggers
const serverLogger = logger.child({ module: 'server' });
const authLogger = logger.child({ module: 'auth' });
const errorLogger = logger.child({ module: 'error' });
const dbLogger = logger.child({ module: 'database' });

// Helper methods
const logRequest = logger.requestLogger;

const logError = (error, req = null, additionalInfo = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...additionalInfo,
  };
  if (req) {
    errorInfo.method = req.method;
    errorInfo.url = req.url;
  }
  errorLogger.error('Application error', errorInfo);
};

const logAuth = (action, userId, success) => {
  authLogger.info(`Auth ${action}`, { userId, success });
};

// Export everything
export {
  logger,
  serverLogger,
  authLogger,
  errorLogger,
  dbLogger,
  logRequest,
  logError,
  logAuth,
};

// Default export for backward compatibility
export default {
  logger,
  serverLogger,
  authLogger,
  errorLogger,
  dbLogger,
  logRequest,
  logError,
  logAuth,
  createChildLogger: (module) => logger.child({ module }),
};
