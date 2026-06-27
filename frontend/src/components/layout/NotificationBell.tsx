import { useState, useEffect } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import { useNotificationStore } from '@/stores';
import { userApi, characterApi } from '@/services/api';
import type { Character } from '@/types';
import { TokenAvatar } from '@/components/shared';
import toast from 'react-hot-toast';

export function NotificationBell() {
  const { pendingRequests, removePendingRequest, setPendingRequests } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [selectedCharacters, setSelectedCharacters] = useState<Record<string, string>>({});

  // Fetch pending requests and characters on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, charsRes] = await Promise.all([
          userApi.getPending(),
          characterApi.list(),
        ]);
        setPendingRequests(requestsRes.data);
        setCharacters(charsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, [setPendingRequests]);

  const handleApprove = async (userId: string) => {
    const role = selectedRoles[userId] || 'player';
    const linkedCharacterId = selectedCharacters[userId];

    setLoadingId(userId);
    try {
      await userApi.approve(userId, { role, linkedCharacterId });
      removePendingRequest(userId);
      toast.success('Usuário aprovado com sucesso!');
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    setLoadingId(userId);
    try {
      await userApi.reject(userId);
      removePendingRequest(userId);
      toast.success('Usuário recusado');
    } catch (error) {
      toast.error('Erro ao recusar usuário');
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  const count = pendingRequests.length;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
          title="Notificações"
        >
          <Bell className="w-5 h-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          className="w-80 max-h-96 bg-surface border border-border rounded-lg shadow-xl overflow-hidden z-50"
          sideOffset={8}
          align="end"
        >
          <div className="p-3 border-b border-border">
            <h3 className="font-semibold text-foreground">Solicitações de Acesso</h3>
            <p className="text-xs text-muted-foreground">
              {count === 0 ? 'Nenhuma solicitação pendente' : `${count} pendente${count > 1 ? 's' : ''}`}
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Tudo tranquilo por aqui!</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {pendingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="p-3 bg-background rounded-lg border border-border"
                  >
                    {/* User info */}
                    <div className="flex items-center gap-2 mb-3">
                      <TokenAvatar
                        name={request.user?.username || 'U'}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {request.user?.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(request.requestedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Role select */}
                    <div className="mb-2">
                      <label className="text-xs text-muted-foreground">Papel</label>
                      <select
                        value={selectedRoles[request.userId] || 'player'}
                        onChange={(e) =>
                          setSelectedRoles((prev) => ({
                            ...prev,
                            [request.userId]: e.target.value,
                          }))
                        }
                        className="w-full mt-1 px-2 py-1.5 bg-surface border border-border rounded text-sm text-foreground"
                      >
                        <option value="player">Jogador</option>
                        <option value="spectator">Espectador</option>
                      </select>
                    </div>

                    {/* Character select (only for players) */}
                    {(selectedRoles[request.userId] || 'player') === 'player' && (
                      <div className="mb-3">
                        <label className="text-xs text-muted-foreground">Personagem</label>
                        <select
                          value={selectedCharacters[request.userId] || ''}
                          onChange={(e) =>
                            setSelectedCharacters((prev) => ({
                              ...prev,
                              [request.userId]: e.target.value,
                            }))
                          }
                          className="w-full mt-1 px-2 py-1.5 bg-surface border border-border rounded text-sm text-foreground"
                        >
                          <option value="">Nenhum (definir depois)</option>
                          {characters.map((char) => (
                            <option key={char.id} value={char.id}>
                              {char.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.userId)}
                        disabled={loadingId === request.userId}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                          'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                        )}
                      >
                        {loadingId === request.userId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(request.userId)}
                        disabled={loadingId === request.userId}
                        className={cn(
                          'flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors',
                          'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                        )}
                      >
                        <X className="w-4 h-4" />
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
