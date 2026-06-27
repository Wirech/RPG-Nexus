import { useState, useEffect } from 'react';
import {
  ScrollText,
  ChevronDown,
  ChevronRight,
  Download,
  Loader2,
  Filter,
  FileText,
} from 'lucide-react';
import { auditApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';
import type { AuditLog as AuditLogType, EntityType, AuditAction } from '@/types';
import toast from 'react-hot-toast';

// Entity type labels
const ENTITY_LABELS: Record<EntityType, string> = {
  character: 'Personagem',
  monster: 'Monstro',
  environment: 'Ambiente',
  document: 'Documento',
  combat: 'Combate',
  user: 'Usuário',
  session: 'Sessão',
};

// Action labels
const ACTION_LABELS: Record<AuditAction, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  access_granted: 'Acesso Concedido',
  access_revoked: 'Acesso Revogado',
  combat_event: 'Evento de Combate',
};

// Action colors
const ACTION_COLORS: Record<AuditAction, string> = {
  create: 'bg-success/20 text-success',
  update: 'bg-accent/20 text-accent',
  delete: 'bg-danger/20 text-danger',
  access_granted: 'bg-success/20 text-success',
  access_revoked: 'bg-warning/20 text-warning',
  combat_event: 'bg-blue-500/20 text-blue-400',
};

export default function AuditLog() {
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  // Filters
  const [filters, setFilters] = useState({
    entityTypes: [] as EntityType[],
    startDate: '',
    endDate: '',
    userId: '',
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = {
        page,
        limit,
      };

      if (filters.entityTypes.length === 1) {
        params.entityType = filters.entityTypes[0];
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }
      if (filters.userId) {
        params.userId = filters.userId;
      }

      const response = await auditApi.list(params as Parameters<typeof auditApi.list>[0]);
      const data = response.data as {
        data: AuditLogType[];
        pagination: { total: number; totalPages: number };
      };
      
      // Filter by multiple entity types on client side if needed
      let filteredData = data.data;
      if (filters.entityTypes.length > 1) {
        filteredData = data.data.filter((log) =>
          filters.entityTypes.includes(log.entityType)
        );
      }

      setLogs(filteredData);
      setTotal(data.pagination.total);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      toast.error('Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  };

  const toggleEntityFilter = (type: EntityType) => {
    setFilters((prev) => ({
      ...prev,
      entityTypes: prev.entityTypes.includes(type)
        ? prev.entityTypes.filter((t) => t !== type)
        : [...prev.entityTypes, type],
    }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({
      entityTypes: [],
      startDate: '',
      endDate: '',
      userId: '',
    });
    setPage(1);
  };

  const exportCSV = () => {
    const headers = [
      'Data',
      'Ação',
      'Tipo',
      'Entidade',
      'Usuário',
      'Campo',
      'Valor Anterior',
      'Novo Valor',
      'Contexto',
    ];

    const rows = logs.map((log) => [
      formatDate(log.timestamp),
      ACTION_LABELS[log.action] || log.action,
      ENTITY_LABELS[log.entityType] || log.entityType,
      log.entityName || log.entityId,
      log.user?.username || 'Sistema',
      log.fieldChanged || '',
      log.oldValue || '',
      log.newValue || '',
      log.context || '',
    ]);

    const csvContent =
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const hasActiveFilters =
    filters.entityTypes.length > 0 ||
    filters.startDate ||
    filters.endDate ||
    filters.userId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ScrollText className="text-accent" />
            Log de Auditoria
          </h1>
          <p className="text-muted-foreground">
            {total} registros encontrados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
              showFilters
                ? 'bg-accent text-white'
                : 'bg-surface border border-border text-foreground hover:bg-surface/80'
            )}
          >
            <Filter size={18} />
            Filtros
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-warning rounded-full" />
            )}
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-surface/80 transition-colors"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Filtros</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-accent hover:underline"
              >
                Limpar filtros
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Entity Types */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Tipo de Entidade
              </label>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ENTITY_LABELS) as EntityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleEntityFilter(type)}
                    className={cn(
                      'px-3 py-1 rounded text-sm transition-colors',
                      filters.entityTypes.includes(type)
                        ? 'bg-accent text-white'
                        : 'bg-background text-muted-foreground hover:bg-background/80'
                    )}
                  >
                    {ENTITY_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-muted-foreground">
                Período
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, startDate: e.target.value }));
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters((prev) => ({ ...prev, endDate: e.target.value }));
                    setPage(1);
                  }}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            </div>

            {/* User Filter */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                ID do Usuário
              </label>
              <input
                type="text"
                value={filters.userId}
                onChange={(e) => {
                  setFilters((prev) => ({ ...prev, userId: e.target.value }));
                  setPage(1);
                }}
                placeholder="Filtrar por usuário"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-16">
          <FileText size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Nenhum log encontrado com os filtros atuais
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                <th className="w-8"></th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Data
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Ação
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Tipo
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Entidade
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                  Usuário
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <>
                  <tr
                    key={log.id}
                    className="hover:bg-background/50 cursor-pointer"
                    onClick={() =>
                      setExpandedRow(expandedRow === log.id ? null : log.id)
                    }
                  >
                    <td className="px-2 text-center">
                      {expandedRow === log.id ? (
                        <ChevronDown size={16} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={16} className="text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs',
                          ACTION_COLORS[log.action] || 'bg-muted text-muted-foreground'
                        )}
                      >
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {ENTITY_LABELS[log.entityType] || log.entityType}
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {log.entityName || log.entityId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {log.user?.username || 'Sistema'}
                    </td>
                  </tr>

                  {/* Expanded Row */}
                  {expandedRow === log.id && (
                    <tr key={`${log.id}-details`}>
                      <td colSpan={6} className="px-8 py-4 bg-background/50">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">ID da Entidade:</span>
                            <p className="text-foreground font-mono text-xs mt-1">
                              {log.entityId}
                            </p>
                          </div>
                          {log.fieldChanged && (
                            <div>
                              <span className="text-muted-foreground">Campo Alterado:</span>
                              <p className="text-foreground mt-1">{log.fieldChanged}</p>
                            </div>
                          )}
                          {log.oldValue && (
                            <div>
                              <span className="text-muted-foreground">Valor Anterior:</span>
                              <p className="text-danger mt-1 font-mono text-xs break-all">
                                {log.oldValue.length > 100
                                  ? `${log.oldValue.slice(0, 100)}...`
                                  : log.oldValue}
                              </p>
                            </div>
                          )}
                          {log.newValue && (
                            <div>
                              <span className="text-muted-foreground">Novo Valor:</span>
                              <p className="text-success mt-1 font-mono text-xs break-all">
                                {log.newValue.length > 100
                                  ? `${log.newValue.slice(0, 100)}...`
                                  : log.newValue}
                              </p>
                            </div>
                          )}
                          {log.context && (
                            <div>
                              <span className="text-muted-foreground">Contexto:</span>
                              <p className="text-foreground mt-1">{log.context}</p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-background border border-border rounded text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background/80"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-background border border-border rounded text-sm text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-background/80"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
