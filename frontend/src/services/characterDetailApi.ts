import api from './api';
import type { 
  CharacterAbility, 
  CharacterSkill, 
  InventoryItem, 
  InventoryLocation 
} from '../types';

// ─────────────────────────────────────────
// HABILIDADES DO PERSONAGEM
// ─────────────────────────────────────────

export async function getCharacterAbilities(characterId: string): Promise<CharacterAbility[]> {
  const response = await api.get<CharacterAbility[]>(`/characters/${characterId}/abilities`);
  return response.data;
}

export interface CreateAbilityData {
  name: string;
  description?: string;
  peCost?: number;
  type?: string;
  element?: string;
  isActive?: boolean;
  actionType?: string;
  usesPerScene?: number;
  trilha?: string;
  nex?: string;
  notes?: string;
}

export async function createCharacterAbility(
  characterId: string, 
  data: CreateAbilityData
): Promise<CharacterAbility> {
  const response = await api.post<CharacterAbility>(
    `/characters/${characterId}/abilities`, 
    data
  );
  return response.data;
}

export interface AddFromCompendiumData {
  compendiumAbilityId?: string;
  compendiumRitualId?: string;
  notes?: string;
}

export async function addAbilityFromCompendium(
  characterId: string, 
  data: AddFromCompendiumData
): Promise<CharacterAbility> {
  const response = await api.post<CharacterAbility>(
    `/characters/${characterId}/abilities/from-compendium`, 
    data
  );
  return response.data;
}

export interface UpdateAbilityData {
  nameOverride?: string;
  descriptionOverride?: string;
  peCostOverride?: number;
  currentUses?: number;
  notes?: string;
  isActive?: boolean;
  // Para customizadas
  name?: string;
  description?: string;
  peCost?: number;
  type?: string;
  element?: string;
  actionType?: string;
  usesPerScene?: number;
  trilha?: string;
  nex?: string;
}

export async function updateCharacterAbility(
  characterId: string, 
  abilityId: string, 
  data: UpdateAbilityData
): Promise<CharacterAbility> {
  const response = await api.put<CharacterAbility>(
    `/characters/${characterId}/abilities/${abilityId}`, 
    data
  );
  return response.data;
}

export async function deleteCharacterAbility(
  characterId: string, 
  abilityId: string
): Promise<void> {
  await api.delete(`/characters/${characterId}/abilities/${abilityId}`);
}

export async function resetAbilityUses(characterId: string): Promise<void> {
  await api.post(`/characters/${characterId}/abilities/reset-uses`);
}

// ─────────────────────────────────────────
// PERÍCIAS DO PERSONAGEM
// ─────────────────────────────────────────

export async function getCharacterSkills(characterId: string): Promise<CharacterSkill[]> {
  const response = await api.get<CharacterSkill[]>(`/characters/${characterId}/skills`);
  return response.data;
}

export interface CreateSkillData {
  name: string;
  attribute: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  training?: 'destreinado' | 'treinado' | 'veterano' | 'expert';
  otherBonus?: number;
  isTrained?: boolean;
  hasSpecialization?: boolean;
  specializationName?: string;
  bonusModifier?: number;
}

export async function createCharacterSkill(
  characterId: string, 
  data: CreateSkillData
): Promise<CharacterSkill> {
  const response = await api.post<CharacterSkill>(
    `/characters/${characterId}/skills`, 
    data
  );
  return response.data;
}

export interface UpdateSkillData {
  name?: string;
  attribute?: 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';
  training?: 'destreinado' | 'treinado' | 'veterano' | 'expert';
  otherBonus?: number;
  isTrained?: boolean;
  hasSpecialization?: boolean;
  specializationName?: string | null;
  bonusModifier?: number;
}

export async function updateCharacterSkill(
  characterId: string, 
  skillId: string, 
  data: UpdateSkillData
): Promise<CharacterSkill> {
  const response = await api.put<CharacterSkill>(
    `/characters/${characterId}/skills/${skillId}`, 
    data
  );
  return response.data;
}

export async function deleteCharacterSkill(
  characterId: string, 
  skillId: string
): Promise<void> {
  await api.delete(`/characters/${characterId}/skills/${skillId}`);
}

// ─────────────────────────────────────────
// INVENTÁRIO DO PERSONAGEM
// ─────────────────────────────────────────

export async function getCharacterInventory(characterId: string): Promise<InventoryItem[]> {
  const response = await api.get<InventoryItem[]>(`/characters/${characterId}/inventory`);
  return response.data;
}

export async function getInventoryLocations(characterId: string): Promise<InventoryLocation[]> {
  const response = await api.get<InventoryLocation[]>(`/characters/${characterId}/inventory/locations`);
  return response.data;
}

export interface CreateLocationData {
  name: string;
  icon?: string;
  color?: string;
}

export async function createInventoryLocation(
  characterId: string, 
  data: CreateLocationData
): Promise<InventoryLocation> {
  const response = await api.post<InventoryLocation>(
    `/characters/${characterId}/inventory/locations`, 
    data
  );
  return response.data;
}

export interface UpdateLocationData {
  name?: string;
  icon?: string;
  color?: string;
  order?: number;
}

export async function updateInventoryLocation(
  characterId: string, 
  locationId: string, 
  data: UpdateLocationData
): Promise<InventoryLocation> {
  const response = await api.put<InventoryLocation>(
    `/characters/${characterId}/inventory/locations/${locationId}`, 
    data
  );
  return response.data;
}

export async function deleteInventoryLocation(
  characterId: string, 
  locationId: string
): Promise<void> {
  await api.delete(`/characters/${characterId}/inventory/locations/${locationId}`);
}

export interface CreateItemData {
  name: string;
  quantity?: number;
  description?: string;
  category?: string;
  weight?: number;
  spaces?: number;
  isEquipped?: boolean;
  locationId?: string;
  locationCustomName?: string;
  // Arma
  weaponType?: string;
  weaponGrip?: string;
  damage?: string;
  damageType?: string;
  criticalMargin?: number;
  criticalMult?: number;
  weaponRange?: string;
  weaponProperties?: string;
  wProficiency?: string;
  wAmmunition?: number;
  wAmmunitionType?: string;
  // Proteção
  protectionType?: string;
  defenseBonus?: number;
  damageReduction?: number;
  pPenalty?: number;
  pMaxDex?: number;
  // Consumível
  cEffect?: string;
  cDuration?: string;
  cCharges?: number;
  // Munição
  aType?: string;
  aDamageBonus?: string;
  aProperties?: string;
}

export async function createInventoryItem(
  characterId: string, 
  data: CreateItemData
): Promise<InventoryItem> {
  const response = await api.post<InventoryItem>(
    `/characters/${characterId}/inventory`, 
    data
  );
  return response.data;
}

export async function updateInventoryItem(
  characterId: string, 
  itemId: string, 
  data: Partial<CreateItemData>
): Promise<InventoryItem> {
  const response = await api.put<InventoryItem>(
    `/characters/${characterId}/inventory/${itemId}`, 
    data
  );
  return response.data;
}

export async function deleteInventoryItem(
  characterId: string, 
  itemId: string
): Promise<void> {
  await api.delete(`/characters/${characterId}/inventory/${itemId}`);
}
