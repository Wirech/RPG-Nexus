import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import { Mark, mergeAttributes } from '@tiptap/core';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Minus,
  Undo,
  Redo,
  EyeOff,
  Palette,
  Link2,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LinkSelectorDialog, type LinkableType } from './LinkSelectorDialog';

// Cores disponíveis para o texto
const TEXT_COLORS = [
  { name: 'Padrão', color: null },
  { name: 'Vermelho', color: '#ef4444' },
  { name: 'Laranja', color: '#f97316' },
  { name: 'Amarelo', color: '#eab308' },
  { name: 'Verde', color: '#22c55e' },
  { name: 'Azul', color: '#3b82f6' },
  { name: 'Roxo', color: '#a855f7' },
  { name: 'Rosa', color: '#ec4899' },
  { name: 'Cinza', color: '#6b7280' },
];

// Extensão customizada para links internos
const InternalLinkMark = Mark.create({
  name: 'internalLink',

  inclusive: false,

  addAttributes() {
    return {
      'data-link-type': {
        default: null,
      },
      'data-link-id': {
        default: null,
      },
      'data-link-name': {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-link-type]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const linkType = HTMLAttributes['data-link-type'] as LinkableType;
    
    // Não forçar cor inline - usar classe CSS e herdar cor do pai se houver
    // A cor padrão será aplicada via CSS apenas quando não há cor herdada
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        class: `internal-link internal-link--${linkType}`,
        style: 'text-decoration: underline; cursor: pointer;',
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setInternalLink:
        (attrs: { type: LinkableType; id: string; name: string }) =>
        ({ commands }) => {
          return commands.setMark(this.name, {
            'data-link-type': attrs.type,
            'data-link-id': attrs.id,
            'data-link-name': attrs.name,
          });
        },
      unsetInternalLink:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },
});

// Extensão customizada para marcar conteúdo secreto
const SecretMark = Mark.create({
  name: 'secret',

  inclusive: true,

  parseHTML() {
    return [
      {
        tag: 'span[data-secret]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-secret': 'true', class: 'secret-mark' }), 0];
  },

  addCommands() {
    return {
      setSecret: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      unsetSecret: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
      toggleSecret: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
    };
  },
});

// Declaração de tipos para os comandos customizados
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    secret: {
      setSecret: () => ReturnType;
      unsetSecret: () => ReturnType;
      toggleSecret: () => ReturnType;
    };
    internalLink: {
      setInternalLink: (attrs: { type: LinkableType; id: string; name: string }) => ReturnType;
      unsetInternalLink: () => ReturnType;
    };
  }
}

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  showSecretButton?: boolean;
  showLinkButton?: boolean;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({ onClick, isActive, disabled, children, title }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-accent text-white'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  );
}

interface ToolbarProps {
  editor: Editor | null;
  showSecretButton?: boolean;
  showLinkButton?: boolean;
  onOpenLinkSelector: () => void;
}

function Toolbar({ editor, showSecretButton, showLinkButton, onOpenLinkSelector }: ToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  const currentColor = editor.getAttributes('textStyle').color || null;
  const hasSelection = !editor.state.selection.empty;

  return (
    <div className="flex items-center gap-1 p-2 border-b border-border flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Negrito"
      >
        <Bold className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Itálico"
      >
        <Italic className="w-4 h-4" />
      </ToolbarButton>

      {/* Seletor de cor */}
      <div className="relative" ref={colorPickerRef}>
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          isActive={showColorPicker}
          title="Cor do texto"
        >
          <Palette className="w-4 h-4" style={{ color: currentColor || undefined }} />
        </ToolbarButton>
        
        {showColorPicker && (
          <div className="absolute top-full left-0 mt-1 p-2 bg-surface border border-border rounded-lg shadow-lg z-50 grid grid-cols-3 gap-1 min-w-[120px]">
            {TEXT_COLORS.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  if (item.color) {
                    editor.chain().focus().setColor(item.color).run();
                  } else {
                    editor.chain().focus().unsetColor().run();
                  }
                  setShowColorPicker(false);
                }}
                className={cn(
                  'w-6 h-6 rounded border-2 transition-transform hover:scale-110',
                  currentColor === item.color ? 'border-white' : 'border-transparent'
                )}
                style={{ backgroundColor: item.color || '#e2e8f0' }}
                title={item.name}
              />
            ))}
          </div>
        )}
      </div>

      <div className="w-px h-4 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Título 2"
      >
        <Heading2 className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Título 3"
      >
        <Heading3 className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-4 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Lista"
      >
        <List className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Lista numerada"
      >
        <ListOrdered className="w-4 h-4" />
      </ToolbarButton>

      <div className="w-px h-4 bg-border mx-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Separador"
      >
        <Minus className="w-4 h-4" />
      </ToolbarButton>

      {showLinkButton && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={onOpenLinkSelector}
            isActive={editor.isActive('internalLink')}
            disabled={!hasSelection}
            title="Inserir link para elemento (selecione texto primeiro)"
          >
            <Link2 className="w-4 h-4 text-blue-400" />
          </ToolbarButton>
        </>
      )}

      {showSecretButton && (
        <>
          <div className="w-px h-4 bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleSecret().run()}
            isActive={editor.isActive('secret')}
            title="Marcar como segredo (visível apenas para o mestre)"
          >
            <EyeOff className="w-4 h-4 text-violet-400" />
          </ToolbarButton>
        </>
      )}

      <div className="flex-1" />

      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Desfazer"
      >
        <Undo className="w-4 h-4" />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Refazer"
      >
        <Redo className="w-4 h-4" />
      </ToolbarButton>
    </div>
  );
}

export function RichTextEditor({
  content = '',
  onChange,
  readOnly = false,
  placeholder = 'Digite aqui...',
  className,
  showSecretButton = false,
  showLinkButton = false,
}: RichTextEditorProps) {
  const [linkSelectorOpen, setLinkSelectorOpen] = useState(false);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      TextStyle,
      Color,
      SecretMark,
      InternalLinkMark,
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-invert prose-sm max-w-none focus:outline-none min-h-[150px] p-4',
          'prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground',
          'prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground',
          '[&_.is-editor-empty:first-child::before]:text-muted-foreground',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.is-editor-empty:first-child::before]:float-left',
          '[&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:pointer-events-none',
          // Estilo para o mark de segredo durante edição
          '[&_.secret-mark]:bg-violet-500/30 [&_.secret-mark]:border [&_.secret-mark]:border-violet-500/50 [&_.secret-mark]:rounded [&_.secret-mark]:px-0.5'
        ),
      },
    },
  });

  const handleLinkSelect = (item: { id: string; name: string; type: LinkableType }) => {
    if (editor) {
      editor.chain().focus().setInternalLink({
        type: item.type,
        id: item.id,
        name: item.name,
      }).run();
    }
  };

  return (
    <>
      <div
        className={cn(
          'rounded-lg border border-border bg-background overflow-hidden',
          !readOnly && 'focus-within:ring-1 focus-within:ring-accent',
          className
        )}
      >
        {!readOnly && (
          <Toolbar 
            editor={editor} 
            showSecretButton={showSecretButton}
            showLinkButton={showLinkButton}
            onOpenLinkSelector={() => setLinkSelectorOpen(true)}
          />
        )}
        <EditorContent editor={editor} />
      </div>
      
      <LinkSelectorDialog
        isOpen={linkSelectorOpen}
        onClose={() => setLinkSelectorOpen(false)}
        onSelect={handleLinkSelect}
      />
    </>
  );
}
