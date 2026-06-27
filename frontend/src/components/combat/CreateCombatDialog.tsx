import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X,
  Loader2,
  Search,
  Plus,
  Trash2,
  Dices,
  Users,
  Bug,
} from 'lucide-react';
import { combatApi, characterApi, monsterApi } from '@/services/api';
import { TokenAvatar } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Character, Monster } from '@/types';
import toast from 'react-hot-toast';

interface Participant {
  entityType: 'character' | 'monster';
  entityId: string;
  entityName: string;
  customName?: string;
  tokenImage?: string | null;
  initiative: number;
  pvMax: number;
  sanMax?: number;
  peMax?: number;
}

interface CreateCombatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateCombatDialog({ open, onOpenChange, onSuccess }: CreateCombatDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    characters: Character[];
    monsters: Monster[];
  }>({ characters: [], monsters: [] });
  const [searching, setSearching] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults({ characters: [], monsters: [] });
      return;
    }

    setSearching(true);
    try {
      const [charRes, monsterRes] = await Promise.all([
        characterApi.list({ search: query }),
        monsterApi.list({ search: query }),
      ]);
      setSearchResults({
        characters: charRes.data || [],
        monsters: monsterRes.data || [],
      });
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const addCharacterParticipant = (character: Character) => {
    const existing = participants.filter(
      (p) => p.entityType === 'character' && p.entityId === character.id
    );
    if (existing.length > 0) {
      toast.error('Este personagem já foi adicionado');
      return;
    }

    setParticipants([
      ...participants,
      {
        entityType: 'character',
        entityId: character.id,
        entityName: character.name,
        tokenImage: character.tokenImage,
        initiative: 0,
        pvMax: character.pvMax,
        sanMax: character.sanMax,
        peMax: character.peMax,
      },
    ]);
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
  };

  const addMonsterParticipant = (monster: Monster) => {
    // Count existing instances of this monster
    const existingCount = participants.filter(
      (p) => p.entityType === 'monster' && p.entityId === monster.id
    ).length;

    const customName = existingCount > 0 ? `${monster.name} ${existingCount + 1}` : undefined;

    // If this is the first duplicate, rename the original
    if (existingCount === 1) {
      setParticipants((prev) =>
        prev.map((p) =>
          p.entityType === 'monster' && p.entityId === monster.id && !p.customName
            ? { ...p, customName: `${monster.name} 1` }
            : p
        )
      );
    }

    setParticipants((prev) => [
      ...prev,
      {
        entityType: 'monster',
        entityId: monster.id,
        entityName: monster.name,
        customName,
        tokenImage: monster.tokenImage,
        initiative: 0,
        pvMax: monster.pvMax,
        sanMax: monster.sanMax ?? undefined,
        peMax: 0,
      },
    ]);
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
  };

  const removeParticipant = (index: number) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const updateInitiative = (index: number, value: number) => {
    setParticipants((prev) =>
      prev.map((p, i) => (i === index ? { ...p, initiative: value } : p))
    );
  };

  const rollInitiative = (index: number) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    updateInitiative(index, roll);
    toast.success(`Rolou ${roll} na iniciativa!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Nome do combate é obrigatório');
      return;
    }

    if (participants.length < 2) {
      toast.error('Adicione pelo menos 2 participantes');
      return;
    }

    setLoading(true);
    try {
      await combatApi.create({
        name: name.trim(),
        participants: participants.map((p) => ({
          entityType: p.entityType,
          entityId: p.entityId,
          customName: p.customName,
          initiative: p.initiative,
        })),
      });
      toast.success('Combate criado!');
      onSuccess();
      resetForm();
    } catch (error) {
      toast.error('Erro ao criar combate');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
    setParticipants([]);
  };

  return (
    <Dialog.Root open={open} onOpenChange={(open) => {
      if (!open) resetForm();
      onOpenChange(open);
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Novo Combate
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-130px)]">
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Combat Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Nome do Combate *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  placeholder="Ex: Emboscada na floresta"
                />
              </div>

              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Adicionar Participantes
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-foreground"
                    placeholder="Buscar personagens ou monstros..."
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={18} />
                  )}
                </div>

                {/* Search Results */}
                {(searchResults.characters.length > 0 || searchResults.monsters.length > 0) && (
                  <div className="mt-2 bg-background border border-border rounded-md max-h-48 overflow-y-auto">
                    {searchResults.characters.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Users size={12} />
                          Personagens
                        </div>
                        {searchResults.characters.map((char) => (
                          <button
                            key={char.id}
                            type="button"
                            onClick={() => addCharacterParticipant(char)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <TokenAvatar src={char.tokenImage} name={char.name} size="xs" />
                            <span className="text-foreground">{char.name}</span>
                            <Plus size={16} className="ml-auto text-accent" />
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.monsters.length > 0 && (
                      <div>
                        <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Bug size={12} />
                          Monstros
                        </div>
                        {searchResults.monsters.map((monster) => (
                          <button
                            key={monster.id}
                            type="button"
                            onClick={() => addMonsterParticipant(monster)}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted transition-colors"
                          >
                            <TokenAvatar src={monster.tokenImage} name={monster.name} size="xs" />
                            <span className="text-foreground">{monster.name}</span>
                            <Plus size={16} className="ml-auto text-accent" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Participants List */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Participantes ({participants.length})
                </label>
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border border-dashed border-border rounded-md">
                    <Users size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Busque e adicione participantes acima</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {participants.map((participant, index) => (
                      <div
                        key={`${participant.entityType}-${participant.entityId}-${index}`}
                        className="flex items-center gap-3 p-3 bg-background border border-border rounded-md"
                      >
                        <TokenAvatar
                          src={participant.tokenImage}
                          name={participant.customName || participant.entityName}
                          size="sm"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {participant.customName || participant.entityName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {participant.entityType === 'character' ? 'Personagem' : 'Monstro'}
                            {' • '}PV: {participant.pvMax}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={participant.initiative}
                            onChange={(e) => updateInitiative(index, parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 bg-surface border border-border rounded text-center text-foreground"
                            placeholder="Init"
                          />
                          <button
                            type="button"
                            onClick={() => rollInitiative(index)}
                            className="p-1.5 text-accent hover:bg-accent/20 rounded"
                            title="Rolar d20"
                          >
                            <Dices size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeParticipant(index)}
                            className="p-1.5 text-danger hover:bg-danger/20 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-border">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || participants.length < 2}
                className={cn(
                  'px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Iniciar Combate
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
