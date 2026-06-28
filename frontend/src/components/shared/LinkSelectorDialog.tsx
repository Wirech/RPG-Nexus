import { useState, useEffect } from 'react';
import { Search, Users, Map, Skull, FileText, X, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { characterApi, monsterApi, environmentApi, documentApi } from '@/services/api';

export type LinkableType = 'character' | 'environment' | 'monster' | 'document';

interface LinkableItem {
  id: string;
  name: string;
  type: LinkableType;
  description?: string;
}

interface LinkSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: LinkableItem) => void;
}

const TYPE_CONFIG: Record<LinkableType, { label: string; icon: typeof Users; color: string }> = {
  character: { label: 'Personagens', icon: Users, color: 'text-blue-400' },
  environment: { label: 'Cenários', icon: Map, color: 'text-green-400' },
  monster: { label: 'Monstros', icon: Skull, color: 'text-red-400' },
  document: { label: 'Documentos', icon: FileText, color: 'text-amber-400' },
};

export function LinkSelectorDialog({ isOpen, onClose, onSelect }: LinkSelectorDialogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<LinkableType | 'all'>('all');
  const [items, setItems] = useState<LinkableItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar itens quando o dialog abre ou o filtro muda
  useEffect(() => {
    if (!isOpen) return;

    const fetchItems = async () => {
      setLoading(true);
      try {
        const results: LinkableItem[] = [];

        // Buscar todos os tipos ou apenas o selecionado
        const typesToFetch = activeType === 'all' 
          ? ['character', 'environment', 'monster', 'document'] as LinkableType[]
          : [activeType];

        await Promise.all(
          typesToFetch.map(async (type) => {
            try {
              switch (type) {
                case 'character': {
                  const res = await characterApi.list();
                  res.data.forEach((c) => {
                    results.push({
                      id: c.id,
                      name: c.name,
                      type: 'character',
                      description: c.trilha || undefined,
                    });
                  });
                  break;
                }
                case 'environment': {
                  const res = await environmentApi.list();
                  res.data.forEach((e) => {
                    results.push({
                      id: e.id,
                      name: e.name,
                      type: 'environment',
                      description: e.description || undefined,
                    });
                  });
                  break;
                }
                case 'monster': {
                  const res = await monsterApi.list();
                  res.data.forEach((m) => {
                    results.push({
                      id: m.id,
                      name: m.name,
                      type: 'monster',
                      description: m.threatLevel || undefined,
                    });
                  });
                  break;
                }
                case 'document': {
                  const res = await documentApi.list();
                  res.data.forEach((d) => {
                    results.push({
                      id: d.id,
                      name: d.title,
                      type: 'document',
                      description: d.category || undefined,
                    });
                  });
                  break;
                }
              }
            } catch (err) {
              console.warn(`Erro ao buscar ${type}:`, err);
            }
          })
        );

        setItems(results);
      } catch (err) {
        console.error('Erro ao buscar itens:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [isOpen, activeType]);

  // Filtrar por termo de busca
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Agrupar por tipo
  const groupedItems = filteredItems.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<LinkableType, LinkableItem[]>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-accent" />
            <h2 className="text-lg font-semibold">Inserir Link</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-border rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-4 border-b border-border space-y-3">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
            />
          </div>

          {/* Tipos */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setActiveType('all')}
              className={cn(
                'px-3 py-1 rounded-full text-sm transition-colors',
                activeType === 'all'
                  ? 'bg-accent text-white'
                  : 'bg-background text-muted-foreground hover:text-foreground'
              )}
            >
              Todos
            </button>
            {(Object.keys(TYPE_CONFIG) as LinkableType[]).map((type) => {
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors flex items-center gap-1',
                    activeType === type
                      ? 'bg-accent text-white'
                      : 'bg-background text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="w-3 h-3" />
                  {config.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum item encontrado
            </div>
          ) : (
            <div className="space-y-4">
              {(Object.keys(groupedItems) as LinkableType[]).map((type) => {
                const config = TYPE_CONFIG[type];
                const Icon = config.icon;
                const typeItems = groupedItems[type];

                return (
                  <div key={type}>
                    <h3 className={cn('text-sm font-medium mb-2 flex items-center gap-2', config.color)}>
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {typeItems.map((item) => (
                        <button
                          key={`${item.type}-${item.id}`}
                          onClick={() => {
                            onSelect(item);
                            onClose();
                          }}
                          className="flex items-center gap-3 p-3 bg-background border border-border rounded-lg hover:border-accent transition-colors text-left"
                        >
                          <Icon className={cn('w-5 h-5 flex-shrink-0', config.color)} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{item.name}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
