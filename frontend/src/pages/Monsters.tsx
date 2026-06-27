import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Skull } from 'lucide-react';
import { monsterApi } from '@/services/api';
import { TokenAvatar } from '@/components/shared';
import { CreateMonsterDialog } from '@/components/monsters';
import { cn } from '@/lib/utils';
import type { Monster, ThreatLevel } from '@/types';
import toast from 'react-hot-toast';

const THREAT_COLORS: Record<ThreatLevel, string> = {
  'Moderado': 'bg-success text-success-foreground',
  'Perigoso': 'bg-warning text-warning-foreground',
  'Mortal': 'bg-orange-600 text-white',
  'Lendário': 'bg-purple-600 text-white',
};

export function Monsters() {
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | ''>('');
  const [createOpen, setCreateOpen] = useState(false);

  const fetchMonsters = async () => {
    try {
      const response = await monsterApi.list({
        search: searchQuery || undefined,
        threatLevel: threatFilter || undefined,
      });
      setMonsters(response.data || []);
    } catch (error) {
      console.error('Failed to fetch monsters:', error);
      toast.error('Erro ao carregar monstros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonsters();
  }, [searchQuery, threatFilter]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Bestiário</h1>
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
        <h1 className="text-2xl font-bold text-foreground">Bestiário</h1>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
        >
          <Plus size={18} />
          Novo Monstro
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome..."
            className="w-full pl-10 pr-4 py-2 bg-surface border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <select
          value={threatFilter}
          onChange={(e) => setThreatFilter(e.target.value as ThreatLevel | '')}
          className="px-4 py-2 bg-surface border border-border rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Todos os níveis</option>
          <option value="Moderado">Moderado</option>
          <option value="Perigoso">Perigoso</option>
          <option value="Mortal">Mortal</option>
          <option value="Lendário">Lendário</option>
        </select>
      </div>

      {/* Monster Grid */}
      {monsters.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Skull size={48} className="mb-4 opacity-50" />
          <p className="text-lg">Nenhum monstro encontrado</p>
          {(searchQuery || threatFilter) && (
            <p className="text-sm mt-1">Tente ajustar os filtros</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {monsters.map((monster) => (
            <MonsterCard key={monster.id} monster={monster} />
          ))}
        </div>
      )}

      <CreateMonsterDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={fetchMonsters}
      />
    </div>
  );
}

interface MonsterCardProps {
  monster: Monster;
}

function MonsterCard({ monster }: MonsterCardProps) {
  return (
    <Link
      to={`/monsters/${monster.id}`}
      className="block bg-surface border border-border rounded-lg p-4 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-danger/50"
    >
      <div className="flex items-start gap-3">
        <TokenAvatar
          src={monster.tokenImage}
          name={monster.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{monster.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {monster.threatLevel && (
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', THREAT_COLORS[monster.threatLevel])}>
                {monster.threatLevel}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">PV Máximo</span>
        <span className="font-medium text-danger">{monster.pvMax}</span>
      </div>
      
      {monster.sanMax && (
        <div className="mt-1 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">SAN Máxima</span>
          <span className="font-medium text-blue-400">{monster.sanMax}</span>
        </div>
      )}
    </Link>
  );
}
