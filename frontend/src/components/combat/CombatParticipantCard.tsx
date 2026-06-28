import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Swords,
  User,
  Bug,
  Plus,
  Check,
  X,
} from 'lucide-react';
import { combatApi } from '@/services/api';
import { VitalBar, TokenAvatar, ConditionBadge, Tooltip } from '@/components/shared';
import { CONDITIONS_DATA, CONDITION_CATEGORIES } from '@/data/conditions';
import { cn } from '@/lib/utils';
import type { CombatParticipant, ConditionType } from '@/types';
import toast from 'react-hot-toast';

interface CombatParticipantCardProps {
  participant: CombatParticipant;
  isCurrentTurn: boolean;
  isAdmin: boolean;
  onVitalsChange: () => void;
  combatId: string;
}

export function CombatParticipantCard({
  participant,
  isCurrentTurn,
  isAdmin,
  onVitalsChange,
  combatId,
}: CombatParticipantCardProps) {
  const [editingVital, setEditingVital] = useState<'pv' | 'san' | 'pe' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [addConditionOpen, setAddConditionOpen] = useState(false);

  const conditions: ConditionType[] = Array.isArray(participant.conditions)
    ? participant.conditions as ConditionType[]
    : [];

  const isDead = conditions.includes('Morto');
  const isUnconscious = participant.pvCurrent === 0 || conditions.includes('Inconsciente');

  const handleVitalChange = async (field: 'pv' | 'san' | 'pe', delta: number) => {
    try {
      await combatApi.updateParticipantVitals(combatId, participant.id, {
        field,
        value: delta,
      });
      onVitalsChange();
    } catch (error) {
      toast.error('Erro ao atualizar vital');
    }
  };

  const handleVitalEdit = async (field: 'pv' | 'san' | 'pe') => {
    const newValue = parseInt(editValue);
    if (isNaN(newValue)) {
      setEditingVital(null);
      setEditValue('');
      return;
    }

    const currentValue =
      field === 'pv'
        ? participant.pvCurrent
        : field === 'san'
        ? participant.sanCurrent
        : participant.peCurrent;

    const delta = newValue - currentValue;
    if (delta !== 0) {
      await handleVitalChange(field, delta);
    }
    setEditingVital(null);
    setEditValue('');
  };

  const handleAddCondition = async (condition: ConditionType) => {
    if (conditions.includes(condition)) return;

    const newConditions = [...conditions, condition];
    try {
      await combatApi.updateParticipantConditions(combatId, participant.id, {
        conditions: newConditions,
      });
      onVitalsChange();
      setAddConditionOpen(false);
    } catch (error) {
      toast.error('Erro ao adicionar condição');
    }
  };

  const handleRemoveCondition = async (condition: ConditionType) => {
    const newConditions = conditions.filter((c) => c !== condition);
    try {
      await combatApi.updateParticipantConditions(combatId, participant.id, {
        conditions: newConditions,
      });
      onVitalsChange();
    } catch (error) {
      toast.error('Erro ao remover condição');
    }
  };

  const displayName = participant.customName || 
    (participant.character?.name) || 
    (participant.monster?.name) || 
    'Participante';
  const tokenImage = participant.character?.tokenImage || participant.monster?.tokenImage;
  const isCharacter = participant.entityType === 'character';
  const profileLink = isCharacter
    ? `/characters/${participant.characterId}`
    : `/monsters/${participant.monsterId}`;

  return (
    <div
      className={cn(
        'bg-surface border rounded-lg p-4 transition-all',
        isCurrentTurn && !isDead && 'border-accent shadow-lg shadow-accent/20 animate-pulse',
        isDead && 'opacity-40',
        isUnconscious && !isDead && 'border-danger',
        !isCurrentTurn && !isDead && !isUnconscious && 'border-border'
      )}
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        {/* Left: Avatar & Info */}
        <div className="flex items-start gap-3">
          {/* Turn Indicator */}
          {isCurrentTurn && !isDead && (
            <div className="flex-shrink-0 p-1.5 bg-accent rounded-full">
              <Swords size={16} className="text-white" />
            </div>
          )}

          {/* Token */}
          <Link to={profileLink} className="flex-shrink-0">
            <TokenAvatar
              src={tokenImage}
              name={displayName}
              size="md"
            />
          </Link>

          {/* Name & Type */}
          <div className="min-w-0">
            <Link
              to={profileLink}
              className="font-semibold text-foreground hover:text-accent truncate block"
            >
              {displayName}
            </Link>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs',
                isCharacter
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-red-500/20 text-red-400'
              )}>
                {isCharacter ? <User size={10} /> : <Bug size={10} />}
                {isCharacter ? 'Personagem' : 'Monstro'}
              </span>
              <span className="text-xs text-muted-foreground">
                Init: {participant.initiative}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Vital Bars */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* PV */}
          <div className="space-y-1">
            {editingVital === 'pv' ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVitalEdit('pv')}
                  className="w-16 px-2 py-1 bg-background border border-accent rounded text-sm text-foreground"
                  autoFocus
                />
                <button
                  onClick={() => handleVitalEdit('pv')}
                  className="p-1 text-success hover:bg-success/20 rounded"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => {
                    setEditingVital(null);
                    setEditValue('');
                  }}
                  className="p-1 text-muted-foreground hover:bg-muted rounded"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <VitalBar
                label="PV"
                current={participant.pvCurrent}
                max={participant.pvMax}
                color="red"
                showNumbers
                onMinus={isAdmin ? () => handleVitalChange('pv', -1) : undefined}
                onPlus={isAdmin ? () => handleVitalChange('pv', 1) : undefined}
                onEdit={isAdmin ? () => {
                  setEditingVital('pv');
                  setEditValue(String(participant.pvCurrent));
                } : undefined}
              />
            )}
          </div>

          {/* SAN */}
          {participant.sanMax > 0 && (
            <div className="space-y-1">
              {editingVital === 'san' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVitalEdit('san')}
                    className="w-16 px-2 py-1 bg-background border border-accent rounded text-sm text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={() => handleVitalEdit('san')}
                    className="p-1 text-success hover:bg-success/20 rounded"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingVital(null);
                      setEditValue('');
                    }}
                    className="p-1 text-muted-foreground hover:bg-muted rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <VitalBar
                  label="SAN"
                  current={participant.sanCurrent}
                  max={participant.sanMax}
                  color="purple"
                  showNumbers
                  onMinus={isAdmin ? () => handleVitalChange('san', -1) : undefined}
                  onPlus={isAdmin ? () => handleVitalChange('san', 1) : undefined}
                  onEdit={isAdmin ? () => {
                    setEditingVital('san');
                    setEditValue(String(participant.sanCurrent));
                  } : undefined}
                />
              )}
            </div>
          )}

          {/* PE */}
          {participant.peMax > 0 && (
            <div className="space-y-1">
              {editingVital === 'pe' ? (
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVitalEdit('pe')}
                    className="w-16 px-2 py-1 bg-background border border-accent rounded text-sm text-foreground"
                    autoFocus
                  />
                  <button
                    onClick={() => handleVitalEdit('pe')}
                    className="p-1 text-success hover:bg-success/20 rounded"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={() => {
                      setEditingVital(null);
                      setEditValue('');
                    }}
                    className="p-1 text-muted-foreground hover:bg-muted rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <VitalBar
                  label="PE"
                  current={participant.peCurrent}
                  max={participant.peMax}
                  color="blue"
                  showNumbers
                  onMinus={isAdmin ? () => handleVitalChange('pe', -1) : undefined}
                  onPlus={isAdmin ? () => handleVitalChange('pe', 1) : undefined}
                  onEdit={isAdmin ? () => {
                    setEditingVital('pe');
                    setEditValue(String(participant.peCurrent));
                  } : undefined}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Conditions */}
      <div className="mt-3 flex items-center flex-wrap gap-1.5">
        {conditions.map((condition) => (
          <ConditionBadge
            key={condition}
            condition={condition}
            onRemove={isAdmin ? () => handleRemoveCondition(condition) : undefined}
          />
        ))}

        {/* Unconscious badge when PV=0 */}
        {isUnconscious && !conditions.includes('Inconsciente') && (
          <span className="px-2 py-0.5 bg-gray-700 text-gray-200 rounded text-xs">
            Inconsciente
          </span>
        )}

        {/* Add condition button */}
        {isAdmin && (
          <div className="relative">
            <button
              onClick={() => setAddConditionOpen(!addConditionOpen)}
              className="flex items-center gap-1 px-2 py-0.5 border border-dashed border-muted-foreground text-muted-foreground rounded text-xs hover:border-accent hover:text-accent"
            >
              <Plus size={12} />
              Condição
            </button>

            {/* Condition dropdown */}
            {addConditionOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setAddConditionOpen(false)}
                />
                <div className="absolute top-full left-0 mt-1 bg-surface border border-border rounded-md shadow-lg z-20 py-2 min-w-[200px] max-h-80 overflow-y-auto">
                  {(['medo', 'mental', 'paralisia', 'sentidos', 'fadiga', 'geral'] as const).map((category) => {
                    const categoryInfo = CONDITION_CATEGORIES[category];
                    const conditionsInCategory = CONDITIONS_DATA.filter(
                      (c) => c.category === category && !conditions.includes(c.name)
                    );
                    
                    const tooltipTextColors: Record<string, string> = {
                      medo: 'text-red-400',
                      mental: 'text-orange-400',
                      paralisia: 'text-blue-400',
                      sentidos: 'text-yellow-400',
                      fadiga: 'text-green-400',
                      geral: 'text-gray-400',
                    };
                    
                    if (conditionsInCategory.length === 0) return null;
                    
                    return (
                      <div key={category} className="mb-2 last:mb-0">
                        <p className={cn('px-3 py-1 text-xs font-medium', categoryInfo.color)}>
                          {categoryInfo.emoji} {categoryInfo.name}
                        </p>
                        {conditionsInCategory.map((condition) => (
                          <Tooltip key={condition.name} content={condition.description} side="right" contentClassName={tooltipTextColors[category]}>
                            <button
                              onClick={() => handleAddCondition(condition.name)}
                              className="w-full px-3 py-1.5 text-left text-sm text-foreground hover:bg-muted transition-colors"
                            >
                              {condition.name}
                            </button>
                          </Tooltip>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
