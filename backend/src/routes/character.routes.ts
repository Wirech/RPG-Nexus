import { Router } from 'express';
import { characterController } from '../controllers/character.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { requireAdmin } from '../middlewares/role.middleware';
import { uploadToken } from '../middlewares/upload.middleware';
import { validate } from '../validators';
import { z } from 'zod';

const router = Router();

// Todas as rotas precisam de autenticação
router.use(authMiddleware);

// ==================== GRUPOS ====================

// GET /groups - Lista grupos (todos autenticados)
router.get('/groups', characterController.listGroups.bind(characterController));

// POST /groups - Cria grupo (admin)
router.post(
  '/groups',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      parentId: z.string().cuid().nullable().optional(),
    })
  ),
  characterController.createGroup.bind(characterController)
);

// PUT /groups/reorder - Reordena grupos em batch (admin)
router.put(
  '/groups/reorder',
  requireAdmin,
  validate(
    z.object({
      orders: z.array(
        z.object({
          id: z.string().cuid(),
          order: z.number().int().min(0),
          parentId: z.string().cuid().nullable().optional(),
        })
      ),
    })
  ),
  characterController.reorderGroups.bind(characterController)
);

// PUT /groups/:id - Atualiza grupo (admin)
router.put(
  '/groups/:id',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().max(500).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      order: z.number().int().min(0).optional(),
      parentId: z.string().cuid().nullable().optional(),
    })
  ),
  characterController.updateGroup.bind(characterController)
);

// DELETE /groups/:id - Deleta grupo (admin)
router.delete(
  '/groups/:id',
  requireAdmin,
  characterController.deleteGroup.bind(characterController)
);

// ==================== MEMBERSHIPS (personagem em múltiplos grupos) ====================

// GET /:id/groups - Lista todos os grupos de um personagem
router.get('/:id/groups', characterController.getCharacterGroups.bind(characterController));

// POST /:id/groups/:groupId - Adiciona personagem a grupo adicional (admin)
router.post(
  '/:id/groups/:groupId',
  requireAdmin,
  characterController.addCharacterToGroup.bind(characterController)
);

// DELETE /:id/groups/:groupId - Remove personagem de grupo adicional (admin)
router.delete(
  '/:id/groups/:groupId',
  requireAdmin,
  characterController.removeCharacterFromGroup.bind(characterController)
);

// PUT /:id/primary-group - Muda grupo principal do personagem (admin)
router.put(
  '/:id/primary-group',
  requireAdmin,
  validate(
    z.object({
      groupId: z.string().cuid(),
    })
  ),
  characterController.changeCharacterPrimaryGroup.bind(characterController)
);

// ==================== PERSONAGENS ====================

// GET / - Lista personagens (admin vê todos, player vê revelados + próprio)
router.get('/', characterController.list.bind(characterController));

// GET /:id - Busca personagem por ID
router.get('/:id', characterController.getById.bind(characterController));

// POST / - Cria personagem (admin)
router.post(
  '/',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(40),
      groupId: z.string().cuid(),
      nex: z.string().optional(),
      trilha: z.string().max(100).optional(),
      origem: z.string().max(100).optional(),
      pvMax: z.number().int().min(0).default(20),
      pvCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).default(12),
      sanCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).default(2),
      peCurrent: z.number().int().min(0).optional(),
      attrForca: z.number().int().min(1).max(6).default(1),
      attrAgilidade: z.number().int().min(1).max(6).default(1),
      attrIntelecto: z.number().int().min(1).max(6).default(1),
      attrPresenca: z.number().int().min(1).max(6).default(1),
      attrVigor: z.number().int().min(1).max(6).default(1),
      defesa: z.number().int().min(0).default(10),
      esquiva: z.number().int().min(0).optional(),
      bloqueio: z.number().int().min(0).optional(),
      fortitude: z.number().int().default(0),
      reflexos: z.number().int().default(0),
      vontade: z.number().int().default(0),
      deslocamento: z.number().min(0).default(9),
      espacosInventario: z.number().int().min(0).default(5),
      description: z.string().optional(),
      conditions: z.array(z.string()).optional(),
      isRevealed: z.boolean().default(false),
      tokenImage: z.string().optional(),
    })
  ),
  characterController.create.bind(characterController)
);

