# Mentonex Backend API

Node.js backend for the Mentonex AI assistant.

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── index.js      # App config (env vars)
│   │   └── database.js   # Database setup
│   │
│   ├── controllers/      # Request handlers
│   │   ├── agentsController.js
│   │   ├── authController.js
│   │   ├── channelsController.js
│   │   ├── chatsController.js
│   │   ├── mcpController.js
│   │   ├── providersController.js
│   │   └── skillsController.js
│   │
│   ├── middlewares/      # Express middlewares
│   │   ├── auth.js       # Authentication
│   │   ├── errorHandler.js
│   │   └── validation.js
│   │
│   ├── routes/           # API routes
│   │   ├── agents.js
│   │   ├── authRoutes.js
│   │   ├── channels.js
│   │   ├── chats.js
│   │   ├── console.js
│   │   ├── mcpRoutes.js
│   │   ├── providers.js
│   │   └── skills.js
│   │
│   ├── integrations/     # Third-party integrations (TODO)
│   │   ├── discord.js
│   │   ├── telegram.js
│   │   └── twilio.js
│   │
│   ├── services/         # Business logic (TODO)
│   │
│   ├── utils/            # Utility functions
│   │   └── logger.js
│   │
│   └── server.js         # Main entry point
│
├── .env                  # Environment variables
├── .env.example          # Example env file
├── package.json
└── README.md
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## 🔌 API Endpoints

### Health & Info
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/version` | API version |

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/status` | Get auth status |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/verify` | Verify token |
| POST | `/api/auth/logout` | Logout |

### Channels
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/config/channels` | List all channels |
| GET | `/api/config/channels/:name` | Get channel config |
| PUT | `/api/config/channels/:name` | Update channel |
| POST | `/api/config/channels/:name/test` | Test connection |

### AI Providers/Models
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/models` | List providers |
| GET | `/api/models/active` | Get active model |
| PUT | `/api/models/active` | Set active model |
| PUT | `/api/models/:id/config` | Configure provider |
| POST | `/api/models/:id/test` | Test connection |

### Chats
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | List chats |
| POST | `/api/chats` | Create chat |
| GET | `/api/chats/:id` | Get chat |
| PUT | `/api/chats/:id` | Update chat |
| DELETE | `/api/chats/:id` | Delete chat |
| POST | `/api/console/chat` | Send message (SSE) |

### Agents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List agents |
| POST | `/api/agents` | Create agent |
| GET | `/api/agents/:id` | Get agent |
| PUT | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |

### Skills
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/skills` | List skills |
| POST | `/api/skills` | Create skill |
| PUT | `/api/skills/:id` | Update skill |
| DELETE | `/api/skills/:id` | Delete skill |

### MCP Clients
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/mcp` | List MCP clients |
| POST | `/api/mcp` | Create client |
| PUT | `/api/mcp/:key` | Update client |
| DELETE | `/api/mcp/:key` | Delete client |

## ⚙️ Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `8088` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `DISCORD_BOT_TOKEN` | Discord bot token |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |

## 🧪 Testing

```bash
# Run tests
npm test

# Test API endpoints manually
curl http://localhost:8088/health
curl http://localhost:8088/api/models
curl http://localhost:8088/api/config/channels
```

## 📝 TODO

- [ ] Add MongoDB/PostgreSQL database support
- [ ] Implement Discord integration
- [ ] Implement Telegram integration
- [ ] Implement Twilio integration
- [ ] Add OpenAI/Anthropic API integration
- [ ] Add JWT authentication
- [ ] Add rate limiting
- [ ] Add file upload handling
- [ ] Add WebSocket support for real-time chat

## 📄 License

MIT
