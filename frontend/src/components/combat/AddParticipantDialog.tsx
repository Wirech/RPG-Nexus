import { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Search, Plus, Dices, Users, Bug } from 'lucide-react';
import { combatApi, characterApi, monsterApi } from '@/services/api';
import { TokenAvatar } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Character, Monster } from '@/types';
import toast from 'react-hot-toast';

interface AddParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combatId: string;
  onSuccess: () => void;
}

export function AddParticipantDialog({
  open,
  onOpenChange,
  combatId,
  onSuccess,
}: AddParticipantDialogProps) {
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    characters: Character[];
    monsters: Monster[];
  }>({ characters: [], monsters: [] });
  
  const [selected, setSelected] = useState<{
    entityType: 'character' | 'monster';
    entityId: string;
    entityName: string;
    tokenImage?: string | null;
    initiative: number;
  } | null>(null);

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
    const timeoutId = setTimeout(() => handleSearch(value), 300);
    return () => clearTimeout(timeoutId);
  };

  const selectCharacter = (character: Character) => {
    setSelected({
      entityType: 'character',
      entityId: character.id,
      entityName: character.name,
      tokenImage: character.tokenImage,
      initiative: 0,
    });
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
  };

  const selectMonster = (monster: Monster) => {
    setSelected({
      entityType: 'monster',
      entityId: monster.id,
      entityName: monster.name,
      tokenImage: monster.tokenImage,
      initiative: 0,
    });
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
  };

  const rollInitiative = () => {
    if (!selected) return;
    const roll = Math.floor(Math.random() * 20) + 1;
    setSelected({ ...selected, initiative: roll });
    toast.success(`Rolou ${roll} na iniciativa!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selected) {
      toast.error('Selecione um participante');
      return;
    }

    setLoading(true);
    try {
      await combatApi.addParticipant(combatId, {
        entityType: selected.entityType,
        entityId: selected.entityId,
        initiative: selected.initiative,
      });
      toast.success('Participante adicionado!');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao adicionar participante');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSearchQuery('');
    setSearchResults({ characters: [], monsters: [] });
    setSelected(null);
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) resetForm();
        onOpenChange(isOpen);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Adicionar Participante
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Search */}
            {!selected && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Buscar Participante
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
                            onClick={() => selectCharacter(char)}
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
                            onClick={() => selectMonster(monster)}
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
            )}

            {/* Selected Participant */}
            {selected && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Participante Selecionado
                </label>
                <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-md">
                  <TokenAvatar
                    src={selected.tokenImage}
                    name={selected.entityName}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{selected.entityName}</p>
                    <p className="text-xs text-muted-foreground">
                      {selected.entityType === 'character' ? 'Personagem' : 'Monstro'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="p-1 text-muted-foreground hover:text-danger"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Initiative */}
                <div className="mt-3">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Iniciativa
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={selected.initiative}
                      onChange={(e) => setSelected({ ...selected, initiative: parseInt(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 bg-background border border-border rounded-md text-foreground"
                      placeholder="Valor da iniciativa"
                    />
                    <button
                      type="button"
                      onClick={rollInitiative}
                      className="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
                    >
                      <Dices size={16} />
                      Rolar d20
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !selected}
                className={cn(
                  'px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Adicionar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