// PUT /:id - Atualiza personagem (admin)
router.put(
  '/:id',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(40).optional(),
      groupId: z.string().cuid().nullable().optional(),
      nex: z.string().nullable().optional(),
      trilha: z.string().max(100).nullable().optional(),
      origem: z.string().max(100).nullable().optional(),
      pvMax: z.number().int().min(0).optional(),
      pvCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).optional(),
      sanCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).optional(),
      peCurrent: z.number().int().min(0).optional(),
      attrForca: z.number().int().min(1).max(6).optional(),
      attrAgilidade: z.number().int().min(1).max(6).optional(),
      attrIntelecto: z.number().int().min(1).max(6).optional(),
      attrPresenca: z.number().int().min(1).max(6).optional(),
      attrVigor: z.number().int().min(1).max(6).optional(),
      defesa: z.number().int().min(0).optional(),
      esquiva: z.number().int().min(0).nullable().optional(),
      bloqueio: z.number().int().min(0).nullable().optional(),
      fortitude: z.number().int().optional(),
      reflexos: z.number().int().optional(),
      vontade: z.number().int().optional(),
      deslocamento: z.number().min(0).optional(),
      espacosInventario: z.number().int().min(0).optional(),
      description: z.string().nullable().optional(),
      conditions: z.array(z.string()).optional(),
      isRevealed: z.boolean().optional(),
      isApproved: z.boolean().optional(),
    })
  ),
  characterController.update.bind(characterController)
);

// DELETE /:id - Deleta personagem (admin)
router.delete(
  '/:id',
  requireAdmin,
  characterController.delete.bind(characterController)
);

// PATCH /:id/vitals - Atualiza vitais (admin ou dono do personagem)
router.patch(
  '/:id/vitals',
  validate(
    z.object({
      pvCurrent: z.number().int().min(0).optional(),
      pvMax: z.number().int().min(0).optional(),
      sanCurrent: z.number().int().min(0).optional(),
      sanMax: z.number().int().min(0).optional(),
      peCurrent: z.number().int().min(0).optional(),
      peMax: z.number().int().min(0).optional(),
    })
  ),
  characterController.updateVitals.bind(characterController)
);

// PATCH /:id/conditions - Atualiza condições (admin)
router.patch(
  '/:id/conditions',
  requireAdmin,
  validate(
    z.object({
      conditions: z.array(z.string()),
    })
  ),
  characterController.updateConditions.bind(characterController)
);

// PATCH /:id/reveal - Revela/oculta personagem (admin)
router.patch(
  '/:id/reveal',
  requireAdmin,
  validate(
    z.object({
      isRevealed: z.boolean(),
    })
  ),
  characterController.reveal.bind(characterController)
);

// POST /:id/token - Upload de token (admin)
router.post(
  '/:id/token',
  requireAdmin,
  uploadToken,
  characterController.uploadToken.bind(characterController)
);

// ==================== SKILLS ====================

// GET /:id/skills - Lista perícias do personagem
router.get(
  '/:id/skills',
  characterController.listSkills.bind(characterController)
);

// POST /:id/skills - Cria perícia customizada (admin)
router.post(
  '/:id/skills',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      attribute: z.enum(['forca', 'agilidade', 'intelecto', 'presenca', 'vigor']),
      training: z.enum(['destreinado', 'treinado', 'veterano', 'expert']).default('destreinado'),
      otherBonus: z.number().int().default(0),
      isTrained: z.boolean().optional(),
      hasSpecialization: z.boolean().optional(),
      specializationName: z.string().max(100).optional(),
      bonusModifier: z.number().int().optional(),
    })
  ),
  characterController.createSkill.bind(characterController)
);

