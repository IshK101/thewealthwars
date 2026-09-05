import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './sockets/handlers';
import { listAvailableLobbies } from './services/lobbyService';

const app = express();
const port = Number(process.env.PORT) || 3002;
const host = '0.0.0.0';

// Configure CORS for Express
app.use(cors({
  origin: '*', // Allow any origin in prototype
  methods: ['GET', 'POST']
}));

app.use(express.json());

// HTTP Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// HTTP Endpoint to list open lobbies
app.get('/lobbies', (req, res) => {
  res.json(listAvailableLobbies());
});

// In production, serve the compiled frontend from this same web service.
// Keeping the browser and Socket.IO server on one origin simplifies hosting,
// HTTPS, and custom-domain configuration.
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  // Disable Express's automatic index.html response so the public homepage
  // can live at / while the multiplayer app has the stable /play address.
  app.use(express.static(frontendDist, { index: false }));

  app.get('/', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'landing.html'));
  });

  app.get(['/play', '/play/*'], (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });

  app.get(['/game', '/index.html'], (_req, res) => {
    res.redirect(301, '/play');
  });

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/socket.io')) {
      next();
      return;
    }

    res.status(404).sendFile(path.join(frontendDist, 'landing.html'));
  });
}

const server = http.createServer(app);

// Configure Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Setup Real-time Sockets
setupSocketHandlers(io);

// Start server
server.listen(port, host, () => {
  console.log(`Wealth Wars Server running on ${host}:${port}`);
});

export { app, server };
