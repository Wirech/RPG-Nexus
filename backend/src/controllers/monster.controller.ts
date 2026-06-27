import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { deleteFile, getRelativePath } from '../middlewares/upload.middleware';
import fs from 'fs';

export class MonsterController {
  // GET / - Lista monstros
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { search, threatLevel } = req.query;

      const where: Record<string, unknown> = {};

      if (search) {
        where.name = { contains: search as string };
      }

      if (threatLevel) {
        where.threatLevel = threatLevel as string;
      }

      const monsters = await prisma.monster.findMany({
        where,
        orderBy: { name: 'asc' },
      });

      // Desserializa resistances e immunities
      const result = monsters.map((m) => ({
        ...m,
        resistances: JSON.parse(m.resistances || '[]'),
        immunities: JSON.parse(m.immunities || '[]'),
      }));

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar monstros:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca monstro por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const monster = await prisma.monster.findUnique({
        where: { id },
        include: {
          attacks: true,
          abilities: true,
        },
      });

      if (!monster) {
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      res.json({
        ...monster,
        resistances: JSON.parse(monster.resistances || '[]'),
        immunities: JSON.parse(monster.immunities || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao buscar monstro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria monstro
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;

      const monster = await prisma.monster.create({
        data: {
          ...data,
          resistances: data.resistances ? JSON.stringify(data.resistances) : '[]',
          immunities: data.immunities ? JSON.stringify(data.immunities) : '[]',
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster',
        entityId: monster.id,
        entityName: monster.name,
        action: 'create',
      });

      res.status(201).json({
        ...monster,
        resistances: JSON.parse(monster.resistances || '[]'),
        immunities: JSON.parse(monster.immunities || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao criar monstro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza monstro
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;

      const monster = await prisma.monster.findUnique({ where: { id } });

      if (!monster) {
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (data.resistances) {
        data.resistances = JSON.stringify(data.resistances);
      }
      if (data.immunities) {
        data.immunities = JSON.stringify(data.immunities);
      }

      const updated = await prisma.monster.update({
        where: { id },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster',
        entityId: id,
        entityName: updated.name,
        action: 'update',
        oldValue: JSON.stringify(monster),
        newValue: JSON.stringify(updated),
      });

      res.json({
        ...updated,
        resistances: JSON.parse(updated.resistances || '[]'),
        immunities: JSON.parse(updated.immunities || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar monstro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta monstro
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const monster = await prisma.monster.findUnique({ where: { id } });

      if (!monster) {
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta token se existir
      if (monster.tokenImage) {
        deleteFile(monster.tokenImage);
      }

      await prisma.monster.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster',
        entityId: id,
        entityName: monster.name,
        action: 'delete',
      });

      res.json({ message: 'Monstro excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar monstro:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/token - Upload de token
  async uploadToken(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      if (!req.file) {
        res.status(400).json({
          error: true,
          message: 'Nenhum arquivo enviado',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const monster = await prisma.monster.findUnique({ where: { id } });

      if (!monster) {
        fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta token antigo se existir
      if (monster.tokenImage) {
        deleteFile(monster.tokenImage);
      }

      const tokenImage = getRelativePath('tokens', req.file.filename);

      const updated = await prisma.monster.update({
        where: { id },
        data: { tokenImage },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster',
        entityId: id,
        entityName: monster.name,
        action: 'update',
        fieldChanged: 'tokenImage',
        oldValue: monster.tokenImage || '',
        newValue: tokenImage,
      });

      res.json({
        ...updated,
        resistances: JSON.parse(updated.resistances || '[]'),
        immunities: JSON.parse(updated.immunities || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao fazer upload de token:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // ==================== ATTACKS ====================

  // POST /:id/attacks
  async createAttack(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, damage, description, damageType, reach } = req.body;

      const monster = await prisma.monster.findUnique({ where: { id } });

      if (!monster) {
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const attack = await prisma.monsterAttack.create({
        data: {
          monsterId: id,
          name,
          damage,
          description,
          damageType,
          reach,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_attack',
        entityId: attack.id,
        entityName: `${monster.name} - ${name}`,
        action: 'create',
      });

      res.status(201).json(attack);
    } catch (error) {
      logger.error('Erro ao criar ataque:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/attacks/:attackId
  async updateAttack(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const attackId = req.params.attackId as string;
      const data = req.body;

      const attack = await prisma.monsterAttack.findFirst({
        where: { id: attackId, monsterId: id },
      });

      if (!attack) {
        res.status(404).json({
          error: true,
          message: 'Ataque não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.monsterAttack.update({
        where: { id: attackId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_attack',
        entityId: attackId,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar ataque:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/attacks/:attackId
  async deleteAttack(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const attackId = req.params.attackId as string;

      const attack = await prisma.monsterAttack.findFirst({
        where: { id: attackId, monsterId: id },
      });

      if (!attack) {
        res.status(404).json({
          error: true,
          message: 'Ataque não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.monsterAttack.delete({ where: { id: attackId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_attack',
        entityId: attackId,
        entityName: attack.name,
        action: 'delete',
      });

      res.json({ message: 'Ataque excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar ataque:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // ==================== ABILITIES ====================

  // POST /:id/abilities
  async createAbility(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, description, type } = req.body;

      const monster = await prisma.monster.findUnique({ where: { id } });

      if (!monster) {
        res.status(404).json({
          error: true,
          message: 'Monstro não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const ability = await prisma.monsterAbility.create({
        data: {
          monsterId: id,
          name,
          description,
          type,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_ability',
        entityId: ability.id,
        entityName: `${monster.name} - ${name}`,
        action: 'create',
      });

      res.status(201).json(ability);
    } catch (error) {
      logger.error('Erro ao criar habilidade:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/abilities/:abilityId
  async updateAbility(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const abilityId = req.params.abilityId as string;
      const data = req.body;

      const ability = await prisma.monsterAbility.findFirst({
        where: { id: abilityId, monsterId: id },
      });

      if (!ability) {
        res.status(404).json({
          error: true,
          message: 'Habilidade não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.monsterAbility.update({
        where: { id: abilityId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_ability',
        entityId: abilityId,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar habilidade:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/abilities/:abilityId
  async deleteAbility(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const abilityId = req.params.abilityId as string;

      const ability = await prisma.monsterAbility.findFirst({
        where: { id: abilityId, monsterId: id },
      });

      if (!ability) {
        res.status(404).json({
          error: true,
          message: 'Habilidade não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.monsterAbility.delete({ where: { id: abilityId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'monster_ability',
        entityId: abilityId,
        entityName: ability.name,
        action: 'delete',
      });

      res.json({ message: 'Habilidade excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar habilidade:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const monsterController = new MonsterController();
