import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { monsterApi } from '@/services/api';
import { cn } from '@/lib/utils';
import type { ThreatLevel, DiceValue } from '@/types';
import toast from 'react-hot-toast';

interface CreateMonsterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const THREAT_LEVELS: ThreatLevel[] = ['Moderado', 'Perigoso', 'Mortal', 'Lendário'];
const DICE_VALUES: DiceValue[] = ['d4', 'd6', 'd8', 'd10' as DiceValue, 'd12', 'd20'];

export function CreateMonsterDialog({ open, onOpenChange, onSuccess }: CreateMonsterDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    threatLevel: 'Moderado' as ThreatLevel,
    pvMax: 30,
    sanMax: 0,
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

    setLoading(true);
    try {
      await monsterApi.create({
        name: formData.name.trim(),
        threatLevel: formData.threatLevel,
        pvMax: formData.pvMax,
        sanMax: formData.sanMax || undefined,
        attrForca: formData.attrForca,
        attrAgilidade: formData.attrAgilidade,
        attrIntelecto: formData.attrIntelecto,
        attrPresenca: formData.attrPresenca,
        attrVigor: formData.attrVigor,
      });
      toast.success(`Monstro "${formData.name}" criado!`);
      onSuccess();
      onOpenChange(false);
      setFormData({
        name: '',
        threatLevel: 'Moderado',
        pvMax: 30,
        sanMax: 0,
        attrForca: 'd6',
        attrAgilidade: 'd6',
        attrIntelecto: 'd6',
        attrPresenca: 'd6',
        attrVigor: 'd6',
      });
    } catch (error) {
      toast.error('Erro ao criar monstro');
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
              Novo Monstro
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
                placeholder="Nome do monstro"
              />
            </div>

            {/* Nível de Ameaça */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nível de Ameaça
              </label>
              <select
                value={formData.threatLevel}
                onChange={(e) => setFormData({ ...formData, threatLevel: e.target.value as ThreatLevel })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                {THREAT_LEVELS.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            {/* PV e SAN */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  PV Máximo *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.pvMax}
                  onChange={(e) => setFormData({ ...formData, pvMax: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  SAN Máxima
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sanMax}
                  onChange={(e) => setFormData({ ...formData, sanMax: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
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
                Criar Monstro
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
