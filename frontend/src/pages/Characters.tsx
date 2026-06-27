import { useEffect, useState, useMemo } from 'react';
import { Search, Plus, Users, FolderPlus, Pencil, Trash2 } from 'lucide-react';
import { characterApi } from '@/services/api';
import { CharacterCard, CreateCharacterDialog, CreateGroupDialog } from '@/components/characters';
import { ConfirmDialog } from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Character, CharacterGroup } from '@/types';
import toast from 'react-hot-toast';

export function Characters() {
  const { isAdmin } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [groups, setGroups] = useState<CharacterGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [createCharacterOpen, setCreateCharacterOpen] = useState(false);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  const fetchData = async () => {
    try {
      const [charactersRes, groupsRes] = await Promise.all([
        characterApi.list(),
        characterApi.listGroups(),
      ]);
      setCharacters(charactersRes.data || []);
      setGroups(groupsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch characters:', error);
      toast.error('Erro ao carregar personagens');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCharacters = useMemo(() => {
    let result = characters;

    // Filter by group
    if (selectedGroupId) {
      result = result.filter((c) => c.groupId === selectedGroupId);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(query) ||
        c.trilha?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [characters, selectedGroupId, searchQuery]);

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;

    const group = groups.find((g) => g.id === deleteGroupId);
    const hasCharacters = characters.some((c) => c.groupId === deleteGroupId);

    if (hasCharacters) {
      toast.error('Não é possível excluir um grupo que possui personagens. Mova-os primeiro.');
      setDeleteGroupId(null);
      return;
    }

    try {
      await characterApi.deleteGroup(deleteGroupId);
      toast.success(`Grupo "${group?.name}" excluído!`);
      setGroups(groups.filter((g) => g.id !== deleteGroupId));
      if (selectedGroupId === deleteGroupId) {
        setSelectedGroupId(null);
      }
    } catch (error) {
      toast.error('Erro ao excluir grupo');
    } finally {
      setDeleteGroupId(null);
    }
  };

  const handleSaveGroupName = async (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    if (!group || editingGroupName.trim() === group.name) {
      setEditingGroupId(null);
      return;
    }

    try {
      await characterApi.updateGroup(groupId, { name: editingGroupName.trim() });
      setGroups(groups.map((g) =>
        g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
      ));
      toast.success('Grupo atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar grupo');
    } finally {
      setEditingGroupId(null);
    }
  };

  const getGroupCharacterCount = (groupId: string) => {
    return characters.filter((c) => c.groupId === groupId).length;
  };

  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-64 bg-surface border-r border-border p-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-48 bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar - Groups */}
      <div className="w-64 bg-surface border-r border-border p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Users size={18} />
            Grupos
          </h2>
          {isAdmin && (
            <button
              onClick={() => setCreateGroupOpen(true)}
              className="p-1.5 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              title="Criar grupo"
            >
              <FolderPlus size={18} />
            </button>
          )}
        </div>

        <div className="space-y-1 flex-1 overflow-y-auto">
          {/* All option */}
          <button
            onClick={() => setSelectedGroupId(null)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left',
              selectedGroupId === null
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-muted text-foreground'
            )}
          >
            <span>Todos</span>
            <span className="text-sm text-muted-foreground">{characters.length}</span>
          </button>

          {/* Groups list */}
          {groups.map((group) => (
            <div key={group.id} className="group">
              {editingGroupId === group.id ? (
                <div className="flex items-center gap-1 px-2">
                  <input
                    type="text"
                    value={editingGroupName}
                    onChange={(e) => setEditingGroupName(e.target.value)}
                    onBlur={() => handleSaveGroupName(group.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveGroupName(group.id);
                      if (e.key === 'Escape') setEditingGroupId(null);
                    }}
                    className="flex-1 px-2 py-1 bg-background border border-border rounded text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left',
                    selectedGroupId === group.id
                      ? 'bg-accent/20 text-accent'
                      : 'hover:bg-muted text-foreground'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: group.color || '#7c3aed' }}
                    />
                    <span className="truncate">{group.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">
                      {getGroupCharacterCount(group.id)}
                    </span>
                    {isAdmin && (
                      <div className="hidden group-hover:flex items-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingGroupId(group.id);
                            setEditingGroupName(group.name);
                          }}
                          className="p-1 hover:bg-background rounded"
                          title="Editar"
                        >
                          <Pencil size={14} className="text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteGroupId(group.id);
                          }}
                          className="p-1 hover:bg-background rounded"
                          title="Excluir"
                        >
                          <Trash2 size={14} className="text-danger" />
                        </button>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </div>
          ))}

          {groups.length === 0 && (
            <p className="text-sm text-muted-foreground px-3 py-4">
              Nenhum grupo criado.
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4 flex-1">
            <h1 className="text-2xl font-bold text-foreground">Personagens</h1>
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome ou trilha..."
                className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setCreateCharacterOpen(true)}
              disabled={groups.length === 0}
              className={cn(
                'flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors',
                groups.length === 0 && 'opacity-50 cursor-not-allowed'
              )}
              title={groups.length === 0 ? 'Crie um grupo primeiro' : undefined}
            >
              <Plus size={18} />
              Novo Personagem
            </button>
          )}
        </div>

        {/* Characters Grid */}
        {filteredCharacters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Users size={48} className="mb-4 opacity-50" />
            <p className="text-lg">Nenhum personagem encontrado</p>
            {searchQuery && (
              <p className="text-sm mt-1">Tente ajustar os filtros de busca</p>
            )}
            {isAdmin && !searchQuery && groups.length > 0 && (
              <button
                onClick={() => setCreateCharacterOpen(true)}
                className="mt-4 text-accent hover:underline"
              >
                Criar primeiro personagem
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCharacters.map((character) => {
              const group = groups.find((g) => g.id === character.groupId);
              return (
                <CharacterCard
                  key={character.id}
                  character={character}
                  isAdmin={isAdmin}
                  groupColor={group?.color || undefined}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateCharacterDialog
        open={createCharacterOpen}
        onOpenChange={setCreateCharacterOpen}
        groups={groups}
        onSuccess={fetchData}
      />

      <CreateGroupDialog
        open={createGroupOpen}
        onOpenChange={setCreateGroupOpen}
        onSuccess={fetchData}
      />

      <ConfirmDialog
        open={deleteGroupId !== null}
        onOpenChange={(open) => !open && setDeleteGroupId(null)}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir o grupo "${groups.find((g) => g.id === deleteGroupId)?.name}"?`}
        confirmText="Excluir"
        onConfirm={handleDeleteGroup}
      />
    </div>
  );
}
