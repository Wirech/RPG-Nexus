import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from '@/components/layout';
import {
  Login,
  AccessRequest,
  PendingApproval,
  Dashboard,
  Characters,
  CharacterSheet,
  Monsters,
  MonsterSheet,
  Environments,
  EnvironmentPage,
  Documents,
  DocumentPage,
  CombatList,
  CombatTracker,
  SessionNotes,
  SessionNoteDetail,
  UserManagement,
  AuditLog,
} from '@/pages';
import { useAuth } from '@/hooks';
import type { UserRole } from '@/types';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
  minRole?: UserRole;
}

function ProtectedRoute({ children, minRole }: ProtectedRouteProps) {
  const { isAuthenticated, user, isPending } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (isPending || user?.status === 'pending') {
    return <Navigate to="/pending" replace />;
  }

  if (user?.status === 'blocked') {
    return <Navigate to="/login" replace />;
  }

  // Role hierarchy: admin > player > spectator
  if (minRole === 'admin' && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <p className="text-xl text-muted-foreground">Página não encontrada</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1a1a24',
            color: '#e2e8f0',
            border: '1px solid #2a2a3a',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#e2e8f0',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#e2e8f0',
            },
          },
        }}
      />

      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/request-access" element={<AccessRequest />} />
        <Route path="/pending" element={<PendingApproval />} />

        {/* Protected routes with layout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Characters */}
          <Route path="characters" element={<Characters />} />
          <Route path="characters/:id" element={<CharacterSheet />} />

          {/* Monsters (admin only) */}
          <Route
            path="monsters"
            element={
              <ProtectedRoute minRole="admin">
                <Monsters />
              </ProtectedRoute>
            }
          />
          <Route
            path="monsters/:id"
            element={
              <ProtectedRoute minRole="admin">
                <MonsterSheet />
              </ProtectedRoute>
            }
          />

          {/* Environments */}
          <Route path="environments" element={<Environments />} />
          <Route path="environments/:id" element={<EnvironmentPage />} />

          {/* Documents */}
          <Route path="documents" element={<Documents />} />
          <Route path="documents/:id" element={<DocumentPage />} />

          {/* Combat (admin for list, all for tracker) */}
          <Route
            path="combat"
            element={
              <ProtectedRoute minRole="admin">
                <CombatList />
              </ProtectedRoute>
            }
          />
          <Route path="combat/:id" element={<CombatTracker />} />

          {/* Sessions (admin only) */}
          <Route
            path="sessions"
            element={
              <ProtectedRoute minRole="admin">
                <SessionNotes />
              </ProtectedRoute>
            }
          />
          <Route
            path="sessions/:id"
            element={
              <ProtectedRoute minRole="admin">
                <SessionNoteDetail />
              </ProtectedRoute>
            }
          />

          {/* Audit (admin only) */}
          <Route
            path="audit"
            element={
              <ProtectedRoute minRole="admin">
                <AuditLog />
              </ProtectedRoute>
            }
          />

          {/* Users (admin only) */}
          <Route
            path="users"
            element={
              <ProtectedRoute minRole="admin">
                <UserManagement />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
