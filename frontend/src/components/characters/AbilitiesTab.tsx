import { useState, useEffect, useCallback } from 'react';
import { 
  AbilityCard, 
  CompendiumAbilityCard, 
  CompendiumRitualCard 
} from '../shared';
import { ConfirmDialog } from '../shared';
import type { 
  Character, 
  CharacterAbility, 
  AbilityCompendium, 
  RitualCompendium,
  ElementType 
} from '../../types';
import { 
  getCharacterAbilities,
  addAbilityFromCompendium,
  updateCharacterAbility,
  deleteCharacterAbility,
  resetAbilityUses,
} from '../../services/characterDetailApi';
import { getAbilities, getRituals } from '../../services/compendiumApi';
import { cn } from '@/lib/utils';

interface AbilitiesTabProps {
  character: Character;
  isAdmin: boolean;
  onRefresh?: () => void;
}

type TabView = 'all' | 'abilities' | 'rituals' | 'compendium';
type CompendiumSubTab = 'abilities' | 'rituals';

const elementFilters: ElementType[] = ['Sangue', 'Morte', 'Energia', 'Conhecimento', 'Medo'];

export function AbilitiesTab({ character, isAdmin, onRefresh }: AbilitiesTabProps) {
  const [abilities, setAbilities] = useState<CharacterAbility[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabView>('all');
  
  // Compêndio
  const [compendiumSubTab, setCompendiumSubTab] = useState<CompendiumSubTab>('abilities');
  const [compendiumAbilities, setCompendiumAbilities] = useState<Record<string, AbilityCompendium[]>>({});
  const [compendiumRituals, setCompendiumRituals] = useState<Record<string, Record<number, RitualCompendium[]>>>({});
  const [compendiumLoading, setCompendiumLoading] = useState(false);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [elementFilter, setElementFilter] = useState<ElementType | ''>('');
  const [trilhaFilter, setTrilhaFilter] = useState('');
  
  // Diálogos
  const [deleteConfirm, setDeleteConfirm] = useState<CharacterAbility | null>(null);

  // Carregar habilidades do personagem
  const loadAbilities = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCharacterAbilities(character.id);
      setAbilities(data);
    } catch (error) {
      console.error('Erro ao carregar habilidades:', error);
    } finally {
      setLoading(false);
    }
  }, [character.id]);

  // Carregar compêndio
  const loadCompendium = useCallback(async () => {
    setCompendiumLoading(true);
    try {
      const [abilitiesData, ritualsData] = await Promise.all([
        getAbilities({ 
          nex: character.nex || undefined,
          trilha: trilhaFilter || undefined,
          search: searchTerm || undefined,
        }),
        getRituals({
          nex: character.nex || undefined,
          element: elementFilter || undefined,
          search: searchTerm || undefined,
        }),
      ]);
      setCompendiumAbilities(abilitiesData);
      setCompendiumRituals(ritualsData);
    } catch (error) {
      console.error('Erro ao carregar compêndio:', error);
    } finally {
      setCompendiumLoading(false);
    }
  }, [character.nex, trilhaFilter, elementFilter, searchTerm]);

  useEffect(() => {
    loadAbilities();
  }, [loadAbilities]);

  useEffect(() => {
    if (activeTab === 'compendium') {
      loadCompendium();
    }
  }, [activeTab, loadCompendium]);

  // Handlers
  const handleAddFromCompendium = async (compendiumAbilityId?: string, compendiumRitualId?: string) => {
    try {
      await addAbilityFromCompendium(character.id, { compendiumAbilityId, compendiumRitualId });
      await loadAbilities();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao adicionar habilidade:', error);
    }
  };

  const handleUseAbility = async (ability: CharacterAbility) => {
    const newUses = (ability.currentUses || 0) + 1;
    try {
      await updateCharacterAbility(character.id, ability.id, { currentUses: newUses });
      await loadAbilities();
    } catch (error) {
      console.error('Erro ao usar habilidade:', error);
    }
  };

  const handleDeleteAbility = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCharacterAbility(character.id, deleteConfirm.id);
      setDeleteConfirm(null);
      await loadAbilities();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao remover habilidade:', error);
    }
  };

  const handleResetUses = async () => {
    try {
      await resetAbilityUses(character.id);
      await loadAbilities();
    } catch (error) {
      console.error('Erro ao resetar usos:', error);
    }
  };

  // Filtrar habilidades
  const filteredAbilities = abilities.filter((a) => {
    if (activeTab === 'abilities' && a.type === 'ritual') return false;
    if (activeTab === 'rituals' && a.type !== 'ritual') return false;
    if (searchTerm && !a.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Agrupar por tipo
  const groupedAbilities = filteredAbilities.reduce((acc, ability) => {
    const key = ability.type === 'ritual' ? 'Rituais' : 'Habilidades';
    if (!acc[key]) acc[key] = [];
    acc[key].push(ability);
    return acc;
  }, {} as Record<string, CharacterAbility[]>);

  // IDs já adicionados (para marcar no compêndio)
  const addedAbilityIds = new Set(abilities.map((a) => a.compendiumAbilityId).filter(Boolean));
  const addedRitualIds = new Set(abilities.map((a) => a.compendiumRitualId).filter(Boolean));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com tabs e ações */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'all'
                ? 'bg-violet-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            Todas
          </button>
          <button
            onClick={() => setActiveTab('abilities')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'abilities'
                ? 'bg-violet-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            Habilidades
          </button>
          <button
            onClick={() => setActiveTab('rituals')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === 'rituals'
                ? 'bg-violet-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
            )}
          >
            Rituais
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('compendium')}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === 'compendium'
                  ? 'bg-violet-500 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
              )}
            >
              📚 Compêndio
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          {isAdmin && (
            <button
                onClick={handleResetUses}
                className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors"
                title="Resetar usos de cena"
              >
                🔄
              </button>
          )}
        </div>
      </div>

      {/* Conteúdo da aba atual */}
      {activeTab !== 'compendium' ? (
        <div className="space-y-6">
          {Object.entries(groupedAbilities).map(([group, items]) => (
            <div key={group}>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">{group}</h3>
              <div className="space-y-2">
                {items.map((ability) => (
                  <AbilityCard
                    key={ability.id}
                    ability={ability}
                    isAdmin={isAdmin}
                    onUse={() => handleUseAbility(ability)}
                    onDelete={() => setDeleteConfirm(ability)}
                  />
                ))}
              </div>
            </div>
          ))}

          {filteredAbilities.length === 0 && (
            <div className="text-center py-8 text-zinc-500">
              Nenhuma habilidade encontrada.
              {isAdmin && (
                <p className="mt-2 text-sm">
                  Use o compêndio para adicionar habilidades ou crie uma customizada.
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Sub-tabs do compêndio */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCompendiumSubTab('abilities')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  compendiumSubTab === 'abilities'
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Habilidades
              </button>
              <button
                onClick={() => setCompendiumSubTab('rituals')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  compendiumSubTab === 'rituals'
                    ? 'bg-zinc-700 text-zinc-200'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                Rituais
              </button>
            </div>

            {/* Filtros */}
            {compendiumSubTab === 'abilities' && (
              <select
                value={trilhaFilter}
                onChange={(e) => setTrilhaFilter(e.target.value)}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200"
              >
                <option value="">Todas as trilhas</option>
                <option value="Combatente">Combatente</option>
                <option value="Especialista">Especialista</option>
                <option value="Ocultista">Ocultista</option>
              </select>
            )}

            {compendiumSubTab === 'rituals' && (
              <select
                value={elementFilter}
                onChange={(e) => setElementFilter(e.target.value as ElementType | '')}
                className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200"
              >
                <option value="">Todos os elementos</option>
                {elementFilters.map((el) => (
                  <option key={el} value={el}>{el}</option>
                ))}
              </select>
            )}
          </div>

          {compendiumLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
            </div>
          ) : compendiumSubTab === 'abilities' ? (
            <div className="space-y-4">
              {Object.entries(compendiumAbilities).map(([nex, items]) => (
                <div key={nex}>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">NEX {nex}</h4>
                  <div className="space-y-2">
                    {items.map((ability) => (
                      <CompendiumAbilityCard
                        key={ability.id}
                        ability={ability}
                        onAdd={() => handleAddFromCompendium(ability.id)}
                        isAdded={addedAbilityIds.has(ability.id)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(compendiumRituals).map(([element, circles]) => (
                <div key={element}>
                  <h4 className="text-lg font-medium text-zinc-200 mb-3">{element}</h4>
                  {Object.entries(circles).map(([circle, items]) => (
                    <div key={circle} className="mb-4">
                      <h5 className="text-sm font-medium text-zinc-400 mb-2">{circle}º Círculo</h5>
                      <div className="space-y-2">
                        {items.map((ritual) => (
                          <CompendiumRitualCard
                            key={ritual.id}
                            ritual={ritual}
                            onAdd={() => handleAddFromCompendium(undefined, ritual.id)}
                            isAdded={addedRitualIds.has(ritual.id)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Diálogos */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Remover Habilidade"
        description={`Deseja remover "${deleteConfirm?.name}" do personagem?`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleDeleteAbility}
        variant="danger"
      />
    </div>
  );
}
