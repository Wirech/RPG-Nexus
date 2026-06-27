import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks';
import {
  LayoutDashboard,
  Users,
  Skull,
  Map,
  FileText,
  Swords,
  BookOpen,
  ScrollText,
  UserCog,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard' },
  { to: '/characters', icon: <Users className="w-5 h-5" />, label: 'Personagens' },
  { to: '/monsters', icon: <Skull className="w-5 h-5" />, label: 'Bestiário', adminOnly: true },
  { to: '/environments', icon: <Map className="w-5 h-5" />, label: 'Ambientes' },
  { to: '/documents', icon: <FileText className="w-5 h-5" />, label: 'Documentos' },
  { to: '/combat', icon: <Swords className="w-5 h-5" />, label: 'Combate', adminOnly: true },
  { to: '/sessions', icon: <BookOpen className="w-5 h-5" />, label: 'Sessões', adminOnly: true },
];

const adminItems: NavItem[] = [
  { to: '/audit', icon: <ScrollText className="w-5 h-5" />, label: 'Log', adminOnly: true },
  { to: '/users', icon: <UserCog className="w-5 h-5" />, label: 'Usuários', adminOnly: true },
];

const STORAGE_KEY = 'nexus-sidebar-collapsed';

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  const { isAdmin } = useAuth();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || isAdmin);
  const visibleAdminItems = isAdmin ? adminItems : [];

  const renderNavItem = (item: NavItem) => {
    const isActive = location.pathname === item.to || 
      (item.to !== '/' && location.pathname.startsWith(item.to));

    return (
      <NavLink
        key={item.to}
        to={item.to}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
          'hover:bg-surface text-muted-foreground hover:text-foreground',
          isActive && 'bg-accent/10 text-accent hover:bg-accent/20 hover:text-accent',
          collapsed && 'justify-center px-2'
        )}
        title={collapsed ? item.label : undefined}
      >
        {item.icon}
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </NavLink>
    );
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-background border-r border-border flex flex-col transition-all duration-300 z-30',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'h-16 flex items-center border-b border-border px-4',
        collapsed && 'justify-center px-2'
      )}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">N</span>
          </div>
          {!collapsed && (
            <span className="font-bold text-foreground">Nexus do Mestre</span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {visibleNavItems.map(renderNavItem)}

        {visibleAdminItems.length > 0 && (
          <>
            <div className="my-3 border-t border-border" />
            {visibleAdminItems.map(renderNavItem)}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'p-3 border-t border-border text-muted-foreground hover:text-foreground hover:bg-surface transition-colors',
          'flex items-center gap-2',
          collapsed && 'justify-center'
        )}
        title={collapsed ? 'Expandir' : 'Recolher'}
      >
        {collapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <>
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Recolher</span>
          </>
        )}
      </button>
    </aside>
  );
}
