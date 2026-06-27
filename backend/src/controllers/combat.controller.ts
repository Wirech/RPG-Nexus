import { Request, Response } from 'express';
import prisma from '../prisma/client';
import { logger } from '../utils/logger';
import { createAuditLog } from '../utils/auditLogger';
import { io } from '../app';
import { emitToCombat, SOCKET_EVENTS } from '../socket';

interface ParticipantInput {
  entityType: 'character' | 'monster';
  entityId: string;
  initiative: number;
}

export class CombatController {
  // GET / - Lista combates
  async list(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.query;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = {};

      if (status) {
        where.status = status as string;
      }

      const combats = await prisma.combatSession.findMany({
        where,
        include: {
          _count: { select: { participants: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(combats);
    } catch (error) {
      logger.error('Erro ao listar combates:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id - Busca combate por ID
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const combat = await prisma.combatSession.findUnique({
        where: { id },
        include: {
          participants: {
            orderBy: { order: 'asc' },
            include: {
              character: { select: { id: true, name: true, tokenImage: true } },
              monster: { select: { id: true, name: true, tokenImage: true } },
            },
          },
          events: {
            orderBy: { timestamp: 'desc' },
            take: 50,
          },
        },
      });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Parse conditions
      const result = {
        ...combat,
        participants: combat.participants.map((p: typeof combat.participants[number]) => ({
          ...p,
          conditions: JSON.parse(p.conditions || '[]'),
        })),
      };

      res.json(result);
    } catch (error) {
      logger.error('Erro ao buscar combate:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST / - Cria combate
  async create(req: Request, res: Response): Promise<void> {
    try {
      const { name, participants } = req.body as {
        name: string;
        participants: ParticipantInput[];
      };

      // Conta ocorrências de cada monstro para nomear
      const monsterCounts = new Map<string, number>();

      // Processa cada participante
      const participantsData = await Promise.all(
        participants.map(async (p, index) => {
          if (p.entityType === 'character') {
            const character = await prisma.character.findUnique({
              where: { id: p.entityId },
              select: { id: true, name: true, pvMax: true, sanMax: true, peMax: true },
            });

            if (!character) {
              throw new Error(`Personagem ${p.entityId} não encontrado`);
            }

            return {
              entityType: 'character',
              characterId: character.id,
              customName: character.name,
              initiative: p.initiative,
              pvMax: character.pvMax,
              pvCurrent: character.pvMax,
              sanMax: character.sanMax,
              sanCurrent: character.sanMax,
              peMax: character.peMax,
              peCurrent: character.peMax,
              order: 0, // será definido depois
            };
          } else {
            const monster = await prisma.monster.findUnique({
              where: { id: p.entityId },
              select: { id: true, name: true, pvMax: true, sanMax: true },
            });

            if (!monster) {
              throw new Error(`Monstro ${p.entityId} não encontrado`);
            }

            // Conta e nomeia múltiplos do mesmo monstro
            const count = (monsterCounts.get(p.entityId) || 0) + 1;
            monsterCounts.set(p.entityId, count);

            const customName = count > 1 || participants.filter(pp => pp.entityId === p.entityId).length > 1
              ? `${monster.name} ${count}`
              : monster.name;

            return {
              entityType: 'monster',
              monsterId: monster.id,
              customName,
              initiative: p.initiative,
              pvMax: monster.pvMax,
              pvCurrent: monster.pvMax,
              sanMax: monster.sanMax || 0,
              sanCurrent: monster.sanMax || 0,
              peMax: 0,
              peCurrent: 0,
              order: 0,
            };
          }
        })
      );

      // Ordena por iniciativa decrescente e define ordem
      participantsData.sort((a, b) => b.initiative - a.initiative);
      participantsData.forEach((p, index) => {
        p.order = index;
      });

      // Cria combate com participantes
      const combat = await prisma.combatSession.create({
        data: {
          name,
          participants: {
            create: participantsData,
          },
        },
        include: {
          participants: {
            orderBy: { order: 'asc' },
          },
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'combat',
        entityId: combat.id,
        entityName: name,
        action: 'create',
      });

      res.status(201).json(combat);
    } catch (error) {
      logger.error('Erro ao criar combate:', error);
      res.status(500).json({
        error: true,
        message: error instanceof Error ? error.message : 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PUT /:id - Atualiza combate
  async update(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { name, status } = req.body;

      const combat = await prisma.combatSession.findUnique({ where: { id } });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.combatSession.update({
        where: { id },
        data: { name, status },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'combat',
        entityId: id,
        entityName: updated.name,
        action: 'update',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao atualizar combate:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id - Deleta combate
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const combat = await prisma.combatSession.findUnique({ where: { id } });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.combatSession.delete({ where: { id } });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'combat',
        entityId: id,
        entityName: combat.name,
        action: 'delete',
      });

      res.json({ message: 'Combate excluído com sucesso' });
    } catch (error) {
      logger.error('Erro ao deletar combate:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/participants/:participantId/vitals - Atualiza vitais de participante
  async updateParticipantVitals(req: Request, res: Response): Promise<void> {
    try {
      const combatId = req.params.id as string;
      const participantId = req.params.participantId as string;
      const { field, value } = req.body as { field: 'pv' | 'san' | 'pe'; value: number };
      const isAdmin = req.user!.role === 'admin';

      const combat = await prisma.combatSession.findUnique({
        where: { id: combatId },
        select: { id: true, roundCurrent: true },
      });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const participant = await prisma.combatParticipant.findUnique({
        where: { id: participantId },
        include: {
          character: { select: { id: true, name: true } },
          monster: { select: { id: true, name: true } },
        },
      });

      if (!participant || participant.combatSessionId !== combatId) {
        res.status(404).json({
          error: true,
          message: 'Participante não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      // Verifica permissão para player
      if (!isAdmin) {
        if (participant.entityType !== 'character') {
          res.status(403).json({
            error: true,
            message: 'Apenas admin pode editar monstros',
            code: 'FORBIDDEN',
          });
          return;
        }

        const user = await prisma.user.findUnique({
          where: { id: req.user!.id },
          select: { linkedCharacterId: true },
        });

        if (user?.linkedCharacterId !== participant.characterId) {
          res.status(403).json({
            error: true,
            message: 'Você só pode editar seu próprio personagem',
            code: 'FORBIDDEN',
          });
          return;
        }
      }

      // Aplica delta
      const currentField = `${field}Current` as 'pvCurrent' | 'sanCurrent' | 'peCurrent';
      const maxField = `${field}Max` as 'pvMax' | 'sanMax' | 'peMax';
      
      const oldVal = participant[currentField];
      const maxVal = participant[maxField];
      const newVal = Math.max(0, Math.min(maxVal, oldVal + value));

      const updated = await prisma.combatParticipant.update({
        where: { id: participantId },
        data: { [currentField]: newVal },
      });

      // Determina ação do evento
      let action: string;
      if (field === 'pv') {
        action = value < 0 ? 'damage' : 'heal';
      } else if (field === 'san') {
        action = value < 0 ? 'san_damage' : 'san_heal';
      } else {
        action = value < 0 ? 'pe_spend' : 'pe_recover';
      }

      // Cria evento de combate
      const event = await prisma.combatEvent.create({
        data: {
          combatSessionId: combatId,
          round: combat.roundCurrent,
          targetId: participantId,
          targetName: participant.customName || participant.character?.name || participant.monster?.name,
          action,
          field,
          value: Math.abs(value),
          description: `${action === 'damage' ? 'Dano' : action === 'heal' ? 'Cura' : action} de ${Math.abs(value)} em ${field.toUpperCase()}`,
        },
      });

      // Emite eventos via socket
      emitToCombat(io, combatId, SOCKET_EVENTS.COMBAT_UPDATED, {
        participantId,
        field,
        oldVal,
        newVal,
      });

      emitToCombat(io, combatId, SOCKET_EVENTS.COMBAT_EVENT, { event });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar vitais do participante:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // PATCH /:id/participants/:participantId/conditions - Atualiza condições
  async updateParticipantConditions(req: Request, res: Response): Promise<void> {
    try {
      const combatId = req.params.id as string;
      const participantId = req.params.participantId as string;
      const { conditions } = req.body as { conditions: string[] };

      const combat = await prisma.combatSession.findUnique({
        where: { id: combatId },
        select: { id: true, roundCurrent: true },
      });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const participant = await prisma.combatParticipant.findUnique({
        where: { id: participantId },
        include: {
          character: { select: { name: true } },
          monster: { select: { name: true } },
        },
      });

      if (!participant || participant.combatSessionId !== combatId) {
        res.status(404).json({
          error: true,
          message: 'Participante não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const oldConditions: string[] = JSON.parse(participant.conditions || '[]');
      const newConditions = conditions;

      // Encontra condições adicionadas e removidas
      const added = newConditions.filter(c => !oldConditions.includes(c));
      const removed = oldConditions.filter(c => !newConditions.includes(c));

      const updated = await prisma.combatParticipant.update({
        where: { id: participantId },
        data: { conditions: JSON.stringify(newConditions) },
      });

      const targetName = participant.customName || participant.character?.name || participant.monster?.name;

      // Cria eventos para condições adicionadas
      for (const condition of added) {
        await prisma.combatEvent.create({
          data: {
            combatSessionId: combatId,
            round: combat.roundCurrent,
            targetId: participantId,
            targetName,
            action: 'condition_add',
            description: `Condição "${condition}" adicionada`,
          },
        });
      }

      // Cria eventos para condições removidas
      for (const condition of removed) {
        await prisma.combatEvent.create({
          data: {
            combatSessionId: combatId,
            round: combat.roundCurrent,
            targetId: participantId,
            targetName,
            action: 'condition_remove',
            description: `Condição "${condition}" removida`,
          },
        });
      }

      // Emite evento via socket
      emitToCombat(io, combatId, SOCKET_EVENTS.COMBAT_UPDATED, {
        participantId,
        conditions: newConditions,
      });

      res.json({
        ...updated,
        conditions: JSON.parse(updated.conditions || '[]'),
      });
    } catch (error) {
      logger.error('Erro ao atualizar condições do participante:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/next-round - Avança rodada
  async nextRound(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const combat = await prisma.combatSession.findUnique({ where: { id } });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      if (combat.status !== 'active') {
        res.status(400).json({
          error: true,
          message: 'Combate não está ativo',
          code: 'VALIDATION_ERROR',
        });
        return;
      }

      const newRound = combat.roundCurrent + 1;

      const updated = await prisma.combatSession.update({
        where: { id },
        data: { roundCurrent: newRound },
      });

      // Cria evento de nova rodada
      await prisma.combatEvent.create({
        data: {
          combatSessionId: id,
          round: newRound,
          action: 'custom',
          description: `Nova rodada: ${newRound}`,
        },
      });

      // Emite evento via socket
      emitToCombat(io, id, SOCKET_EVENTS.COMBAT_ROUND_CHANGE, {
        combatId: id,
        round: newRound,
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao avançar rodada:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/finish - Finaliza combate
  async finish(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;

      const combat = await prisma.combatSession.findUnique({ where: { id } });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      const updated = await prisma.combatSession.update({
        where: { id },
        data: {
          status: 'finished',
          finishedAt: new Date(),
        },
      });

      await createAuditLog({
        userId: req.user!.id,
        entityType: 'combat',
        entityId: id,
        entityName: combat.name,
        action: 'update',
        fieldChanged: 'status',
        oldValue: combat.status,
        newValue: 'finished',
      });

      res.json(updated);
    } catch (error) {
      logger.error('Erro ao finalizar combate:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // POST /:id/participants - Adiciona participante ao combate
  async addParticipant(req: Request, res: Response): Promise<void> {
    try {
      const combatId = req.params.id as string;
      const { entityType, entityId, initiative } = req.body as ParticipantInput;

      const combat = await prisma.combatSession.findUnique({
        where: { id: combatId },
        include: { participants: true },
      });

      if (!combat) {
        res.status(404).json({
          error: true,
          message: 'Combate não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      let participantData: {
        combatSessionId: string;
        entityType: string;
        characterId?: string;
        monsterId?: string;
        customName: string;
        initiative: number;
        pvMax: number;
        pvCurrent: number;
        sanMax: number;
        sanCurrent: number;
        peMax: number;
        peCurrent: number;
        order: number;
      };

      if (entityType === 'character') {
        const character = await prisma.character.findUnique({
          where: { id: entityId },
          select: { id: true, name: true, pvMax: true, sanMax: true, peMax: true },
        });

        if (!character) {
          res.status(404).json({
            error: true,
            message: 'Personagem não encontrado',
            code: 'NOT_FOUND',
          });
          return;
        }

        participantData = {
          combatSessionId: combatId,
          entityType: 'character',
          characterId: character.id,
          customName: character.name,
          initiative,
          pvMax: character.pvMax,
          pvCurrent: character.pvMax,
          sanMax: character.sanMax,
          sanCurrent: character.sanMax,
          peMax: character.peMax,
          peCurrent: character.peMax,
          order: combat.participants.length,
        };
      } else {
        const monster = await prisma.monster.findUnique({
          where: { id: entityId },
          select: { id: true, name: true, pvMax: true, sanMax: true },
        });

        if (!monster) {
          res.status(404).json({
            error: true,
            message: 'Monstro não encontrado',
            code: 'NOT_FOUND',
          });
          return;
        }

        // Conta monstros existentes com mesmo id
        const sameMonsterCount = combat.participants.filter(p => p.monsterId === entityId).length;
        const customName = sameMonsterCount > 0 ? `${monster.name} ${sameMonsterCount + 1}` : monster.name;

        participantData = {
          combatSessionId: combatId,
          entityType: 'monster',
          monsterId: monster.id,
          customName,
          initiative,
          pvMax: monster.pvMax,
          pvCurrent: monster.pvMax,
          sanMax: monster.sanMax || 0,
          sanCurrent: monster.sanMax || 0,
          peMax: 0,
          peCurrent: 0,
          order: combat.participants.length,
        };
      }

      const participant = await prisma.combatParticipant.create({
        data: participantData,
      });

      // Reordena por iniciativa
      const allParticipants = [...combat.participants, participant];
      allParticipants.sort((a, b) => b.initiative - a.initiative);

      for (let i = 0; i < allParticipants.length; i++) {
        await prisma.combatParticipant.update({
          where: { id: allParticipants[i].id },
          data: { order: i },
        });
      }

      res.status(201).json(participant);
    } catch (error) {
      logger.error('Erro ao adicionar participante:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // DELETE /:id/participants/:participantId - Remove participante
  async removeParticipant(req: Request, res: Response): Promise<void> {
    try {
      const combatId = req.params.id as string;
      const participantId = req.params.participantId as string;

      const participant = await prisma.combatParticipant.findUnique({
        where: { id: participantId },
      });

      if (!participant || participant.combatSessionId !== combatId) {
        res.status(404).json({
          error: true,
          message: 'Participante não encontrado',
          code: 'NOT_FOUND',
        });
        return;
      }

      await prisma.combatParticipant.delete({ where: { id: participantId } });

      res.json({ message: 'Participante removido com sucesso' });
    } catch (error) {
      logger.error('Erro ao remover participante:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  // GET /:id/events - Lista eventos do combate
  async getEvents(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { round } = req.query;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { combatSessionId: id };

      if (round) {
        where.round = parseInt(round as string, 10);
      }

      const events = await prisma.combatEvent.findMany({
        where,
        orderBy: { timestamp: 'desc' },
      });

      res.json(events);
    } catch (error) {
      logger.error('Erro ao listar eventos:', error);
      res.status(500).json({
        error: true,
        message: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

export const combatController = new CombatController();
