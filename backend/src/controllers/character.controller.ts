import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { deleteFile, getRelativePath } from '../middlewares/upload.middleware';
import { calculateCharacterStats, CharacterRole } from '../utils/gameRules';
import { seedNewCharacter } from '../utils/seedCharacter';
import fs from 'fs';

// Helper para verificar se usuário é dono de um personagem
async function isCharacterOwner(userId: string, characterId: string): Promise<boolean> {
  const userCharacter = await prisma.userCharacter.findFirst({
    where: { userId, characterId },
  });
  if (userCharacter) return true;

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { createdById: true },
  });
  return character?.createdById === userId;
}

export class CharacterController {
  // GET / - Lista personagens
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { groupId, search } = req.query;
      const isAdmin = req.user!.role === 'admin';

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      // Admin vê todos, player vê revelados + próprios (associados)
      if (!isAdmin) {
        const userCharacters = await prisma.userCharacter.findMany({
          where: { userId: req.user!.id },
          select: { characterId: true },
        });
        const linkedIds = userCharacters.map((uc: { characterId: string }) => uc.characterId);

        where.OR = [
          { isRevealed: true },
          { isApproved: true },
          ...(linkedIds.length > 0 ? [{ id: { in: linkedIds } }] : []),
          { createdById: req.user!.id }, // Personagens que o próprio usuário criou
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
          _count: { select: { characters: true, memberships: true } },
          children: {
            include: {
              _count: { select: { characters: true, memberships: true } },
            },
          },
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
      const { name, description, color, parentId } = req.body;

      // Se tem parentId, verifica se o grupo pai existe
      if (parentId) {
        const parent = await prisma.characterGroup.findUnique({ where: { id: parentId } });
        if (!parent) {
          res.status(400).json({
            error: true,
            message: 'Grupo pai não encontrado',
            code: 'INVALID_PARENT',
          });
          return;
        }
      }

      const maxOrder = await prisma.characterGroup.aggregate({
        _max: { order: true },
      });

      const group = await prisma.characterGroup.create({
        data: {
          name,
          description,
          color,
          parentId,
          order: (maxOrder._max.order || 0) + 1,
        },
        include: {
          _count: { select: { characters: true, memberships: true } },
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
      const { name, description, color, order, parentId } = req.body;

      const group = await prisma.characterGroup.findUnique({ where: { id } });

      if (!group) {
        res.status(404).json({
          error: true,
          message: 'Grupo não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Se está mudando o parentId, verifica se não está criando ciclo
      if (parentId !== undefined && parentId !== group.parentId) {
        if (parentId === id) {
          res.status(400).json({
            error: true,
            message: 'Um grupo não pode ser pai de si mesmo',
            code: 'INVALID_PARENT',
          });
          return;
        }

        // Verifica se o novo pai não é um descendente
        if (parentId) {
          const isDescendant = await this.isGroupDescendant(parentId, id);
          if (isDescendant) {
            res.status(400).json({
              error: true,
              message: 'Não é possível mover um grupo para dentro de um de seus descendentes',
              code: 'CIRCULAR_REFERENCE',
            });
            return;
          }
        }
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (color !== undefined) updateData.color = color;
      if (order !== undefined) updateData.order = order;
      if (parentId !== undefined) updateData.parentId = parentId;

      const updated = await prisma.characterGroup.update({
        where: { id },
        data: updateData,
        include: {
          _count: { select: { characters: true, memberships: true } },
        },
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

  // Função auxiliar para verificar se um grupo é descendente de outro
  private async isGroupDescendant(groupId: string, potentialAncestorId: string): Promise<boolean> {
    const group = await prisma.characterGroup.findUnique({
      where: { id: groupId },
      select: { parentId: true },
    });

    if (!group) return false;
    if (group.parentId === potentialAncestorId) return true;
    if (!group.parentId) return false;

    return this.isGroupDescendant(group.parentId, potentialAncestorId);
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

  // PUT /groups/reorder - Reordena grupos em batch
  async reorderGroups(req: Request, res: Response): Promise<void> {
    try {
      const { orders } = req.body; // Array de { id, order, parentId }

      if (!Array.isArray(orders)) {
        res.status(400).json({
          error: true,
          message: 'orders deve ser um array',
          code: 'INVALID_INPUT',
        });
        return;
      }

      // Atualiza em transação
      await prisma.$transaction(
        orders.map((item: { id: string; order: number; parentId?: string | null }) =>
          prisma.characterGroup.update({
            where: { id: item.id },
            data: {
              order: item.order,
              parentId: item.parentId !== undefined ? item.parentId : undefined,
            },
          })
        )
      );

      res.json({ message: 'Grupos reordenados com sucesso' });
    } catch (error) {
      logger.error('Erro ao reordenar grupos:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/groups/:groupId - Adiciona personagem a grupo adicional
  async addCharacterToGroup(req: Request, res: Response): Promise<void> {
    try {
      const characterId = req.params.id as string;
      const groupId = req.params.groupId as string;

      // Verifica se personagem existe
      const character = await prisma.character.findUnique({ where: { id: characterId } });
      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica se grupo existe
      const group = await prisma.characterGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        res.status(404).json({
          error: true,
          message: 'Grupo não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Se é o grupo principal, não precisa criar membership
      if (character.groupId === groupId) {
        res.status(400).json({
          error: true,
          message: 'Este já é o grupo principal do personagem',
          code: 'ALREADY_PRIMARY',
        });
        return;
      }

      // Cria membership (ou ignora se já existe)
      const membership = await prisma.characterGroupMembership.upsert({
        where: {
          characterId_groupId: { characterId, groupId },
        },
        update: {},
        create: {
          characterId,
          groupId,
        },
        include: {
          group: true,
        },
      });

      res.status(201).json(membership);
    } catch (error) {
      logger.error('Erro ao adicionar personagem ao grupo:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/groups/:groupId - Remove personagem de grupo adicional
  async removeCharacterFromGroup(req: Request, res: Response): Promise<void> {
    try {
      const characterId = req.params.id as string;
      const groupId = req.params.groupId as string;

      const membership = await prisma.characterGroupMembership.findUnique({
        where: {
          characterId_groupId: { characterId, groupId },
        },
      });

      if (!membership) {
        res.status(404).json({
          error: true,
          message: 'Personagem não está neste grupo',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.characterGroupMembership.delete({
        where: { id: membership.id },
      });

      res.json({ message: 'Personagem removido do grupo' });
    } catch (error) {
      logger.error('Erro ao remover personagem do grupo:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id/groups - Lista todos os grupos de um personagem
  async getCharacterGroups(req: Request, res: Response): Promise<void> {
    try {
      const characterId = req.params.id as string;

      const character = await prisma.character.findUnique({
        where: { id: characterId },
        include: {
          group: true,
          groupMemberships: {
            include: {
              group: true,
            },
          },
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

      // Combina grupo principal com memberships
      type MembershipWithGroup = { group: typeof character.group };
      const membershipGroups = (character.groupMemberships as MembershipWithGroup[]).map((m) => ({ 
        ...m.group, 
        isPrimary: false 
      }));
      const groups = [
        { ...character.group, isPrimary: true },
        ...membershipGroups,
      ];

      res.json(groups);
    } catch (error) {
      logger.error('Erro ao listar grupos do personagem:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/primary-group - Muda o grupo principal do personagem
  async changeCharacterPrimaryGroup(req: Request, res: Response): Promise<void> {
    try {
      const characterId = req.params.id as string;
      const { groupId } = req.body;

      const character = await prisma.character.findUnique({ where: { id: characterId } });
      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const group = await prisma.characterGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        res.status(404).json({
          error: true,
          message: 'Grupo não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const oldGroupId = character.groupId;

      // Atualiza grupo principal
      await prisma.character.update({
        where: { id: characterId },
        data: { groupId },
      });

      // Remove membership se existir (pois agora é principal)
      await prisma.characterGroupMembership.deleteMany({
        where: { characterId, groupId },
      });

      // Opcionalmente adiciona o antigo grupo principal como membership
      // (apenas se não for o mesmo)
      if (oldGroupId !== groupId) {
        await prisma.characterGroupMembership.upsert({
          where: {
            characterId_groupId: { characterId, groupId: oldGroupId },
          },
          update: {},
          create: {
            characterId,
            groupId: oldGroupId,
          },
        });
      }

      res.json({ message: 'Grupo principal alterado com sucesso' });
    } catch (error) {
      logger.error('Erro ao alterar grupo principal:', error);
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
          groupMemberships: {
            include: { group: true },
          },
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
        const userCharacter = await prisma.userCharacter.findFirst({
          where: { userId: req.user!.id, characterId: id },
        });

        const isOwner = !!userCharacter || character.createdById === req.user!.id;
        if (!character.isRevealed && !character.isApproved && !isOwner) {
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

      // Atributos
      const attrForca = data.attrForca || 1;
      const attrAgilidade = data.attrAgilidade || 1;
      const attrIntelecto = data.attrIntelecto || 1;
      const attrPresenca = data.attrPresenca || 1;
      const attrVigor = data.attrVigor || 1;

      // Calcular stats baseado nas regras do Ordem Paranormal
      const trilha = data.trilha as CharacterRole;
      const nex = data.nex || '5%';

      let calculatedStats;
      if (trilha && ['Combatente', 'Especialista', 'Ocultista'].includes(trilha)) {
        calculatedStats = calculateCharacterStats(
          trilha,
          nex,
          {
            forca: attrForca,
            agilidade: attrAgilidade,
            intelecto: attrIntelecto,
            presenca: attrPresenca,
            vigor: attrVigor,
          }
        );
      } else {
        // Fallback para valores manuais ou personagens sem trilha definida
        calculatedStats = {
          pvMax: data.pvMax || 20,
          peMax: data.peMax || 5,
          sanMax: data.sanMax || 20,
          defesa: 10 + attrAgilidade,
          esquiva: attrAgilidade,
          bloqueio: attrVigor,
          fortitude: attrVigor,
          reflexos: attrAgilidade,
          vontade: attrPresenca,
          espacosInventario: attrForca > 0 ? 5 + attrForca : 2,
          deslocamento: 9,
          limitePE: 1,
        };
      }

      // Se valores manuais forem passados, eles sobrescrevem os calculados
      const pvMax = data.pvMax ?? calculatedStats.pvMax;
      const peMax = data.peMax ?? calculatedStats.peMax;
      const sanMax = data.sanMax ?? calculatedStats.sanMax;
      const defesa = data.defesa ?? calculatedStats.defesa;
      const esquiva = data.esquiva ?? calculatedStats.esquiva;
      const bloqueio = data.bloqueio ?? calculatedStats.bloqueio;
      const fortitude = data.fortitude ?? calculatedStats.fortitude;
      const reflexos = data.reflexos ?? calculatedStats.reflexos;
      const vontade = data.vontade ?? calculatedStats.vontade;
      const espacosInventario = data.espacosInventario ?? calculatedStats.espacosInventario;
      const deslocamento = data.deslocamento ?? calculatedStats.deslocamento;
      const limitePE = data.limitePE ?? calculatedStats.limitePE;

      // Recursos vitais começam cheios
      const pvCurrent = data.pvCurrent ?? pvMax;
      const sanCurrent = data.sanCurrent ?? sanMax;
      const peCurrent = data.peCurrent ?? peMax;

      const character = await prisma.character.create({
        data: {
          groupId: data.groupId,
          name: data.name,
          tokenImage: data.tokenImage,
          description: data.description,
          historySummary: data.historySummary,
          historyFull: data.historyFull,
          nex: data.nex,
          trilha: data.trilha,
          origem: data.origem,
          attrForca,
          attrAgilidade,
          attrIntelecto,
          attrPresenca,
          attrVigor,
          pvMax,
          pvCurrent,
          sanMax,
          sanCurrent,
          peMax,
          peCurrent,
          defesa,
          esquiva,
          bloqueio,
          fortitude,
          reflexos,
          vontade,
          deslocamento,
          espacosInventario,
          limitePE,
          reducaoDano: data.reducaoDano ?? 0,
          conditions,
          isApproved: data.isApproved ?? false,
          isRevealed: data.isRevealed ?? false,
          createdById: req.user!.id,
        },
        include: { group: true },
      });

      // Seed perícias oficiais e locais de inventário padrão
      try {
        await seedNewCharacter(character.id);
      } catch (seedError) {
        logger.warn('Erro ao popular dados iniciais do personagem:', seedError);
      }

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
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
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

  // GET /:id/skills - Lista perícias do personagem
  async listSkills(req: Request, res: Response): Promise<void> {
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

      const skills = await prisma.characterSkill.findMany({
        where: { characterId: id },
        orderBy: [{ isOfficial: 'desc' }, { name: 'asc' }],
      });

      res.json(skills);
    } catch (error) {
      logger.error('Erro ao listar perícias:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/skills - Cria perícia customizada
  async createSkill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { 
        name, attribute, training, otherBonus,
        isTrained, hasSpecialization, specializationName, bonusModifier 
      } = req.body;

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
          training: training || 'destreinado',
          otherBonus: otherBonus || 0,
          isTrained: isTrained || false,
          hasSpecialization: hasSpecialization || false,
          specializationName,
          bonusModifier: bonusModifier || 0,
          isOfficial: false, // Perícia customizada
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

  // PUT /:id/skills/:skillId - Atualiza perícia
  async updateSkill(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const skillId = req.params.skillId as string;
      const {
        name, attribute, training, otherBonus,
        isTrained, hasSpecialization, specializationName, bonusModifier
      } = req.body;

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

      const updateData: Record<string, unknown> = {};

      // Se for perícia oficial, só permite certos campos
      if (skill.isOfficial) {
        if (training !== undefined) updateData.training = training;
        if (otherBonus !== undefined) updateData.otherBonus = otherBonus;
        if (isTrained !== undefined) updateData.isTrained = isTrained;
        if (hasSpecialization !== undefined) updateData.hasSpecialization = hasSpecialization;
        if (specializationName !== undefined) updateData.specializationName = specializationName;
        if (bonusModifier !== undefined) updateData.bonusModifier = bonusModifier;
      } else {
        // Perícia customizada - permite editar todos os campos
        if (name !== undefined) updateData.name = name;
        if (attribute !== undefined) updateData.attribute = attribute;
        if (training !== undefined) updateData.training = training;
        if (otherBonus !== undefined) updateData.otherBonus = otherBonus;
        if (isTrained !== undefined) updateData.isTrained = isTrained;
        if (hasSpecialization !== undefined) updateData.hasSpecialization = hasSpecialization;
        if (specializationName !== undefined) updateData.specializationName = specializationName;
        if (bonusModifier !== undefined) updateData.bonusModifier = bonusModifier;
      }

      const updated = await prisma.characterSkill.update({
        where: { id: skillId },
        data: updateData,
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

  // DELETE /:id/skills/:skillId - Deleta perícia (só customizada)
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

      // Não permite deletar perícias oficiais
      if (skill.isOfficial) {
        res.status(403).json({
          error: true,
          message: 'Não é possível excluir perícias oficiais',
          code: 'FORBIDDEN',
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

  // GET /:id/abilities - Lista habilidades do personagem
  async listAbilities(req: Request, res: Response): Promise<void> {
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

      const abilities = await prisma.characterAbility.findMany({
        where: { characterId: id },
        include: {
          compendiumAbility: true,
          compendiumRitual: true,
        },
        orderBy: { addedAt: 'asc' },
      });

      res.json(abilities);
    } catch (error) {
      logger.error('Erro ao listar habilidades:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/abilities
  async createAbility(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { 
        name, description, peCost, type, element, isActive,
        compendiumAbilityId, compendiumRitualId,
        nameOverride, descriptionOverride, peCostOverride,
        actionType, usesPerScene, trilha, nex, notes
      } = req.body;

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
          isActive: isActive ?? true,
          compendiumAbilityId,
          compendiumRitualId,
          nameOverride,
          descriptionOverride,
          peCostOverride,
          actionType,
          usesPerScene,
          trilha,
          nex,
          notes,
        },
        include: {
          compendiumAbility: true,
          compendiumRitual: true,
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

  // POST /:id/abilities/from-compendium - Adiciona habilidade do compêndio
  async addAbilityFromCompendium(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { compendiumAbilityId, compendiumRitualId, notes } = req.body;

      if (!compendiumAbilityId && !compendiumRitualId) {
        res.status(400).json({
          error: true,
          message: 'É necessário fornecer compendiumAbilityId ou compendiumRitualId',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const character = await prisma.character.findUnique({ where: { id } });

      if (!character) {
        res.status(404).json({
          error: true,
          message: 'Personagem não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      let abilityData: Record<string, unknown> = {
        characterId: id,
        isActive: true,
        notes,
      };

      // Se for habilidade do compêndio
      if (compendiumAbilityId) {
        const compAbility = await prisma.abilityCompendium.findUnique({
          where: { id: compendiumAbilityId },
        });

        if (!compAbility) {
          res.status(404).json({
            error: true,
            message: 'Habilidade do compêndio não encontrada',
            code: 'NOT_FOUND',
          });
          return;
        }

        abilityData = {
          ...abilityData,
          compendiumAbilityId,
          name: compAbility.name,
          description: compAbility.description,
          type: 'ability',
          peCost: compAbility.peCost,
          actionType: compAbility.actionType,
          usesPerScene: compAbility.usesPerScene,
          trilha: compAbility.trilha,
          nex: compAbility.nex,
        };
      }

      // Se for ritual do compêndio
      if (compendiumRitualId) {
        const compRitual = await prisma.ritualCompendium.findUnique({
          where: { id: compendiumRitualId },
        });

        if (!compRitual) {
          res.status(404).json({
            error: true,
            message: 'Ritual do compêndio não encontrado',
            code: 'NOT_FOUND',
          });
          return;
        }

        abilityData = {
          ...abilityData,
          compendiumRitualId,
          name: compRitual.name,
          description: compRitual.description,
          type: 'ritual',
          element: compRitual.element,
          peCost: compRitual.peCost,
          nex: compRitual.nex,
        };
      }

      const ability = await prisma.characterAbility.create({
        data: abilityData as never,
        include: {
          compendiumAbility: true,
          compendiumRitual: true,
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_ability',
        entityId: ability.id,
        entityName: `${character.name} - ${ability.name}`,
        action: 'create',
      });

      res.status(201).json(ability);
    } catch (error) {
      logger.error('Erro ao adicionar habilidade do compêndio:', error);
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
      const {
        nameOverride, descriptionOverride, peCostOverride,
        currentUses, notes, isActive,
        // Campos de habilidade customizada
        name, description, peCost, type, element,
        actionType, usesPerScene, trilha, nex
      } = req.body;

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

      const updateData: Record<string, unknown> = {};

      // Campos de override (para habilidades do compêndio)
      if (nameOverride !== undefined) updateData.nameOverride = nameOverride;
      if (descriptionOverride !== undefined) updateData.descriptionOverride = descriptionOverride;
      if (peCostOverride !== undefined) updateData.peCostOverride = peCostOverride;
      if (currentUses !== undefined) updateData.currentUses = currentUses;
      if (notes !== undefined) updateData.notes = notes;
      if (isActive !== undefined) updateData.isActive = isActive;

      // Campos diretos (para habilidades customizadas)
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (peCost !== undefined) updateData.peCost = peCost;
      if (type !== undefined) updateData.type = type;
      if (element !== undefined) updateData.element = element;
      if (actionType !== undefined) updateData.actionType = actionType;
      if (usesPerScene !== undefined) updateData.usesPerScene = usesPerScene;
      if (trilha !== undefined) updateData.trilha = trilha;
      if (nex !== undefined) updateData.nex = nex;

      const updated = await prisma.characterAbility.update({
        where: { id: abilityId },
        data: updateData,
        include: {
          compendiumAbility: true,
          compendiumRitual: true,
        },
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

  // POST /:id/abilities/reset-uses - Reseta usos de todas as habilidades
  async resetAbilityUses(req: Request, res: Response): Promise<void> {
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

      await prisma.characterAbility.updateMany({
        where: { characterId: id },
        data: { currentUses: 0 },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'character_ability',
        entityId: id,
        entityName: `${character.name} - Reset de usos`,
        action: 'update',
      });

      res.json({ message: 'Usos resetados com sucesso' });
    } catch (error) {
      logger.error('Erro ao resetar usos:', error);
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

  // GET /:id/inventory - Lista itens do inventário
  async listInventory(req: Request, res: Response): Promise<void> {
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

      const items = await prisma.inventoryItem.findMany({
        where: { characterId: id },
        orderBy: { name: 'asc' },
      });

      res.json(items);
    } catch (error) {
      logger.error('Erro ao listar inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id/inventory/locations - Lista locais de inventário
  async listInventoryLocations(req: Request, res: Response): Promise<void> {
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

      const locations = await prisma.inventoryLocation.findMany({
        where: { characterId: id },
        orderBy: { order: 'asc' },
      });

      // Conta manualmente os itens por local
      const locationsWithCount = await Promise.all(
        locations.map(async (loc: { name: string; id: string; order: number }) => {
          const itemCount = await prisma.inventoryItem.count({
            where: { 
              characterId: id,
              location: `custom:${loc.name}`,
            },
          });
          return { ...loc, _count: { items: itemCount } };
        })
      );

      res.json(locationsWithCount);
    } catch (error) {
      logger.error('Erro ao listar locais de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/inventory/locations - Cria local de inventário
  async createInventoryLocation(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, icon, color } = req.body;
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

      if (!isAdmin) {
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      // Obter próxima ordem
      const maxOrder = await prisma.inventoryLocation.aggregate({
        where: { characterId: id },
        _max: { order: true },
      });

      const location = await prisma.inventoryLocation.create({
        data: {
          characterId: id,
          name,
          icon: icon || '📦',
          color: color || '#6b7280',
          order: (maxOrder._max.order || 0) + 1,
        },
      });

      res.status(201).json(location);
    } catch (error) {
      logger.error('Erro ao criar local de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id/inventory/locations/:locationId - Atualiza local
  async updateInventoryLocation(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const locationId = req.params.locationId as string;
      const { name, icon, color, order } = req.body;
      const isAdmin = req.user!.role === 'admin';

      const location = await prisma.inventoryLocation.findFirst({
        where: { id: locationId, characterId: id },
      });

      if (!location) {
        res.status(404).json({
          error: true,
          message: 'Local não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (!isAdmin) {
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (icon !== undefined) updateData.icon = icon;
      if (color !== undefined) updateData.color = color;
      if (order !== undefined) updateData.order = order;

      const updated = await prisma.inventoryLocation.update({
        where: { id: locationId },
        data: updateData,
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar local de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/inventory/locations/:locationId - Deleta local
  async deleteInventoryLocation(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const locationId = req.params.locationId as string;
      const isAdmin = req.user!.role === 'admin';

      const location = await prisma.inventoryLocation.findFirst({
        where: { id: locationId, characterId: id },
      });

      if (!location) {
        res.status(404).json({
          error: true,
          message: 'Local não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (!isAdmin) {
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      // Mover itens para "equipado" antes de deletar o local
      const itemsInLocation = await prisma.inventoryItem.count({
        where: {
          characterId: id,
          location: `custom:${location.name}`,
        },
      });

      if (itemsInLocation > 0) {
        await prisma.inventoryItem.updateMany({
          where: {
            characterId: id,
            location: `custom:${location.name}`,
          },
          data: { location: 'equipado' },
        });
      }

      await prisma.inventoryLocation.delete({ where: { id: locationId } });

      res.json({ message: 'Local excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar local de inventário:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/inventory
  async createInventoryItem(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { 
        name, quantity, description, category, spaces, weight,
        isEquipped, location, locationCustomName,
        // Campos de arma (wXxx)
        weaponType, weaponGrip, damage, damageType,
        criticalMargin, criticalMult, weaponRange, weaponProperties,
        wProficiency, wAmmunition, wAmmunitionType,
        // Campos de proteção (pXxx)
        protectionType, defenseBonus, damageReduction,
        pPenalty, pMaxDex,
        // Campos de consumível (cXxx)
        cEffect, cDuration, cCharges,
        // Campos de munição (aXxx)
        aType, aDamageBonus, aProperties
      } = req.body;
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
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
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
          weight: weight || 0,
          spaces: spaces || 1,
          isEquipped: isEquipped || false,
          location: location || 'equipado',
          locationCustomName,
          // Arma
          weaponType,
          weaponGrip,
          damage,
          damageType,
          criticalMargin,
          criticalMult,
          weaponRange,
          weaponProperties,
          // Proteção
          protectionType,
          defenseBonus,
          damageReduction,
          // Consumível
          cEffect,
          // Munição
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
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio inventário',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      // Extrair apenas campos permitidos
      const {
        name, quantity, description, category, spaces, weight,
        isEquipped, location, locationCustomName,
        weaponType, weaponGrip, damage, damageType,
        criticalMargin, criticalMult, weaponRange, weaponProperties,
        protectionType, defenseBonus, damageReduction,
        cEffect
      } = req.body;

      const updateData: Record<string, unknown> = {};

      // Campos básicos
      if (name !== undefined) updateData.name = name;
      if (quantity !== undefined) updateData.quantity = quantity;
      if (description !== undefined) updateData.description = description;
      if (category !== undefined) updateData.category = category;
      if (spaces !== undefined) updateData.spaces = spaces;
      if (weight !== undefined) updateData.weight = weight;
      if (isEquipped !== undefined) updateData.isEquipped = isEquipped;
      if (location !== undefined) updateData.location = location;
      if (locationCustomName !== undefined) updateData.locationCustomName = locationCustomName;

      // Campos de arma
      if (weaponType !== undefined) updateData.weaponType = weaponType;
      if (weaponGrip !== undefined) updateData.weaponGrip = weaponGrip;
      if (damage !== undefined) updateData.damage = damage;
      if (damageType !== undefined) updateData.damageType = damageType;
      if (criticalMargin !== undefined) updateData.criticalMargin = criticalMargin;
      if (criticalMult !== undefined) updateData.criticalMult = criticalMult;
      if (weaponRange !== undefined) updateData.weaponRange = weaponRange;
      if (weaponProperties !== undefined) updateData.weaponProperties = weaponProperties;

      // Campos de proteção
      if (protectionType !== undefined) updateData.protectionType = protectionType;
      if (defenseBonus !== undefined) updateData.defenseBonus = defenseBonus;
      if (damageReduction !== undefined) updateData.damageReduction = damageReduction;

      // Campos de consumível
      if (cEffect !== undefined) updateData.cEffect = cEffect;

      const updated = await prisma.inventoryItem.update({
        where: { id: itemId },
        data: updateData,
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
        const isOwner = await isCharacterOwner(req.user!.id, id);
        if (!isOwner) {
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
