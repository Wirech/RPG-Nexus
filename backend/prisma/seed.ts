import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { HABILIDADES_SEED, RITUAIS_SEED } from '../src/utils/skillsData';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verificar se admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { username: process.env.ADMIN_USERNAME || 'admin' }
  });

  if (existingAdmin) {
    console.log('✅ Admin já existe, pulando criação.');
  } else {
    // Criar usuário admin
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD || 'senha_inicial_admin',
      10
    );

    const admin = await prisma.user.create({
      data: {
        username: process.env.ADMIN_USERNAME || 'admin',
        passwordHash,
        role: 'admin',
        status: 'active',
        approvedAt: new Date()
      }
    });

    console.log(`✅ Admin criado: ${admin.username}`);
  }

  // Criar grupo padrão "Agentes" se não existir
  const existingGroup = await prisma.characterGroup.findFirst({
    where: { name: 'Agentes' }
  });

  if (existingGroup) {
    console.log('✅ Grupo "Agentes" já existe, pulando criação.');
  } else {
    const group = await prisma.characterGroup.create({
      data: {
        name: 'Agentes',
        description: 'Personagens jogadores da Ordem',
        color: '#7c3aed',
        order: 0
      }
    });

    console.log(`✅ Grupo criado: ${group.name}`);
  }

  // Criar grupos adicionais sugeridos
  const additionalGroups = [
    { name: 'NPCs', description: 'Personagens não-jogadores', color: '#3b82f6', order: 1 },
    { name: 'Aliados', description: 'Aliados dos agentes', color: '#16a34a', order: 2 },
    { name: 'Antagonistas', description: 'Inimigos e antagonistas', color: '#dc2626', order: 3 }
  ];

  for (const groupData of additionalGroups) {
    const exists = await prisma.characterGroup.findFirst({
      where: { name: groupData.name }
    });

    if (!exists) {
      await prisma.characterGroup.create({ data: groupData });
      console.log(`✅ Grupo criado: ${groupData.name}`);
    }
  }

  // ─────────────────────────────────────────
  // SEED DO COMPÊNDIO DE HABILIDADES
  // ─────────────────────────────────────────
  console.log('📚 Populando compêndio de habilidades...');
  
  for (const hab of HABILIDADES_SEED) {
    await prisma.abilityCompendium.upsert({
      where: { id: `ability-${hab.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `ability-${hab.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: hab.name,
        description: hab.description,
        trilha: hab.trilha,
        nex: hab.nex,
        actionType: hab.actionType,
        peCost: hab.peCost,
        usesPerScene: hab.usesPerScene || null,
        source: 'official',
      },
    });
  }
  console.log(`✅ ${HABILIDADES_SEED.length} habilidades do compêndio criadas/atualizadas`);

  // ─────────────────────────────────────────
  // SEED DO COMPÊNDIO DE RITUAIS
  // ─────────────────────────────────────────
  console.log('📚 Populando compêndio de rituais...');
  
  for (const rit of RITUAIS_SEED) {
    await prisma.ritualCompendium.upsert({
      where: { id: `ritual-${rit.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        id: `ritual-${rit.name.toLowerCase().replace(/\s+/g, '-')}`,
        name: rit.name,
        description: rit.description,
        effectDescription: rit.effectDescription,
        element: rit.element,
        circle: rit.circle,
        executionTime: rit.executionTime,
        range: rit.range,
        duration: rit.duration,
        resistance: rit.resistance || 'nenhuma',
        peCost: rit.peCost,
        nex: rit.nex,
        components: rit.components,
        source: 'official',
      },
    });
  }
  console.log(`✅ ${RITUAIS_SEED.length} rituais do compêndio criados/atualizados`);

  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
