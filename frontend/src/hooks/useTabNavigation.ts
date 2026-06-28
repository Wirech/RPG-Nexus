import { useNavigate } from 'react-router-dom';
import { useTabStore, type TabType } from '@/stores/tabStore';

interface OpenTabOptions {
  type: TabType;
  title: string;
  path: string;
  entityId?: string;
}

export function useTabNavigation() {
  const navigate = useNavigate();
  const { openOrFocusTab, replaceCurrentTab, addTab, tabs, activeTabId } = useTabStore();
  
  // Navega substituindo a aba atual (comportamento padrão)
  const navigateTo = (options: OpenTabOptions) => {
    replaceCurrentTab(options);
    navigate(options.path);
  };
  
  // Abre em nova aba (Ctrl+click ou botão +)
  const openInNewTab = (options: OpenTabOptions) => {
    openOrFocusTab(options);
    navigate(options.path);
  };
  
  // Navega com suporte a Ctrl (detecta se deve abrir nova aba)
  const navigateWithEvent = (options: OpenTabOptions, event?: React.MouseEvent | MouseEvent) => {
    const openNew = event?.ctrlKey || event?.metaKey;
    if (openNew) {
      openInNewTab(options);
    } else {
      navigateTo(options);
    }
  };
  
  // Cria uma nova aba vazia (Dashboard)
  const createNewTab = () => {
    addTab({
      type: 'dashboard',
      title: 'Nova aba',
      path: '/',
    });
    navigate('/');
  };
  
  // Atalhos para navegação (substituem aba atual por padrão)
  const openCharacter = (id: string, name: string, event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'character',
      title: name,
      path: `/characters/${id}`,
      entityId: id,
    }, event);
  };
  
  const openEnvironment = (id: string, name: string, event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'environment',
      title: name,
      path: `/environments/${id}`,
      entityId: id,
    }, event);
  };
  
  const openMonster = (id: string, name: string, event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'monster',
      title: name,
      path: `/monsters/${id}`,
      entityId: id,
    }, event);
  };
  
  const openDocument = (id: string, name: string, event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'document',
      title: name,
      path: `/documents/${id}`,
      entityId: id,
    }, event);
  };
  
  const openDashboard = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'dashboard',
      title: 'Início',
      path: '/',
    }, event);
  };
  
  const openCharacters = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'characters',
      title: 'Personagens',
      path: '/characters',
    }, event);
  };
  
  const openEnvironments = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'environments',
      title: 'Cenários',
      path: '/environments',
    }, event);
  };
  
  const openMonsters = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'monsters',
      title: 'Bestiário',
      path: '/monsters',
    }, event);
  };
  
  const openDocuments = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'documents',
      title: 'Documentos',
      path: '/documents',
    }, event);
  };
  
  const openCombat = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'combat',
      title: 'Combate',
      path: '/combat',
    }, event);
  };
  
  const openSession = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'session',
      title: 'Sessão',
      path: '/session',
    }, event);
  };
  
  const openAdmin = (event?: React.MouseEvent | MouseEvent) => {
    navigateWithEvent({
      type: 'admin',
      title: 'Administração',
      path: '/admin',
    }, event);
  };
  
  // Navega para um link interno (usado pelo editor de texto) - SEMPRE abre em nova aba
  const navigateToLink = (type: string, id: string, name: string, _event?: MouseEvent) => {
    const options = (() => {
      switch (type) {
        case 'character':
          return { type: 'character' as TabType, title: name, path: `/characters/${id}`, entityId: id };
        case 'environment':
          return { type: 'environment' as TabType, title: name, path: `/environments/${id}`, entityId: id };
        case 'monster':
          return { type: 'monster' as TabType, title: name, path: `/monsters/${id}`, entityId: id };
        case 'document':
          return { type: 'document' as TabType, title: name, path: `/documents/${id}`, entityId: id };
        default:
          console.warn(`Tipo de link desconhecido: ${type}`);
          return null;
      }
    })();
    
    if (options) {
      // Links em texto sempre abrem em nova aba
      openInNewTab(options);
    }
  };
  
  return {
    navigateTo,
    openInNewTab,
    navigateWithEvent,
    createNewTab,
    openCharacter,
    openEnvironment,
    openMonster,
    openDocument,
    openDashboard,
    openCharacters,
    openEnvironments,
    openMonsters,
    openDocuments,
    openCombat,
    openSession,
    openAdmin,
    navigateToLink,
    tabs,
    activeTabId,
  };
}
