import dotenv from 'dotenv';
dotenv.config();

import { httpServer } from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
  logger.info(`📡 WebSocket pronto para conexões`);
});
