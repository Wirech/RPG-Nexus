import { useEffect, useState, useMemo, useCallback } from 'react';
import { Search, Plus, Users, FolderPlus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical, Copy } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { characterApi } from '@/services/api';
import { CharacterCard, CreateCharacterDialog, CreateGroupDialog } from '@/components/characters';
import { ConfirmDialog } from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Character, CharacterGroup } from '@/types';
import toast from 'react-hot-toast';

// ============================
// TIPOS
// ============================
interface GroupWithHierarchy extends CharacterGroup {
  children?: GroupWithHierarchy[];
  depth: number;
}

interface DragItem {
  type: 'group' | 'character';
  id: string;
  data: CharacterGroup | Character;
}

// ============================
// COMPONENTE SORTABLE DE GRUPO
// ============================
interface SortableGroupItemProps {
  group: GroupWithHierarchy;
  isSelected: boolean;
  isExpanded: boolean;
  onToggleExpand: (groupId: string) => void;
  onSelect: (groupId: string) => void;
  onEdit: (group: CharacterGroup) => void;
  onDelete: (groupId: string) => void;
  getCharacterCount: (groupId: string) => number;
  isAdmin: boolean;
  isOver?: boolean;
}

function SortableGroupItem({
  group,
  isSelected,
  isExpanded,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  getCharacterCount,
  isAdmin,
  isOver,
}: SortableGroupItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `group-${group.id}`,
    data: { type: 'group', group },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    paddingLeft: `${group.depth * 16 + 8}px`,
  };

  const hasChildren = group.children && group.children.length > 0;
  const count = getCharacterCount(group.id);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative',
        isDragging && 'opacity-50',
        isOver && 'bg-accent/10 ring-2 ring-accent ring-inset rounded-md'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between pr-2 py-1.5 rounded-md transition-colors cursor-pointer',
          isSelected
            ? 'bg-accent/20 text-accent'
            : 'hover:bg-muted text-foreground'
        )}
      >
        {/* Drag handle + Expand button */}
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {isAdmin && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 cursor-grab hover:bg-background rounded touch-none"
              title="Arrastar grupo"
            >
              <GripVertical size={14} className="text-muted-foreground" />
            </button>
          )}

          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand(group.id);
              }}
              className="p-0.5 hover:bg-background rounded"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-muted-foreground" />
              ) : (
                <ChevronRight size={14} className="text-muted-foreground" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div
            onClick={() => onSelect(group.id)}
            className="flex items-center gap-2 min-w-0 flex-1"
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: group.color || '#7c3aed' }}
            />
            <span className="truncate">{group.name}</span>
          </div>
        </div>

        {/* Count and actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-sm text-muted-foreground font-mono">
            {String(count).padStart(2, '0')}
          </span>
          {isAdmin && (
            <div className="hidden group-hover:flex items-center">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(group);
                }}
                className="p-1 hover:bg-background rounded"
                title="Editar"
              >
                <Pencil size={14} className="text-muted-foreground" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(group.id);
                }}
                className="p-1 hover:bg-background rounded"
                title="Excluir"
              >
                <Trash2 size={14} className="text-danger" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// COMPONENTE PRINCIPAL
// ============================
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
  
  // Drag and drop state
  const [activeItem, setActiveItem] = useState<DragItem | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [overGroupId, setOverGroupId] = useState<string | null>(null);
  const [isCopyDrag, setIsCopyDrag] = useState(false);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ============================
  // DATA FETCHING
  // ============================
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

  // ============================
  // HIERARCHY BUILDING
  // ============================
  const buildGroupHierarchy = useCallback((
    groups: CharacterGroup[],
    parentId: string | null = null,
    depth: number = 0
  ): GroupWithHierarchy[] => {
    return groups
      .filter((g) => g.parentId === parentId)
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        depth,
        children: buildGroupHierarchy(groups, group.id, depth + 1),
      }));
  }, []);

  const hierarchicalGroups = useMemo(() => {
    return buildGroupHierarchy(groups);
  }, [groups, buildGroupHierarchy]);

  // Flatten hierarchy for rendering (respecting expanded state)
  const flattenGroups = useCallback((
    groups: GroupWithHierarchy[],
    expanded: Set<string>
  ): GroupWithHierarchy[] => {
    const result: GroupWithHierarchy[] = [];
    for (const group of groups) {
      result.push(group);
      if (group.children && group.children.length > 0 && expanded.has(group.id)) {
        result.push(...flattenGroups(group.children, expanded));
      }
    }
    return result;
  }, []);

  const visibleGroups = useMemo(() => {
    return flattenGroups(hierarchicalGroups, expandedGroups);
  }, [hierarchicalGroups, expandedGroups, flattenGroups]);

  // ============================
  // FILTERING
  // ============================
  const filteredCharacters = useMemo(() => {
    let result = characters;

    // Filter by group (including memberships)
    if (selectedGroupId) {
      result = result.filter((c) => 
        c.groupId === selectedGroupId ||
        c.groupMemberships?.some((m) => m.groupId === selectedGroupId)
      );
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

  // ============================
  // GROUP HANDLERS
  // ============================
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

  const toggleGroupExpand = (groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const getGroupCharacterCount = (groupId: string) => {
    // Count primary + membership
    return characters.filter(
      (c) =>
        c.groupId === groupId ||
        c.groupMemberships?.some((m) => m.groupId === groupId)
    ).length;
  };

  // ============================
  // DRAG AND DROP HANDLERS
  // ============================
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeId = String(active.id);

    // Check if CTRL is pressed for copy mode
    const isCtrlPressed = (event.activatorEvent as KeyboardEvent)?.ctrlKey || false;
    setIsCopyDrag(isCtrlPressed);

    if (activeId.startsWith('group-')) {
      const groupId = activeId.replace('group-', '');
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        setActiveItem({ type: 'group', id: groupId, data: group });
      }
    } else if (activeId.startsWith('character-')) {
      const characterId = activeId.replace('character-', '');
      const character = characters.find((c) => c.id === characterId);
      if (character) {
        setActiveItem({ type: 'character', id: characterId, data: character });
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const overId = String(over.id);
      if (overId.startsWith('group-')) {
        setOverGroupId(overId.replace('group-', ''));
      } else {
        setOverGroupId(null);
      }
    } else {
      setOverGroupId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveItem(null);
    setOverGroupId(null);

    if (!over || !isAdmin) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // GROUP DRAG
    if (activeId.startsWith('group-')) {
      const draggedGroupId = activeId.replace('group-', '');
      
      // Dropping on another group = set as child
      if (overId.startsWith('group-')) {
        const targetGroupId = overId.replace('group-', '');
        
        if (draggedGroupId === targetGroupId) return;

        // Check if target is a descendant of dragged group (prevent circular)
        const isDescendant = (parentId: string, checkId: string): boolean => {
          const children = groups.filter((g) => g.parentId === parentId);
          return children.some((c) => c.id === checkId || isDescendant(c.id, checkId));
        };

        if (isDescendant(draggedGroupId, targetGroupId)) {
          toast.error('Não é possível mover um grupo para dentro de um de seus descendentes');
          return;
        }

        try {
          await characterApi.updateGroup(draggedGroupId, { parentId: targetGroupId });
          setGroups(groups.map((g) =>
            g.id === draggedGroupId ? { ...g, parentId: targetGroupId } : g
          ));
          // Auto-expand parent
          setExpandedGroups((prev) => new Set([...prev, targetGroupId]));
          toast.success('Grupo movido!');
        } catch (error) {
          toast.error('Erro ao mover grupo');
        }
      }
      // TODO: Handle reordering within same level
    }

    // CHARACTER DRAG
    if (activeId.startsWith('character-')) {
      const characterId = activeId.replace('character-', '');
      
      if (overId.startsWith('group-')) {
        const targetGroupId = overId.replace('group-', '');
        const character = characters.find((c) => c.id === characterId);

        if (!character) return;

        // If CTRL was held, add as membership (copy)
        if (isCopyDrag) {
          // Don't add if already primary or membership
          if (character.groupId === targetGroupId) {
            toast.error('Este já é o grupo principal do personagem');
            return;
          }

          const alreadyMember = character.groupMemberships?.some(
            (m) => m.groupId === targetGroupId
          );
          if (alreadyMember) {
            toast.error('Personagem já está neste grupo');
            return;
          }

          try {
            await characterApi.addCharacterToGroup(characterId, targetGroupId);
            toast.success('Personagem adicionado ao grupo!');
            await fetchData(); // Refresh to get updated memberships
          } catch (error) {
            toast.error('Erro ao adicionar personagem ao grupo');
          }
        } else {
          // Move = change primary group
          if (character.groupId === targetGroupId) return;

          try {
            await characterApi.update(characterId, { groupId: targetGroupId });
            setCharacters(characters.map((c) =>
              c.id === characterId ? { ...c, groupId: targetGroupId } : c
            ));
            toast.success('Personagem movido!');
          } catch (error) {
            toast.error('Erro ao mover personagem');
          }
        }
      }
    }

    setIsCopyDrag(false);
  };

  // ============================
  // RENDER
  // ============================
  if (loading) {
    return (
      <div className="flex h-full">
        <div className="w-64 bg-surface border-r border-border p-4 space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-[260px] bg-surface rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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

          <div className="space-y-0.5 flex-1 overflow-y-auto">
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
              <span className="text-sm text-muted-foreground font-mono">{String(characters.length).padStart(2, '0')}</span>
            </button>

            {/* Groups tree */}
            <SortableContext
              items={visibleGroups.map((g) => `group-${g.id}`)}
              strategy={verticalListSortingStrategy}
            >
              {visibleGroups.map((group) => (
                <SortableGroupItem
                  key={group.id}
                  group={group}
                  isSelected={selectedGroupId === group.id}
                  isExpanded={expandedGroups.has(group.id)}
                  onToggleExpand={toggleGroupExpand}
                  onSelect={setSelectedGroupId}
                  onEdit={(g) => {
                    setEditingGroupId(g.id);
                    setEditingGroupName(g.name);
                  }}
                  onDelete={setDeleteGroupId}
                  getCharacterCount={getGroupCharacterCount}
                  isAdmin={isAdmin}
                  isOver={overGroupId === group.id}
                />
              ))}
            </SortableContext>

            {groups.length === 0 && (
              <p className="text-sm text-muted-foreground px-3 py-4">
                Nenhum grupo criado.
              </p>
            )}
          </div>

          {/* Help text for drag */}
          {isAdmin && groups.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground space-y-1">
              <p className="flex items-center gap-1">
                <GripVertical size={12} /> Arraste grupos para reorganizar
              </p>
              <p className="flex items-center gap-1">
                <Copy size={12} /> CTRL+arrastar = adicionar a grupo
              </p>
            </div>
          )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredCharacters.map((character) => {
                const group = groups.find((g) => g.id === character.groupId);
                return (
                  <DraggableCharacterCard
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

        {/* Drag Overlay */}
        <DragOverlay>
          {activeItem?.type === 'group' && (
            <div className="px-3 py-2 bg-surface border border-accent rounded-md shadow-lg">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: (activeItem.data as CharacterGroup).color || '#7c3aed' }}
                />
                <span className="font-medium">{(activeItem.data as CharacterGroup).name}</span>
              </div>
            </div>
          )}
          {activeItem?.type === 'character' && (
            <div className="px-3 py-2 bg-surface border border-accent rounded-md shadow-lg flex items-center gap-2">
              {isCopyDrag && <Copy size={14} className="text-accent" />}
              <span className="font-medium">{(activeItem.data as Character).name}</span>
            </div>
          )}
        </DragOverlay>
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

      {/* Edit Group Name Modal */}
      {editingGroupId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-xl w-80">
            <h3 className="text-lg font-semibold mb-4">Editar Grupo</h3>
            <input
              type="text"
              value={editingGroupName}
              onChange={(e) => setEditingGroupName(e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingGroupId(null)}
                className="px-4 py-2 text-muted-foreground hover:text-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveGroupName(editingGroupId)}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
}

// ============================
// DRAGGABLE CHARACTER CARD
// ============================
interface DraggableCharacterCardProps {
  character: Character;
  isAdmin: boolean;
  groupColor?: string;
}

function DraggableCharacterCard({ character, isAdmin, groupColor }: DraggableCharacterCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `character-${character.id}`,
    data: { type: 'character', character },
    disabled: !isAdmin,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && 'opacity-50')}
    >
      <div className="relative">
        {isAdmin && (
          <button
            {...attributes}
            {...listeners}
            className="absolute -left-2 top-4 p-1 bg-surface border border-border rounded cursor-grab z-10 hover:bg-muted"
            title="Arrastar personagem (CTRL para copiar)"
          >
            <GripVertical size={14} className="text-muted-foreground" />
          </button>
        )}
        <CharacterCard
          character={character}
          isAdmin={isAdmin}
          groupColor={groupColor}
        />
      </div>
    </div>
  );
}
