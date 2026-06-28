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
  RichTextEditor,
  ConfirmDialog,
  Tooltip,
} from '@/components/shared';
import {
  AbilitiesTab as AbilitiesTabComponent,
  InventoryTab as InventoryTabComponent,
  SkillsTab as SkillsTabComponent,
} from '@/components/characters';
import { useAuth, useTabNavigation } from '@/hooks';
import { useTabStore } from '@/stores/tabStore';
import { cn, formatDate, getUploadUrl } from '@/lib/utils';
import { CONDITIONS, CONDITIONS_DATA, CONDITION_CATEGORIES } from '@/data/conditions';
import type {
  Character,
  CharacterSkill,
  AuditLog,
  CharacterRole,
  ConditionType,
  ElementType,
} from '@/types';
import toast from 'react-hot-toast';

const TRILHAS: CharacterRole[] = ['Combatente', 'Especialista', 'Ocultista'];
const NEX_VALUES = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'];

const ITEM_CATEGORIES = ['arma', 'proteção', 'escudo', 'equipamento', 'consumível', 'misc'] as const;

const SKILLS_BY_ATTR: Record<string, string[]> = {
  forca: ['Atletismo', 'Luta', 'Intimidação'],
  agilidade: ['Acrobacia', 'Furtividade', 'Pilotagem', 'Pontaria', 'Reflexos'],
  intelecto: ['Atualidades', 'Ciências', 'Crimes', 'Investigação', 'Medicina', 'Ocultismo', 'Percepção', 'Tecnologia'],
  presenca: ['Artes', 'Diplomacia', 'Enganação', 'Intuição', 'Liderança', 'Persuasão'],
  vigor: ['Fortitude'],
};