// PUT /:id/skills/:skillId - Atualiza perícia (admin)
router.put(
  '/:id/skills/:skillId',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      attribute: z.enum(['forca', 'agilidade', 'intelecto', 'presenca', 'vigor']).optional(),
      training: z.enum(['destreinado', 'treinado', 'veterano', 'expert']).optional(),
      otherBonus: z.number().int().optional(),
      isTrained: z.boolean().optional(),
      hasSpecialization: z.boolean().optional(),
      specializationName: z.string().max(100).nullable().optional(),
      bonusModifier: z.number().int().optional(),
    })
  ),
  characterController.updateSkill.bind(characterController)
);

// DELETE /:id/skills/:skillId - Deleta perícia customizada (admin)
router.delete(
  '/:id/skills/:skillId',
  requireAdmin,
  characterController.deleteSkill.bind(characterController)
);

// ==================== ABILITIES ====================

// GET /:id/abilities - Lista habilidades do personagem
router.get(
  '/:id/abilities',
  characterController.listAbilities.bind(characterController)
);

// POST /:id/abilities - Cria habilidade customizada (admin)
router.post(
  '/:id/abilities',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      peCost: z.number().int().min(0).default(0),
      type: z.string().max(50).optional(),
      element: z.string().max(50).optional(),
      isActive: z.boolean().optional(),
      actionType: z.string().max(50).optional(),
      usesPerScene: z.number().int().min(1).optional(),
      trilha: z.string().max(100).optional(),
      nex: z.string().max(10).optional(),
      notes: z.string().optional(),
    })
  ),
  characterController.createAbility.bind(characterController)
);

// POST /:id/abilities/from-compendium - Adiciona do compêndio (admin)
router.post(
  '/:id/abilities/from-compendium',
  requireAdmin,
  validate(
    z.object({
      compendiumAbilityId: z.string().optional(),
      compendiumRitualId: z.string().optional(),
      notes: z.string().optional(),
    })
  ),
  characterController.addAbilityFromCompendium.bind(characterController)
);

// POST /:id/abilities/reset-uses - Reseta usos de habilidades (admin)
router.post(
  '/:id/abilities/reset-uses',
  requireAdmin,
  characterController.resetAbilityUses.bind(characterController)
);

// PUT /:id/abilities/:abilityId - Atualiza habilidade (admin)
router.put(
  '/:id/abilities/:abilityId',
  requireAdmin,
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      description: z.string().optional(),
      peCost: z.number().int().min(0).optional(),
      type: z.string().max(50).optional(),
      element: z.string().max(50).optional(),
      isActive: z.boolean().optional(),
      nameOverride: z.string().max(100).optional(),
      descriptionOverride: z.string().optional(),
      peCostOverride: z.number().int().min(0).optional(),
      currentUses: z.number().int().min(0).optional(),
      notes: z.string().optional(),
      actionType: z.string().max(50).optional(),
      usesPerScene: z.number().int().min(1).optional(),
      trilha: z.string().max(100).optional(),
      nex: z.string().max(10).optional(),
    })
  ),
  characterController.updateAbility.bind(characterController)
);

// DELETE /:id/abilities/:abilityId - Deleta habilidade (admin)
router.delete(
  '/:id/abilities/:abilityId',
  requireAdmin,
  characterController.deleteAbility.bind(characterController)
);

// ==================== INVENTORY ====================

// GET /:id/inventory - Lista itens do inventário
router.get(
  '/:id/inventory',
  characterController.listInventory.bind(characterController)
);

// GET /:id/inventory/locations - Lista locais de inventário
router.get(
  '/:id/inventory/locations',
  characterController.listInventoryLocations.bind(characterController)
);

// POST /:id/inventory/locations - Cria local de inventário
router.post(
  '/:id/inventory/locations',
  validate(
    z.object({
      name: z.string().min(1).max(50),
      icon: z.string().max(10).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    })
  ),
  characterController.createInventoryLocation.bind(characterController)
);

// PUT /:id/inventory/locations/:locationId - Atualiza local
router.put(
  '/:id/inventory/locations/:locationId',
  validate(
    z.object({
      name: z.string().min(1).max(50).optional(),
      icon: z.string().max(10).optional(),
      color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
      order: z.number().int().min(0).optional(),
    })
  ),
  characterController.updateInventoryLocation.bind(characterController)
);

