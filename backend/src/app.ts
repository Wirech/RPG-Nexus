import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';

// Garantir que as pastas de upload existam
const uploadsDir = process.env.UPLOADS_DIR || './uploads';
const uploadFolders = ['tokens', 'documents', 'environments'];
uploadFolders.forEach(folder => {
  const folderPath = path.join(uploadsDir, folder);
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
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// TODO: Importar e registrar rotas aqui
// import { authRouter } from './routes/auth.routes';
// import { userRouter } from './routes/user.routes';
// import { characterRouter } from './routes/character.routes';
// import { monsterRouter } from './routes/monster.routes';
// import { environmentRouter } from './routes/environment.routes';
// import { documentRouter } from './routes/document.routes';
// import { combatRouter } from './routes/combat.routes';
// import { sessionRouter } from './routes/session.routes';
// import { auditRouter } from './routes/auditlog.routes';

// app.use('/api/v1/auth', authRouter);
// app.use('/api/v1/users', userRouter);
// app.use('/api/v1/characters', characterRouter);
// app.use('/api/v1/monsters', monsterRouter);
// app.use('/api/v1/environments', environmentRouter);
// app.use('/api/v1/documents', documentRouter);
// app.use('/api/v1/combat', combatRouter);
// app.use('/api/v1/sessions', sessionRouter);
// app.use('/api/v1/audit', auditRouter);

// TODO: Inicializar Socket.io
// import { initSocket } from './socket';
// initSocket(io);

export { app, httpServer, io };
