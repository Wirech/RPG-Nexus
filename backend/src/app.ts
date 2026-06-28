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
import compendiumRouter from './routes/compendium.routes';

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

// Configuração de CORS para aceitar múltiplas origens
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Função para validar origem (aceita também IPs de rede local)
const corsOrigin = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  // Permite requisições sem origin (ex: mobile apps, Postman)
  if (!origin) {
    return callback(null, true);
  }
  
  // Permite origens da lista
  if (allowedOrigins.includes(origin)) {
    return callback(null, true);
  }
  
  // Permite qualquer IP local (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  const localIpRegex = /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
  if (localIpRegex.test(origin)) {
    return callback(null, true);
  }
  
  // Em desenvolvimento, aceita qualquer origem
  if (process.env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  
  callback(new Error('Not allowed by CORS'));
};

const io = new Server(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: true
  }
});

// Middlewares globais
app.use(cors({
  origin: corsOrigin,
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
app.use('/api/v1/compendium', compendiumRouter);

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
