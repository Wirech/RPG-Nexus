import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../prisma/client';
import { signToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { io } from '../app';
import { emitToAdmins, SOCKET_EVENTS } from '../socket';

export class AuthController {
  // POST /register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Verifica se username é 'admin'
      if (username.toLowerCase() === 'admin') {
        res.status(409).json({
          error: true,
          message: 'Este username não está disponível',
          code: 'CONFLICT',
        });
        return;
      }

      // Verifica se username já existe
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        res.status(409).json({
          error: true,
          message: 'Username já está em uso',
          code: 'CONFLICT',
        });
        return;
      }

      // Hash da senha
      const passwordHash = await bcrypt.hash(password, 12);

      // Cria usuário e AccessRequest
      const user = await prisma.user.create({
        data: {
          username,
          passwordHash,
          role: 'pending',
          status: 'pending',
          accessRequest: {
            create: {
              status: 'pending',
            },
          },
        },
        include: {
          accessRequest: true,
        },
      });

      // Emite evento para admins
      emitToAdmins(io, SOCKET_EVENTS.ACCESS_NEW_REQUEST, {
        userId: user.id,
        username: user.username,
        requestedAt: user.accessRequest?.requestedAt,
      });

      // Gera token para o usuário pendente poder se conectar ao socket
      const token = signToken({ id: user.id, username: user.username, role: user.role });

      logger.info(`Novo registro: ${username}`);

      res.status(201).json({
        message: 'Solicitação enviada. Aguarde aprovação do Mestre.',
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
        },
      });
    } catch (error) {
      logger.error('Erro no registro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Busca usuário
      const user = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          passwordHash: true,
          role: true,
          status: true,
          linkedCharacters: {
            include: { character: { select: { id: true, name: true } } }
          },
        },
      });

      if (!user) {
        res.status(401).json({
          error: true,
          message: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      // Verifica senha
      const validPassword = await bcrypt.compare(password, user.passwordHash);
      if (!validPassword) {
        res.status(401).json({
          error: true,
          message: 'Credenciais inválidas',
          code: 'INVALID_CREDENTIALS',
        });
        return;
      }

      // Verifica status
      if (user.status === 'pending') {
        res.status(403).json({
          error: true,
          message: 'Conta aguardando aprovação',
          code: 'ACCOUNT_PENDING',
        });
        return;
      }

      if (user.status === 'blocked') {
        res.status(403).json({
          error: true,
          message: 'Conta bloqueada',
          code: 'ACCOUNT_BLOCKED',
        });
        return;
      }

      // Gera token
      const token = signToken({
        id: user.id,
        username: user.username,
        role: user.role,
      });

      logger.info(`Login: ${username}`);

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          status: user.status,
          linkedCharacterIds: user.linkedCharacters.map(lc => lc.characterId),
        },
      });
    } catch (error) {
      logger.error('Erro no login:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /me
  async me(req: Request, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          linkedCharacters: {
            include: { character: { select: { id: true, name: true } } }
          },
          createdAt: true,
          approvedAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          error: true,
          message: 'Usuário não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      res.json({
        ...user,
        linkedCharacterIds: user.linkedCharacters.map(lc => lc.characterId),
      });
    } catch (error) {
      logger.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const authController = new AuthController();
