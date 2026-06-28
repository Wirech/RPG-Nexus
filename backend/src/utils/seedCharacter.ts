import prisma from '../prisma/client';
import { PERICIAS_OFICIAIS, LOCAIS_PADRAO } from './skillsData';

/**
 * Popula um personagem recém-criado com perícias oficiais e locais de inventário padrão.
 * @param characterId ID do personagem criado
 */
export async function seedNewCharacter(characterId: string): Promise<void> {
  // Criar perícias oficiais
  const skillsData = PERICIAS_OFICIAIS.map((skill) => ({
    characterId,
    name: skill.name,
    attribute: skill.attribute,
    training: 'destreinado' as const,
    otherBonus: 0,
    isTrained: false,
    hasSpecialization: false,
    isOfficial: true,
  }));

  // Usar createMany sem skipDuplicates - como é um personagem novo, não haverá duplicatas
  await prisma.characterSkill.createMany({
    data: skillsData,
  });

  // Criar locais de inventário padrão
  const locationsData = LOCAIS_PADRAO.map((loc, index) => ({
    characterId,
    name: loc.name,
    icon: loc.icon,
    color: loc.color,
    order: index,
  }));

  await prisma.inventoryLocation.createMany({
    data: locationsData,
  });
}
