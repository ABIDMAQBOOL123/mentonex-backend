/**
 * Mentonex Backend Server
 * Main entry point for the API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Config
import config from './config/index.js';
import { connectDatabase, seedDefaultData } from './services/database.js';

// Services
import { initializeProviders } from './services/aiService.js';

// Middlewares
import { errorHandler, notFoundHandler } from './middlewares/index.js';

// Routes
import {
  channelsRoutes,
  providersRoutes,
  chatsRoutes,
  consoleRoutes,
  agentsRoutes,
  skillsRoutes,
  mcpRoutes,
  authRoutes,
  twilioRoutes,
  integrationsRoutes,
} from './routes/index.js';

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

// Security headers
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS
app.use(cors({
  origin: config.server.frontendUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Logging
app.use(morgan(config.server.env === 'development' ? 'dev' : 'combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// API ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Mentonex Backend',
    version: '1.0.0',
    environment: config.server.env,
  });
});

// API version
app.get('/api/version', (req, res) => {
  res.json({
    version: '1.0.0',
    name: 'Mentonex API',
    build: new Date().toISOString(),
  });
});

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/config/channels', channelsRoutes);
app.use('/api/models', providersRoutes);
app.use('/api/chats', chatsRoutes);
app.use('/api/console', consoleRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/mcp', mcpRoutes);
app.use('/api/twilio', twilioRoutes);
app.use('/api/integrations', integrationsRoutes);

// ============================================================
// STATIC FILES (Production)
// ============================================================

if (config.server.env === 'production') {
  const frontendPath = join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Serve index.html for client-side routing
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(join(frontendPath, 'index.html'));
  });
}

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// ============================================================
// INITIALIZATION
// ============================================================

async function startServer() {
  const PORT = config.server.port;

  // Connect to database
  await connectDatabase();
  
  // Seed default data
  await seedDefaultData();

  // Initialize AI providers
  initializeProviders();

  // Start server
  app.listen(PORT, () => {
    console.log('');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   🚀 MENTONEX BACKEND SERVER                              ║');
    console.log('║                                                           ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║   Port:        ${PORT}                                        ║`);
    console.log(`║   Environment: ${config.server.env.padEnd(42)}║`);
    console.log(`║   Frontend:    ${config.server.frontendUrl.padEnd(42)}║`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║   API Endpoints:                                          ║');
    console.log('║   • GET  /health              - Health check              ║');
    console.log('║   • GET  /api/version         - API version               ║');
    console.log('║   • *    /api/auth/*          - Authentication            ║');
    console.log('║   • *    /api/config/channels - Channel management        ║');
    console.log('║   • *    /api/models          - AI providers/models       ║');
    console.log('║   • *    /api/chats           - Chat sessions             ║');
    console.log('║   • *    /api/console         - Real-time chat            ║');
    console.log('║   • *    /api/agents          - Agent management          ║');
    console.log('║   • *    /api/skills          - Skills management         ║');
    console.log('║   • *    /api/mcp             - MCP clients               ║');
    console.log('║   • *    /api/integrations    - Discord/Telegram/Twilio   ║');
    console.log('║   • *    /api/twilio          - Twilio webhooks           ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
  });
}

// Start the server
startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;