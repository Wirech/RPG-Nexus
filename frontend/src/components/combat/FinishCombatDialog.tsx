import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, CheckCircle, Users, Swords, FileText } from 'lucide-react';
import { TokenAvatar } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { CombatSession, CombatParticipant, CombatEvent } from '@/types';

interface FinishCombatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combat: CombatSession;
  participants: CombatParticipant[];
  events: CombatEvent[];
  onConfirm: (updateVitals: boolean, createSessionNote: boolean) => Promise<void>;
}

export function FinishCombatDialog({
  open,
  onOpenChange,
  combat,
  participants,
  events,
  onConfirm,
}: FinishCombatDialogProps) {
  const [loading, setLoading] = useState(false);
  const [updateVitals, setUpdateVitals] = useState(true);
  const [createSessionNote, setCreateSessionNote] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(updateVitals, createSessionNote);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const characters = participants.filter((p) => p.entityType === 'character');
  const monsters = participants.filter((p) => p.entityType === 'monster');
  const deadParticipants = participants.filter((p) => {
    const conditions: string[] = Array.isArray(p.conditions) ? p.conditions : [];
    return conditions.includes('Morto') || p.pvCurrent === 0;
  });
  const damageEvents = events.filter((e) => e.action === 'damage');
  const totalDamage = damageEvents.reduce((sum, e) => sum + Math.abs(e.value || 0), 0);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-lg z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Encerrar Combate
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <div className="p-4 space-y-4">
            {/* Combat Summary */}
            <div className="bg-background border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">{combat.name}</h3>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Swords size={16} className="text-accent" />
                  <span className="text-muted-foreground">Rodadas:</span>
                  <span className="text-foreground font-medium">{combat.roundCurrent}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-blue-400" />
                  <span className="text-muted-foreground">Participantes:</span>
                  <span className="text-foreground font-medium">{participants.length}</span>
                </div>
              </div>

              {/* Participants Summary */}
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">Participantes:</p>
                <div className="flex flex-wrap gap-2">
                  {participants.map((p) => {
                    const isDead = p.pvCurrent === 0;
                    return (
                      <div
                        key={p.id}
                        className={cn(
                          'flex items-center gap-1.5 px-2 py-1 rounded',
                          isDead ? 'bg-danger/20' : 'bg-muted'
                        )}
                      >
                        <TokenAvatar
                          src={p.character?.tokenImage || p.monster?.tokenImage}
                          name={p.customName || p.character?.name || p.monster?.name || ''}
                          size="xs"
                        />
                        <span className={cn(
                          'text-xs',
                          isDead ? 'text-danger line-through' : 'text-foreground'
                        )}>
                          {p.customName || p.character?.name || p.monster?.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stats */}
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{characters.length}</p>
                  <p className="text-xs text-muted-foreground">Personagens</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{monsters.length}</p>
                  <p className="text-xs text-muted-foreground">Monstros</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-danger">{totalDamage}</p>
                  <p className="text-xs text-muted-foreground">Dano Total</p>
                </div>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={updateVitals}
                  onChange={(e) => setUpdateVitals(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <div>
                  <p className="font-medium text-foreground">Atualizar vitais dos personagens</p>
                  <p className="text-xs text-muted-foreground">
                    Salvar PV, SAN e PE atuais nas fichas dos personagens
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="checkbox"
                  checked={createSessionNote}
                  onChange={(e) => setCreateSessionNote(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent"
                />
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-accent" />
                  <div>
                    <p className="font-medium text-foreground">Criar nota de sessão</p>
                    <p className="text-xs text-muted-foreground">
                      Gerar nota com o log deste combate
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {/* Warning */}
            {deadParticipants.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                <span className="text-warning text-sm">⚠️</span>
                <p className="text-sm text-warning">
                  {deadParticipants.length} participante(s) derrotado(s) neste combate.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-4 border-t border-border">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className={cn(
                'px-4 py-2 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
              )}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle size={16} />
              )}
              Encerrar Combate
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
