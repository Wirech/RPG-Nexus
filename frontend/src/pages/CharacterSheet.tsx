import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowLeft,
  Camera,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Pencil,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import { characterApi, auditApi } from '@/services/api';
import {
  VitalBar,
  ConditionBadge,
  TokenAvatar,
  DiceDisplay,
  RichTextEditor,
  ConfirmDialog,
} from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn, formatDate } from '@/lib/utils';
import type {
  Character,
  CharacterSkill,
  AuditLog,
  DiceValue,
  CharacterRole,
  ConditionType,
  ElementType,
} from '@/types';
import toast from 'react-hot-toast';

const DICE_VALUES: DiceValue[] = ['d4', 'd6', 'd8', 'd10' as DiceValue, 'd12', 'd20'];
const TRILHAS: CharacterRole[] = ['Combatente', 'Especialista', 'Ocultista'];
const NEX_VALUES = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'];

const CONDITIONS: ConditionType[] = [
  'Abalado', 'Alquebrado', 'Apavorado', 'Atordoado', 'Cego', 'Confuso',
  'Debilitado', 'Desprevenido', 'Exausto', 'Fascinado', 'Fraco', 'Imóvel',
  'Inconsciente', 'Lento', 'Morto', 'Paralisado', 'Pressionado', 'Sangrando',
  'Surdo', 'Vulnerável',
];

const ITEM_CATEGORIES = ['arma', 'proteção', 'item', 'consumível'] as const;

const SKILLS_BY_ATTR: Record<string, string[]> = {
  forca: ['Atletismo', 'Luta', 'Intimidação'],
  agilidade: ['Acrobacia', 'Furtividade', 'Pilotagem', 'Pontaria', 'Reflexos'],
  intelecto: ['Atualidades', 'Ciências', 'Crimes', 'Investigação', 'Medicina', 'Ocultismo', 'Percepção', 'Tecnologia'],
  presenca: ['Artes', 'Diplomacia', 'Enganação', 'Intuição', 'Liderança', 'Persuasão'],
  vigor: ['Fortitude'],
};

const ELEMENTS: ElementType[] = ['Morte', 'Sangue', 'Energia', 'Conhecimento', 'Medo'];

const ELEMENT_COLORS: Record<ElementType, string> = {
  Morte: 'bg-gray-700 text-gray-100',
  Sangue: 'bg-red-700 text-red-100',
  Energia: 'bg-blue-600 text-blue-100',
  Conhecimento: 'bg-amber-600 text-amber-100',
  Medo: 'bg-purple-700 text-purple-100',
};

