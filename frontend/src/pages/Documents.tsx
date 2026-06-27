import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Plus,
  FileText,
  X,
  Loader2,
  Eye,
  EyeOff,
  SearchIcon,
  FileCheck,
  Map,
  Camera,
  Volume2,
  Folder,
} from 'lucide-react';
import { documentApi } from '@/services/api';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import type { Document, DocumentCategory } from '@/types';
import toast from 'react-hot-toast';

const CATEGORY_CONFIG: Record<DocumentCategory, { icon: React.ElementType; label: string; emoji: string }> = {
  'pista': { icon: SearchIcon, label: 'Pista', emoji: '🔍' },
  'relatório': { icon: FileCheck, label: 'Relatório', emoji: '📋' },
  'mapa': { icon: Map, label: 'Mapa', emoji: '🗺️' },
  'foto': { icon: Camera, label: 'Foto', emoji: '📷' },
  'áudio': { icon: Volume2, label: 'Áudio', emoji: '🔊' },
  'outro': { icon: Folder, label: 'Outro', emoji: '📁' },
};

const CATEGORIES: DocumentCategory[] = ['pista', 'relatório', 'mapa', 'foto', 'áudio', 'outro'];

export function Documents() {
  const { isAdmin } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DocumentCategory | ''>('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchDocuments = async () => {
    try {
      const response = await documentApi.list({
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
      });
      setDocuments(response.data || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast.error('Erro ao carregar documentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [searchQuery, categoryFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-48 bg-surface rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-foreground">Documentos</h1>
        {isAdmin && (
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
          >
            <Plus size={18} />
            Novo Documento
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por título ou tags..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as DocumentCategory | '')}
          className="px-3 py-2 bg-surface border border-border rounded-md text-foreground"
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_CONFIG[cat].emoji} {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText size={48} className="mb-4 opacity-50" />
          <p className="text-lg">Nenhum documento encontrado</p>
          {(searchQuery || categoryFilter) && (
            <p className="text-sm mt-1">Tente ajustar os filtros</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {isAdmin && (
        <CreateDocumentDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

interface DocumentCardProps {
  document: Document;
  isAdmin: boolean;
}

function DocumentCard({ document, isAdmin }: DocumentCardProps) {
  const config = document.category ? CATEGORY_CONFIG[document.category] : CATEGORY_CONFIG['outro'];
  const excerpt = document.content?.replace(/<[^>]*>/g, '').slice(0, 80) || '';

  return (
    <Link
      to={`/documents/${document.id}`}
      className="block bg-surface border border-border rounded-lg p-4 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-accent/50"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <span className="text-3xl">{config.emoji}</span>
        {isAdmin && (
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-xs',
            document.isRevealed
              ? 'bg-success/20 text-success'
              : 'bg-muted text-muted-foreground'
          )}>
            {document.isRevealed ? <Eye size={10} /> : <EyeOff size={10} />}
          </div>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-foreground mt-3 truncate">{document.title}</h3>

      {/* Category Badge */}
      <span className="inline-block mt-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
        {config.label}
      </span>

      {/* Tags */}
      {document.tags && document.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {document.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-accent/20 text-accent rounded text-xs">
              {tag}
            </span>
          ))}
          {document.tags.length > 3 && (
            <span className="text-xs text-muted-foreground">+{document.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Excerpt */}
      {excerpt && (
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
          {excerpt}...
        </p>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────
// Create Document Dialog
// ─────────────────────────────────────────

interface CreateDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateDocumentDialog({ open, onOpenChange, onSuccess }: CreateDocumentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    category: 'pista' as DocumentCategory,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    try {
      await documentApi.create({
        title: form.title.trim(),
        category: form.category,
      });
      toast.success(`Documento "${form.title}" criado!`);
      onSuccess();
      onOpenChange(false);
      setForm({ title: '', category: 'pista' });
    } catch (error) {
      toast.error('Erro ao criar documento');
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
              Novo Documento
            </Dialog.Title>
            <Dialog.Close className="p-1 hover:bg-muted rounded">
              <X size={20} className="text-muted-foreground" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="Título do documento"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Categoria
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_CONFIG[cat].emoji} {cat}
                  </option>
                ))}
              </select>
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
                Criar Documento
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
