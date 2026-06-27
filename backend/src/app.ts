import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { initSocket } from './socket';
import { logger } from './utils/logger';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import characterRouter from './routes/character.routes';
import monsterRouter from './routes/monster.routes';
import environmentRouter from './routes/environment.routes';
import documentRouter from './routes/document.routes';
import combatRouter from './routes/combat.routes';
import sessionRouter from './routes/session.routes';
import auditLogRouter from './routes/auditlog.routes';

// Garantir que as pastas de upload existam
const uploadsDir = process.env.UPLOADS_DIR || './uploads';
const uploadFolders = ['tokens', 'documents', 'environments', 'logs'];
uploadFolders.forEach(folder => {
  const folderPath = folder === 'logs' 
    ? path.join(__dirname, '..', 'logs')
    : path.join(uploadsDir, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }
});

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
  }
});

// Middlewares globais
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Health check
app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rotas da API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/characters', characterRouter);
app.use('/api/v1/monsters', monsterRouter);
app.use('/api/v1/environments', environmentRouter);
app.use('/api/v1/documents', documentRouter);
app.use('/api/v1/combat', combatRouter);
app.use('/api/v1/sessions', sessionRouter);
app.use('/api/v1/audit', auditLogRouter);

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: true,
    message: 'Erro interno do servidor',
    code: 'INTERNAL_ERROR',
  });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: true,
    message: 'Rota não encontrada',
    code: 'NOT_FOUND',
  });
});

// Inicializar Socket.io
initSocket(io);

export { app, httpServer, io };
