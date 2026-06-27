import { useRef, useEffect } from 'react';
import {
  ScrollText,
  Copy,
  Swords,
  Heart,
  AlertTriangle,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';
import type { CombatEvent, CombatParticipant } from '@/types';
import toast from 'react-hot-toast';

const ACTION_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  damage: { icon: Swords, color: 'text-danger', label: 'Dano' },
  heal: { icon: Heart, color: 'text-success', label: 'Cura' },
  condition_add: { icon: AlertTriangle, color: 'text-warning', label: 'Condição' },
  condition_remove: { icon: RefreshCw, color: 'text-blue-400', label: 'Removida' },
  custom: { icon: Zap, color: 'text-accent', label: 'Evento' },
};

interface CombatEventLogProps {
  events: CombatEvent[];
  participants: CombatParticipant[];
  isAdmin: boolean;
}

export function CombatEventLog({ events, participants, isAdmin }: CombatEventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest event
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length]);

  const getParticipantName = (participantId: string | null | undefined) => {
    if (!participantId) return 'Sistema';
    const participant = participants.find((p) => p.id === participantId);
    return participant?.customName || 
      participant?.character?.name || 
      participant?.monster?.name || 
      'Desconhecido';
  };

  const formatEventDescription = (event: CombatEvent) => {
    const targetName = getParticipantName(event.targetId);
    const sourceName = event.sourceId ? getParticipantName(event.sourceId) : null;

    switch (event.action) {
      case 'damage':
        return (
          <>
            <span className="text-danger font-medium">{targetName}</span>
            {' recebeu '}
            <span className="text-danger font-bold">{Math.abs(event.value || 0)}</span>
            {' de dano'}
            {sourceName && (
              <span className="text-muted-foreground"> de {sourceName}</span>
            )}
            {event.field === 'san' && <span className="text-warning"> (Sanidade)</span>}
          </>
        );
      case 'heal':
        return (
          <>
            <span className="text-success font-medium">{targetName}</span>
            {' recuperou '}
            <span className="text-success font-bold">{event.value || 0}</span>
            {' PV'}
            {event.field === 'san' && <span className="text-warning"> de Sanidade</span>}
          </>
        );
      case 'condition_add':
        return (
          <>
            <span className="font-medium text-foreground">{targetName}</span>
            {' recebeu a condição '}
            <span className="text-warning font-medium">{event.description}</span>
          </>
        );
      case 'condition_remove':
        return (
          <>
            <span className="font-medium text-foreground">{targetName}</span>
            {' perdeu a condição '}
            <span className="text-blue-400 font-medium">{event.description}</span>
          </>
        );
      case 'custom':
      default:
        return (
          <span className="text-muted-foreground">
            {event.description || 'Evento registrado'}
          </span>
        );
    }
  };

  const handleCopyLog = () => {
    const logText = events
      .map((event) => {
        const targetName = getParticipantName(event.targetId);
        const timestamp = formatDate(event.timestamp);
        let text = `[${timestamp}] `;

        switch (event.action) {
          case 'damage':
            text += `${targetName} recebeu ${Math.abs(event.value || 0)} de dano`;
            break;
          case 'heal':
            text += `${targetName} recuperou ${event.value || 0} PV`;
            break;
          case 'condition_add':
            text += `${targetName} recebeu condição: ${event.description}`;
            break;
          case 'condition_remove':
            text += `${targetName} perdeu condição: ${event.description}`;
            break;
          default:
            text += event.description || 'Evento registrado';
        }
        return text;
      })
      .join('\n');

    navigator.clipboard.writeText(logText);
    toast.success('Log copiado para a área de transferência');
  };

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <ScrollText size={18} className="text-accent" />
          Log de Combate
        </h3>
        {isAdmin && events.length > 0 && (
          <button
            onClick={handleCopyLog}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-colors"
            title="Copiar log"
          >
            <Copy size={14} />
            Copiar
          </button>
        )}
      </div>

      {/* Events List */}
      <div
        ref={scrollRef}
        className="h-[400px] lg:h-[calc(100vh-350px)] overflow-y-auto p-2"
      >
        {events.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhum evento registrado</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {events.map((event) => {
              const config = ACTION_CONFIG[event.action] || ACTION_CONFIG.custom;
              const Icon = config.icon;

              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 px-2 py-1.5 rounded hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('flex-shrink-0 mt-0.5', config.color)}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">
                      {formatEventDescription(event)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDate(event.timestamp)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
