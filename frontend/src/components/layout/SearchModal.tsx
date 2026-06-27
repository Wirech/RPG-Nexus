import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Search,
  Users,
  Bug,
  Map,
  FileText,
  BookOpen,
  Loader2,
  X,
} from 'lucide-react';
import { characterApi, monsterApi, environmentApi, documentApi, sessionApi } from '@/services/api';
import { TokenAvatar } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { Character, Monster, Environment, Document, SessionNote } from '@/types';

interface SearchResult {
  id: string;
  type: 'character' | 'monster' | 'environment' | 'document' | 'session';
  name: string;
  description?: string;
  icon: React.ElementType;
  image?: string | null;
  url: string;
}

export function SearchModal() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search with debounce
  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search all resources in parallel
        const [characters, monsters, environments, documents, sessions] =
          await Promise.allSettled([
            characterApi.list({ search: searchQuery }),
            isAdmin ? monsterApi.list({ search: searchQuery }) : Promise.resolve({ data: [] }),
            environmentApi.list({ search: searchQuery }),
            documentApi.list({ search: searchQuery }),
            isAdmin ? sessionApi.list() : Promise.resolve({ data: [] }),
          ]);

        // Process characters
        if (characters.status === 'fulfilled') {
          const chars = (characters.value.data as Character[]) || [];
          chars
            .filter((c) =>
              c.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5)
            .forEach((char) => {
              searchResults.push({
                id: char.id,
                type: 'character',
                name: char.name,
                description: char.trilha || 'Personagem',
                icon: Users,
                image: char.tokenImage,
                url: `/characters/${char.id}`,
              });
            });
        }

        // Process monsters (admin only)
        if (isAdmin && monsters.status === 'fulfilled') {
          const mons = (monsters.value.data as Monster[]) || [];
          mons
            .filter((m) =>
              m.name.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5)
            .forEach((monster) => {
              searchResults.push({
                id: monster.id,
                type: 'monster',
                name: monster.name,
                description: monster.threatLevel || 'Monstro',
                icon: Bug,
                image: monster.tokenImage,
                url: `/monsters/${monster.id}`,
              });
            });
        }

        // Process environments
        if (environments.status === 'fulfilled') {
          const envs = (environments.value.data as Environment[]) || [];
          envs
            .filter(
              (e) =>
                e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.description?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5)
            .forEach((env) => {
              searchResults.push({
                id: env.id,
                type: 'environment',
                name: env.name,
                description: 'Ambiente',
                icon: Map,
                url: `/environments/${env.id}`,
              });
            });
        }

        // Process documents
        if (documents.status === 'fulfilled') {
          const docs = (documents.value.data as Document[]) || [];
          docs
            .filter(
              (d) =>
                d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.content?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5)
            .forEach((doc) => {
              searchResults.push({
                id: doc.id,
                type: 'document',
                name: doc.title,
                description: doc.category || 'Documento',
                icon: FileText,
                url: `/documents/${doc.id}`,
              });
            });
        }

        // Process sessions (admin only)
        if (isAdmin && sessions.status === 'fulfilled') {
          const sess = (sessions.value.data as SessionNote[]) || [];
          sess
            .filter(
              (s) =>
                s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.content?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .slice(0, 5)
            .forEach((session) => {
              searchResults.push({
                id: session.id,
                type: 'session',
                name: session.title,
                description: session.sessionNumber
                  ? `Sessão #${session.sessionNumber}`
                  : 'Nota de Sessão',
                icon: BookOpen,
                url: `/sessions/${session.id}`,
              });
            });
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin]
  );

  // Handle input change with debounce
  const handleInputChange = (value: string) => {
    setQuery(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSelect = (result: SearchResult) => {
    setOpen(false);
    navigate(result.url);
  };

  // Group results by type
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  const typeLabels: Record<string, string> = {
    character: 'Personagens',
    monster: 'Monstros',
    environment: 'Ambientes',
    document: 'Documentos',
    session: 'Sessões',
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Dialog.Content className="fixed top-[20%] left-1/2 -translate-x-1/2 bg-surface border border-border rounded-lg w-full max-w-xl z-50 overflow-hidden shadow-2xl">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
            <Search className="text-muted-foreground" size={20} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar personagens, monstros, ambientes, documentos..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={18} />
              </button>
            )}
            <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-background border border-border rounded text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="animate-spin text-accent" size={24} />
              </div>
            ) : query && results.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nenhum resultado encontrado para "{query}"
                </p>
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type}>
                    <div className="px-4 py-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {typeLabels[type]}
                      </span>
                    </div>
                    {items.map((result) => {
                      const globalIndex = results.indexOf(result);
                      const Icon = result.icon;
                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={cn(
                            'w-full flex items-center gap-3 px-4 py-2 text-left transition-colors',
                            globalIndex === selectedIndex
                              ? 'bg-accent/20'
                              : 'hover:bg-background/50'
                          )}
                        >
                          {result.image ? (
                            <TokenAvatar
                              src={result.image}
                              name={result.name}
                              size="sm"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                              <Icon size={16} className="text-accent" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {result.name}
                            </p>
                            {result.description && (
                              <p className="text-sm text-muted-foreground truncate">
                                {result.description}
                              </p>
                            )}
                          </div>
                          {globalIndex === selectedIndex && (
                            <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 bg-background border border-border rounded text-xs text-muted-foreground">
                              Enter
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : !query ? (
              <div className="py-8 px-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Digite para buscar em personagens, monstros, ambientes, documentos
                  {isAdmin && ' e sessões'}
                </p>
                <p className="text-muted-foreground text-xs mt-2">
                  Use <kbd className="px-1 py-0.5 bg-background border border-border rounded text-xs">↑</kbd>{' '}
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded text-xs">↓</kbd> para navegar,{' '}
                  <kbd className="px-1 py-0.5 bg-background border border-border rounded text-xs">Enter</kbd> para selecionar
                </p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground">
            <span>
              <kbd className="px-1 py-0.5 bg-background border border-border rounded">Ctrl</kbd>
              {' + '}
              <kbd className="px-1 py-0.5 bg-background border border-border rounded">K</kbd>
              {' para abrir'}
            </span>
            {results.length > 0 && (
              <span>{results.length} resultado(s)</span>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
