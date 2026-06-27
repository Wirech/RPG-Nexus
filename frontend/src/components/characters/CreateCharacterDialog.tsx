import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { characterApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { CharacterGroup, CharacterRole, DiceValue } from '@/types';
import toast from 'react-hot-toast';

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: CharacterGroup[];
  onSuccess: () => void;
}

const TRILHAS: CharacterRole[] = ['Combatente', 'Especialista', 'Ocultista'];
const NEX_VALUES = ['5%', '10%', '15%', '20%', '25%', '30%', '35%', '40%', '45%', '50%', '55%', '60%', '65%', '70%', '75%', '80%', '85%', '90%', '95%', '99%'];
const DICE_VALUES: DiceValue[] = ['d4', 'd6', 'd8', 'd10' as DiceValue, 'd12', 'd20'];

export function CreateCharacterDialog({ open, onOpenChange, groups, onSuccess }: CreateCharacterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    groupId: groups[0]?.id || '',
    trilha: '' as CharacterRole | '',
    nex: '5%',
    pvMax: 20,
    sanMax: 20,
    peMax: 5,
    attrForca: 'd6' as DiceValue,
    attrAgilidade: 'd6' as DiceValue,
    attrIntelecto: 'd6' as DiceValue,
    attrPresenca: 'd6' as DiceValue,
    attrVigor: 'd6' as DiceValue,
  });

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

    setLoading(true);
    try {
      await characterApi.create({
        name: formData.name.trim(),
        groupId: formData.groupId,
        trilha: formData.trilha || undefined,
        nex: formData.nex,
        pvMax: formData.pvMax,
        sanMax: formData.sanMax,
        peMax: formData.peMax,
        attrForca: formData.attrForca,
        attrAgilidade: formData.attrAgilidade,
        attrIntelecto: formData.attrIntelecto,
        attrPresenca: formData.attrPresenca,
        attrVigor: formData.attrVigor,
      });
      toast.success(`Personagem "${formData.name}" criado!`);
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        groupId: groups[0]?.id || '',
        trilha: '',
        nex: '5%',
        pvMax: 20,
        sanMax: 20,
        peMax: 5,
        attrForca: 'd6',
        attrAgilidade: 'd6',
        attrIntelecto: 'd6',
        attrPresenca: 'd6',
        attrVigor: 'd6',
      });
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
                Nome *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  Trilha
                </label>
                <select
                  value={formData.trilha}
                  onChange={(e) => setFormData({ ...formData, trilha: e.target.value as CharacterRole })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="">Sem trilha</option>
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

            {/* Vitais */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Pontos Máximos
              </label>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">PV</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.pvMax}
                    onChange={(e) => setFormData({ ...formData, pvMax: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">SAN</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.sanMax}
                    onChange={(e) => setFormData({ ...formData, sanMax: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">PE</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.peMax}
                    onChange={(e) => setFormData({ ...formData, peMax: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                  />
                </div>
              </div>
            </div>

            {/* Atributos */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Atributos
              </label>
              <div className="grid grid-cols-5 gap-2">
                {(['attrForca', 'attrAgilidade', 'attrIntelecto', 'attrPresenca', 'attrVigor'] as const).map((attr) => (
                  <div key={attr}>
                    <label className="block text-xs text-muted-foreground mb-1 text-center">
                      {attr.replace('attr', '').slice(0, 3).toUpperCase()}
                    </label>
                    <select
                      value={formData[attr]}
                      onChange={(e) => setFormData({ ...formData, [attr]: e.target.value as DiceValue })}
                      className="w-full px-2 py-2 bg-background border border-border rounded-md text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    >
                      {DICE_VALUES.map((d) => (
                        <option key={d} value={d}>{d}</option>
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
