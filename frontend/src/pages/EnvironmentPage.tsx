import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  ChevronLeft,
  ChevronRight,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { environmentApi } from '@/services/api';
import { RichTextEditor, ConfirmDialog } from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Environment, EnvironmentPoint } from '@/types';
import toast from 'react-hot-toast';

export function EnvironmentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Content states
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Image carousel
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [addPointOpen, setAddPointOpen] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);
  const [deletePointId, setDeletePointId] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounce auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEnvironment = useCallback(async () => {
    if (!id) return;
    try {
      const response = await environmentApi.getById(id);
      setEnvironment(response.data);
      setDescription(response.data.description || '');
      setNotes(response.data.notes || '');
    } catch (error) {
      toast.error('Erro ao carregar ambiente');
      navigate('/environments');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchEnvironment();
  }, [fetchEnvironment]);

  // Auto-save description
  useEffect(() => {
    if (!hasUnsavedChanges || !id || !isAdmin) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await environmentApi.update(id, { description, notes });
        setHasUnsavedChanges(false);
        toast.success('Salvo');
      } catch (error) {
        toast.error('Erro ao salvar');
      } finally {
        setSaving(false);
      }
    }, 3000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [description, notes, hasUnsavedChanges, id, isAdmin]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !environment) return;

    try {
      await environmentApi.uploadImage(environment.id, file);
      toast.success('Imagem adicionada');
      fetchEnvironment();
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageId || !environment) return;
    try {
      await environmentApi.deleteImage(environment.id, deleteImageId);
      toast.success('Imagem removida');
      fetchEnvironment();
      setCurrentImageIndex(0);
    } catch (error) {
      toast.error('Erro ao remover imagem');
    } finally {
      setDeleteImageId(null);
    }
  };

  const handleToggleReveal = async () => {
    if (!environment) return;

    try {
      await environmentApi.reveal(environment.id, !environment.isRevealed);
      setEnvironment({ ...environment, isRevealed: !environment.isRevealed });
      setRevealDialogOpen(false);
      toast.success(environment.isRevealed ? 'Ambiente ocultado' : 'Ambiente revelado');
    } catch (error) {
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const handleDelete = async () => {
    if (!environment) return;

    try {
      await environmentApi.delete(environment.id);
      toast.success('Ambiente excluído');
      navigate('/environments');
    } catch (error) {
      toast.error('Erro ao excluir ambiente');
    }
  };

  const handleDeletePoint = async () => {
    if (!deletePointId || !environment) return;
    try {
      await environmentApi.deletePoint(environment.id, deletePointId);
      toast.success('Ponto de interesse removido');
      fetchEnvironment();
    } catch (error) {
      toast.error('Erro ao remover ponto');
    } finally {
      setDeletePointId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!environment) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Ambiente não encontrado</p>
      </div>
    );
  }

  const images = environment.images || [];
  const points = environment.points || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/environments')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setRevealDialogOpen(true)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors',
                environment.isRevealed
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {environment.isRevealed ? <Eye size={16} /> : <EyeOff size={16} />}
              {environment.isRevealed ? 'Revelado' : 'Oculto'}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2 text-danger hover:bg-danger/20 rounded-md transition-colors"
              title="Excluir ambiente"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-foreground">{environment.name}</h1>

      {/* Save indicator */}
      {isAdmin && (
        <div className="flex justify-end">
          {saving && (
            <span className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Salvando...
            </span>
          )}
          {!saving && hasUnsavedChanges && (
            <span className="text-sm text-warning">Alterações não salvas</span>
          )}
          {!saving && !hasUnsavedChanges && (description || notes) && (
            <span className="text-sm text-success">✓ Salvo</span>
          )}
        </div>
      )}

      {/* Image Carousel */}
      <div className="bg-surface border border-border rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground">Imagens</h3>
          {isAdmin && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
            >
              <Upload size={16} />
              Adicionar Imagem
            </button>
          )}
          <input
            ref={fileInputRef as React.RefObject<HTMLInputElement>}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        {images.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-background rounded-lg">
            <p className="text-muted-foreground">Nenhuma imagem adicionada</p>
          </div>
        ) : (
          <div className="relative">
            <div className="h-96 bg-background rounded-lg overflow-hidden">
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/uploads/environments/${images[currentImageIndex].filePath.split('/').pop()}`}
                alt={images[currentImageIndex].caption || environment.name}
                className="w-full h-full object-contain"
              />
            </div>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Indicators */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-colors',
                      currentImageIndex === index ? 'bg-accent' : 'bg-muted'
                    )}
                  />
                ))}
              </div>
            )}

            {/* Delete button */}
            {isAdmin && images.length > 0 && (
              <button
                onClick={() => setDeleteImageId(images[currentImageIndex].id)}
                className="absolute top-2 right-2 p-2 bg-danger/80 text-white rounded-md hover:bg-danger"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Description */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Descrição</h3>
        <RichTextEditor
          content={description}
          onChange={isAdmin ? (val) => {
            setDescription(val);
            setHasUnsavedChanges(true);
          } : undefined}
          readOnly={!isAdmin}
          placeholder="Descreva este ambiente..."
        />
      </div>

      {/* Points of Interest */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <MapPin size={20} className="text-accent" />
            Pontos de Interesse
          </h3>
          {isAdmin && (
            <button
              onClick={() => setAddPointOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
            >
              <Plus size={16} />
              Adicionar Ponto
            </button>
          )}
        </div>

        {points.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum ponto de interesse</p>
        ) : (
          <div className="space-y-2">
            {points.map((point) => (
              <PointOfInterestCard
                key={point.id}
                point={point}
                isAdmin={isAdmin}
                onDelete={() => setDeletePointId(point.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Admin Notes */}
      {isAdmin && (
        <div className="bg-surface border border-border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Notas do Mestre (oculto para jogadores)
          </h3>
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasUnsavedChanges(true);
            }}
            rows={4}
            placeholder="Anotações secretas sobre este ambiente..."
            className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground resize-none"
          />
        </div>
      )}

      {/* Dialogs */}
      <AddPointDialog
        open={addPointOpen}
        onOpenChange={setAddPointOpen}
        environmentId={environment.id}
        onSuccess={fetchEnvironment}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Ambiente"
        description={`Tem certeza que deseja excluir "${environment.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        title={environment.isRevealed ? 'Ocultar Ambiente' : 'Revelar Ambiente'}
        description={
          environment.isRevealed
            ? `Ocultar "${environment.name}" dos jogadores?`
            : `Revelar "${environment.name}" para todos os jogadores?`
        }
        confirmText={environment.isRevealed ? 'Ocultar' : 'Revelar'}
        onConfirm={handleToggleReveal}
      />

      <ConfirmDialog
        open={deleteImageId !== null}
        onOpenChange={(open) => !open && setDeleteImageId(null)}
        title="Remover Imagem"
        description="Tem certeza que deseja remover esta imagem?"
        confirmText="Remover"
        onConfirm={handleDeleteImage}
      />

      <ConfirmDialog
        open={deletePointId !== null}
        onOpenChange={(open) => !open && setDeletePointId(null)}
        title="Remover Ponto de Interesse"
        description="Tem certeza que deseja remover este ponto de interesse?"
        confirmText="Remover"
        onConfirm={handleDeletePoint}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// Point of Interest Card
// ─────────────────────────────────────────

interface PointOfInterestCardProps {
  point: EnvironmentPoint;
  isAdmin: boolean;
  onDelete: () => void;
}

function PointOfInterestCard({ point, isAdmin, onDelete }: PointOfInterestCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-background border border-border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 text-left"
      >
        <div className="flex items-center gap-3">
          <MapPin size={18} className="text-accent" />
          <span className="font-medium text-foreground">{point.name}</span>
          {point.linkedNpcId && (
            <span className="text-xs text-muted-foreground">(NPC vinculado)</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1 text-danger hover:bg-danger/20 rounded"
            >
              <Trash2 size={14} />
            </button>
          )}
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>
      
      {expanded && point.description && (
        <div className="px-4 pb-4 pt-0">
          <p className="text-sm text-muted-foreground">{point.description}</p>
          {point.linkedNpcId && (
            <Link
              to={`/characters/${point.linkedNpcId}`}
              className="inline-block mt-2 text-sm text-accent hover:underline"
            >
              Ver ficha do NPC →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────
// Add Point Dialog
// ─────────────────────────────────────────

interface AddPointDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  environmentId: string;
  onSuccess: () => void;
}

function AddPointDialog({ open, onOpenChange, environmentId, onSuccess }: AddPointDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
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
      await environmentApi.createPoint(environmentId, {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      toast.success('Ponto de interesse adicionado');
      onSuccess();
      onOpenChange(false);
      setForm({ name: '', description: '' });
    } catch (error) {
      toast.error('Erro ao adicionar ponto');
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
              Adicionar Ponto de Interesse
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
                placeholder="Ex: Altar misterioso..."
              />
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
