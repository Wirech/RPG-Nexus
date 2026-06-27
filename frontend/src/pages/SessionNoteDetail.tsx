import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Trash2,
  FileDown,
  Loader2,
  Check,
  Calendar,
  Hash,
  Tag,
  X,
  Plus,
} from 'lucide-react';
import { sessionApi } from '@/services/api';
import { RichTextEditor, ConfirmDialog } from '@/components/shared';
import type { SessionNote } from '@/types';
import toast from 'react-hot-toast';

export default function SessionNoteDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Form state
  const [form, setForm] = useState({
    title: '',
    sessionNumber: '' as string | number,
    sessionDate: '',
    content: '',
    tags: [] as string[],
  });

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasChangesRef = useRef(false);

  // Fetch session
  useEffect(() => {
    if (!id) return;
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      const response = await sessionApi.getById(id!);
      const data = response.data as SessionNote;
      setSession(data);
      setForm({
        title: data.title,
        sessionNumber: data.sessionNumber ?? '',
        sessionDate: data.sessionDate?.split('T')[0] ?? '',
        content: data.content ?? '',
        tags: data.tags ?? [],
      });
    } catch (error) {
      toast.error('Erro ao carregar sessão');
      navigate('/sessions');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save with debounce
  const scheduleAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    hasChangesRef.current = true;
    setSaveStatus('idle');

    saveTimeoutRef.current = setTimeout(() => {
      if (hasChangesRef.current) {
        saveChanges();
      }
    }, 3000);
  }, []);

  const saveChanges = async () => {
    if (!id || !hasChangesRef.current) return;

    setSaving(true);
    setSaveStatus('saving');
    try {
      await sessionApi.update(id, {
        title: form.title,
        sessionNumber: form.sessionNumber ? Number(form.sessionNumber) : undefined,
        sessionDate: form.sessionDate || undefined,
        content: form.content,
        tags: form.tags,
      });
      hasChangesRef.current = false;
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      toast.error('Erro ao salvar');
      setSaveStatus('idle');
    } finally {
      setSaving(false);
    }
  };

  const handleManualSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    hasChangesRef.current = true;
    saveChanges();
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await sessionApi.delete(id);
      toast.success('Sessão deletada');
      navigate('/sessions');
    } catch (error) {
      toast.error('Erro ao deletar sessão');
    }
  };

  const handleExportPDF = () => {
    // Use browser print with custom styling
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${form.title}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 40px;
              color: #1a1a1a;
            }
            h1 { 
              font-size: 28px; 
              margin-bottom: 8px;
              color: #1a1a1a;
            }
            .meta {
              color: #666;
              font-size: 14px;
              margin-bottom: 24px;
              border-bottom: 1px solid #e5e5e5;
              padding-bottom: 16px;
            }
            .meta span {
              margin-right: 24px;
            }
            .tags {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-top: 8px;
            }
            .tag {
              background: #f3f4f6;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
            }
            .content {
              line-height: 1.6;
            }
            .content h2 { font-size: 22px; margin-top: 24px; }
            .content h3 { font-size: 18px; margin-top: 20px; }
            .content p { margin: 12px 0; }
            .content ul, .content ol { margin: 12px 0; padding-left: 24px; }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <h1>${form.title}</h1>
          <div class="meta">
            ${form.sessionNumber ? `<span>Sessão #${form.sessionNumber}</span>` : ''}
            ${form.sessionDate ? `<span>${new Date(form.sessionDate).toLocaleDateString('pt-BR')}</span>` : ''}
            ${form.tags.length > 0 ? `
              <div class="tags">
                ${form.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <div class="content">
            ${form.content}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setNewTag('');
      scheduleAutoSave();
    }
  };

  const removeTag = (tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
    scheduleAutoSave();
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Sessão não encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/sessions')}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="flex items-center gap-3">
          {/* Save Status */}
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            {saveStatus === 'saving' && (
              <>
                <Loader2 className="animate-spin" size={14} />
                Salvando...
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check size={14} className="text-success" />
                Salvo
              </>
            )}
          </span>

          <button
            onClick={handleManualSave}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-surface/80 transition-colors"
          >
            <Save size={18} />
            Salvar
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-3 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-surface/80 transition-colors"
          >
            <FileDown size={18} />
            Exportar
          </button>

          <button
            onClick={() => setDeleteDialogOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Título
          </label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              setForm({ ...form, title: e.target.value });
              scheduleAutoSave();
            }}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xl font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Session Number */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Hash size={14} />
              Número da Sessão
            </label>
            <input
              type="number"
              value={form.sessionNumber}
              onChange={(e) => {
                setForm({ ...form, sessionNumber: e.target.value });
                scheduleAutoSave();
              }}
              min="1"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar size={14} />
              Data
            </label>
            <input
              type="date"
              value={form.sessionDate}
              onChange={(e) => {
                setForm({ ...form, sessionDate: e.target.value });
                scheduleAutoSave();
              }}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1">
              <Tag size={14} />
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Nova tag"
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                onClick={addTag}
                className="px-3 py-2 bg-accent text-white rounded-lg hover:bg-accent/80 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Tags List */}
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {form.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-danger transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content Editor */}
      <div className="bg-surface border border-border rounded-lg p-6">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Conteúdo
        </label>
        <RichTextEditor
          content={form.content}
          onChange={(content) => {
            setForm({ ...form, content });
            scheduleAutoSave();
          }}
          placeholder="Escreva as notas da sessão aqui..."
        />
      </div>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Deletar Sessão"
        description={`Tem certeza que deseja deletar a sessão "${session.title}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        onConfirm={handleDelete}
        variant="danger"
      />
    </div>
  );
}
