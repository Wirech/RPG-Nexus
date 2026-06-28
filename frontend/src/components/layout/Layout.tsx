import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { TabBar } from './TabBar';
import { SearchModal } from './SearchModal';
import { DiceRoller } from '@/components/shared';
import { useSocket } from '@/hooks';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'nexus-sidebar-collapsed';

export function Layout() {
  // Initialize socket connection for the entire app
  useSocket();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });

  // Listen for sidebar state changes
  useEffect(() => {
    const handleStorage = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSidebarCollapsed(stored === 'true');
    };

    // Check periodically for changes (localStorage doesn't trigger events in same tab)
    const interval = setInterval(handleStorage, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-60'
        )}
      >
        {/* Top bar */}
        <TopBar />

        {/* Tab bar */}
        <TabBar />

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Floating dice roller */}
      <DiceRoller />

      {/* Global search modal (Ctrl+K) */}
      <SearchModal />
    </div>
  );
}
