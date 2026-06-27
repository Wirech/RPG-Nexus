import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Map, Eye, EyeOff, ImageOff } from 'lucide-react';
import { environmentApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Environment } from '@/types';
import toast from 'react-hot-toast';

export function Environments() {
  const { isAdmin } = useAuth();
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchEnvironments = async () => {
    try {
      const response = await environmentApi.list({ search: searchQuery || undefined });
      setEnvironments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch environments:', error);
      toast.error('Erro ao carregar ambientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvironments();
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Ambientes</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-64 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Ambientes</h1>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
          >
            <Plus size={18} />
            Novo Ambiente
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar por nome..."
          className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {/* Environments Grid */}
      {environments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Map size={48} className="mb-4 opacity-50" />
          <p className="text-lg">Nenhum ambiente encontrado</p>
          {searchQuery && (
            <p className="text-sm mt-1">Tente ajustar a busca</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {environments.map((env) => (
            <EnvironmentCard key={env.id} environment={env} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {isAdmin && (
        <CreateEnvironmentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={fetchEnvironments}
        />
      )}
    </div>
  );
}

interface EnvironmentCardProps {
  environment: Environment;
  isAdmin: boolean;
}

function EnvironmentCard({ environment, isAdmin }: EnvironmentCardProps) {
  const firstImage = environment.images?.[0];
  const description = environment.description?.replace(/<[^>]*>/g, '').slice(0, 100) || '';

  return (
    <Link
      to={`/environments/${environment.id}`}
      className="block bg-surface border border-border rounded-lg overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 hover:border-success/50"
    >
      {/* Image */}
      <div className="relative h-40 bg-background">
        {firstImage ? (
          <img
            src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/uploads/environments/${firstImage.filePath.split('/').pop()}`}
            alt={environment.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff size={48} className="text-muted-foreground/30" />
          </div>
        )}
        
        {/* Visibility Badge */}
        {isAdmin && (
          <div className={cn(
            'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded text-xs',
            environment.isRevealed
              ? 'bg-success/90 text-white'
              : 'bg-muted/90 text-muted-foreground'
          )}>
            {environment.isRevealed ? <Eye size={12} /> : <EyeOff size={12} />}
            {environment.isRevealed ? 'Revelado' : 'Oculto'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground truncate">{environment.name}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}...
          </p>
        )}
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────
// Create Environment Dialog
// ─────────────────────────────────────────

import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';

interface CreateEnvironmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateEnvironmentDialog({ open, onOpenChange, onSuccess }: CreateEnvironmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await environmentApi.create({ name: name.trim() });
      toast.success(`Ambiente "${name}" criado!`);
      onSuccess();
      onOpenChange(false);
      setName('');
    } catch (error) {
      toast.error('Erro ao criar ambiente');
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
              Novo Ambiente
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Nome do ambiente"
              />
            </div>

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
                Criar Ambiente
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
