import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  SkipForward,
  UserPlus,
  XCircle,
  Swords,
} from 'lucide-react';
import { combatApi } from '@/services/api';
import { useSocket, useAuth } from '@/hooks';
import { useCombatStore } from '@/stores/combatStore';
import { ConfirmDialog } from '@/components/shared';
import {
  CombatParticipantCard,
  CombatEventLog,
  ApplyDamageDialog,
  FinishCombatDialog,
  AddParticipantDialog,
} from '@/components/combat';
import type { CombatSession } from '@/types';
import toast from 'react-hot-toast';

export function CombatTracker() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { joinCombat, leaveCombat } = useSocket();

  const {
    activeCombat,
    participants,
    events,
    currentRound,
    setActiveCombat,
  } = useCombatStore();

  const [loading, setLoading] = useState(true);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);

  // Dialogs
  const [applyDamageOpen, setApplyDamageOpen] = useState(false);
  const [finishOpen, setFinishOpen] = useState(false);
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [nextRoundConfirmOpen, setNextRoundConfirmOpen] = useState(false);

  const fetchCombat = useCallback(async () => {
    if (!id) return;
    try {
      const response = await combatApi.getById(id);
      const combat = response.data as CombatSession;
      
      // Set combat data to store
      setActiveCombat(combat);
      
      // Default turn index to 0, will be updated via socket events
      setCurrentTurnIndex(0);
    } catch (error) {
      toast.error('Erro ao carregar combate');
      navigate('/combat');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, setActiveCombat]);

  useEffect(() => {
    fetchCombat();
  }, [fetchCombat]);

  // Join/leave combat room on socket
  useEffect(() => {
    if (id) {
      joinCombat(id);
      return () => leaveCombat(id);
    }
  }, [id, joinCombat, leaveCombat]);

  const handleNextRound = async () => {
    if (!id) return;
    try {
      await combatApi.nextRound(id);
      toast.success(`Rodada ${currentRound + 1} iniciada!`);
      setNextRoundConfirmOpen(false);
      fetchCombat();
    } catch (error) {
      toast.error('Erro ao avançar rodada');
    }
  };

  const handleFinish = async (updateVitals: boolean, createSessionNote: boolean) => {
    if (!id) return;
    try {
      await combatApi.finish(id, { updateCharacterVitals: updateVitals, createSessionNote });
      toast.success('Combate encerrado!');
      setFinishOpen(false);
      navigate('/combat');
    } catch (error) {
      toast.error('Erro ao encerrar combate');
    }
  };

  // Sort participants by order (initiative)
  const sortedParticipants = [...participants].sort((a, b) => a.order - b.order);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-accent" size={32} />
      </div>
    );
  }

  if (!activeCombat) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Combate não encontrado</p>
      </div>
    );
  }

  const isFinished = activeCombat.status === 'finished';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/combat')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{activeCombat.name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Swords size={14} />
                Rodada {currentRound}
              </span>
              <span>•</span>
              <span>{sortedParticipants.length} participantes</span>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        {isAdmin && !isFinished && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setNextRoundConfirmOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <SkipForward size={16} />
              Próxima Rodada
            </button>
            <button
              onClick={() => setAddParticipantOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-surface border border-border text-foreground rounded-md hover:bg-muted transition-colors"
            >
              <UserPlus size={16} />
              Adicionar
            </button>
            <button
              onClick={() => setApplyDamageOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-md hover:bg-accent/90 transition-colors"
            >
              <Swords size={16} />
              Aplicar Dano
            </button>
            <button
              onClick={() => setFinishOpen(true)}
              className="flex items-center gap-2 px-3 py-2 bg-danger text-white rounded-md hover:bg-danger/90 transition-colors"
            >
              <XCircle size={16} />
              Encerrar
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants List */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Ordem de Iniciativa</h2>
          {sortedParticipants.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground bg-surface border border-border rounded-lg">
              <p>Nenhum participante no combate</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedParticipants.map((participant, index) => (
                <CombatParticipantCard
                  key={participant.id}
                  participant={participant}
                  isCurrentTurn={index === currentTurnIndex && !isFinished}
                  isAdmin={isAdmin}
                  onVitalsChange={() => fetchCombat()}
                  combatId={id!}
                />
              ))}
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="lg:col-span-1">
          <CombatEventLog
            events={events}
            participants={participants}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* Dialogs */}
      <ApplyDamageDialog
        open={applyDamageOpen}
        onOpenChange={setApplyDamageOpen}
        participants={sortedParticipants}
        combatId={id!}
        onSuccess={fetchCombat}
      />

      <FinishCombatDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        combat={activeCombat}
        participants={sortedParticipants}
        events={events}
        onConfirm={handleFinish}
      />

      <AddParticipantDialog
        open={addParticipantOpen}
        onOpenChange={setAddParticipantOpen}
        combatId={id!}
        onSuccess={fetchCombat}
      />

      <ConfirmDialog
        open={nextRoundConfirmOpen}
        onOpenChange={setNextRoundConfirmOpen}
        title="Próxima Rodada"
        description={`Avançar para a Rodada ${currentRound + 1}?`}
        confirmText="Avançar"
        onConfirm={handleNextRound}
      />
    </div>
  );
}
