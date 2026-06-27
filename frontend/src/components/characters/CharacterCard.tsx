import { Link } from 'react-router-dom';
import { EyeOff } from 'lucide-react';
import { TokenAvatar, ConditionBadge } from '@/components/shared';
import { cn } from '@/lib/utils';
import type { Character } from '@/types';

interface CharacterCardProps {
  character: Character;
  isAdmin?: boolean;
  groupColor?: string;
}

export function CharacterCard({ character, isAdmin, groupColor }: CharacterCardProps) {
  const pvPercent = character.pvMax > 0 ? (character.pvCurrent / character.pvMax) * 100 : 100;
  const sanPercent = character.sanMax > 0 ? (character.sanCurrent / character.sanMax) * 100 : 100;
  const pePercent = character.peMax > 0 ? (character.peCurrent / character.peMax) * 100 : 100;

  const getBarColor = (percent: number) => {
    if (percent > 50) return 'bg-success';
    if (percent > 25) return 'bg-warning';
    return 'bg-danger';
  };

  const isDead = character.conditions.includes('Morto');
  const isUnconscious = character.conditions.includes('Inconsciente') || character.pvCurrent === 0;

  return (
    <Link
      to={`/characters/${character.id}`}
      className={cn(
        'block bg-surface border border-border rounded-lg p-4 transition-all',
        'hover:shadow-lg hover:-translate-y-1',
        groupColor && `hover:border-[${groupColor}]/50`,
        !groupColor && 'hover:border-accent/50',
        isDead && 'opacity-50',
        isUnconscious && !isDead && 'opacity-75'
      )}
      style={groupColor ? { '--hover-color': groupColor } as React.CSSProperties : undefined}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <TokenAvatar
          src={character.tokenImage}
          name={character.name}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{character.name}</h3>
            {isAdmin && !character.isRevealed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground">
                <EyeOff size={12} />
                Oculto
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {character.trilha && <span>{character.trilha}</span>}
            {character.trilha && character.nex && <span>•</span>}
            {character.nex && <span>NEX {character.nex}</span>}
          </div>
        </div>
      </div>

      {/* Mini Vital Bars */}
      <div className="space-y-1.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">PV</span>
          <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(pvPercent))}
              style={{ width: `${pvPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {character.pvCurrent}/{character.pvMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">SAN</span>
          <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(sanPercent))}
              style={{ width: `${sanPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {character.sanCurrent}/{character.sanMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-8">PE</span>
          <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(pePercent))}
              style={{ width: `${pePercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-12 text-right">
            {character.peCurrent}/{character.peMax}
          </span>
        </div>
      </div>

      {/* Conditions */}
      {character.conditions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {character.conditions.slice(0, 3).map((condition) => (
            <ConditionBadge key={condition} condition={condition} />
          ))}
          {character.conditions.length > 3 && (
            <span className="text-xs text-muted-foreground px-1">
              +{character.conditions.length - 3}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
