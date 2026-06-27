import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock, XCircle, Loader2 } from 'lucide-react';
import { useSocket, useAuth } from '@/hooks';

export function PendingApproval() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isPending } = useAuth();
  
  // Connect to socket to listen for approval/rejection
  useSocket();

  const rejected = searchParams.get('rejected') === 'true';
  const rejectionReason = searchParams.get('reason');

  // If user is approved, redirect to dashboard
  useEffect(() => {
    if (user && !isPending && user.status === 'active') {
      navigate('/');
    }
  }, [user, isPending, navigate]);

  if (rejected) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>

          {/* Message */}
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mb-6">
            {rejectionReason || 'Sua solicitação de acesso foi recusada pelo Mestre.'}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => navigate('/request-access')}
              className="w-full py-2.5 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 bg-surface hover:bg-surface/80 text-foreground font-medium rounded-lg border border-border transition-colors"
            >
              Voltar ao Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        {/* Animated icon */}
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 bg-accent/20 rounded-full animate-ping" />
          <div className="relative w-full h-full bg-accent/10 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-accent" />
          </div>
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Aguardando Aprovação
        </h1>
        <p className="text-muted-foreground mb-8">
          Sua solicitação foi enviada e está sendo analisada pelo Mestre.
          <br />
          Você será notificado quando houver uma resposta.
        </p>

        {/* Loading indicator */}
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Aguardando resposta em tempo real...</span>
        </div>

        {/* User info */}
        {user && (
          <div className="mt-8 p-4 bg-surface border border-border rounded-lg">
            <p className="text-sm text-muted-foreground">
              Logado como: <span className="text-foreground font-medium">{user.username}</span>
            </p>
          </div>
        )}

        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="mt-6 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
}
