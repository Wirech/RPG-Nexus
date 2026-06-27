import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { deleteFile, getRelativePath } from '../middlewares/upload.middleware';
import fs from 'fs';

export class CharacterController {
  // GET / - Lista personagens
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, search } = req.query;
      const isAdmin = req.user!.role === 'admin';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      // Admin vê todos, player vê revelados + próprio
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        where.OR = [
          { isRevealed: true },
          ...(user?.linkedCharacterId ? [{ id: user.linkedCharacterId }] : []),
        ];
      }

      if (groupId) {
        where.groupId = groupId as string;
      }

      if (search) {
        where.name = { contains: search as string };
      }

      const characters = await prisma.character.findMany({
        where,
        include: {
          group: { select: { id: true, name: true, color: true } },
        },
        orderBy: { name: 'asc' },
      });

      // Parse conditions de JSON para array
      const result = characters.map((c: typeof characters[number]) => ({
        ...c,
        conditions: JSON.parse(c.conditions || '[]'),
      }));

      res.json(result);
    } catch (error) {
      logger.error('Erro ao listar personagens:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /groups - Lista grupos de personagens
  async listGroups(req: Request, res: Response): Promise<void> {
    try {
      const groups = await prisma.characterGroup.findMany({
        include: {
          _count: { select: { characters: true } },
        },
        orderBy: { order: 'asc' },
      });

      res.json(groups);
    } catch (error) {
      logger.error('Erro ao listar grupos:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /groups - Cria grupo
  async createGroup(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, color } = req.body;

      const maxOrder = await prisma.characterGroup.aggregate({
        _max: { order: true },
      });

      const group = await prisma.characterGroup.create({
        data: {
          name,
          description,
          color,
          order: (maxOrder._max.order || 0) + 1,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_group',
        entityId: group.id,
        entityName: name,
        action: 'create',
      });

      res.status(201).json(group);
    } catch (error) {
      logger.error('Erro ao criar grupo:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /groups/:id - Atualiza grupo
  async updateGroup(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, description, color, order } = req.body;

      const group = await prisma.characterGroup.findUnique({ where: { id } });

      if (!group) {
        res.status(404).json({
          error: true,
          message: 'Grupo não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.characterGroup.update({
        where: { id },
        data: { name, description, color, order },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_group',
        entityId: id,
        entityName: updated.name,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar grupo:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /groups/:id - Deleta grupo
  async deleteGroup(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const group = await prisma.characterGroup.findUnique({
        where: { id },
        include: { _count: { select: { characters: true } } },
      });

      if (!group) {
        res.status(404).json({
          error: true,
          message: 'Grupo não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (group._count.characters > 0) {
        res.status(409).json({
          error: true,
          message: 'Não é possível excluir um grupo com personagens vinculados',
          code: 'CONFLICT',
        });
        return;
      }

      await prisma.characterGroup.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_group',
        entityId: id,
        entityName: group.name,
        action: 'delete',
      });

      res.json({ message: 'Grupo excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar grupo:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca personagem por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const isAdmin = req.user!.role === 'admin';

      const character = await prisma.character.findUnique({
        where: { id },
        include: {
          group: true,
          skills: true,
          abilities: true,
          inventory: true,
        },
      });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica permissão
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        const isOwner = user?.linkedCharacterId === id;
        if (!character.isRevealed && !isOwner) {
          res.status(403).json({
            error: true,
            message: 'Acesso negado a este personagem',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      res.json({
        ...character,
        conditions: JSON.parse(character.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao buscar personagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria personagem
  async create(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body;
      const conditions = data.conditions ? JSON.stringify(data.conditions) : '[]';

      const character = await prisma.character.create({
        data: {
          ...data,
          conditions,
        },
        include: { group: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: character.id,
        entityName: character.name,
        action: 'create',
      });

      res.status(201).json({
        ...character,
        conditions: JSON.parse(character.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao criar personagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza personagem
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const data = req.body;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (data.conditions) {
        data.conditions = JSON.stringify(data.conditions);
      }

      const updated = await prisma.character.update({
        where: { id },
        data,
        include: { group: true },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: id,
        entityName: updated.name,
        action: 'update',
        oldValue: JSON.stringify(character),
        newValue: JSON.stringify(updated),
      });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar personagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta personagem
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta token se existir
      if (character.tokenImage) {
        deleteFile(character.tokenImage);
      }

      await prisma.character.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: id,
        entityName: character.name,
        action: 'delete',
      });

      res.json({ message: 'Personagem excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar personagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/vitals - Atualiza vitais
  async updateVitals(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { pvCurrent, pvMax, sanCurrent, sanMax, peCurrent, peMax } = req.body;
      const isAdmin = req.user!.role === 'admin';

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica permissão para player
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        if (user?.linkedCharacterId !== id) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio personagem',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      const updateData: Record<string, number> = {};
      const changes: { field: string; oldValue: number; newValue: number }[] = [];

      if (pvCurrent !== undefined) {
        const newVal = Math.max(0, Math.min(pvCurrent, character.pvMax));
        if (newVal !== character.pvCurrent) {
          updateData.pvCurrent = newVal;
          changes.push({ field: 'pvCurrent', oldValue: character.pvCurrent, newValue: newVal });
        }
      }

      if (pvMax !== undefined && pvMax !== character.pvMax) {
        updateData.pvMax = pvMax;
        changes.push({ field: 'pvMax', oldValue: character.pvMax, newValue: pvMax });
      }

      if (sanCurrent !== undefined) {
        const newVal = Math.max(0, Math.min(sanCurrent, character.sanMax));
        if (newVal !== character.sanCurrent) {
          updateData.sanCurrent = newVal;
          changes.push({ field: 'sanCurrent', oldValue: character.sanCurrent, newValue: newVal });
        }
      }

      if (sanMax !== undefined && sanMax !== character.sanMax) {
        updateData.sanMax = sanMax;
        changes.push({ field: 'sanMax', oldValue: character.sanMax, newValue: sanMax });
      }

      if (peCurrent !== undefined) {
        const newVal = Math.max(0, Math.min(peCurrent, character.peMax));
        if (newVal !== character.peCurrent) {
          updateData.peCurrent = newVal;
          changes.push({ field: 'peCurrent', oldValue: character.peCurrent, newValue: newVal });
        }
      }

      if (peMax !== undefined && peMax !== character.peMax) {
        updateData.peMax = peMax;
        changes.push({ field: 'peMax', oldValue: character.peMax, newValue: peMax });
      }

      if (Object.keys(updateData).length === 0) {
        res.json({ ...character, conditions: JSON.parse(character.conditions || '[]') });
        return;
      }

      const updated = await prisma.character.update({
        where: { id },
        data: updateData,
      });

      // Cria audit logs para cada mudança
      for (const change of changes) {
        await createAuditLog({
          userId: req.user!.id,
          entityType: 'character',
          entityId: id,
          entityName: character.name,
          action: 'update',
          fieldChanged: change.field,
          oldValue: String(change.oldValue),
          newValue: String(change.newValue),
        });
      }

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar vitais:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/conditions - Atualiza condições
  async updateConditions(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { conditions } = req.body;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const oldConditions = character.conditions;
      const newConditions = JSON.stringify(conditions);

      const updated = await prisma.character.update({
        where: { id },
        data: { conditions: newConditions },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: id,
        entityName: character.name,
        action: 'update',
        fieldChanged: 'conditions',
        oldValue: oldConditions || '[]',
        newValue: newConditions,
      });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar condições:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/reveal - Revela/oculta personagem
  async reveal(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { isRevealed } = req.body;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.character.update({
        where: { id },
        data: { isRevealed },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: id,
        entityName: character.name,
        action: 'update',
        fieldChanged: 'isRevealed',
        oldValue: String(character.isRevealed),
        newValue: String(isRevealed),
      });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao revelar personagem:', error);
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

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        // Deleta arquivo que acabou de subir
        fs.unlinkSync(req.file.path);
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Deleta token antigo se existir
      if (character.tokenImage) {
        deleteFile(character.tokenImage);
      }

      const tokenImage = getRelativePath('tokens', req.file.filename);

      const updated = await prisma.character.update({
        where: { id },
        data: { tokenImage },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character',
        entityId: id,
        entityName: character.name,
        action: 'update',
        fieldChanged: 'tokenImage',
        oldValue: character.tokenImage || '',
        newValue: tokenImage,
      });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
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

  // ==================== SKILLS ====================

  // POST /:id/skills
  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, attribute, bonus, trained } = req.body;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const skill = await prisma.characterSkill.create({
        data: {
          characterId: id,
          name,
          attribute,
          bonus: bonus || 0,
          trained: trained || false,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_skill',
        entityId: skill.id,
        entityName: `${character.name} - ${name}`,
        action: 'create',
      });

      res.status(201).json(skill);
    } catch (error) {
      logger.error('Erro ao criar perícia:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/skills/:skillId
  async updateSkill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const skillId = req.params.skillId as string;
      const data = req.body;

      const skill = await prisma.characterSkill.findFirst({
        where: { id: skillId, characterId: id },
      });

      if (!skill) {
        res.status(404).json({
          error: true,
          message: 'Perícia não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.characterSkill.update({
        where: { id: skillId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_skill',
        entityId: skillId,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar perícia:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/skills/:skillId
  async deleteSkill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const skillId = req.params.skillId as string;

      const skill = await prisma.characterSkill.findFirst({
        where: { id: skillId, characterId: id },
      });

      if (!skill) {
        res.status(404).json({
          error: true,
          message: 'Perícia não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.characterSkill.delete({ where: { id: skillId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_skill',
        entityId: skillId,
        entityName: skill.name,
        action: 'delete',
      });

      res.json({ message: 'Perícia excluída com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar perícia:', error);
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
      const { name, description, peCost, type, element } = req.body;

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const ability = await prisma.characterAbility.create({
        data: {
          characterId: id,
          name,
          description,
          peCost: peCost || 0,
          type,
          element,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_ability',
        entityId: ability.id,
        entityName: `${character.name} - ${name}`,
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

      const ability = await prisma.characterAbility.findFirst({
        where: { id: abilityId, characterId: id },
      });

      if (!ability) {
        res.status(404).json({
          error: true,
          message: 'Habilidade não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.characterAbility.update({
        where: { id: abilityId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_ability',
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

      const ability = await prisma.characterAbility.findFirst({
        where: { id: abilityId, characterId: id },
      });

      if (!ability) {
        res.status(404).json({
          error: true,
          message: 'Habilidade não encontrada',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.characterAbility.delete({ where: { id: abilityId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_ability',
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

  // ==================== INVENTORY ====================

  // POST /:id/inventory
  async createInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, quantity, description, category, weight } = req.body;
      const isAdmin = req.user!.role === 'admin';

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Player só pode adicionar ao próprio inventário
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        if (user?.linkedCharacterId !== id) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      const item = await prisma.inventoryItem.create({
        data: {
          characterId: id,
          name,
          quantity: quantity || 1,
          description,
          category,
          weight,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'inventory_item',
        entityId: item.id,
        entityName: `${character.name} - ${name}`,
        action: 'create',
      });

      res.status(201).json(item);
    } catch (error) {
      logger.error('Erro ao criar item de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/inventory/:itemId
  async updateInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const data = req.body;
      const isAdmin = req.user!.role === 'admin';

      const item = await prisma.inventoryItem.findFirst({
        where: { id: itemId, characterId: id },
      });

      if (!item) {
        res.status(404).json({
          error: true,
          message: 'Item não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Player só pode editar próprio inventário
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        if (user?.linkedCharacterId !== id) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      const updated = await prisma.inventoryItem.update({
        where: { id: itemId },
        data,
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'inventory_item',
        entityId: itemId,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar item de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/inventory/:itemId
  async deleteInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const itemId = req.params.itemId as string;
      const isAdmin = req.user!.role === 'admin';

      const item = await prisma.inventoryItem.findFirst({
        where: { id: itemId, characterId: id },
      });

      if (!item) {
        res.status(404).json({
          error: true,
          message: 'Item não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Player só pode deletar do próprio inventário
      if (!isAdmin) {
        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        if (user?.linkedCharacterId !== id) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      await prisma.inventoryItem.delete({ where: { id: itemId } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'inventory_item',
        entityId: itemId,
        entityName: item.name,
        action: 'delete',
      });

      res.json({ message: 'Item excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar item de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const characterController = new CharacterController();