export function CharacterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin, linkedCharacterId } = useAuth();

  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Editing states
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [historyContent, setHistoryContent] = useState('');
  const [historySummary, setHistorySummary] = useState('');
  const [hasUnsavedHistory, setHasUnsavedHistory] = useState(false);

  // Audit logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [auditPage, setAuditPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);

  // Dialogs
  const [addConditionOpen, setAddConditionOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [addAbilityOpen, setAddAbilityOpen] = useState(false);
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = linkedCharacterId === id;
  const canEdit = isAdmin;
  const canEditVitals = isAdmin || isOwner;

  // Debounce auto-save for history
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCharacter = useCallback(async () => {
    if (!id) return;
    try {
      const response = await characterApi.getById(id);
      setCharacter(response.data);
      setNameValue(response.data.name);
      setHistoryContent(response.data.historyFull || '');
      setHistorySummary(response.data.historySummary || '');
    } catch (error) {
      toast.error('Erro ao carregar personagem');
      navigate('/characters');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchAuditLogs = useCallback(async () => {
    if (!id || !isAdmin) return;
    try {
      const response = await auditApi.getByEntity('character', id, 50);
      setAuditLogs(response.data || []);
      setAuditTotal(response.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  }, [id, isAdmin, auditPage]);

  useEffect(() => {
    fetchCharacter();
  }, [fetchCharacter]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAuditLogs();
    }
  }, [activeTab, fetchAuditLogs]);

  // Auto-save history
  useEffect(() => {
    if (!hasUnsavedHistory || !canEdit) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await characterApi.update(id!, {
          historyFull: historyContent,
          historySummary,
        });
        setHasUnsavedHistory(false);
        toast.success('História salva');
      } catch (error) {
        toast.error('Erro ao salvar história');
      } finally {
        setSaving(false);
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [historyContent, historySummary, hasUnsavedHistory, id, canEdit]);

  const handleUpdateVital = async (field: 'pv' | 'san' | 'pe', delta: number) => {
    if (!character || !canEditVitals) return;

    const maxField = `${field}Max` as const;
    const currentField = `${field}Current` as const;
    const max = character[maxField];
    const current = character[currentField];
    const newValue = Math.max(0, Math.min(max, current + delta));

    try {
      await characterApi.updateVitals(character.id, field, delta);
      setCharacter({ ...character, [currentField]: newValue });
    } catch (error) {
      toast.error('Erro ao atualizar vital');
    }
  };

  const handleUpdateAttribute = async (attr: string, value: DiceValue) => {
    if (!character || !canEdit) return;

    try {
      await characterApi.update(character.id, { [attr]: value });
      setCharacter({ ...character, [attr]: value });
      toast.success('Atributo atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar atributo');
    }
  };

  const handleSaveName = async () => {
    if (!character || !canEdit || !nameValue.trim()) return;

    try {
      await characterApi.update(character.id, { name: nameValue.trim() });
      setCharacter({ ...character, name: nameValue.trim() });
      setEditingName(false);
      toast.success('Nome atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar nome');
    }
  };

  const handleAddCondition = async (condition: ConditionType) => {
    if (!character || !canEdit) return;
    if (character.conditions.includes(condition)) {
      toast.error('Condição já adicionada');
      return;
    }

    const newConditions = [...character.conditions, condition];
    try {
      await characterApi.updateConditions(character.id, newConditions);
      setCharacter({ ...character, conditions: newConditions });
      setAddConditionOpen(false);
      toast.success(`Condição "${condition}" adicionada`);
    } catch (error) {
      toast.error('Erro ao adicionar condição');
    }
  };

  const handleRemoveCondition = async (condition: string) => {
    if (!character || !canEdit) return;

    const newConditions = character.conditions.filter((c) => c !== condition);
    try {
      await characterApi.updateConditions(character.id, newConditions);
      setCharacter({ ...character, conditions: newConditions });
      toast.success(`Condição "${condition}" removida`);
    } catch (error) {
      toast.error('Erro ao remover condição');
    }
  };

  const handleTokenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !character || !canEdit) return;

    try {
      const response = await characterApi.uploadToken(character.id, file);
      setCharacter({ ...character, tokenImage: response.data.tokenImage });
      toast.success('Token atualizado');
    } catch (error) {
      toast.error('Erro ao fazer upload do token');
    }
  };

  const handleToggleReveal = async () => {
    if (!character || !canEdit) return;

    try {
      await characterApi.update(character.id, { isRevealed: !character.isRevealed });
      setCharacter({ ...character, isRevealed: !character.isRevealed });
      setRevealDialogOpen(false);
      toast.success(character.isRevealed ? 'Personagem ocultado' : 'Personagem revelado');
    } catch (error) {
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const handleDelete = async () => {
    if (!character || !canEdit) return;

    try {
      await characterApi.delete(character.id);
      toast.success('Personagem excluído');
      navigate('/characters');
    } catch (error) {
      toast.error('Erro ao excluir personagem');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Personagem não encontrado</p>
      </div>
    );
  }

  const isDead = character.conditions.includes('Morto');

  return (
    <div className={cn('space-y-6', isDead && 'opacity-60')}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/characters')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRevealDialogOpen(true)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
                character.isRevealed
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {character.isRevealed ? <Eye size={16} /> : <EyeOff size={16} />}
              {character.isRevealed ? 'Revelado' : 'Oculto'}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2 text-danger hover:bg-danger/20 rounded-md transition-colors"
              title="Excluir personagem"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          {[
            { value: 'overview', label: 'Visão Geral' },
            { value: 'story', label: 'História' },
            { value: 'inventory', label: 'Inventário' },
            { value: 'abilities', label: 'Habilidades & Rituais' },
            { value: 'skills', label: 'Perícias' },
            ...(isAdmin ? [{ value: 'history', label: 'Histórico' }] : []),
          ].map((tab) => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className={cn(
                'px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.value
                  ? 'text-accent border-accent'
                  : 'text-muted-foreground border-transparent hover:text-foreground'
              )}
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        {/* Overview Tab */}
        <Tabs.Content value="overview">
          <OverviewTab
            character={character}
            canEdit={canEdit}
            canEditVitals={canEditVitals}
            editingName={editingName}
            nameValue={nameValue}
            setEditingName={setEditingName}
            setNameValue={setNameValue}
            handleSaveName={handleSaveName}
            handleUpdateVital={handleUpdateVital}
            handleUpdateAttribute={handleUpdateAttribute}
            handleAddCondition={() => setAddConditionOpen(true)}
            handleRemoveCondition={handleRemoveCondition}
            fileInputRef={fileInputRef}
            handleTokenUpload={handleTokenUpload}
            setCharacter={setCharacter}
          />
        </Tabs.Content>

        {/* Story Tab */}
        <Tabs.Content value="story">
          <StoryTab
            character={character}
            canEdit={canEdit}
            historySummary={historySummary}
            historyContent={historyContent}
            hasUnsavedHistory={hasUnsavedHistory}
            saving={saving}
            setHistorySummary={(val) => {
              setHistorySummary(val);
              setHasUnsavedHistory(true);
            }}
            setHistoryContent={(val) => {
              setHistoryContent(val);
              setHasUnsavedHistory(true);
            }}
          />
        </Tabs.Content>

        {/* Inventory Tab */}
        <Tabs.Content value="inventory">
          <InventoryTab
            character={character}
            canEdit={canEdit || isOwner}
            onAddItem={() => setAddItemOpen(true)}
            onRefresh={fetchCharacter}
          />
        </Tabs.Content>

        {/* Abilities Tab */}
        <Tabs.Content value="abilities">
          <AbilitiesTab
            character={character}
            canEdit={canEdit}
            onAddAbility={() => setAddAbilityOpen(true)}
            onRefresh={fetchCharacter}
          />
        </Tabs.Content>

        {/* Skills Tab */}
        <Tabs.Content value="skills">
          <SkillsTab
            character={character}
            canEdit={canEdit}
            onAddSkill={() => setAddSkillOpen(true)}
            onRefresh={fetchCharacter}
          />
        </Tabs.Content>

        {/* Audit History Tab */}
        {isAdmin && (
          <Tabs.Content value="history">
            <AuditTab
              logs={auditLogs}
              page={auditPage}
              total={auditTotal}
              onPageChange={setAuditPage}
            />
          </Tabs.Content>
        )}
      </Tabs.Root>

      {/* Dialogs */}
      <AddConditionDialog
        open={addConditionOpen}
        onOpenChange={setAddConditionOpen}
        currentConditions={character.conditions}
        onAdd={handleAddCondition}
      />

      <AddItemDialog
        open={addItemOpen}
        onOpenChange={setAddItemOpen}
        characterId={character.id}
        onSuccess={fetchCharacter}
      />

      <AddAbilityDialog
        open={addAbilityOpen}
        onOpenChange={setAddAbilityOpen}
        characterId={character.id}
        onSuccess={fetchCharacter}
      />

      <AddSkillDialog
        open={addSkillOpen}
        onOpenChange={setAddSkillOpen}
        characterId={character.id}
        existingSkills={character.skills || []}
        onSuccess={fetchCharacter}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Personagem"
        description={`Tem certeza que deseja excluir "${character.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        title={character.isRevealed ? 'Ocultar Personagem' : 'Revelar Personagem'}
        description={
          character.isRevealed
            ? `Ocultar "${character.name}" dos jogadores?`
            : `Revelar "${character.name}" para todos os jogadores?`
        }
        confirmText={character.isRevealed ? 'Ocultar' : 'Revelar'}
        onConfirm={handleToggleReveal}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Overview Tab Component
// ─────────────────────────────────────────

interface OverviewTabProps {
  character: Character;
  canEdit: boolean;
  canEditVitals: boolean;
  editingName: boolean;
  nameValue: string;
  setEditingName: (val: boolean) => void;
  setNameValue: (val: string) => void;
  handleSaveName: () => void;
  handleUpdateVital: (field: 'pv' | 'san' | 'pe', delta: number) => void;
  handleUpdateAttribute: (attr: string, value: DiceValue) => void;
  handleAddCondition: () => void;
  handleRemoveCondition: (condition: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleTokenUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setCharacter: (char: Character) => void;
}

function OverviewTab({
  character,
  canEdit,
  canEditVitals,
  editingName,
  nameValue,
  setEditingName,
  setNameValue,
  handleSaveName,
  handleUpdateVital,
  handleUpdateAttribute,
  handleAddCondition,
  handleRemoveCondition,
  fileInputRef,
  handleTokenUpload,
  setCharacter,
}: OverviewTabProps) {
  const [editingTrilha, setEditingTrilha] = useState(false);
  const [editingNex, setEditingNex] = useState(false);

  const handleUpdateField = async (field: string, value: string) => {
    try {
      await characterApi.update(character.id, { [field]: value || null });
      setCharacter({ ...character, [field]: value || null });
      toast.success('Atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Token */}
      <div className="lg:col-span-1">
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="relative group mx-auto w-48 h-48">
            <TokenAvatar
              src={character.tokenImage}
              name={character.name}
              size="xl"
            />
            {canEdit && (
              <>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                >
                  <Camera size={32} className="text-white" />
                </button>
                <input
                  ref={fileInputRef as React.RefObject<HTMLInputElement>}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleTokenUpload}
                  className="hidden"
                />
              </>
            )}
          </div>

          {/* Name */}
          <div className="mt-4 text-center">
            {editingName ? (
              <div className="flex items-center justify-center gap-2">
                <input
                  type="text"
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="px-2 py-1 bg-background border border-border rounded text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent"
                  autoFocus
                />
                <button onClick={handleSaveName} className="text-success">
                  <Check size={18} />
                </button>
                <button onClick={() => setEditingName(false)} className="text-danger">
                  <X size={18} />
                </button>
              </div>
            ) : (
              <h2
                className={cn(
                  'text-2xl font-bold text-foreground',
                  canEdit && 'cursor-pointer hover:text-accent'
                )}
                onClick={() => canEdit && setEditingName(true)}
              >
                {character.name}
                {canEdit && <Pencil size={14} className="inline ml-2 opacity-50" />}
              </h2>
            )}
          </div>

          {/* Trilha & NEX */}
          <div className="mt-4 flex justify-center gap-4 text-sm">
            {editingTrilha ? (
              <select
                value={character.trilha || ''}
                onChange={(e) => {
                  handleUpdateField('trilha', e.target.value);
                  setEditingTrilha(false);
                }}
                onBlur={() => setEditingTrilha(false)}
                className="px-2 py-1 bg-background border border-border rounded text-foreground"
                autoFocus
              >
                <option value="">Sem trilha</option>
                {TRILHAS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  'text-muted-foreground',
                  canEdit && 'cursor-pointer hover:text-foreground'
                )}
                onClick={() => canEdit && setEditingTrilha(true)}
              >
                {character.trilha || 'Sem trilha'}
              </span>
            )}
            <span className="text-muted-foreground">•</span>
            {editingNex ? (
              <select
                value={character.nex || '5%'}
                onChange={(e) => {
                  handleUpdateField('nex', e.target.value);
                  setEditingNex(false);
                }}
                onBlur={() => setEditingNex(false)}
                className="px-2 py-1 bg-background border border-border rounded text-foreground"
                autoFocus
              >
                {NEX_VALUES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            ) : (
              <span
                className={cn(
                  'text-muted-foreground',
                  canEdit && 'cursor-pointer hover:text-foreground'
                )}
                onClick={() => canEdit && setEditingNex(true)}
              >
                NEX {character.nex || '5%'}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right Column - Attributes & Vitals */}
      <div className="lg:col-span-2 space-y-6">
        {/* Attributes */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Atributos</h3>
          <div className="grid grid-cols-5 gap-4">
            {[
              { key: 'attrForca', label: 'FOR' },
              { key: 'attrAgilidade', label: 'AGI' },
              { key: 'attrIntelecto', label: 'INT' },
              { key: 'attrPresenca', label: 'PRE' },
              { key: 'attrVigor', label: 'VIG' },
            ].map((attr) => (
              <div key={attr.key} className="text-center">
                <p className="text-sm text-muted-foreground mb-2">{attr.label}</p>
                <DiceDisplay
                  value={(character[attr.key as keyof Character] as DiceValue) || 'd6'}
                />
                {canEdit && (
                  <select
                    value={(character[attr.key as keyof Character] as DiceValue) || 'd6'}
                    onChange={(e) => handleUpdateAttribute(attr.key, e.target.value as DiceValue)}
                    className="mt-2 w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                  >
                    {DICE_VALUES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Vitais</h3>
          <div className="space-y-4">
            <VitalBar
              label="Pontos de Vida"
              current={character.pvCurrent}
              max={character.pvMax}
              color="red"
              showNumbers
              onMinus={canEditVitals ? () => handleUpdateVital('pv', -1) : undefined}
              onPlus={canEditVitals ? () => handleUpdateVital('pv', 1) : undefined}
            />
            <VitalBar
              label="Sanidade"
              current={character.sanCurrent}
              max={character.sanMax}
              color="blue"
              showNumbers
              onMinus={canEditVitals ? () => handleUpdateVital('san', -1) : undefined}
              onPlus={canEditVitals ? () => handleUpdateVital('san', 1) : undefined}
            />
            <VitalBar
              label="Pontos de Esforço"
              current={character.peCurrent}
              max={character.peMax}
              color="purple"
              showNumbers
              onMinus={canEditVitals ? () => handleUpdateVital('pe', -1) : undefined}
              onPlus={canEditVitals ? () => handleUpdateVital('pe', 1) : undefined}
            />
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Condições</h3>
            {canEdit && (
              <button
                onClick={handleAddCondition}
                className="flex items-center gap-1 text-sm text-accent hover:text-accent/80"
              >
                <Plus size={16} />
                Adicionar
              </button>
            )}
          </div>
          {character.conditions.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma condição ativa</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {character.conditions.map((condition) => (
                <ConditionBadge
                  key={condition}
                  condition={condition}
                  onRemove={canEdit ? () => handleRemoveCondition(condition) : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Story Tab Component
// ─────────────────────────────────────────

interface StoryTabProps {
  character: Character;
  canEdit: boolean;
  historySummary: string;
  historyContent: string;
  hasUnsavedHistory: boolean;
  saving: boolean;
  setHistorySummary: (val: string) => void;
  setHistoryContent: (val: string) => void;
}

function StoryTab({
  canEdit,
  historySummary,
  historyContent,
  hasUnsavedHistory,
  saving,
  setHistorySummary,
  setHistoryContent,
}: StoryTabProps) {
  return (
    <div className="space-y-6">
      {/* Save indicator */}
      <div className="flex justify-end">
        {saving && (
          <span className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Salvando...
          </span>
        )}
        {!saving && hasUnsavedHistory && (
          <span className="text-sm text-warning">Alterações não salvas</span>
        )}
        {!saving && !hasUnsavedHistory && (
          <span className="text-sm text-success flex items-center gap-1">
            <Check size={14} />
            Salvo
          </span>
        )}
      </div>

      {/* Summary */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Resumo</h3>
        <textarea
          value={historySummary}
          onChange={(e) => setHistorySummary(e.target.value)}
          readOnly={!canEdit}
          maxLength={500}
          rows={3}
          placeholder="Breve resumo da história do personagem..."
          className={cn(
            'w-full px-3 py-2 bg-background border border-border rounded-md text-foreground',
            'placeholder:text-muted-foreground resize-none',
            !canEdit && 'cursor-default'
          )}
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">
          {historySummary.length}/500
        </p>
      </div>

      {/* Full History */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">História Completa</h3>
        <RichTextEditor
          content={historyContent}
          onChange={canEdit ? setHistoryContent : undefined}
          readOnly={!canEdit}
          placeholder="Escreva a história completa do personagem..."
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Inventory Tab Component
// ─────────────────────────────────────────

interface InventoryTabProps {
  character: Character;
  canEdit: boolean;
  onAddItem: () => void;
  onRefresh: () => void;
}

function InventoryTab({ character, canEdit, onAddItem, onRefresh }: InventoryTabProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteItem = async () => {
    if (!deleteId) return;
    try {
      await characterApi.deleteItem(character.id, deleteId);
      toast.success('Item removido');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao remover item');
    } finally {
      setDeleteId(null);
    }
  };

  const items = character.inventory || [];

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Inventário</h3>
        {canEdit && (
          <button
            onClick={onAddItem}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
          >
            <Plus size={16} />
            Adicionar Item
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Inventário vazio</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Nome</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Categoria</th>
                <th className="text-center py-2 px-3 text-sm font-medium text-muted-foreground">Qtd</th>
                <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Descrição</th>
                {canEdit && <th className="w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 px-3 text-foreground">{item.name}</td>
                  <td className="py-2 px-3 text-muted-foreground capitalize">{item.category || '-'}</td>
                  <td className="py-2 px-3 text-center text-foreground">{item.quantity}</td>
                  <td className="py-2 px-3 text-muted-foreground text-sm">{item.description || '-'}</td>
                  {canEdit && (
                    <td className="py-2 px-3">
                      <button
                        onClick={() => setDeleteId(item.id)}
                        className="p-1 text-danger hover:bg-danger/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Item"
        description="Tem certeza que deseja remover este item do inventário?"
        confirmText="Remover"
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Abilities Tab Component
// ─────────────────────────────────────────

interface AbilitiesTabProps {
  character: Character;
  canEdit: boolean;
  onAddAbility: () => void;
  onRefresh: () => void;
}

function AbilitiesTab({ character, canEdit, onAddAbility, onRefresh }: AbilitiesTabProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteAbility = async () => {
    if (!deleteId) return;
    try {
      await characterApi.deleteAbility(character.id, deleteId);
      toast.success('Habilidade removida');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao remover habilidade');
    } finally {
      setDeleteId(null);
    }
  };

  const abilities = character.abilities || [];
  const habilidades = abilities.filter((a) => a.type === 'habilidade');
  const rituais = abilities.filter((a) => a.type === 'ritual');

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canEdit && (
          <button
            onClick={onAddAbility}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
          >
            <Plus size={16} />
            Adicionar
          </button>
        )}
      </div>

      {/* Habilidades */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Habilidades</h3>
        {habilidades.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma habilidade</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {habilidades.map((ability) => (
              <div key={ability.id} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-foreground">{ability.name}</h4>
                  {canEdit && (
                    <button
                      onClick={() => setDeleteId(ability.id)}
                      className="p-1 text-danger hover:bg-danger/20 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {ability.description && (
                  <p className="text-sm text-muted-foreground mt-2">{ability.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rituais */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Rituais</h3>
        {rituais.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum ritual</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rituais.map((ritual) => (
              <div key={ritual.id} className="bg-background border border-border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-foreground">{ritual.name}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      {ritual.element && (
                        <span className={cn('px-2 py-0.5 rounded text-xs', ELEMENT_COLORS[ritual.element])}>
                          {ritual.element}
                        </span>
                      )}
                      {ritual.peCost && ritual.peCost > 0 && (
                        <span className="text-xs text-muted-foreground">{ritual.peCost} PE</span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => setDeleteId(ritual.id)}
                      className="p-1 text-danger hover:bg-danger/20 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {ritual.description && (
                  <p className="text-sm text-muted-foreground mt-2">{ritual.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Habilidade"
        description="Tem certeza que deseja remover esta habilidade?"
        confirmText="Remover"
        onConfirm={handleDeleteAbility}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Skills Tab Component
// ─────────────────────────────────────────

interface SkillsTabProps {
  character: Character;
  canEdit: boolean;
  onAddSkill: () => void;
  onRefresh: () => void;
}

function SkillsTab({ character, canEdit, onAddSkill, onRefresh }: SkillsTabProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDeleteSkill = async () => {
    if (!deleteId) return;
    try {
      await characterApi.deleteSkill(character.id, deleteId);
      toast.success('Perícia removida');
      onRefresh();
    } catch (error) {
      toast.error('Erro ao remover perícia');
    } finally {
      setDeleteId(null);
    }
  };

  const skills = character.skills || [];
  const groupedSkills = {
    forca: skills.filter((s) => s.attribute === 'forca'),
    agilidade: skills.filter((s) => s.attribute === 'agilidade'),
    intelecto: skills.filter((s) => s.attribute === 'intelecto'),
    presenca: skills.filter((s) => s.attribute === 'presenca'),
    vigor: skills.filter((s) => s.attribute === 'vigor'),
  };

  const attrLabels: Record<string, string> = {
    forca: 'Força',
    agilidade: 'Agilidade',
    intelecto: 'Intelecto',
    presenca: 'Presença',
    vigor: 'Vigor',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        {canEdit && (
          <button
            onClick={onAddSkill}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
          >
            <Plus size={16} />
            Adicionar Perícia
          </button>
        )}
      </div>

      {Object.entries(groupedSkills).map(([attr, attrSkills]) => (
        <div key={attr} className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">{attrLabels[attr]}</h3>
          {attrSkills.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhuma perícia</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attrSkills.map((skill) => (
                <div
                  key={skill.id}
                  className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-md border',
                    skill.trained
                      ? 'bg-accent/20 border-accent/50 text-accent'
                      : 'bg-background border-border text-foreground'
                  )}
                >
                  <span>{skill.name}</span>
                  <span className="text-sm">
                    {skill.bonus >= 0 ? '+' : ''}{skill.bonus}
                  </span>
                  {skill.trained && (
                    <span className="text-xs bg-accent text-white px-1.5 py-0.5 rounded">T</span>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setDeleteId(skill.id)}
                      className="p-0.5 text-danger hover:bg-danger/20 rounded"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      <ConfirmDialog
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Remover Perícia"
        description="Tem certeza que deseja remover esta perícia?"
        confirmText="Remover"
        onConfirm={handleDeleteSkill}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Audit Tab Component
// ─────────────────────────────────────────

interface AuditTabProps {
  logs: AuditLog[];
  page: number;
  total: number;
  onPageChange: (page: number) => void;
}

function AuditTab({ logs, page, total, onPageChange }: AuditTabProps) {
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">Histórico de Alterações</h3>
      {logs.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nenhum registro</p>
      ) : (
        <>
          <div className="space-y-2">
            {logs.map((log) => (
              <div key={log.id} className="p-3 bg-background rounded-md border border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{formatDate(log.timestamp)}</span>
                  <span className="text-foreground capitalize">{log.action}</span>
                </div>
                {log.fieldChanged && (
                  <p className="text-sm text-foreground mt-1">
                    <span className="text-muted-foreground">{log.fieldChanged}:</span>{' '}
                    <span className="text-danger line-through">{log.oldValue || '-'}</span>{' '}
                    → <span className="text-success">{log.newValue || '-'}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 bg-muted rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="px-3 py-1 text-muted-foreground">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 bg-muted rounded disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Add Condition Dialog
// ─────────────────────────────────────────

interface AddConditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentConditions: string[];
  onAdd: (condition: ConditionType) => void;
}

function AddConditionDialog({ open, onOpenChange, currentConditions, onAdd }: AddConditionDialogProps) {
  const availableConditions = CONDITIONS.filter((c) => !currentConditions.includes(c));

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50 p-4">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            Adicionar Condição
          </Dialog.Title>
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {availableConditions.map((condition) => (
              <button
                key={condition}
                onClick={() => onAdd(condition)}
                className="px-3 py-1.5 bg-muted hover:bg-muted/80 rounded-md text-foreground text-sm transition-colors"
              >
                {condition}
              </button>
            ))}
          </div>
          {availableConditions.length === 0 && (
            <p className="text-muted-foreground text-sm">Todas as condições já foram adicionadas.</p>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─────────────────────────────────────────
// Add Item Dialog
// ─────────────────────────────────────────

interface AddItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  onSuccess: () => void;
}

function AddItemDialog({ open, onOpenChange, characterId, onSuccess }: AddItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    category: '' as typeof ITEM_CATEGORIES[number] | '',
    quantity: 1,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await characterApi.createItem(characterId, {
        name: form.name.trim(),
        category: form.category || undefined,
        quantity: form.quantity,
        description: form.description.trim() || undefined,
      });
      toast.success('Item adicionado');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', category: '', quantity: 1, description: '' });
    } catch (error) {
      toast.error('Erro ao adicionar item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50">
          <div className="p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Adicionar Item
            </Dialog.Title>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Categoria</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as typeof ITEM_CATEGORIES[number] })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="">Nenhuma</option>
                  {ITEM_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-muted-foreground">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
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

// ─────────────────────────────────────────
// Add Ability Dialog
// ─────────────────────────────────────────

interface AddAbilityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  onSuccess: () => void;
}

function AddAbilityDialog({ open, onOpenChange, characterId, onSuccess }: AddAbilityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'habilidade' as 'habilidade' | 'ritual',
    element: '' as ElementType | '',
    peCost: 0,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await characterApi.createAbility(characterId, {
        name: form.name.trim(),
        type: form.type,
        element: form.type === 'ritual' && form.element ? form.element : undefined,
        peCost: form.type === 'ritual' ? form.peCost : undefined,
        description: form.description.trim() || undefined,
        isActive: true,
      });
      toast.success('Habilidade adicionada');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', type: 'habilidade', element: '', peCost: 0, description: '' });
    } catch (error) {
      toast.error('Erro ao adicionar habilidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50">
          <div className="p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Adicionar Habilidade
            </Dialog.Title>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as 'habilidade' | 'ritual' })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="habilidade">Habilidade</option>
                <option value="ritual">Ritual</option>
              </select>
            </div>
            {form.type === 'ritual' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Elemento</label>
                  <select
                    value={form.element}
                    onChange={(e) => setForm({ ...form, element: e.target.value as ElementType })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  >
                    <option value="">Nenhum</option>
                    {ELEMENTS.map((el) => (
                      <option key={el} value={el}>{el}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Custo PE</label>
                  <input
                    type="number"
                    min="0"
                    value={form.peCost}
                    onChange={(e) => setForm({ ...form, peCost: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-muted-foreground">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
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

// ─────────────────────────────────────────
// Add Skill Dialog
// ─────────────────────────────────────────

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterId: string;
  existingSkills: CharacterSkill[];
  onSuccess: () => void;
}

function AddSkillDialog({ open, onOpenChange, characterId, existingSkills, onSuccess }: AddSkillDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    attribute: 'forca' as CharacterSkill['attribute'],
    bonus: 0,
    trained: false,
  });

  const existingNames = existingSkills.map((s) => s.name.toLowerCase());
  const suggestedSkills = SKILLS_BY_ATTR[form.attribute].filter(
    (s) => !existingNames.includes(s.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await characterApi.createSkill(characterId, {
        name: form.name.trim(),
        attribute: form.attribute,
        bonus: form.bonus,
        trained: form.trained,
      });
      toast.success('Perícia adicionada');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', attribute: 'forca', bonus: 0, trained: false });
    } catch (error) {
      toast.error('Erro ao adicionar perícia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50">
          <div className="p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Adicionar Perícia
            </Dialog.Title>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Atributo</label>
              <select
                value={form.attribute}
                onChange={(e) => setForm({ ...form, attribute: e.target.value as CharacterSkill['attribute'], name: '' })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="forca">Força</option>
                <option value="agilidade">Agilidade</option>
                <option value="intelecto">Intelecto</option>
                <option value="presenca">Presença</option>
                <option value="vigor">Vigor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                placeholder="Nome da perícia"
              />
              {suggestedSkills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {suggestedSkills.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => setForm({ ...form, name: skill })}
                      className="px-2 py-1 bg-muted hover:bg-muted/80 rounded text-xs text-foreground"
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bônus</label>
                <input
                  type="number"
                  value={form.bonus}
                  onChange={(e) => setForm({ ...form, bonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.trained}
                    onChange={(e) => setForm({ ...form, trained: e.target.checked })}
                    className="w-4 h-4 rounded border-border"
                  />
                  <span className="text-sm text-foreground">Treinada</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-muted-foreground">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 disabled:opacity-50 flex items-center gap-2"
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

// Radix Dialog import
import * as Dialog from '@radix-ui/react-dialog';
