import { useState, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Info } from 'lucide-react';
import { characterApi } from '@/services/api';
import { cn } from '@/lib/utils';
import { calculateCharacterStats, getNexLevel } from '@/data/gameRules';
import { ORIGINS, ALL_SKILLS, SKILL_TO_ATTRIBUTE, getOriginByName, countChoices } from '@/data/origins';
import type { CharacterGroup, CharacterRole } from '@/types';
import toast from 'react-hot-toast';

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CharacterGroup[];
  onSuccess: () => void;
}

const TRILHAS: CharacterRole[] = ['Combatente', 'Especialista', 'Ocultista'];
const NEX_VALUES = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'];
const ATTR_VALUES = [0, 1, 2, 3, 4, 5];

export function CreateCharacterDialog({ open, onOpenChange, groups, onSuccess }: CreateCharacterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    groupId: groups[0]?.id || '',
    trilha: 'Combatente' as CharacterRole,
    origem: '',
    nex: '5%',
    attrForca: 1,
    attrAgilidade: 1,
    attrIntelecto: 1,
    attrPresenca: 1,
    attrVigor: 1,
  });
  const [skillChoices, setSkillChoices] = useState<string[]>(['', '']);

  // Origem selecionada
  const selectedOrigin = useMemo(() => {
    return formData.origem ? getOriginByName(formData.origem) : null;
  }, [formData.origem]);

  // Quantas escolhas de perícia a origem tem
  const numChoices = useMemo(() => {
    return selectedOrigin ? countChoices(selectedOrigin) : 0;
  }, [selectedOrigin]);

  // Perícias que serão concedidas pela origem
  const originSkills = useMemo(() => {
    if (!selectedOrigin) return [];
    
    const skills: { name: string; attribute: string }[] = [];
    let choiceIndex = 0;
    
    for (const skill of selectedOrigin.skills) {
      if (skill === 'escolha') {
        const chosen = skillChoices[choiceIndex];
        if (chosen) {
          skills.push({ name: chosen, attribute: SKILL_TO_ATTRIBUTE[chosen] || 'intelecto' });
        }
        choiceIndex++;
      } else {
        skills.push({ name: skill, attribute: SKILL_TO_ATTRIBUTE[skill] || 'intelecto' });
      }
    }
    
    return skills;
  }, [selectedOrigin, skillChoices]);

  // Calcular stats automaticamente baseado nas escolhas
  const calculatedStats = useMemo(() => {
    if (!formData.trilha) return null;
    
    return calculateCharacterStats(
      formData.trilha,
      formData.nex,
      {
        forca: formData.attrForca,
        agilidade: formData.attrAgilidade,
        intelecto: formData.attrIntelecto,
        presenca: formData.attrPresenca,
        vigor: formData.attrVigor,
      }
    );
  }, [formData.trilha, formData.nex, formData.attrForca, formData.attrAgilidade, formData.attrIntelecto, formData.attrPresenca, formData.attrVigor]);

  const nexLevel = useMemo(() => getNexLevel(formData.nex), [formData.nex]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!formData.groupId) {
      toast.error('Selecione um grupo');
      return;
    }
    if (!formData.trilha) {
      toast.error('Selecione uma trilha');
      return;
    }
    
    // Validar escolhas de perícia se a origem tiver
    if (numChoices > 0) {
      const filledChoices = skillChoices.slice(0, numChoices).filter(s => s !== '');
      if (filledChoices.length < numChoices) {
        toast.error('Selecione todas as perícias da origem');
        return;
      }
    }

    setLoading(true);
    try {
      // Criar personagem
      const response = await characterApi.create({
        name: formData.name.trim(),
        groupId: formData.groupId,
        trilha: formData.trilha,
        origem: formData.origem || undefined,
        nex: formData.nex,
        attrForca: formData.attrForca,
        attrAgilidade: formData.attrAgilidade,
        attrIntelecto: formData.attrIntelecto,
        attrPresenca: formData.attrPresenca,
        attrVigor: formData.attrVigor,
      });
      const character = response.data;

      // Se tiver origem, criar as perícias treinadas automaticamente
      if (selectedOrigin && originSkills.length > 0) {
        for (const skill of originSkills) {
          try {
            await characterApi.createSkill(character.id, {
              name: skill.name,
              attribute: skill.attribute as 'forca' | 'agilidade' | 'intelecto' | 'presenca' | 'vigor',
              training: 'treinado',
              otherBonus: 0,
              isTrained: true,
              hasSpecialization: false,
              bonusModifier: 0,
              isOfficial: false,
            });
          } catch (err) {
            console.warn(`Erro ao criar perícia ${skill.name}:`, err);
          }
        }
      }

      // Se tiver origem, criar a habilidade do poder de origem
      if (selectedOrigin) {
        try {
          await characterApi.createAbility(character.id, {
            name: `[Origem] ${selectedOrigin.power.name}`,
            description: selectedOrigin.power.description,
            peCost: 0,
            type: 'origem',
            isActive: true,
            currentUses: 0,
          });
        } catch (err) {
          console.warn('Erro ao criar habilidade de origem:', err);
        }
      }

      toast.success(`Personagem "${formData.name}" criado!`);
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        groupId: groups[0]?.id || '',
        trilha: 'Combatente',
        origem: '',
        nex: '5%',
        attrForca: 1,
        attrAgilidade: 1,
        attrIntelecto: 1,
        attrPresenca: 1,
        attrVigor: 1,
      });
      setSkillChoices(['', '']);
    } catch (error) {
      toast.error('Erro ao criar personagem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Novo Personagem
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome * <span className="text-xs text-muted-foreground">({formData.name.length}/40)</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value.slice(0, 40) })}
                maxLength={40}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Nome do personagem"
              />
            </div>

            {/* Grupo */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Grupo *
              </label>
              <select
                value={formData.groupId}
                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Trilha e NEX */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Classe *
                </label>
                <select
                  value={formData.trilha}
                  onChange={(e) => setFormData({ ...formData, trilha: e.target.value as CharacterRole })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {TRILHAS.map((trilha) => (
                    <option key={trilha} value={trilha}>{trilha}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  NEX
                </label>
                <select
                  value={formData.nex}
                  onChange={(e) => setFormData({ ...formData, nex: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  {NEX_VALUES.map((nex) => (
                    <option key={nex} value={nex}>{nex}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Origem
              </label>
              <select
                value={formData.origem}
                onChange={(e) => {
                  setFormData({ ...formData, origem: e.target.value });
                  setSkillChoices(['', '']); // Reset skill choices when origin changes
                }}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">-- Selecione uma origem --</option>
                <optgroup label="Livro Básico">
                  {ORIGINS.filter(o => o.source === 'livro-basico').map((origin) => (
                    <option key={origin.name} value={origin.name}>{origin.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Sobrevivendo ao Horror">
                  {ORIGINS.filter(o => o.source === 'sobrevivendo-ao-horror').map((origin) => (
                    <option key={origin.name} value={origin.name}>{origin.name}</option>
                  ))}
                </optgroup>
                <optgroup label="Materiais Extras">
                  {ORIGINS.filter(o => o.source === 'extras').map((origin) => (
                    <option key={origin.name} value={origin.name}>{origin.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Info da Origem Selecionada */}
            {selectedOrigin && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-accent mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium text-foreground">Perícias:</span>{' '}
                      <span className="text-muted-foreground">
                        {selectedOrigin.skills.map((s, i) => (
                          <span key={i}>
                            {s === 'escolha' ? <em className="text-accent">(à escolha)</em> : s}
                            {i < selectedOrigin.skills.length - 1 && ' + '}
                          </span>
                        ))}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{selectedOrigin.power.name}:</span>{' '}
                      <span className="text-muted-foreground">{selectedOrigin.power.description}</span>
                    </div>
                  </div>
                </div>
                
                {/* Escolha de perícias */}
                {numChoices > 0 && (
                  <div className="mt-3 pt-3 border-t border-accent/20">
                    <span className="block text-sm font-medium text-foreground mb-2">
                      Escolha {numChoices === 1 ? 'a perícia' : 'as perícias'}:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {Array.from({ length: numChoices }).map((_, idx) => (
                        <select
                          key={idx}
                          value={skillChoices[idx] || ''}
                          onChange={(e) => {
                            const newChoices = [...skillChoices];
                            newChoices[idx] = e.target.value;
                            setSkillChoices(newChoices);
                          }}
                          className="px-2 py-1.5 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                        >
                          <option value="">-- Selecione --</option>
                          {ALL_SKILLS.filter(s => !skillChoices.includes(s) || skillChoices[idx] === s).map((skill) => (
                            <option key={skill} value={skill}>{skill}</option>
                          ))}
                        </select>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Valores Calculados */}
            {calculatedStats && (
              <div className="bg-background border border-border rounded-lg p-4">
                <label className="block text-sm font-medium text-foreground mb-3">
                  Valores Calculados
                </label>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <span className="block text-xs text-muted-foreground mb-1">PV Máx</span>
                    <span className="text-2xl font-bold text-red-400">{calculatedStats.pvMax}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-muted-foreground mb-1">SAN Máx</span>
                    <span className="text-2xl font-bold text-blue-400">{calculatedStats.sanMax}</span>
                  </div>
                  <div className="text-center">
                    <span className="block text-xs text-muted-foreground mb-1">PE Máx</span>
                    <span className="text-2xl font-bold text-yellow-400">{calculatedStats.peMax}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <span className="block text-xs text-muted-foreground">Defesa</span>
                    <span className="font-semibold">{calculatedStats.defesa}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Esquiva</span>
                    <span className="font-semibold">+{calculatedStats.esquiva}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Bloqueio</span>
                    <span className="font-semibold">RD {calculatedStats.bloqueio}</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm mt-2">
                  <div>
                    <span className="block text-xs text-muted-foreground">Limite PE</span>
                    <span className="font-semibold">{calculatedStats.limitePE}/rodada</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Inventário</span>
                    <span className="font-semibold">{calculatedStats.espacosInventario} espaços</span>
                  </div>
                  <div>
                    <span className="block text-xs text-muted-foreground">Perícias</span>
                    <span className="font-semibold">{calculatedStats.pericias}</span>
                  </div>
                </div>
                {nexLevel && (
                  <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground text-center">
                    {nexLevel.veteranoDisponivel && <span className="mr-3">✓ Veterano disponível</span>}
                    {nexLevel.expertDisponivel && <span>✓ Expert disponível</span>}
                    {!nexLevel.veteranoDisponivel && !nexLevel.expertDisponivel && <span>Apenas treinamento básico disponível</span>}
                  </div>
                )}
              </div>
            )}

            {/* Atributos */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Atributos (1-6)
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['attrForca', 'attrAgilidade', 'attrIntelecto', 'attrPresenca', 'attrVigor'] as const).map((attr) => (
                  <div key={attr}>
                    <label className="block text-xs text-muted-foreground mb-1 text-center">
                      {attr.replace('attr', '').slice(0, 3).toUpperCase()}
                    </label>
                    <select
                      value={formData[attr]}
                      onChange={(e) => setFormData({ ...formData, [attr]: parseInt(e.target.value) })}
                      className="w-full px-2 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {ATTR_VALUES.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

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
                disabled={loading}
                className={cn(
                  'px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
                )}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Criar Personagem
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
