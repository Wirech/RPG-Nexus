import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { combatApi } from '@/services/api';
import { TokenAvatar } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { CombatParticipant } from '@/types';
import toast from 'react-hot-toast';

type ActionType = 'damage_pv' | 'damage_san' | 'heal_pv' | 'heal_san' | 'spend_pe' | 'recover_pe';

const ACTION_OPTIONS: { value: ActionType; label: string; color: string }[] = [
  { value: 'damage_pv', label: 'Dano (PV)', color: 'text-danger' },
  { value: 'damage_san', label: 'Dano (Sanidade)', color: 'text-warning' },
  { value: 'heal_pv', label: 'Cura (PV)', color: 'text-success' },
  { value: 'heal_san', label: 'Recuperar Sanidade', color: 'text-success' },
  { value: 'spend_pe', label: 'Gastar PE', color: 'text-accent' },
  { value: 'recover_pe', label: 'Recuperar PE', color: 'text-accent' },
];

interface ApplyDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: CombatParticipant[];
  combatId: string;
  onSuccess: () => void;
}

export function ApplyDamageDialog({
  open,
  onOpenChange,
  participants,
  combatId,
  onSuccess,
}: ApplyDamageDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    targetId: '',
    action: 'damage_pv' as ActionType,
    value: '',
    sourceId: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.targetId) {
      toast.error('Selecione um alvo');
      return;
    }

    const value = parseInt(form.value);
    if (isNaN(value) || value <= 0) {
      toast.error('Informe um valor válido');
      return;
    }

    setLoading(true);
    try {
      // Determine field and delta based on action
      let field: 'pv' | 'san' | 'pe';
      let delta: number;

      switch (form.action) {
        case 'damage_pv':
          field = 'pv';
          delta = -value;
          break;
        case 'damage_san':
          field = 'san';
          delta = -value;
          break;
        case 'heal_pv':
          field = 'pv';
          delta = value;
          break;
        case 'heal_san':
          field = 'san';
          delta = value;
          break;
        case 'spend_pe':
          field = 'pe';
          delta = -value;
          break;
        case 'recover_pe':
          field = 'pe';
          delta = value;
          break;
        default:
          field = 'pv';
          delta = -value;
      }

      await combatApi.updateParticipantVitals(combatId, form.targetId, {
        field,
        value: delta,
        sourceId: form.sourceId || undefined,
        description: form.description || undefined,
      });

      toast.success('Aplicado com sucesso!');
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao aplicar ação');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      targetId: '',
      action: 'damage_pv',
      value: '',
      sourceId: '',
      description: '',
    });
  };

  const selectedTarget = participants.find((p) => p.id === form.targetId);

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
              Aplicar Dano / Cura
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            {/* Target Select */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Alvo *
              </label>
              <select
                value={form.targetId}
                onChange={(e) => setForm({ ...form, targetId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="">Selecione o alvo</option>
                {participants.map((p) => {
                  const name = p.customName || p.character?.name || p.monster?.name || 'Participante';
                  return (
                    <option key={p.id} value={p.id}>
                      {name} (PV: {p.pvCurrent}/{p.pvMax})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Selected Target Preview */}
            {selectedTarget && (
              <div className="flex items-center gap-3 p-3 bg-background rounded-md">
                <TokenAvatar
                  src={selectedTarget.character?.tokenImage || selectedTarget.monster?.tokenImage}
                  name={selectedTarget.customName || selectedTarget.character?.name || selectedTarget.monster?.name || ''}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-foreground">
                    {selectedTarget.customName || selectedTarget.character?.name || selectedTarget.monster?.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PV: {selectedTarget.pvCurrent}/{selectedTarget.pvMax}
                    {selectedTarget.sanMax > 0 && ` • SAN: ${selectedTarget.sanCurrent}/${selectedTarget.sanMax}`}
                    {selectedTarget.peMax > 0 && ` • PE: ${selectedTarget.peCurrent}/${selectedTarget.peMax}`}
                  </p>
                </div>
              </div>
            )}

            {/* Action Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tipo de Ação
              </label>
              <select
                value={form.action}
                onChange={(e) => setForm({ ...form, action: e.target.value as ActionType })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Valor *
              </label>
              <input
                type="number"
                min="1"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                placeholder="Quantidade"
              />
            </div>

            {/* Source (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Origem (opcional)
              </label>
              <select
                value={form.sourceId}
                onChange={(e) => setForm({ ...form, sourceId: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                <option value="">Nenhuma</option>
                {participants
                  .filter((p) => p.id !== form.targetId)
                  .map((p) => {
                    const name = p.customName || p.character?.name || p.monster?.name || 'Participante';
                    return (
                      <option key={p.id} value={p.id}>
                        {name}
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Description (Optional) */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Descrição (opcional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
                placeholder="Ex: Ataque de mordida"
              />
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
                Aplicar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
