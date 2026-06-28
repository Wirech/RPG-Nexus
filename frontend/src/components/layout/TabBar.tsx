import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Home, Users, Map, Skull, FileText, Swords, BookOpen, Settings, Plus } from 'lucide-react';
import { useTabStore, type Tab, type TabType } from '@/stores/tabStore';
import { cn } from '@/lib/utils';

// Ícones por tipo de tab
const TAB_ICONS: Record<TabType, React.ComponentType<{ className?: string }>> = {
  dashboard: Home,
  characters: Users,
  character: Users,
  environments: Map,
  environment: Map,
  monsters: Skull,
  monster: Skull,
  documents: FileText,
  document: FileText,
  combat: Swords,
  session: BookOpen,
  admin: Settings,
};

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  canClose: boolean;
}

function TabItem({ tab, isActive, onActivate, onClose, canClose }: TabItemProps) {
  const Icon = TAB_ICONS[tab.type] || FileText;
  
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 border-r border-border cursor-pointer transition-colors min-w-[120px] max-w-[200px]',
        isActive
          ? 'bg-surface text-foreground border-b-2 border-b-accent'
          : 'bg-background text-muted-foreground hover:bg-surface/50 hover:text-foreground'
      )}
      onClick={onActivate}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span className="truncate text-sm flex-1">{tab.title}</span>
      {canClose && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className={cn(
            'p-0.5 rounded hover:bg-border transition-opacity',
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          )}
          title="Fechar aba"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, activeTabId, setActiveTab, removeTab, syncWithRoute, addTab } = useTabStore();
  
  // Sincroniza tabs com a rota atual
  useEffect(() => {
    syncWithRoute(location.pathname);
  }, [location.pathname, syncWithRoute]);
  
  // Handler para ativar uma tab e navegar
  const handleActivate = (tab: Tab) => {
    setActiveTab(tab.id);
    navigate(tab.path);
  };
  
  // Handler para fechar tab (navega para próxima se necessário)
  const handleClose = (tabId: string) => {
    const tabIndex = tabs.findIndex((t) => t.id === tabId);
    const isActiveTab = tabId === activeTabId;
    
    removeTab(tabId);
    
    // Se fechou a tab ativa, navega para a nova tab ativa
    if (isActiveTab && tabs.length > 1) {
      const newTabs = tabs.filter((t) => t.id !== tabId);
      const newActiveTab = tabIndex < newTabs.length 
        ? newTabs[tabIndex] 
        : newTabs[newTabs.length - 1];
      if (newActiveTab) {
        navigate(newActiveTab.path);
      }
    }
  };
  
  // Handler para criar nova aba
  const handleNewTab = () => {
    addTab({
      type: 'dashboard',
      title: 'Nova aba',
      path: '/',
    });
    navigate('/');
  };
  
  return (
    <div className="flex items-center bg-background border-b border-border overflow-x-auto">
      {tabs.map((tab) => (
        <TabItem
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onActivate={() => handleActivate(tab)}
          onClose={() => handleClose(tab.id)}
          canClose={tabs.length > 1}
        />
      ))}
      
      {/* Botão para nova aba */}
      <button
        onClick={handleNewTab}
        className="p-2 text-muted-foreground hover:text-foreground hover:bg-surface/50 transition-colors flex-shrink-0"
        title="Nova aba (Ctrl+click em links também abre nova aba)"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
