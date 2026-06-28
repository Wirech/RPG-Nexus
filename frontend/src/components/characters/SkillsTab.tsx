import { useState, useEffect, useCallback, useMemo } from 'react';
import { SkillRow, SkillGroup } from '../shared';
import { ConfirmDialog } from '../shared';
import type { Character, CharacterSkill } from '../../types';
import {
  getCharacterSkills,
  createCharacterSkill,
  updateCharacterSkill,
  deleteCharacterSkill,
} from '../../services/characterDetailApi';
import { cn } from '@/lib/utils';

interface SkillsTabProps {
  character: Character;
  isAdmin: boolean;
  onRefresh?: () => void;
}

type ViewMode = 'list' | 'grouped';
type AttributeKey = 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor';

const attributeLabels: Record<AttributeKey, string> = {
  forca: 'Força',
  agilidade: 'Agilidade',
  intelecto: 'Intelecto',
  presenca: 'Presença',
  vigor: 'Vigor',
};

export function SkillsTab({ character, isAdmin, onRefresh }: SkillsTabProps) {
  const [skills, setSkills] = useState<CharacterSkill[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('grouped');
  const [searchTerm, setSearchTerm] = useState('');
  const [showTrainedOnly, setShowTrainedOnly] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Diálogos
  const [showCreateSkill, setShowCreateSkill] = useState(false);
  const [editingSkill, setEditingSkill] = useState<CharacterSkill | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<CharacterSkill | null>(null);

  // Form state
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillAttribute, setNewSkillAttribute] = useState<AttributeKey>('intelecto');
  const [newSkillTraining, setNewSkillTraining] = useState<CharacterSkill['training']>('destreinado');

  // Mapa de atributos do personagem
  const attributeValues: Record<AttributeKey, number> = useMemo(() => ({
    forca: character.attrForca,
    agilidade: character.attrAgilidade,
    intelecto: character.attrIntelecto,
    presenca: character.attrPresenca,
    vigor: character.attrVigor,
  }), [character]);

  // Carregar perícias
  const loadSkills = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCharacterSkills(character.id);
      setSkills(data);
    } catch (error) {
      console.error('Erro ao carregar perícias:', error);
    } finally {
      setLoading(false);
    }
  }, [character.id]);

  useEffect(() => {
    loadSkills();
  }, [loadSkills]);

  // Handlers
  const handleCreateSkill = async () => {
    if (!newSkillName.trim()) return;
    try {
      await createCharacterSkill(character.id, {
        name: newSkillName.trim(),
        attribute: newSkillAttribute,
        training: newSkillTraining,
      });
      setNewSkillName('');
      setNewSkillAttribute('intelecto');
      setNewSkillTraining('destreinado');
      setShowCreateSkill(false);
      await loadSkills();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao criar perícia:', error);
    }
  };

  const handleUpdateTraining = async (skill: CharacterSkill, training: CharacterSkill['training']) => {
    try {
      await updateCharacterSkill(character.id, skill.id, { training });
      await loadSkills();
    } catch (error) {
      console.error('Erro ao atualizar treinamento:', error);
    }
  };

  const handleToggleSpecialization = async (skill: CharacterSkill) => {
    try {
      await updateCharacterSkill(character.id, skill.id, { 
        hasSpecialization: !skill.hasSpecialization,
        specializationName: !skill.hasSpecialization ? 'Especialização' : null,
      });
      await loadSkills();
    } catch (error) {
      console.error('Erro ao toggle especialização:', error);
    }
  };

  const handleDeleteSkill = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteCharacterSkill(character.id, deleteConfirm.id);
      setDeleteConfirm(null);
      await loadSkills();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao remover perícia:', error);
    }
  };

  const handleRollSkill = (skill: CharacterSkill) => {
    // TODO: Implementar rolagem de dados
    const attrValue = attributeValues[skill.attribute];
    const trainBonus = skill.training === 'destreinado' ? 0 : 
                       skill.training === 'treinado' ? 5 :
                       skill.training === 'veterano' ? 10 : 15;
    const total = attrValue + trainBonus + (skill.otherBonus || 0) + (skill.bonusModifier || 0);
    console.log(`Rolando ${skill.name}: d20 + ${total}`);
    alert(`Rolando ${skill.name}: d20 + ${total}`);
  };

  const toggleGroupCollapse = (attr: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(attr)) {
      newCollapsed.delete(attr);
    } else {
      newCollapsed.add(attr);
    }
    setCollapsedGroups(newCollapsed);
  };

  // Filtrar perícias
  const filteredSkills = skills.filter((skill) => {
    if (searchTerm && !skill.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (showTrainedOnly && skill.training === 'destreinado') return false;
    return true;
  });

  // Agrupar por atributo
  const skillsByAttribute = filteredSkills.reduce((acc, skill) => {
    const key = skill.attribute;
    if (!acc[key]) acc[key] = [];
    acc[key].push(skill);
    return acc;
  }, {} as Record<AttributeKey, CharacterSkill[]>);

  // Estatísticas
  const trainedCount = skills.filter((s) => s.training !== 'destreinado').length;
  const specializedCount = skills.filter((s) => s.hasSpecialization).length;
  const customCount = skills.filter((s) => !s.isOfficial).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Estatísticas */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400">
              <span className="text-zinc-200 font-medium">{skills.length}</span> perícias
            </span>
            <span className="text-green-400">
              <span className="font-medium">{trainedCount}</span> treinadas
            </span>
            {specializedCount > 0 && (
              <span className="text-yellow-400">
                <span className="font-medium">{specializedCount}</span> especializações
              </span>
            )}
            {customCount > 0 && (
              <span className="text-violet-400">
                <span className="font-medium">{customCount}</span> customizadas
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Modo de visualização */}
          <div className="flex items-center bg-zinc-800 rounded-lg">
            <button
              onClick={() => setViewMode('grouped')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-l-lg transition-colors',
                viewMode === 'grouped' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-400'
              )}
            >
              Por Atributo
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-r-lg transition-colors',
                viewMode === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-400'
              )}
            >
              Lista
            </button>
          </div>
        </div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar perícia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrainedOnly}
            onChange={(e) => setShowTrainedOnly(e.target.checked)}
            className="rounded bg-zinc-800 border-zinc-600"
          />
          Apenas treinadas
        </label>

        <div className="flex-1" />

        {isAdmin && (
          <button
            onClick={() => setShowCreateSkill(true)}
            className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Perícia Custom
          </button>
        )}
      </div>

      {/* Lista de perícias */}
      {viewMode === 'grouped' ? (
        <div className="space-y-4">
          {(['forca', 'agilidade', 'intelecto', 'presenca', 'vigor'] as AttributeKey[]).map((attr) => {
            const attrSkills = skillsByAttribute[attr];
            if (!attrSkills?.length) return null;

            return (
              <SkillGroup
                key={attr}
                attribute={attr}
                skills={attrSkills}
                attributeValue={attributeValues[attr]}
                onEditSkill={isAdmin ? (s) => setEditingSkill(s) : undefined}
                onRollSkill={handleRollSkill}
                isAdmin={isAdmin}
                collapsed={collapsedGroups.has(attr)}
                onToggleCollapse={() => toggleGroupCollapse(attr)}
              />
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredSkills
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((skill) => (
              <SkillRow
                key={skill.id}
                skill={skill}
                attributeValue={attributeValues[skill.attribute]}
                onEdit={isAdmin ? () => setEditingSkill(skill) : undefined}
                onRoll={() => handleRollSkill(skill)}
                isAdmin={isAdmin}
              />
            ))}
        </div>
      )}

      {filteredSkills.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          Nenhuma perícia encontrada.
        </div>
      )}

      {/* Modal criar perícia customizada */}
      {showCreateSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Criar Perícia Customizada</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ex: Hacking"
                />
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Atributo</label>
                <select
                  value={newSkillAttribute}
                  onChange={(e) => setNewSkillAttribute(e.target.value as AttributeKey)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                >
                  {Object.entries(attributeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Treinamento</label>
                <select
                  value={newSkillTraining}
                  onChange={(e) => setNewSkillTraining(e.target.value as CharacterSkill['training'])}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                >
                  <option value="destreinado">Destreinado</option>
                  <option value="treinado">Treinado (+5)</option>
                  <option value="veterano">Veterano (+10)</option>
                  <option value="expert">Expert (+15)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateSkill(false)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateSkill}
                disabled={!newSkillName.trim()}
                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar perícia */}
      {editingSkill && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">
              Editar: {editingSkill.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Treinamento</label>
                <select
                  value={editingSkill.training}
                  onChange={(e) => handleUpdateTraining(editingSkill, e.target.value as CharacterSkill['training'])}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                >
                  <option value="destreinado">Destreinado</option>
                  <option value="treinado">Treinado (+5)</option>
                  <option value="veterano">Veterano (+10)</option>
                  <option value="expert">Expert (+15)</option>
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingSkill.hasSpecialization}
                    onChange={() => handleToggleSpecialization(editingSkill)}
                    className="rounded bg-zinc-800 border-zinc-600"
                  />
                  Possui especialização
                </label>
              </div>
              {!editingSkill.isOfficial && (
                <button
                  onClick={() => {
                    setDeleteConfirm(editingSkill);
                    setEditingSkill(null);
                  }}
                  className="w-full px-3 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-sm transition-colors"
                >
                  Remover Perícia Customizada
                </button>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditingSkill(null)}
                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogo de confirmação */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Remover Perícia"
        description={`Deseja remover a perícia customizada "${deleteConfirm?.name}"?`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleDeleteSkill}
        variant="danger"
      />
    </div>
  );
}
