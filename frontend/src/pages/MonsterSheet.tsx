import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  Camera,
  Trash2,
  Plus,
  Loader2,
  Shield,
  Zap,
} from 'lucide-react';
import { monsterApi } from '@/services/api';
import {
  TokenAvatar,
  DiceDisplay,
  RichTextEditor,
  ConfirmDialog,
} from '@/components/shared';
import { cn } from '@/lib/utils';
import type {
  Monster,
  DiceValue,
  ThreatLevel,
  DamageType,
  AttackReach,
} from '@/types';
import toast from 'react-hot-toast';

const DICE_VALUES: DiceValue[] = ['d4', 'd6', 'd8', 'd10' as DiceValue, 'd12', 'd20'];
const DAMAGE_TYPES: DamageType[] = ['físico', 'mental', 'paranormal'];
const ATTACK_REACHES: AttackReach[] = ['corpo a corpo', 'curto', 'médio', 'longo'];

const THREAT_COLORS: Record<ThreatLevel, string> = {
  'Moderado': 'bg-success text-success-foreground',
  'Perigoso': 'bg-warning text-warning-foreground',
  'Mortal': 'bg-orange-600 text-white',
  'Lendário': 'bg-purple-600 text-white',
};

export function MonsterSheet() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [monster, setMonster] = useState<Monster | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Editing states
  const [loreContent, setLoreContent] = useState('');
  const [hasUnsavedLore, setHasUnsavedLore] = useState(false);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addAttackOpen, setAddAttackOpen] = useState(false);
  const [addAbilityOpen, setAddAbilityOpen] = useState(false);
  const [deleteAttackId, setDeleteAttackId] = useState<string | null>(null);
  const [deleteAbilityId, setDeleteAbilityId] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce auto-save for lore
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMonster = useCallback(async () => {
    if (!id) return;
    try {
      const response = await monsterApi.getById(id);
      setMonster(response.data);
      setLoreContent(response.data.lore || '');
    } catch (error) {
      toast.error('Erro ao carregar monstro');
      navigate('/monsters');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchMonster();
  }, [fetchMonster]);

  // Auto-save lore
  useEffect(() => {
    if (!hasUnsavedLore || !id) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await monsterApi.update(id, { lore: loreContent });
        setHasUnsavedLore(false);
        toast.success('Lore salvo');
      } catch (error) {
        toast.error('Erro ao salvar lore');
      } finally {
        setSaving(false);
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [loreContent, hasUnsavedLore, id]);

  const handleUpdateAttribute = async (attr: string, value: DiceValue) => {
    if (!monster) return;

    try {
      await monsterApi.update(monster.id, { [attr]: value });
      setMonster({ ...monster, [attr]: value });
      toast.success('Atributo atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar atributo');
    }
  };

  const handleUpdateField = async (field: string, value: string | number) => {
    if (!monster) return;

    try {
      await monsterApi.update(monster.id, { [field]: value });
      setMonster({ ...monster, [field]: value });
      toast.success('Atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleTokenUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !monster) return;

    try {
      const response = await monsterApi.uploadToken(monster.id, file);
      setMonster({ ...monster, tokenImage: response.data.tokenImage });
      toast.success('Token atualizado');
    } catch (error) {
      toast.error('Erro ao fazer upload do token');
    }
  };

  const handleDelete = async () => {
    if (!monster) return;

    try {
      await monsterApi.delete(monster.id);
      toast.success('Monstro excluído');
      navigate('/monsters');
    } catch (error) {
      toast.error('Erro ao excluir monstro');
    }
  };

  const handleDeleteAttack = async () => {
    if (!deleteAttackId || !monster) return;
    try {
      await monsterApi.deleteAttack(monster.id, deleteAttackId);
      toast.success('Ataque removido');
      fetchMonster();
    } catch (error) {
      toast.error('Erro ao remover ataque');
    } finally {
      setDeleteAttackId(null);
    }
  };

  const handleDeleteAbility = async () => {
    if (!deleteAbilityId || !monster) return;
    try {
      await monsterApi.deleteAbility(monster.id, deleteAbilityId);
      toast.success('Habilidade removida');
      fetchMonster();
    } catch (error) {
      toast.error('Erro ao remover habilidade');
    } finally {
      setDeleteAbilityId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!monster) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Monstro não encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/monsters')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <button
          onClick={() => setDeleteDialogOpen(true)}
          className="p-2 text-danger hover:bg-danger/20 rounded-md transition-colors"
          title="Excluir monstro"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          {[
            { value: 'overview', label: 'Visão Geral' },
            { value: 'attacks', label: 'Ataques' },
            { value: 'abilities', label: 'Habilidades' },
            { value: 'lore', label: 'Lore' },
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Token */}
            <div className="lg:col-span-1">
              <div className="bg-surface border border-border rounded-lg p-6">
                <div className="relative group mx-auto w-48 h-48">
                  <TokenAvatar
                    src={monster.tokenImage}
                    name={monster.name}
                    size="xl"
                  />
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
                </div>

                {/* Name */}
                <div className="mt-4 text-center">
                  <h2 className="text-2xl font-bold text-foreground">{monster.name}</h2>
                  {monster.threatLevel && (
                    <span className={cn('inline-block mt-2 px-3 py-1 rounded text-sm', THREAT_COLORS[monster.threatLevel])}>
                      {monster.threatLevel}
                    </span>
                  )}
                </div>

                {/* PV/SAN */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">PV Máximo</span>
                    <input
                      type="number"
                      min="1"
                      value={monster.pvMax}
                      onChange={(e) => handleUpdateField('pvMax', parseInt(e.target.value) || 1)}
                      className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground text-right"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">SAN Máxima</span>
                    <input
                      type="number"
                      min="0"
                      value={monster.sanMax || 0}
                      onChange={(e) => handleUpdateField('sanMax', parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 bg-background border border-border rounded text-foreground text-right"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Attributes */}
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
                        value={(monster[attr.key as keyof Monster] as DiceValue) || 'd6'}
                      />
                      <select
                        value={(monster[attr.key as keyof Monster] as DiceValue) || 'd6'}
                        onChange={(e) => handleUpdateAttribute(attr.key, e.target.value as DiceValue)}
                        className="mt-2 w-full px-2 py-1 bg-background border border-border rounded text-sm text-foreground"
                      >
                        {DICE_VALUES.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resistances & Immunities */}
              <div className="bg-surface border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Shield size={20} className="text-accent" />
                  Resistências & Imunidades
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Resistências</p>
                    <div className="flex flex-wrap gap-1">
                      {monster.resistances.length > 0 ? (
                        monster.resistances.map((r) => (
                          <span key={r} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                            {r}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Imunidades</p>
                    <div className="flex flex-wrap gap-1">
                      {monster.immunities.length > 0 ? (
                        monster.immunities.map((i) => (
                          <span key={i} className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-sm">
                            {i}
                          </span>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhuma</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tabs.Content>

        {/* Attacks Tab */}
        <Tabs.Content value="attacks">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Ataques</h3>
              <button
                onClick={() => setAddAttackOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
              >
                <Plus size={16} />
                Adicionar Ataque
              </button>
            </div>

            {(!monster.attacks || monster.attacks.length === 0) ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhum ataque cadastrado</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Nome</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Dano</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Tipo</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Alcance</th>
                      <th className="text-left py-2 px-3 text-sm font-medium text-muted-foreground">Descrição</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {monster.attacks.map((attack) => (
                      <tr key={attack.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 text-foreground font-medium">{attack.name}</td>
                        <td className="py-2 px-3 text-danger font-mono">{attack.damage}</td>
                        <td className="py-2 px-3 text-muted-foreground capitalize">{attack.damageType || '-'}</td>
                        <td className="py-2 px-3 text-muted-foreground capitalize">{attack.reach || '-'}</td>
                        <td className="py-2 px-3 text-muted-foreground text-sm">{attack.description || '-'}</td>
                        <td className="py-2 px-3">
                          <button
                            onClick={() => setDeleteAttackId(attack.id)}
                            className="p-1 text-danger hover:bg-danger/20 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Abilities Tab */}
        <Tabs.Content value="abilities">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap size={20} className="text-warning" />
                Habilidades
              </h3>
              <button
                onClick={() => setAddAbilityOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
              >
                <Plus size={16} />
                Adicionar Habilidade
              </button>
            </div>

            {(!monster.abilities || monster.abilities.length === 0) ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma habilidade cadastrada</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {monster.abilities.map((ability) => (
                  <div key={ability.id} className="bg-background border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-foreground">{ability.name}</h4>
                        <span className={cn(
                          'inline-block mt-1 px-2 py-0.5 rounded text-xs',
                          ability.type === 'passiva' && 'bg-gray-600 text-gray-100',
                          ability.type === 'habilidade' && 'bg-blue-600 text-blue-100',
                          ability.type === 'ritual' && 'bg-purple-600 text-purple-100'
                        )}>
                          {ability.type}
                        </span>
                      </div>
                      <button
                        onClick={() => setDeleteAbilityId(ability.id)}
                        className="p-1 text-danger hover:bg-danger/20 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    {ability.description && (
                      <p className="text-sm text-muted-foreground mt-2">{ability.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Tabs.Content>

        {/* Lore Tab */}
        <Tabs.Content value="lore">
          <div className="bg-surface border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Lore / Origem</h3>
              <div className="text-sm">
                {saving && (
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Salvando...
                  </span>
                )}
                {!saving && hasUnsavedLore && (
                  <span className="text-warning">Alterações não salvas</span>
                )}
                {!saving && !hasUnsavedLore && loreContent && (
                  <span className="text-success">✓ Salvo</span>
                )}
              </div>
            </div>
            <RichTextEditor
              content={loreContent}
              onChange={(val) => {
                setLoreContent(val);
                setHasUnsavedLore(true);
              }}
              placeholder="Escreva a história, origem e lore deste monstro..."
            />
          </div>
        </Tabs.Content>
      </Tabs.Root>

      {/* Dialogs */}
      <AddAttackDialog
        open={addAttackOpen}
        onOpenChange={setAddAttackOpen}
        monsterId={monster.id}
        onSuccess={fetchMonster}
      />

      <AddAbilityDialog
        open={addAbilityOpen}
        onOpenChange={setAddAbilityOpen}
        monsterId={monster.id}
        onSuccess={fetchMonster}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Monstro"
        description={`Tem certeza que deseja excluir "${monster.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={deleteAttackId !== null}
        onOpenChange={(open) => !open && setDeleteAttackId(null)}
        title="Remover Ataque"
        description="Tem certeza que deseja remover este ataque?"
        confirmText="Remover"
        onConfirm={handleDeleteAttack}
      />

      <ConfirmDialog
        open={deleteAbilityId !== null}
        onOpenChange={(open) => !open && setDeleteAbilityId(null)}
        title="Remover Habilidade"
        description="Tem certeza que deseja remover esta habilidade?"
        confirmText="Remover"
        onConfirm={handleDeleteAbility}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Add Attack Dialog
// ─────────────────────────────────────────

interface AddAttackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  monsterId: string;
  onSuccess: () => void;
}

function AddAttackDialog({ open, onOpenChange, monsterId, onSuccess }: AddAttackDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    damage: '1d6',
    damageType: 'físico' as DamageType,
    reach: 'corpo a corpo' as AttackReach,
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.damage.trim()) {
      toast.error('Nome e dano são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await monsterApi.createAttack(monsterId, {
        name: form.name.trim(),
        damage: form.damage.trim(),
        damageType: form.damageType,
        reach: form.reach,
        description: form.description.trim() || undefined,
      });
      toast.success('Ataque adicionado');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', damage: '1d6', damageType: 'físico', reach: 'corpo a corpo', description: '' });
    } catch (error) {
      toast.error('Erro ao adicionar ataque');
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
              Adicionar Ataque
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
                placeholder="Ex: Mordida, Garra..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Dano *</label>
                <input
                  type="text"
                  value={form.damage}
                  onChange={(e) => setForm({ ...form, damage: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground font-mono"
                  placeholder="Ex: 2d6+3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tipo</label>
                <select
                  value={form.damageType}
                  onChange={(e) => setForm({ ...form, damageType: e.target.value as DamageType })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                >
                  {DAMAGE_TYPES.map((t) => (
                    <option key={t} value={t} className="capitalize">{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Alcance</label>
              <select
                value={form.reach}
                onChange={(e) => setForm({ ...form, reach: e.target.value as AttackReach })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {ATTACK_REACHES.map((r) => (
                  <option key={r} value={r} className="capitalize">{r}</option>
                ))}
              </select>
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
  monsterId: string;
  onSuccess: () => void;
}

function AddAbilityDialog({ open, onOpenChange, monsterId, onSuccess }: AddAbilityDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    type: 'habilidade' as 'habilidade' | 'ritual' | 'passiva',
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
      await monsterApi.createAbility(monsterId, {
        name: form.name.trim(),
        type: form.type,
        description: form.description.trim() || undefined,
      });
      toast.success('Habilidade adicionada');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', type: 'habilidade', description: '' });
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
                onChange={(e) => setForm({ ...form, type: e.target.value as 'habilidade' | 'ritual' | 'passiva' })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="habilidade">Habilidade</option>
                <option value="ritual">Ritual</option>
                <option value="passiva">Passiva</option>
              </select>
            </div>
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
