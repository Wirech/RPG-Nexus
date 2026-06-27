import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as Tabs from '@radix-ui/react-tabs';
import {
  Swords,
  Plus,
  Users,
  Clock,
  Play,
  Eye,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { combatApi } from '@/services/api';
import { cn, formatDate } from '@/lib/utils';
import type { CombatSession } from '@/types';
import toast from 'react-hot-toast';
import { CreateCombatDialog } from '@/components/combat';

export function CombatList() {
  const [activeCombats, setActiveCombats] = useState<CombatSession[]>([]);
  const [finishedCombats, setFinishedCombats] = useState<CombatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchCombats = async () => {
    try {
      const [activeRes, finishedRes] = await Promise.all([
        combatApi.list({ status: 'active' }),
        combatApi.list({ status: 'finished' }),
      ]);
      setActiveCombats(activeRes.data || []);
      setFinishedCombats(finishedRes.data || []);
    } catch (error) {
      console.error('Failed to fetch combats:', error);
      toast.error('Erro ao carregar combates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCombats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Combates</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-accent" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Combates</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          Novo Combate
        </button>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex gap-1 border-b border-border mb-6">
          <Tabs.Trigger
            value="active"
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'active'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <Swords size={16} />
            Combates Ativos
            {activeCombats.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-accent/20 text-accent rounded text-xs">
                {activeCombats.length}
              </span>
            )}
          </Tabs.Trigger>
          <Tabs.Trigger
            value="history"
            className={cn(
              'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === 'history'
                ? 'text-accent border-accent'
                : 'text-muted-foreground border-transparent hover:text-foreground'
            )}
          >
            <Clock size={16} />
            Histórico
          </Tabs.Trigger>
        </Tabs.List>

        {/* Active Combats */}
        <Tabs.Content value="active">
          {activeCombats.length === 0 ? (
            <EmptyState
              icon={Swords}
              message="Nenhum combate ativo"
              subMessage="Crie um novo combate para começar"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCombats.map((combat) => (
                <CombatCard key={combat.id} combat={combat} isActive />
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* History */}
        <Tabs.Content value="history">
          {finishedCombats.length === 0 ? (
            <EmptyState
              icon={Clock}
              message="Nenhum combate no histórico"
              subMessage="Combates encerrados aparecerão aqui"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {finishedCombats.map((combat) => (
                <CombatCard key={combat.id} combat={combat} isActive={false} />
              ))}
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      <CreateCombatDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => {
          fetchCombats();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ElementType;
  message: string;
  subMessage?: string;
}

function EmptyState({ icon: Icon, message, subMessage }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Icon size={48} className="mb-4 opacity-50" />
      <p className="text-lg">{message}</p>
      {subMessage && <p className="text-sm mt-1">{subMessage}</p>}
    </div>
  );
}

interface CombatCardProps {
  combat: CombatSession;
  isActive: boolean;
}

function CombatCard({ combat, isActive }: CombatCardProps) {
  const participantCount = combat._count?.participants || combat.participants?.length || 0;

  return (
    <div className="bg-surface border border-border rounded-lg p-4 hover:border-accent/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-foreground">{combat.name}</h3>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {participantCount} participantes
            </span>
          </div>
        </div>
        <span className={cn(
          'px-2 py-1 rounded text-xs font-medium',
          isActive
            ? 'bg-success/20 text-success'
            : 'bg-muted text-muted-foreground'
        )}>
          {isActive ? (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              Ativo
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <CheckCircle size={12} />
              Finalizado
            </span>
          )}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm mb-4">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Swords size={14} />
          Rodada {combat.roundCurrent}
        </div>
        {combat.finishedAt && (
          <div className="text-muted-foreground">
            {formatDate(combat.finishedAt)}
          </div>
        )}
      </div>

      {/* Action */}
      <Link
        to={`/combat/${combat.id}`}
        className={cn(
          'flex items-center justify-center gap-2 w-full py-2 rounded-md font-medium transition-colors',
          isActive
            ? 'bg-accent text-white hover:bg-accent/90'
            : 'bg-muted text-foreground hover:bg-muted/80'
        )}
      >
        {isActive ? (
          <>
            <Play size={16} />
            Entrar
          </>
        ) : (
          <>
            <Eye size={16} />
            Ver Detalhes
          </>
        )}
      </Link>
    </div>
  );
}