const ELEMENTS: ElementType[] = ['Morte', 'Sangue', 'Energia', 'Conhecimento', 'Medo'];

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

  // Atualiza o título da aba quando o personagem carrega
  const updateTab = useTabStore((state) => state.updateTab);
  const tabs = useTabStore((state) => state.tabs);
  
  useEffect(() => {
    if (character && id) {
      // Encontra a tab atual pelo path
      const currentTab = tabs.find((t) => t.path === `/characters/${id}`);
      if (currentTab && currentTab.title !== character.name) {
        updateTab(currentTab.id, { title: character.name });
      }
    }
  }, [character, id, tabs, updateTab]);

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
  }, [historyContent, hasUnsavedHistory, id, canEdit]);

  const handleUpdateVital = async (field: 'pv' | 'san' | 'pe', delta: number) => {
    if (!character || !canEditVitals) return;

    const maxField = `${field}Max` as 'pvMax' | 'sanMax' | 'peMax';
    const currentField = `${field}Current` as 'pvCurrent' | 'sanCurrent' | 'peCurrent';
    const max = character[maxField];
    const current = character[currentField];
    const newValue = Math.max(0, Math.min(max, current + delta));

    // Otimista: atualiza UI imediatamente
    setCharacter({ ...character, [currentField]: newValue });

    try {
      // Backend espera o valor absoluto, não o delta
      await characterApi.updateVitals(character.id, { [currentField]: newValue });
    } catch (error) {
      // Reverte em caso de erro
      setCharacter({ ...character, [currentField]: current });
      toast.error('Erro ao atualizar vital');
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
            isAdmin={isAdmin}
            historyContent={historyContent}
            hasUnsavedHistory={hasUnsavedHistory}
            saving={saving}
            setHistoryContent={(val) => {
              setHistoryContent(val);
              setHasUnsavedHistory(true);
            }}
          />
        </Tabs.Content>

        {/* Inventory Tab */}
        <Tabs.Content value="inventory">
          <InventoryTabComponent
            character={character}
            isAdmin={isAdmin}
            onRefresh={fetchCharacter}
          />
        </Tabs.Content>

        {/* Abilities Tab */}
        <Tabs.Content value="abilities">
          <AbilitiesTabComponent
            character={character}
            isAdmin={isAdmin}
            onRefresh={fetchCharacter}
          />
        </Tabs.Content>

        {/* Skills Tab */}
        <Tabs.Content value="skills">
          <SkillsTabComponent
            character={character}
            isAdmin={isAdmin}
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
          <div className="relative group flex items-center justify-center">
            <div className="relative w-48 rounded-lg overflow-hidden flex items-center justify-center">
              {character.tokenImage ? (
                <img
                  src={getUploadUrl(character.tokenImage) || ''}
                  alt={character.name}
                  className="w-full h-auto object-contain"
                />
              ) : (
                <div className="w-48 h-48 bg-background">
                  <TokenAvatar
                    src={null}
                    name={character.name}
                    size="xl"
                    className="w-full h-full !rounded-none"
                  />
                </div>
              )}
              {canEdit && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={32} className="text-white" />
                </button>
              )}
            </div>
            <input
              ref={fileInputRef as React.RefObject<HTMLInputElement>}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleTokenUpload}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div className="mt-4 text-center">
            {editingName ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value.slice(0, 40))}
                    maxLength={40}
                    className="px-2 py-1 bg-background border border-border rounded text-lg font-bold text-foreground text-center focus:outline-none focus:ring-2 focus:ring-accent max-w-[250px]"
                    autoFocus
                  />
                  <button onClick={handleSaveName} className="text-success">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-danger">
                    <X size={18} />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">{nameValue.length}/40</span>
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
        {/* Top Row - Attributes + Defesas side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attributes - Pentagram Layout */}
          <div className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 text-center">Atributos</h3>
            <div className="relative w-full aspect-square max-w-[220px] mx-auto">
              {/* Pentagram image background */}
              <img
                src="/pentagram.png"
                alt=""
                className="absolute inset-0 w-full h-full object-contain opacity-70"
              />
              
              {/* Top - Intelecto (ponta superior da estrela) */}
              <div className="absolute top-4 left-1/2 -translate-x-1/2 text-center">
                <span 
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  {character.attrIntelecto || 1}
                </span>
                <p 
                  className="text-xs font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  INT
                </p>
              </div>
              
              {/* Top Right - Presença (ponta superior direita) */}
              <div className="absolute top-[36%] right-[9%] text-center">
                <span 
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  {character.attrPresenca || 1}
                </span>
                <p 
                  className="text-xs font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  PRE
                </p>
              </div>
              
              {/* Top Left - Agilidade (ponta superior esquerda) */}
              <div className="absolute top-[36%] left-[9%] text-center">
                <span 
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  {character.attrAgilidade || 1}
                </span>
                <p 
                  className="text-xs font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  AGI
                </p>
              </div>
              
              {/* Bottom Right - Vigor (ponta inferior direita) */}
              <div className="absolute bottom-0 right-[23%] text-center">
                <span 
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  {character.attrVigor || 1}
                </span>
                <p 
                  className="text-xs font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  VIG
                </p>
              </div>
              
              {/* Bottom Left - Força (ponta inferior esquerda) */}
              <div className="absolute bottom-0 left-[23%] text-center">
                <span 
                  className="text-2xl font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  {character.attrForca || 1}
                </span>
                <p 
                  className="text-xs font-bold text-white"
                  style={{ textShadow: '-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000' }}
                >
                  FOR
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Defesas, Movimento */}
          <div className="space-y-4">
            {/* Defesas & Resistências */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Defesas & Resistências</h3>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">DEFESA</p>
                  <div className="text-lg font-bold text-foreground">{character.defesa}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">ESQUIVA</p>
                  <div className="text-lg font-bold text-foreground">{character.esquiva ?? '-'}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">BLOQUEIO</p>
                  <div className="text-lg font-bold text-foreground">{character.bloqueio ?? '-'}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div className="text-center p-2 bg-background rounded-lg border-l-2 border-emerald-500">
                  <p className="text-[10px] text-muted-foreground mb-1">FORT</p>
                  <div className="text-sm font-bold text-emerald-500">+{character.fortitude}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-lg border-l-2 border-yellow-500">
                  <p className="text-[10px] text-muted-foreground mb-1">REF</p>
                  <div className="text-sm font-bold text-yellow-500">+{character.reflexos}</div>
                </div>
                <div className="text-center p-2 bg-background rounded-lg border-l-2 border-violet-500">
                  <p className="text-[10px] text-muted-foreground mb-1">VON</p>
                  <div className="text-sm font-bold text-violet-500">+{character.vontade}</div>
                </div>
              </div>
            </div>

            {/* Movimento & Inventário */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Movimento & Capacidade</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">DESLOCAMENTO</p>
                  <div className="text-lg font-bold text-foreground">{character.deslocamento}m</div>
                </div>
                <div className="text-center p-2 bg-background rounded-lg">
                  <p className="text-[10px] text-muted-foreground mb-1">INVENTÁRIO</p>
                  <div className="text-lg font-bold text-foreground">{character.espacosInventario}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vitals */}
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Vitais</h3>
          <div className="space-y-4">
            <VitalBar
              label="PV"
              current={character.pvCurrent}
              max={character.pvMax}
              color="red"
              showNumbers
              onMinus={canEditVitals ? (amount) => handleUpdateVital('pv', -amount) : undefined}
              onPlus={canEditVitals ? (amount) => handleUpdateVital('pv', amount) : undefined}
            />
            <VitalBar
              label="SAN"
              current={character.sanCurrent}
              max={character.sanMax}
              color="blue"
              showNumbers
              onMinus={canEditVitals ? (amount) => handleUpdateVital('san', -amount) : undefined}
              onPlus={canEditVitals ? (amount) => handleUpdateVital('san', amount) : undefined}
            />
            <VitalBar
              label="PE"
              current={character.peCurrent}
              max={character.peMax}
              color="purple"
              showNumbers
              onMinus={canEditVitals ? (amount) => handleUpdateVital('pe', -amount) : undefined}
              onPlus={canEditVitals ? (amount) => handleUpdateVital('pe', amount) : undefined}
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
  isAdmin: boolean;
  historyContent: string;
  hasUnsavedHistory: boolean;
  saving: boolean;
  setHistoryContent: (val: string) => void;
}

