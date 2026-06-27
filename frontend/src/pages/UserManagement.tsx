import { useState, useEffect } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Users,
  UserPlus,
  Clock,
  Check,
  X,
  Shield,
  ShieldAlert,
  ShieldOff,
  Loader2,
  Trash2,
  Edit,
  User as UserIcon,
} from 'lucide-react';
import { userApi, characterApi } from '@/services/api';
import { TokenAvatar, ConfirmDialog } from '@/components/shared';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationStore } from '@/stores/notificationStore';
import { cn, formatDate } from '@/lib/utils';
import type { User, AccessRequest, Character } from '@/types';
import toast from 'react-hot-toast';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const { removePendingRequest } = useNotificationStore();

  const [activeTab, setActiveTab] = useState('pending');
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [editUserDialog, setEditUserDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, usersRes, charsRes] = await Promise.all([
        userApi.getPending(),
        userApi.list(),
        characterApi.list(),
      ]);
      setPendingRequests((pendingRes.data as AccessRequest[]) || []);
      setUsers((usersRes.data as User[]) || []);
      setCharacters((charsRes.data as Character[]) || []);
    } catch (error) {
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (
    request: AccessRequest,
    role: string,
    linkedCharacterId?: string
  ) => {
    try {
      await userApi.approve(request.userId, { role, linkedCharacterId });
      toast.success('Usuário aprovado!');
      removePendingRequest(request.id);
      fetchData();
    } catch (error) {
      toast.error('Erro ao aprovar usuário');
    }
  };

  const handleReject = async (request: AccessRequest, reason?: string) => {
    try {
      await userApi.reject(request.userId, reason);
      toast.success('Solicitação rejeitada');
      removePendingRequest(request.id);
      fetchData();
    } catch (error) {
      toast.error('Erro ao rejeitar solicitação');
    }
  };

  const handleBlockUser = async (user: User) => {
    try {
      if (user.status === 'blocked') {
        await userApi.unblock(user.id);
        toast.success('Usuário desbloqueado');
      } else {
        await userApi.block(user.id);
        toast.success('Usuário bloqueado');
      }
      fetchData();
    } catch (error) {
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const handleUpdateUser = async (userId: string, data: Partial<User>) => {
    try {
      await userApi.update(userId, data);
      toast.success('Usuário atualizado');
      setEditUserDialog({ open: false, user: null });
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return;
    try {
      await userApi.delete(deleteDialog.user.id);
      toast.success('Usuário deletado');
      setDeleteDialog({ open: false, user: null });
      fetchData();
    } catch (error) {
      toast.error('Erro ao deletar usuário');
    }
  };

  // Filter active users (not pending)
  const activeUsers = users.filter(
    (u) => u.status !== 'pending' && u.id !== currentUser?.id
  );

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
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Users className="text-accent" />
          Gerenciamento de Usuários
        </h1>
        <p className="text-muted-foreground">
          Gerencie solicitações de acesso e permissões de usuários
        </p>
      </div>

      {/* Tabs */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List className="flex border-b border-border mb-6">
          <Tabs.Trigger
            value="pending"
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'pending'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Clock size={18} />
            Pendentes
            {pendingRequests.length > 0 && (
              <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </Tabs.Trigger>

          <Tabs.Trigger
            value="active"
            className={cn(
              'flex items-center gap-2 px-4 py-3 border-b-2 transition-colors',
              activeTab === 'active'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <UserPlus size={18} />
            Usuários Ativos
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">
              {activeUsers.length}
            </span>
          </Tabs.Trigger>
        </Tabs.List>

        {/* Pending Requests Tab */}
        <Tabs.Content value="pending">
          {pendingRequests.length === 0 ? (
            <div className="text-center py-16">
              <Clock size={48} className="mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhuma solicitação pendente
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <PendingRequestCard
                  key={request.id}
                  request={request}
                  characters={characters}
                  onApprove={(role, charId) => handleApprove(request, role, charId)}
                  onReject={(reason) => handleReject(request, reason)}
                />
              ))}
            </div>
          )}
        </Tabs.Content>

        {/* Active Users Tab */}
        <Tabs.Content value="active">
          {activeUsers.length === 0 ? (
            <div className="text-center py-16">
              <Users size={48} className="mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                Nenhum usuário ativo além do administrador
              </p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-background">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Usuário
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Papel
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Personagem
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activeUsers.map((user) => {
                    const linkedChar = characters.find(
                      (c) => c.id === user.linkedCharacterId
                    );
                    return (
                      <tr key={user.id} className="hover:bg-background/50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-accent/20 rounded-full flex items-center justify-center">
                              <UserIcon size={16} className="text-accent" />
                            </div>
                            <span className="font-medium text-foreground">
                              {user.username}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="px-4 py-3">
                          {linkedChar ? (
                            <div className="flex items-center gap-2">
                              <TokenAvatar
                                src={linkedChar.tokenImage}
                                name={linkedChar.name}
                                size="xs"
                              />
                              <span className="text-foreground text-sm">
                                {linkedChar.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              Nenhum
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={user.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() =>
                                setEditUserDialog({ open: true, user })
                              }
                              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                              title="Editar"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleBlockUser(user)}
                              className={cn(
                                'p-2 transition-colors',
                                user.status === 'blocked'
                                  ? 'text-success hover:text-success/80'
                                  : 'text-warning hover:text-warning/80'
                              )}
                              title={user.status === 'blocked' ? 'Desbloquear' : 'Bloquear'}
                            >
                              {user.status === 'blocked' ? (
                                <ShieldOff size={16} />
                              ) : (
                                <ShieldAlert size={16} />
                              )}
                            </button>
                            <button
                              onClick={() =>
                                setDeleteDialog({ open: true, user })
                              }
                              className="p-2 text-danger hover:text-danger/80 transition-colors"
                              title="Deletar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tabs.Content>
      </Tabs.Root>

      {/* Edit User Dialog */}
      <EditUserDialog
        open={editUserDialog.open}
        user={editUserDialog.user}
        characters={characters}
        onOpenChange={(open) => setEditUserDialog({ open, user: null })}
        onSave={handleUpdateUser}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, user: null })}
        title="Deletar Usuário"
        description={`Tem certeza que deseja deletar o usuário "${deleteDialog.user?.username}"? Esta ação não pode ser desfeita.`}
        confirmText="Deletar"
        onConfirm={handleDeleteUser}
        variant="danger"
      />
    </div>
  );
}

// ─────────────────────────────────────────
// PENDING REQUEST CARD
// ─────────────────────────────────────────

interface PendingRequestCardProps {
  request: AccessRequest;
  characters: Character[];
  onApprove: (role: string, linkedCharacterId?: string) => void;
  onReject: (reason?: string) => void;
}

function PendingRequestCard({
  request,
  characters,
  onApprove,
  onReject,
}: PendingRequestCardProps) {
  const [selectedRole, setSelectedRole] = useState('player');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    await onApprove(
      selectedRole,
      selectedCharacter || undefined
    );
    setLoading(false);
  };

  const handleReject = async () => {
    setLoading(true);
    await onReject();
    setLoading(false);
  };

  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-warning/20 rounded-full flex items-center justify-center">
            <Clock className="text-warning" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">
              {request.user?.username}
            </h3>
            <p className="text-sm text-muted-foreground">
              Solicitado em {formatDate(request.requestedAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Role Select */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Papel
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="player">Jogador</option>
            <option value="spectator">Espectador</option>
          </select>
        </div>

        {/* Character Select */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-1">
            Vincular Personagem
          </label>
          <select
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Nenhum</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          onClick={handleReject}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <X size={18} />
          Recusar
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success/80 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Check size={18} />
          )}
          Aprovar
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// EDIT USER DIALOG
// ─────────────────────────────────────────

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  characters: Character[];
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, data: Partial<User>) => void;
}

function EditUserDialog({
  open,
  user,
  characters,
  onOpenChange,
  onSave,
}: EditUserDialogProps) {
  const [role, setRole] = useState(user?.role || 'player');
  const [linkedCharacterId, setLinkedCharacterId] = useState(
    user?.linkedCharacterId || ''
  );

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setLinkedCharacterId(user.linkedCharacterId || '');
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    onSave(user.id, {
      role,
      linkedCharacterId: linkedCharacterId || null,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-lg p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-lg font-semibold text-foreground mb-4">
            Editar Usuário
          </Dialog.Title>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Usuário
              </label>
              <p className="text-foreground font-medium">{user?.username}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Papel
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'player' | 'spectator')}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="player">Jogador</option>
                <option value="spectator">Espectador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Personagem Vinculado
              </label>
              <select
                value={linkedCharacterId}
                onChange={(e) => setLinkedCharacterId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="">Nenhum</option>
                {characters.map((char) => (
                  <option key={char.id} value={char.id}>
                    {char.name}
                  </option>
                ))}
              </select>
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
                className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-lg transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─────────────────────────────────────────
// HELPER COMPONENTS
// ─────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const config: Record<string, { icon: React.ElementType; color: string; label: string }> = {
    admin: { icon: Shield, color: 'bg-accent/20 text-accent', label: 'Admin' },
    player: { icon: UserIcon, color: 'bg-success/20 text-success', label: 'Jogador' },
    spectator: { icon: UserIcon, color: 'bg-muted text-muted-foreground', label: 'Espectador' },
  };

  const { icon: Icon, color, label } = config[role] || config.spectator;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-1 rounded text-xs', color)}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-success/20 text-success', label: 'Ativo' },
    blocked: { color: 'bg-danger/20 text-danger', label: 'Bloqueado' },
    pending: { color: 'bg-warning/20 text-warning', label: 'Pendente' },
  };

  const { color, label } = config[status] || config.pending;

  return (
    <span className={cn('inline-flex items-center px-2 py-1 rounded text-xs', color)}>
      {label}
    </span>
  );
}
