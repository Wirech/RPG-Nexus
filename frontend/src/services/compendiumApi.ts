import api from './api';
import type { AbilityCompendium, RitualCompendium } from '../types';

// ─────────────────────────────────────────
// HABILIDADES DO COMPÊNDIO
// ─────────────────────────────────────────

export interface GetAbilitiesParams {
  trilha?: string;
  nex?: string;
  actionType?: string;
  search?: string;
}

export async function getAbilities(params?: GetAbilitiesParams): Promise<Record<string, AbilityCompendium[]>> {
  const searchParams = new URLSearchParams();
  if (params?.trilha) searchParams.append('trilha', params.trilha);
  if (params?.nex) searchParams.append('nex', params.nex);
  if (params?.actionType) searchParams.append('actionType', params.actionType);
  if (params?.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const response = await api.get<Record<string, AbilityCompendium[]>>(
    `/compendium/abilities${query ? `?${query}` : ''}`
  );
  return response.data;
}

export async function createAbility(data: Partial<AbilityCompendium>): Promise<AbilityCompendium> {
  const response = await api.post<AbilityCompendium>('/compendium/abilities', data);
  return response.data;
}

// ─────────────────────────────────────────
// RITUAIS DO COMPÊNDIO
// ─────────────────────────────────────────

export interface GetRitualsParams {
  element?: string;
  circle?: number;
  nex?: string;
  search?: string;
}

export async function getRituals(params?: GetRitualsParams): Promise<Record<string, Record<number, RitualCompendium[]>>> {
  const searchParams = new URLSearchParams();
  if (params?.element) searchParams.append('element', params.element);
  if (params?.circle) searchParams.append('circle', params.circle.toString());
  if (params?.nex) searchParams.append('nex', params.nex);
  if (params?.search) searchParams.append('search', params.search);

  const query = searchParams.toString();
  const response = await api.get<Record<string, Record<number, RitualCompendium[]>>>(
    `/compendium/rituals${query ? `?${query}` : ''}`
  );
  return response.data;
}

export async function createRitual(data: Partial<RitualCompendium>): Promise<RitualCompendium> {
  const response = await api.post<RitualCompendium>('/compendium/rituals', data);
  return response.data;
}