// Função para criptografar texto - substitui cada caractere (exceto espaços) por letra aleatória
// Usa seed baseada na posição para ser determinístico (não mudar a cada render)
function cipherText(text: string, seed: number = 0): string {
  // Letras disponíveis na fonte Paranormal (sem X e Y que podem não existir)
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWZ';
  const lettersLower = 'abcdefghijklmnopqrstuvwz';
  
  // Função pseudo-random com seed
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };
  
  let result = '';
  let charIndex = 0;
  let inTag = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    
    // Detecta início/fim de tags HTML
    if (char === '<') {
      inTag = true;
      result += char;
      continue;
    }
    if (char === '>') {
      inTag = false;
      result += char;
      continue;
    }
    
    // Dentro de tag HTML, mantém como está
    if (inTag) {
      result += char;
      continue;
    }
    
    // Espaços e quebras de linha são mantidos
    if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
      result += char;
      charIndex++;
      continue;
    }
    
    // Qualquer outro caractere (letra, número, símbolo) vira letra aleatória
    const randomIndex = Math.floor(seededRandom(seed + charIndex) * letters.length);
    
    // Alterna entre maiúscula e minúscula baseado no caractere original
    const isUpper = char === char.toUpperCase() && char !== char.toLowerCase();
    result += isUpper ? letters[randomIndex] : lettersLower[randomIndex];
    
    charIndex++;
  }
  
  return result;
}

// Componente wrapper para conteúdo com links internos clicáveis
function RichContent({ 
  html, 
  isAdmin, 
  onReveal 
}: { 
  html: string; 
  isAdmin: boolean; 
  onReveal?: (newContent: string) => void;
}) {
  const { navigateToLink } = useTabNavigation();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Processar segredos
  const processedContent = processSecretContent(html, isAdmin, onReveal);
  
  // Adicionar handler para links internos
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('[data-link-type]') as HTMLElement;
      
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        
        const type = link.getAttribute('data-link-type') as 'character' | 'environment' | 'monster' | 'document';
        const id = link.getAttribute('data-link-id');
        const name = link.getAttribute('data-link-name') || 'Item';
        
        if (type && id) {
          // Links em texto sempre abrem em nova aba
          navigateToLink(type, id, name);
        }
      }
    };
    
    container.addEventListener('click', handleLinkClick);
    return () => container.removeEventListener('click', handleLinkClick);
  }, [navigateToLink]);
  
  return (
    <div ref={containerRef}>
      {processedContent}
    </div>
  );
}

// Função auxiliar para encontrar spans secretos com suporte a aninhamento
function findSecretSpans(html: string): Array<{ fullMatch: string; content: string; start: number; end: number }> {
  const results: Array<{ fullMatch: string; content: string; start: number; end: number }> = [];
  const secretOpenRegex = /<span[^>]*data-secret="true"[^>]*>/gi;
  
  let match;
  while ((match = secretOpenRegex.exec(html)) !== null) {
    const startIndex = match.index;
    const openTag = match[0];
    let depth = 1;
    let i = startIndex + openTag.length;
    
    // Encontra o </span> correspondente contando profundidade
    while (i < html.length && depth > 0) {
      if (html.substring(i).startsWith('<span')) {
        // Encontrou abertura de span
        const endOfTag = html.indexOf('>', i);
        if (endOfTag !== -1) {
          depth++;
          i = endOfTag + 1;
        } else {
          i++;
        }
      } else if (html.substring(i).startsWith('</span>')) {
        depth--;
        if (depth === 0) {
          // Encontrou o fechamento correto
          const endIndex = i + 7; // '</span>'.length
          const fullMatch = html.substring(startIndex, endIndex);
          const content = html.substring(startIndex + openTag.length, i);
          results.push({ fullMatch, content, start: startIndex, end: endIndex });
        }
        i += 7;
      } else {
        i++;
      }
    }
  }
  
  return results;
}

