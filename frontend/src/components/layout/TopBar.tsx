import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronRight, User, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import { useAuthStore } from '@/stores';
import { NotificationBell } from './NotificationBell';
import { TokenAvatar } from '@/components/shared';

// Route labels for breadcrumb
const routeLabels: Record<string, string> = {
  '': 'Dashboard',
  characters: 'Personagens',
  monsters: 'Bestiário',
  environments: 'Ambientes',
  documents: 'Documentos',
  combat: 'Combate',
  sessions: 'Sessões',
  audit: 'Log de Auditoria',
  users: 'Usuários',
};

export function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const logout = useAuthStore((state) => state.logout);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Generate breadcrumb from path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const label = routeLabels[segment] || segment;
    return { path, label };
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-background border-b border-border flex items-center justify-between px-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm">
        <Link
          to="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-foreground font-medium">{crumb.label}</span>
            ) : (
              <Link
                to={crumb.path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Notification bell (admin only) */}
        {isAdmin && <NotificationBell />}

        {/* User menu */}
        <DropdownMenu.Root open={dropdownOpen} onOpenChange={setDropdownOpen}>
          <DropdownMenu.Trigger asChild>
            <button
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-surface transition-colors"
            >
              <TokenAvatar
                name={user?.username || 'U'}
                size="sm"
              />
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-foreground">
                  {user?.username}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role === 'admin' ? 'Mestre' : user?.role}
                </p>
              </div>
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-48 bg-surface border border-border rounded-lg shadow-xl p-1 z-50"
              sideOffset={8}
              align="end"
            >
              <DropdownMenu.Item
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded text-sm text-muted-foreground',
                  'hover:bg-background hover:text-foreground cursor-pointer outline-none'
                )}
              >
                <User className="w-4 h-4" />
                Perfil
              </DropdownMenu.Item>

              {isAdmin && (
                <DropdownMenu.Item
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded text-sm text-muted-foreground',
                    'hover:bg-background hover:text-foreground cursor-pointer outline-none'
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Configurações
                </DropdownMenu.Item>
              )}

              <DropdownMenu.Separator className="my-1 border-t border-border" />

              <DropdownMenu.Item
                onClick={handleLogout}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded text-sm text-red-400',
                  'hover:bg-red-500/10 hover:text-red-300 cursor-pointer outline-none'
                )}
              >
                <LogOut className="w-4 h-4" />
                Sair
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
