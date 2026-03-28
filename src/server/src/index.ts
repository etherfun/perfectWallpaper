import express from 'express';
import { getSystemInfo, getCpuUsage, getMemoryInfo, getGpuInfo, SystemInfo } from './systemInfo.js';

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3842;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:*';

// Enable CORS for Wallpaper Engine (restricted to allowed origin)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

// Middleware to measure request time
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// GET /api/system - Full system info
app.get('/api/system', async (req, res) => {
  try {
    const info = await getSystemInfo();
    res.json({
      success: true,
      data: info,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/cpu - CPU info only
app.get('/api/cpu', async (req, res) => {
  try {
    const usage = await getCpuUsage();
    res.json({
      success: true,
      data: { usage },
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/memory - Memory info only
app.get('/api/memory', async (req, res) => {
  try {
    const info = await getMemoryInfo();
    res.json({
      success: true,
      data: info,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/gpu - GPU info only
app.get('/api/gpu', async (req, res) => {
  try {
    const info = await getGpuInfo();
    res.json({
      success: true,
      data: info,
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

// SSE endpoint for real-time updates (for Wallpaper Engine)
interface SseClient {
  id: number;
  res: express.Response;
}

const sseClients: SseClient[] = [];
let clientIdCounter = 0;

app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  const clientId = clientIdCounter++;
  const client: SseClient = { id: clientId, res };
  sseClients.push(client);

  console.log(`[SSE] Client connected: ${clientId}. Total clients: ${sseClients.length}`);

  // Keep connection alive with periodic comment
  const keepAlive = setInterval(() => {
    res.write(`: keepalive\n\n`);
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    const index = sseClients.findIndex(c => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
    console.log(`[SSE] Client disconnected: ${clientId}. Total clients: ${sseClients.length}`);
  });
});

// Broadcast system info to all SSE clients
async function broadcastSystemInfo(): Promise<void> {
  if (sseClients.length === 0) return;

  try {
    const info = await getSystemInfo();
    const message = `data: ${JSON.stringify({ type: 'systemInfo', data: info, timestamp: Date.now() })}\n\n`;

    for (const client of sseClients) {
      try {
        client.res.write(message);
      } catch (error) {
        console.error(`[SSE] Error sending to client ${client.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[SSE] Error broadcasting:', error);
  }
}

// Start broadcasting every 2 seconds
setInterval(broadcastSystemInfo, 2000);

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║           PerfectWall System Info Server                    ║
╠════════════════════════════════════════════════════════════╣
║  HTTP Server running on http://localhost:${PORT}              ║
╠════════════════════════════════════════════════════════════╣
║  Endpoints:                                                 ║
║    GET /api/system   - Full system information              ║
║    GET /api/cpu      - CPU usage only                       ║
║    GET /api/memory   - Memory usage only                    ║
║    GET /api/gpu      - GPU info only                        ║
║    GET /api/health   - Health check                         ║
║    GET /api/stream   - SSE real-time updates                ║
╠════════════════════════════════════════════════════════════╣
║  For Wallpaper Engine, use:                                 ║
║    http://localhost:${PORT}/api/system                       ║
╚════════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  process.exit(0);
});