// Função para processar conteúdo secreto
// Agora usa <span data-secret="true"> gerado pelo TipTap Mark customizado
function processSecretContent(html: string, isAdmin: boolean, onReveal?: (newContent: string) => void): React.ReactNode {
  // Preservar parágrafos vazios (quebras de linha) convertendo <p></p> para ter conteúdo
  let preservedHtml = html.replace(/<p><\/p>/g, '<p><br></p>');
  
  // Se não tem segredos, retorna o HTML direto
  if (!preservedHtml.includes('data-secret="true"')) {
    return <div dangerouslySetInnerHTML={{ __html: preservedHtml }} />;
  }

  // Encontra todos os spans secretos com suporte a aninhamento
  const secretSpans = findSecretSpans(preservedHtml);
  
  if (secretSpans.length === 0) {
    return <div dangerouslySetInnerHTML={{ __html: preservedHtml }} />;
  }

  if (isAdmin) {
    // Para admin: substituir o span por versão estilizada com botão
    const secretMatches: string[] = [];
    let processedHtml = preservedHtml;
    let offset = 0;
    
    for (const span of secretSpans) {
      const index = secretMatches.length;
      secretMatches.push(span.fullMatch);
      
      // Cria span estilizado com botão inline
      const replacement = `<span class="secret-admin-view" style="background:rgba(139,92,246,0.2);border:1px solid rgba(139,92,246,0.5);border-radius:4px;padding:0 4px;display:inline"><span style="color:rgb(167,139,250)">${span.content}</span><button data-reveal-index="${index}" style="margin-left:4px;font-size:10px;background:rgb(139,92,246);color:white;padding:1px 4px;border-radius:3px;border:none;cursor:pointer">Revelar</button></span>`;
      
      processedHtml = processedHtml.substring(0, span.start + offset) + replacement + processedHtml.substring(span.end + offset);
      offset += replacement.length - span.fullMatch.length;
    }

    // Handler para cliques nos botões revelar
    const handleClick = (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' && target.dataset.revealIndex !== undefined) {
        const index = parseInt(target.dataset.revealIndex, 10);
        const fullMatch = secretMatches[index];
        if (fullMatch && onReveal) {
          // Encontra o conteúdo do span original
          const spanData = findSecretSpans(fullMatch)[0];
          if (spanData) {
            const newHtml = html.replace(fullMatch, spanData.content);
            onReveal(newHtml);
          }
        }
      }
    };

    return (
      <div 
        onClick={handleClick}
        dangerouslySetInnerHTML={{ __html: processedHtml }} 
      />
    );
  } else {
    // Para jogadores: criptografar o texto e usar fonte Paranormal
    // Links internos são completamente removidos (invisíveis)
    let processedHtml = preservedHtml;
    let offset = 0;
    let secretIndex = 0;
    
    for (const span of secretSpans) {
      // Remove TODOS os links internos do conteúdo - extrai só o texto puro
      let cleanContent = span.content;
      
      // Remove links internos recursivamente (pode haver aninhamento)
      // Substitui <span class="internal-link ...">texto</span> por apenas o texto puro
      // A classe pode ser "internal-link" ou "internal-link internal-link--type"
      while (cleanContent.includes('internal-link')) {
        cleanContent = cleanContent.replace(
          /<span[^>]*class="[^"]*internal-link[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
          '$1'
        );
      }
      
      // Remove TODAS as tags HTML restantes para obter apenas texto puro
      const textOnly = cleanContent.replace(/<[^>]*>/g, '');
      
      // Criptografa o texto
      const ciphered = cipherText(textOnly, secretIndex * 1000);
      secretIndex++;
      
      // Cria o span criptografado SEM nenhuma cor especial (texto padrão)
      const replacement = `<span class="paranormal-cipher" title="Conteúdo oculto" style="font-family:'Paranormal',monospace;letter-spacing:0.05em;user-select:none;display:inline;">${ciphered}</span>`;
      
      processedHtml = processedHtml.substring(0, span.start + offset) + replacement + processedHtml.substring(span.end + offset);
      offset += replacement.length - span.fullMatch.length;
    }
    
    return <div dangerouslySetInnerHTML={{ __html: processedHtml }} />;
  }
}

