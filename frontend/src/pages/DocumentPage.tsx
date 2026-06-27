import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ArrowLeft,
  Trash2,
  Plus,
  Loader2,
  X,
  Eye,
  EyeOff,
  Upload,
  Tag,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Edit2,
  Check,
} from 'lucide-react';
import { documentApi } from '@/services/api';
import { RichTextEditor, ConfirmDialog } from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Document, DocumentCategory } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_EMOJIS: Record<DocumentCategory, string> = {
  'pista': '🔍',
  'relatório': '📋',
  'mapa': '🗺️',
  'foto': '📷',
  'áudio': '🔊',
  'outro': '📁',
};

const CATEGORIES: DocumentCategory[] = ['pista', 'relatório', 'mapa', 'foto', 'áudio', 'outro'];

export function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editing states
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Dialogs
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revealDialogOpen, setRevealDialogOpen] = useState(false);
  const [addTagOpen, setAddTagOpen] = useState(false);
  const [deleteImageId, setDeleteImageId] = useState<string | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Debounce auto-save
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDocument = useCallback(async () => {
    if (!id) return;
    try {
      const response = await documentApi.getById(id);
      setDocument(response.data);
      setTitle(response.data.title);
      setContent(response.data.content || '');
      setTags(response.data.tags || []);
    } catch (error) {
      toast.error('Erro ao carregar documento');
      navigate('/documents');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Auto-save content
  useEffect(() => {
    if (!hasUnsavedChanges || !id || !isAdmin) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        await documentApi.update(id, { content });
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
  }, [content, hasUnsavedChanges, id, isAdmin]);

  const handleSaveTitle = async () => {
    if (!document || !title.trim()) return;

    try {
      await documentApi.update(document.id, { title: title.trim() });
      setDocument({ ...document, title: title.trim() });
      setEditingTitle(false);
      toast.success('Título atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar título');
    }
  };

  const handleCategoryChange = async (category: DocumentCategory) => {
    if (!document) return;

    try {
      await documentApi.update(document.id, { category });
      setDocument({ ...document, category });
      toast.success('Categoria atualizada');
    } catch (error) {
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleAddTag = async (tag: string) => {
    if (!document || !tag.trim() || tags.includes(tag.trim())) return;

    const newTags = [...tags, tag.trim()];
    try {
      await documentApi.update(document.id, { tags: newTags });
      setTags(newTags);
      setDocument({ ...document, tags: newTags });
      toast.success('Tag adicionada');
    } catch (error) {
      toast.error('Erro ao adicionar tag');
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!document) return;

    const newTags = tags.filter((t) => t !== tagToRemove);
    try {
      await documentApi.update(document.id, { tags: newTags });
      setTags(newTags);
      setDocument({ ...document, tags: newTags });
      toast.success('Tag removida');
    } catch (error) {
      toast.error('Erro ao remover tag');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !document) return;

    try {
      await documentApi.uploadImage(document.id, file);
      toast.success('Imagem adicionada');
      fetchDocument();
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  const handleDeleteImage = async () => {
    if (!deleteImageId || !document) return;
    try {
      await documentApi.deleteImage(document.id, deleteImageId);
      toast.success('Imagem removida');
      fetchDocument();
      setCurrentImageIndex(0);
    } catch (error) {
      toast.error('Erro ao remover imagem');
    } finally {
      setDeleteImageId(null);
    }
  };

  const handleToggleReveal = async () => {
    if (!document) return;

    try {
      await documentApi.reveal(document.id, !document.isRevealed);
      setDocument({ ...document, isRevealed: !document.isRevealed });
      setRevealDialogOpen(false);
      toast.success(document.isRevealed ? 'Documento ocultado' : 'Documento revelado');
    } catch (error) {
      toast.error('Erro ao alterar visibilidade');
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    try {
      await documentApi.delete(document.id);
      toast.success('Documento excluído');
      navigate('/documents');
    } catch (error) {
      toast.error('Erro ao excluir documento');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!document) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Documento não encontrado</p>
      </div>
    );
  }

  const images = document.images || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/documents')}
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
                document.isRevealed
                  ? 'bg-success/20 text-success hover:bg-success/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {document.isRevealed ? <Eye size={16} /> : <EyeOff size={16} />}
              {document.isRevealed ? 'Revelado' : 'Oculto'}
            </button>
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="p-2 text-danger hover:bg-danger/20 rounded-md transition-colors"
              title="Excluir documento"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">{document.category ? CATEGORY_EMOJIS[document.category] : '📁'}</span>
        {editingTitle && isAdmin ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
              className="flex-1 text-3xl font-bold bg-transparent border-b-2 border-accent text-foreground focus:outline-none"
            />
            <button
              onClick={handleSaveTitle}
              className="p-2 text-success hover:bg-success/20 rounded-md"
            >
              <Check size={20} />
            </button>
            <button
              onClick={() => {
                setTitle(document.title);
                setEditingTitle(false);
              }}
              className="p-2 text-muted-foreground hover:bg-muted rounded-md"
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-foreground">{document.title}</h1>
            {isAdmin && (
              <button
                onClick={() => {
                  setEditingTitle(true);
                  setTimeout(() => titleInputRef.current?.focus(), 0);
                }}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Category and Tags */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Category */}
        {isAdmin ? (
          <select
            value={document.category || 'outro'}
            onChange={(e) => handleCategoryChange(e.target.value as DocumentCategory)}
            className="px-3 py-1 bg-surface border border-border rounded-md text-foreground"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_EMOJIS[cat]} {cat}
              </option>
            ))}
          </select>
        ) : (
          <span className="px-3 py-1 bg-muted rounded-md text-foreground">
            {document.category ? CATEGORY_EMOJIS[document.category] : '📁'} {document.category || 'outro'}
          </span>
        )}

        {/* Tags */}
        <div className="flex items-center gap-2 flex-wrap">
          <Tag size={16} className="text-muted-foreground" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent/20 text-accent rounded"
            >
              {tag}
              {isAdmin && (
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-danger"
                >
                  <X size={12} />
                </button>
              )}
            </span>
          ))}
          {isAdmin && (
            <button
              onClick={() => setAddTagOpen(true)}
              className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-muted-foreground text-muted-foreground rounded hover:border-accent hover:text-accent"
            >
              <Plus size={12} />
              Tag
            </button>
          )}
        </div>
      </div>

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
          {!saving && !hasUnsavedChanges && content && (
            <span className="text-sm text-success">✓ Salvo</span>
          )}
        </div>
      )}

      {/* Content */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Conteúdo</h3>
        <RichTextEditor
          content={content}
          onChange={isAdmin ? (val) => {
            setContent(val);
            setHasUnsavedChanges(true);
          } : undefined}
          readOnly={!isAdmin}
          placeholder="Escreva o conteúdo do documento..."
        />
      </div>

      {/* Image Gallery */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <ImagePlus size={20} className="text-accent" />
            Imagens
          </h3>
          {isAdmin && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-3 py-1.5 bg-accent text-white rounded-md hover:bg-accent/90 text-sm"
            >
              <Upload size={16} />
              Adicionar
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
          <div className="h-32 flex items-center justify-center bg-background rounded-lg">
            <p className="text-muted-foreground">Nenhuma imagem</p>
          </div>
        ) : (
          <div className="relative">
            <div className="h-64 bg-background rounded-lg overflow-hidden">
              <img
                src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/uploads/documents/${images[currentImageIndex].filePath.split('/').pop()}`}
                alt=""
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

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {images.map((img, index) => (
                  <button
                    key={img.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'w-12 h-12 rounded overflow-hidden border-2',
                      currentImageIndex === index ? 'border-accent' : 'border-transparent'
                    )}
                  >
                    <img
                      src={`${import.meta.env.VITE_API_URL?.replace('/api/v1', '')}/uploads/documents/${img.filePath.split('/').pop()}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
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

      {/* Dialogs */}
      <AddTagDialog
        open={addTagOpen}
        onOpenChange={setAddTagOpen}
        onAdd={handleAddTag}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Excluir Documento"
        description={`Tem certeza que deseja excluir "${document.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        open={revealDialogOpen}
        onOpenChange={setRevealDialogOpen}
        title={document.isRevealed ? 'Ocultar Documento' : 'Revelar Documento'}
        description={
          document.isRevealed
            ? `Ocultar "${document.title}" dos jogadores?`
            : `Revelar "${document.title}" para todos os jogadores?`
        }
        confirmText={document.isRevealed ? 'Ocultar' : 'Revelar'}
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
    </div>
  );
}

// ─────────────────────────────────────────
// Add Tag Dialog
// ─────────────────────────────────────────

interface AddTagDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tag: string) => void;
}

function AddTagDialog({ open, onOpenChange, onAdd }: AddTagDialogProps) {
  const [tag, setTag] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tag.trim()) return;
    onAdd(tag.trim());
    setTag('');
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg shadow-xl w-full max-w-sm z-50">
          <div className="p-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Adicionar Tag
            </Dialog.Title>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Nome da tag"
              className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
            />
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => onOpenChange(false)} className="px-4 py-2 text-muted-foreground">
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
              >
                Adicionar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
