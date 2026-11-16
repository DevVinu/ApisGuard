import cors from 'cors';
import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { env } from './config/env.js';
import { checkDatabaseConnection } from './db/mysql.js';
import { initMqtt } from './mqtt/client.js';
import { createApiRouter } from './routes/api.js';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: env.corsOrigin,
    methods: ['GET', 'POST', 'PATCH'],
  },
});

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/api', createApiRouter(io));

io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

initMqtt(io);

server.listen(env.port, async () => {
  const dbOk = await checkDatabaseConnection();
  console.log(`[Backend] ApisGuard API running on http://localhost:${env.port}`);
  console.log(
    `[MySQL] ${dbOk ? 'Connected' : 'Not reachable yet (running with in-memory fallback until DB is up)'}`
  );
});