function StoryTab({
  canEdit,
  isAdmin,
  historyContent,
  hasUnsavedHistory,
  saving,
  setHistoryContent,
}: StoryTabProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

  return (
    <div className="space-y-6">
      {/* Header with save indicator and view toggle */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {canEdit && (
            <div className="flex bg-background border border-border rounded-md p-0.5">
              <button
                onClick={() => setViewMode('edit')}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  viewMode === 'edit'
                    ? 'bg-accent text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Editar
              </button>
              <button
                onClick={() => setViewMode('preview')}
                className={cn(
                  'px-3 py-1 text-sm rounded transition-colors',
                  viewMode === 'preview'
                    ? 'bg-accent text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Visualizar
              </button>
            </div>
          )}
          {isAdmin && viewMode === 'edit' && (
            <span className="text-xs text-violet-400 flex items-center gap-1">
              <span className="w-2 h-2 bg-violet-500 rounded-full"></span>
              Selecione texto e clique no ícone de olho para marcar segredos
            </span>
          )}
        </div>
        <div>
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
      </div>

      {/* História */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">História</h3>
        
        {canEdit && viewMode === 'edit' ? (
          <RichTextEditor
            content={historyContent}
            onChange={setHistoryContent}
            readOnly={false}
            showSecretButton={isAdmin}
            showLinkButton={true}
            placeholder="Escreva a história do personagem..."
          />
        ) : (
          <div className="prose prose-invert prose-sm max-w-none min-h-[150px]">
            {historyContent ? (
              <RichContent
                html={historyContent}
                isAdmin={isAdmin}
                onReveal={canEdit ? setHistoryContent : undefined}
              />
            ) : (
              <p className="text-muted-foreground italic">Nenhuma história escrita ainda.</p>
            )}
          </div>
        )}
      </div>
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
  // Agrupar condições por categoria
  const categories = ['medo', 'mental', 'paralisia', 'sentidos', 'fadiga', 'geral'] as const;
  
  const categoryColors: Record<string, string> = {
    medo: 'bg-red-600 hover:bg-red-500',
    mental: 'bg-orange-600 hover:bg-orange-500',
    paralisia: 'bg-blue-600 hover:bg-blue-500',
    sentidos: 'bg-yellow-600 hover:bg-yellow-500',
    fadiga: 'bg-green-600 hover:bg-green-500',
    geral: 'bg-gray-600 hover:bg-gray-500',
  };

  const tooltipTextColors: Record<string, string> = {
    medo: 'text-red-400',
    mental: 'text-orange-400',
    paralisia: 'text-blue-400',
    sentidos: 'text-yellow-400',
    fadiga: 'text-green-400',
    geral: 'text-gray-400',
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg z-50 p-4 max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            Adicionar Condição
          </Dialog.Title>
          
          <div className="space-y-4">
            {categories.map((category) => {
              const categoryInfo = CONDITION_CATEGORIES[category];
              const conditionsInCategory = CONDITIONS_DATA.filter(
                (c) => c.category === category && !currentConditions.includes(c.name)
              );
              
              if (conditionsInCategory.length === 0) return null;
              
              return (
                <div key={category}>
                  <h4 className={cn('text-sm font-medium mb-2', categoryInfo.color)}>
                    {categoryInfo.emoji} {categoryInfo.name}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {conditionsInCategory.map((condition) => (
                      <Tooltip key={condition.name} content={condition.description} side="bottom" contentClassName={tooltipTextColors[category]}>
                        <button
                          onClick={() => onAdd(condition.name)}
                          className={cn(
                            'px-3 py-1.5 rounded-md text-white text-sm transition-colors',
                            categoryColors[category]
                          )}
                        >
                          {condition.name}
                        </button>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          
          {CONDITIONS.every((c) => currentConditions.includes(c)) && (
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
        spaces: 1,
        isEquipped: false,
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
    training: 'treinado' as 'destreinado' | 'treinado' | 'veterano' | 'expert',
    otherBonus: 0,
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
        training: form.training,
        otherBonus: form.otherBonus,
      });
      toast.success('Perícia adicionada');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', attribute: 'forca', training: 'treinado', otherBonus: 0 });
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
                <label className="block text-sm font-medium text-foreground mb-1">Treinamento</label>
                <select
                  value={form.training}
                  onChange={(e) => setForm({ ...form, training: e.target.value as typeof form.training })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  <option value="destreinado">Destreinado (+0)</option>
                  <option value="treinado">Treinado (+5)</option>
                  <option value="veterano">Veterano (+10)</option>
                  <option value="expert">Expert (+15)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bônus Extra</label>
                <input
                  type="number"
                  value={form.otherBonus}
                  onChange={(e) => setForm({ ...form, otherBonus: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                />
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
