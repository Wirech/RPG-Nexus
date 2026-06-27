import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Skull,
  Map,
  FileText,
  Swords,
  BookOpen,
  AlertTriangle,
  Play,
  ArrowRight,
} from 'lucide-react';
import { characterApi, combatApi, sessionApi, monsterApi, environmentApi, documentApi } from '@/services/api';
import { VitalBar, TokenAvatar } from '@/components/shared';
import { useAuth } from '@/hooks';
import { cn, formatDate } from '@/lib/utils';
import type { Character, CombatSession, SessionNote } from '@/types';

interface ModuleCounts {
  characters: number;
  monsters: number;
  environments: number;
  documents: number;
  combats: number;
  sessions: number;
}

export function Dashboard() {
  const { isAdmin } = useAuth();
  const [playerCharacters, setPlayerCharacters] = useState<Character[]>([]);
  const [activeCombats, setActiveCombats] = useState<CombatSession[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionNote[]>([]);
  const [counts, setCounts] = useState<ModuleCounts>({
    characters: 0,
    monsters: 0,
    environments: 0,
    documents: 0,
    combats: 0,
    sessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch counts for all modules
        const [
          charactersRes,
          monstersRes,
          environmentsRes,
          documentsRes,
          combatsRes,
          sessionsRes,
        ] = await Promise.all([
          characterApi.list(),
          isAdmin ? monsterApi.list() : Promise.resolve({ data: [] }),
          environmentApi.list(),
          documentApi.list(),
          isAdmin ? combatApi.list() : Promise.resolve({ data: [] }),
          isAdmin ? sessionApi.list() : Promise.resolve({ data: [] }),
        ]);

        setCounts({
          characters: charactersRes.data?.length || 0,
          monsters: monstersRes.data?.length || 0,
          environments: environmentsRes.data?.length || 0,
          documents: documentsRes.data?.length || 0,
          combats: combatsRes.data?.length || 0,
          sessions: sessionsRes.data?.length || 0,
        });

        // Admin-specific data
        if (isAdmin) {
          // Filter player characters (those with linked users)
          const allCharacters = charactersRes.data || [];
          setPlayerCharacters(allCharacters.filter((c: Character) => c.isRevealed));

          // Active combats
          const allCombats = combatsRes.data || [];
          setActiveCombats(allCombats.filter((c: CombatSession) => c.status === 'active'));

          // Recent sessions (last 3)
          const allSessions = sessionsRes.data || [];
          setRecentSessions(allSessions.slice(0, 3));
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [isAdmin]);

  const isCritical = (character: Character) => {
    const pvPercent = (character.pvCurrent / character.pvMax) * 100;
    const sanPercent = (character.sanCurrent / character.sanMax) * 100;
    return pvPercent < 25 || sanPercent < 25;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>

      {/* Admin Panels */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Panel - Player Characters */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-lg p-4">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Users size={20} className="text-accent" />
              Status dos Personagens
            </h2>
            {playerCharacters.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nenhum personagem de jogador ativo.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {playerCharacters.map((character) => (
                  <Link
                    key={character.id}
                    to={`/characters/${character.id}`}
                    className={cn(
                      'flex items-center gap-3 p-3 bg-background rounded-lg border border-border',
                      'hover:border-accent/50 transition-colors',
                      isCritical(character) && 'border-danger animate-pulse'
                    )}
                  >
                    <TokenAvatar
                      src={character.tokenImage}
                      name={character.name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{character.name}</p>
                      <div className="space-y-1 mt-1">
                        <VitalBar
                          label="PV"
                          current={character.pvCurrent}
                          max={character.pvMax}
                          showNumbers
                        />
                        <VitalBar
                          label="SAN"
                          current={character.sanCurrent}
                          max={character.sanMax}
                          showNumbers
                        />
                      </div>
                    </div>
                    {isCritical(character) && (
                      <AlertTriangle className="text-danger flex-shrink-0" size={20} />
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Active Combats */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Swords size={20} className="text-danger" />
                Combates Ativos
              </h2>
              {activeCombats.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground text-sm mb-3">Nenhum combate ativo.</p>
                  <Link
                    to="/combat"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors text-sm"
                  >
                    <Play size={16} />
                    Iniciar Combate
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeCombats.map((combat) => (
                    <Link
                      key={combat.id}
                      to={`/combat/${combat.id}`}
                      className="flex items-center justify-between p-3 bg-background rounded-lg border border-border hover:border-accent/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{combat.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Rodada {combat.roundCurrent} • {combat.participants?.length || 0} participantes
                        </p>
                      </div>
                      <ArrowRight size={18} className="text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Sessions */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-accent" />
                Sessões Recentes
              </h2>
              {recentSessions.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma nota de sessão.</p>
              ) : (
                <div className="space-y-2">
                  {recentSessions.map((session) => (
                    <Link
                      key={session.id}
                      to={`/sessions/${session.id}`}
                      className="block p-3 bg-background rounded-lg border border-border hover:border-accent/50 transition-colors"
                    >
                      <p className="font-medium text-foreground truncate">{session.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.sessionDate ? formatDate(session.sessionDate) : 'Data não definida'}
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Access Grid */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Acesso Rápido</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <QuickAccessCard
            icon={Users}
            label="Personagens"
            count={counts.characters}
            to="/characters"
            color="text-accent"
          />
          {isAdmin && (
            <QuickAccessCard
              icon={Skull}
              label="Bestiário"
              count={counts.monsters}
              to="/monsters"
              color="text-danger"
            />
          )}
          <QuickAccessCard
            icon={Map}
            label="Ambientes"
            count={counts.environments}
            to="/environments"
            color="text-success"
          />
          <QuickAccessCard
            icon={FileText}
            label="Documentos"
            count={counts.documents}
            to="/documents"
            color="text-warning"
          />
          {isAdmin && (
            <>
              <QuickAccessCard
                icon={Swords}
                label="Combate"
                count={counts.combats}
                to="/combat"
                color="text-danger"
              />
              <QuickAccessCard
                icon={BookOpen}
                label="Sessões"
                count={counts.sessions}
                to="/sessions"
                color="text-accent"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface QuickAccessCardProps {
  icon: React.ElementType;
  label: string;
  count: number;
  to: string;
  color: string;
}

function QuickAccessCard({ icon: Icon, label, count, to, color }: QuickAccessCardProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center p-6 bg-surface border border-border rounded-lg hover:border-accent/50 hover:shadow-lg transition-all group"
    >
      <Icon size={32} className={cn(color, 'group-hover:scale-110 transition-transform')} />
      <span className="mt-3 font-medium text-foreground">{label}</span>
      <span className="text-sm text-muted-foreground">{count} itens</span>
    </Link>
  );
}