// DELETE /:id/inventory/locations/:locationId - Deleta local
router.delete(
  '/:id/inventory/locations/:locationId',
  characterController.deleteInventoryLocation.bind(characterController)
);

// POST /:id/inventory - Cria item (admin ou dono)
router.post(
  '/:id/inventory',
  validate(
    z.object({
      name: z.string().min(1).max(100),
      quantity: z.number().int().min(0).default(1),
      description: z.string().max(500).optional(),
      category: z.string().max(50).optional(),
      weight: z.number().min(0).optional(),
      spaces: z.number().int().min(0).optional(),
      isEquipped: z.boolean().optional(),
      locationId: z.string().optional(),
      locationCustomName: z.string().max(50).optional(),
      // Arma
      weaponType: z.string().max(50).optional(),
      weaponGrip: z.string().max(20).optional(),
      damage: z.string().max(50).optional(),
      damageType: z.string().max(50).optional(),
      criticalMargin: z.number().int().optional(),
      criticalMult: z.number().int().optional(),
      weaponRange: z.string().max(50).optional(),
      weaponProperties: z.string().max(255).optional(),
      wProficiency: z.string().max(50).optional(),
      wAmmunition: z.number().int().optional(),
      wAmmunitionType: z.string().max(50).optional(),
      // Proteção
      protectionType: z.string().max(50).optional(),
      defenseBonus: z.number().int().optional(),
      damageReduction: z.number().int().optional(),
      pPenalty: z.number().int().optional(),
      pMaxDex: z.number().int().optional(),
      // Consumível
      cEffect: z.string().max(255).optional(),
      cDuration: z.string().max(50).optional(),
      cCharges: z.number().int().optional(),
      // Munição
      aType: z.string().max(50).optional(),
      aDamageBonus: z.string().max(50).optional(),
      aProperties: z.string().max(255).optional(),
    })
  ),
  characterController.createInventoryItem.bind(characterController)
);

// PUT /:id/inventory/:itemId - Atualiza item (admin ou dono)
router.put(
  '/:id/inventory/:itemId',
  validate(
    z.object({
      name: z.string().min(1).max(100).optional(),
      quantity: z.number().int().min(0).optional(),
      description: z.string().max(500).optional(),
      category: z.string().max(50).optional(),
      weight: z.number().min(0).optional(),
      spaces: z.number().int().min(0).optional(),
      isEquipped: z.boolean().optional(),
      locationId: z.string().nullable().optional(),
      locationCustomName: z.string().max(50).nullable().optional(),
      // Arma
      weaponType: z.string().max(50).nullable().optional(),
      weaponGrip: z.string().max(20).nullable().optional(),
      damage: z.string().max(50).nullable().optional(),
      damageType: z.string().max(50).nullable().optional(),
      criticalMargin: z.number().int().nullable().optional(),
      criticalMult: z.number().int().nullable().optional(),
      weaponRange: z.string().max(50).nullable().optional(),
      weaponProperties: z.string().max(255).nullable().optional(),
      wProficiency: z.string().max(50).nullable().optional(),
      wAmmunition: z.number().int().nullable().optional(),
      wAmmunitionType: z.string().max(50).nullable().optional(),
      // Proteção
      protectionType: z.string().max(50).nullable().optional(),
      defenseBonus: z.number().int().nullable().optional(),
      damageReduction: z.number().int().nullable().optional(),
      pPenalty: z.number().int().nullable().optional(),
      pMaxDex: z.number().int().nullable().optional(),
      // Consumível
      cEffect: z.string().max(255).nullable().optional(),
      cDuration: z.string().max(50).nullable().optional(),
      cCharges: z.number().int().nullable().optional(),
      // Munição
      aType: z.string().max(50).nullable().optional(),
      aDamageBonus: z.string().max(50).nullable().optional(),
      aProperties: z.string().max(255).nullable().optional(),
    })
  ),
  characterController.updateInventoryItem.bind(characterController)
);

// DELETE /:id/inventory/:itemId - Deleta item (admin ou dono)
router.delete(
  '/:id/inventory/:itemId',
  characterController.deleteInventoryItem.bind(characterController)
);

export default router;
