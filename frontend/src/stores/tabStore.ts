import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TabType = 
  | 'dashboard'
  | 'characters'
  | 'character'
  | 'environments'
  | 'environment'
  | 'monsters'
  | 'monster'
  | 'documents'
  | 'document'
  | 'combat'
  | 'session'
  | 'admin';

export interface Tab {
  id: string;
  type: TabType;
  title: string;
  path: string;
  entityId?: string; // ID do personagem, monstro, etc.
  icon?: string;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  
  // Ações
  addTab: (tab: Omit<Tab, 'id'>) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTab: (id: string, updates: Partial<Tab>) => void;
  closeAllTabs: () => void;
  closeOtherTabs: (id: string) => void;
  
  // Navegação com tabs
  openOrFocusTab: (tab: Omit<Tab, 'id'>) => void;
  replaceCurrentTab: (tab: Omit<Tab, 'id'>) => void;
  
  // Sincronização com rota
  syncWithRoute: (path: string) => void;
}

// Gera ID único para tabs
const generateTabId = () => `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [
        {
          id: 'tab-dashboard',
          type: 'dashboard',
          title: 'Início',
          path: '/',
        },
      ],
      activeTabId: 'tab-dashboard',

      addTab: (tab) => {
        const id = generateTabId();
        const newTab: Tab = { ...tab, id };
        
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: id,
        }));
        
        return id;
      },

      removeTab: (id) => {
        const { tabs, activeTabId } = get();
        
        // Não pode fechar a última tab
        if (tabs.length <= 1) return;
        
        const tabIndex = tabs.findIndex((t) => t.id === id);
        const newTabs = tabs.filter((t) => t.id !== id);
        
        // Se a tab fechada era a ativa, ativa a próxima ou anterior
        let newActiveId = activeTabId;
        if (activeTabId === id) {
          if (tabIndex < newTabs.length) {
            newActiveId = newTabs[tabIndex].id;
          } else {
            newActiveId = newTabs[newTabs.length - 1].id;
          }
        }
        
        set({
          tabs: newTabs,
          activeTabId: newActiveId,
        });
      },

      setActiveTab: (id) => {
        set({ activeTabId: id });
      },

      updateTab: (id, updates) => {
        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        }));
      },

      closeAllTabs: () => {
        set({
          tabs: [
            {
              id: 'tab-dashboard',
              type: 'dashboard',
              title: 'Início',
              path: '/',
            },
          ],
          activeTabId: 'tab-dashboard',
        });
      },

      closeOtherTabs: (id) => {
        const { tabs } = get();
        const tabToKeep = tabs.find((t) => t.id === id);
        
        if (tabToKeep) {
          set({
            tabs: [tabToKeep],
            activeTabId: id,
          });
        }
      },

      // Abre sempre em nova aba
      openOrFocusTab: (tab) => {
        const { addTab } = get();
        addTab(tab);
      },

      // Substitui a aba atual com novo conteúdo (comportamento padrão de navegador)
      replaceCurrentTab: (tab) => {
        const { activeTabId, updateTab, addTab } = get();
        
        // Se não tem aba ativa, adiciona nova
        if (!activeTabId) {
          addTab(tab);
          return;
        }
        
        // Substitui a aba atual diretamente
        updateTab(activeTabId, {
          type: tab.type,
          title: tab.title,
          path: tab.path,
          entityId: tab.entityId,
        });
      },

      // Sincroniza o estado das tabs com a rota atual (sem criar novas tabs automaticamente)
      // Só muda a aba ativa se a aba atual NÃO corresponde ao path
      syncWithRoute: (path: string) => {
        const { tabs, activeTabId } = get();
        
        // Verifica se a aba ativa já tem o path correto
        const activeTab = tabs.find((t) => t.id === activeTabId);
        if (activeTab && activeTab.path === path) {
          // Aba ativa já está correta, não faz nada
          return;
        }
        
        // Se a aba ativa não corresponde, não mudar automaticamente
        // A navegação já foi tratada por replaceCurrentTab ou openOrFocusTab
      },
    }),
    {
      name: 'nexus-tabs',
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
      }),
    }
  )
);
