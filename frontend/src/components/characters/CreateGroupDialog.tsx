import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { characterApi } from '@/services/api';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CreateGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const COLOR_OPTIONS = [
  { label: 'Roxo', value: '#7c3aed' },
  { label: 'Azul', value: '#3b82f6' },
  { label: 'Verde', value: '#16a34a' },
  { label: 'Amarelo', value: '#d97706' },
  { label: 'Vermelho', value: '#dc2626' },
  { label: 'Rosa', value: '#ec4899' },
  { label: 'Ciano', value: '#06b6d4' },
  { label: 'Cinza', value: '#6b7280' },
];

export function CreateGroupDialog({ open, onOpenChange, onSuccess }: CreateGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await characterApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
      });
      toast.success(`Grupo "${name}" criado!`);
      onSuccess();
      onOpenChange(false);
      setName('');
      setDescription('');
      setColor(COLOR_OPTIONS[0].value);
    } catch (error) {
      toast.error('Erro ao criar grupo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-md z-50">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Novo Grupo
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
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Ex: Agentes, NPCs, Antagonistas..."
              />
            </div>

            {/* Descrição */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Descrição
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Descrição opcional..."
              />
            </div>

            {/* Cor */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Cor
              </label>
              <div className="flex gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setColor(option.value)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-all',
                      color === option.value ? 'border-white scale-110' : 'border-transparent'
                    )}
                    style={{ backgroundColor: option.value }}
                    title={option.label}
                  />
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
                Criar Grupo
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
