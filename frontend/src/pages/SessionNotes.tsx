import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Search,
  Calendar,
  Hash,
  Tag,
  Loader2,
  FileText,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { sessionApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';
import type { SessionNote } from '@/types';
import toast from 'react-hot-toast';

export default function SessionNotes() {
  const [sessions, setSessions] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch sessions
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await sessionApi.list();
      const data = response.data as SessionNote[];
      // Sort by sessionDate descending
      data.sort((a, b) => {
        const dateA = a.sessionDate ? new Date(a.sessionDate).getTime() : 0;
        const dateB = b.sessionDate ? new Date(b.sessionDate).getTime() : 0;
        return dateB - dateA;
      });
      setSessions(data);
    } catch (error) {
      toast.error('Erro ao carregar sessões');
    } finally {
      setLoading(false);
    }
  };

  // Get all unique tags from sessions
  const allTags = [...new Set(sessions.flatMap((s) => s.tags || []))];

  // Filter sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      !searchQuery ||
      session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.content?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTags =
      tagFilter.length === 0 ||
      tagFilter.some((tag) => session.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const toggleTagFilter = (tag: string) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="text-accent" />
            Notas de Sessão
          </h1>
          <p className="text-muted-foreground">
            Registro das sessões de jogo
          </p>
        </div>

        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Nova Sessão
        </button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <input
            type="text"
            placeholder="Buscar por título ou conteúdo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTagFilter(tag)}
                className={cn(
                  'px-3 py-1 rounded-full text-sm transition-colors',
                  tagFilter.includes(tag)
                    ? 'bg-accent text-white'
                    : 'bg-surface text-muted-foreground hover:bg-surface/80'
                )}
              >
                <Tag size={12} className="inline mr-1" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            {sessions.length === 0
              ? 'Nenhuma nota de sessão ainda'
              : 'Nenhuma sessão encontrada com os filtros atuais'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Link
              key={session.id}
              to={`/sessions/${session.id}`}
              className="block bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground truncate">
                    {session.title}
                  </h3>

                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    {session.sessionNumber != null && (
                      <span className="flex items-center gap-1">
                        <Hash size={14} />
                        Sessão {session.sessionNumber}
                      </span>
                    )}
                    {session.sessionDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(session.sessionDate).split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {session.tags.slice(0, 5).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {session.tags.length > 5 && (
                        <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded">
                          +{session.tags.length - 5}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content Preview */}
                  {session.content && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {session.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Session Dialog */}
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          fetchSessions();
          setCreateDialogOpen(false);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────
// CREATE SESSION DIALOG
// ─────────────────────────────────────────

interface CreateSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function CreateSessionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSessionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '',
    sessionNumber: '',
    sessionDate: new Date().toISOString().split('T')[0],
    tags: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    setLoading(true);
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await sessionApi.create({
        title: form.title.trim(),
        sessionNumber: form.sessionNumber ? parseInt(form.sessionNumber) : undefined,
        sessionDate: form.sessionDate || undefined,
        tags,
      });

      toast.success('Sessão criada com sucesso!');
      setForm({
        title: '',
        sessionNumber: '',
        sessionDate: new Date().toISOString().split('T')[0],
        tags: '',
      });
      onSuccess();
    } catch (error) {
      toast.error('Erro ao criar sessão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            Nova Nota de Sessão
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Título *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: A Invasão do Laboratório"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Número da Sessão
                </label>
                <input
                  type="number"
                  value={form.sessionNumber}
                  onChange={(e) =>
                    setForm({ ...form, sessionNumber: e.target.value })
                  }
                  placeholder="Ex: 15"
                  min="1"
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={form.sessionDate}
                  onChange={(e) =>
                    setForm({ ...form, sessionDate: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={form.tags}
                onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="Ex: combate, investigação, lore"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Dialog.Close asChild>
                <button
                  type="button"
                  className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancelar
                </button>
              </Dialog.Close>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Criar Sessão
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
