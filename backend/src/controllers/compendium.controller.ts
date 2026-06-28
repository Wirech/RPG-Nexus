import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../prisma/client';
import type { AbilityCompendium, RitualCompendium } from '@prisma/client';

// Lista de NEX em ordem para comparação
const NEX_ORDER = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'];

function getNexIndex(nex: string | null): number {
  if (!nex) return -1;
  return NEX_ORDER.indexOf(nex);
}

// GET /abilities - Lista habilidades do compêndio
export async function getAbilities(req: Request, res: Response) {
  try {
    const { trilha, nex, actionType, search } = req.query;

    const where: Record<string, unknown> = {};

    if (trilha) {
      where.trilha = trilha as string;
    }

    if (actionType) {
      where.actionType = actionType as string;
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
      ];
    }

    let abilities = await prisma.abilityCompendium.findMany({
      where,
      orderBy: [{ trilha: 'asc' }, { nex: 'asc' }, { name: 'asc' }],
    });

    // Filtrar por NEX se fornecido (retorna apenas abilities com nex <= nex fornecido)
    if (nex) {
      const maxNexIndex = getNexIndex(nex as string);
      abilities = abilities.filter((a: AbilityCompendium) => {
        const abilityNexIndex = getNexIndex(a.nex);
        return abilityNexIndex <= maxNexIndex;
      });
    }

    // Agrupar por NEX
    const grouped: Record<string, typeof abilities> = {};
    for (const ability of abilities) {
      const key = ability.nex || 'Sem NEX';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(ability);
    }

    res.json(grouped);
  } catch (error) {
    console.error('Erro ao buscar habilidades do compêndio:', error);
    res.status(500).json({ error: 'Erro ao buscar habilidades do compêndio' });
  }
}

// GET /rituals - Lista rituais do compêndio
export async function getRituals(req: Request, res: Response) {
  try {
    const { element, circle, nex, search } = req.query;

    const where: Record<string, unknown> = {};

    if (element) {
      where.element = element as string;
    }

    if (circle) {
      where.circle = parseInt(circle as string, 10);
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { description: { contains: search as string } },
        { effectDescription: { contains: search as string } },
      ];
    }

    let rituals = await prisma.ritualCompendium.findMany({
      where,
      orderBy: [{ element: 'asc' }, { circle: 'asc' }, { name: 'asc' }],
    });

    // Filtrar por NEX se fornecido
    if (nex) {
      const maxNexIndex = getNexIndex(nex as string);
      rituals = rituals.filter((r: RitualCompendium) => {
        const ritualNexIndex = getNexIndex(r.nex);
        return ritualNexIndex <= maxNexIndex;
      });
    }

    // Agrupar por element, depois por circle
    const grouped: Record<string, Record<number, typeof rituals>> = {};
    for (const ritual of rituals) {
      const elemKey = ritual.element;
      if (!grouped[elemKey]) {
        grouped[elemKey] = {};
      }
      if (!grouped[elemKey][ritual.circle]) {
        grouped[elemKey][ritual.circle] = [];
      }
      grouped[elemKey][ritual.circle].push(ritual);
    }

    res.json(grouped);
  } catch (error) {
    console.error('Erro ao buscar rituais do compêndio:', error);
    res.status(500).json({ error: 'Erro ao buscar rituais do compêndio' });
  }
}

// Schema de validação para criar habilidade
const createAbilitySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  trilha: z.string().optional(),
  nex: z.string().optional(),
  actionType: z.enum(['passiva', 'acao_padrao', 'acao_movimento', 'reacao', 'acao_completa']),
  peCost: z.number().int().min(0).default(0),
  usesPerScene: z.number().int().min(1).optional(),
  requiresConcentration: z.boolean().default(false),
  tags: z.string().default('[]'),
});

// POST /abilities [admin] - Criar habilidade customizada
export async function createAbility(req: Request, res: Response) {
  try {
    const parsed = createAbilitySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.errors });
    }

    const ability = await prisma.abilityCompendium.create({
      data: {
        ...parsed.data,
        source: 'custom',
      },
    });

    res.status(201).json(ability);
  } catch (error) {
    console.error('Erro ao criar habilidade:', error);
    res.status(500).json({ error: 'Erro ao criar habilidade' });
  }
}

// Schema de validação para criar ritual
const createRitualSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  effectDescription: z.string().optional(),
  element: z.enum(['Morte', 'Sangue', 'Energia', 'Conhecimento', 'Medo']),
  circle: z.number().int().min(1).max(3),
  executionTime: z.enum(['padrao', 'completa', 'reacao', 'livre', 'ritual']),
  range: z.enum(['toque', 'curto', 'medio', 'longo', 'extremo', 'pessoal']),
  duration: z.enum(['imediato', 'cena', 'sustentado', '1_dia', 'permanente']),
  resistance: z.string().optional(),
  peCost: z.number().int().min(0),
  nex: z.string().optional(),
  components: z.string().default('[]'),
});

// POST /rituals [admin] - Criar ritual customizado
export async function createRitual(req: Request, res: Response) {
  try {
    const parsed = createRitualSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Dados inválidos', details: parsed.error.errors });
    }

    const ritual = await prisma.ritualCompendium.create({
      data: {
        ...parsed.data,
        source: 'custom',
      },
    });

    res.status(201).json(ritual);
  } catch (error) {
    console.error('Erro ao criar ritual:', error);
    res.status(500).json({ error: 'Erro ao criar ritual' });
  }
}
