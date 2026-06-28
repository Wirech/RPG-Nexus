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

/**
 * Formata nome longo para "Primeiro N. S. Último"
 * Se o nome tiver 3+ palavras e mais de 25 caracteres, abrevia os nomes do meio
 */
function formatDisplayName(name: string): string {
  if (name.length <= 25) return name;
  
  const words = name.trim().split(/\s+/);
  if (words.length <= 2) return name;
  
  const first = words[0];
  const last = words[words.length - 1];
  const middle = words.slice(1, -1).map(w => `${w[0].toUpperCase()}.`).join(' ');
  
  return `${first} ${middle} ${last}`;
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
  const displayName = formatDisplayName(character.name);

  return (
    <Link
      to={`/characters/${character.id}`}
      className={cn(
        'flex flex-col bg-surface border border-border rounded-lg p-5 transition-all overflow-hidden h-[260px]',
        'hover:shadow-lg hover:-translate-y-1',
        groupColor && `hover:border-[${groupColor}]/50`,
        !groupColor && 'hover:border-accent/50',
        isDead && 'opacity-50',
        isUnconscious && !isDead && 'opacity-75'
      )}
      style={groupColor ? { '--hover-color': groupColor } as React.CSSProperties : undefined}
    >
      {/* Header - Token + Name side by side, fixed height for 3 lines */}
      <div className="flex items-center gap-4 h-[64px]">
        {/* Left: Token with hidden indicator */}
        <div className="relative flex-shrink-0">
          <TokenAvatar
            src={character.tokenImage}
            name={character.name}
            size="lg"
            objectPosition="top"
          />
          {isAdmin && !character.isRevealed && (
            <span className="absolute -bottom-1 -right-1 inline-flex items-center justify-center w-5 h-5 bg-muted border border-border rounded-full">
              <EyeOff size={12} className="text-muted-foreground" />
            </span>
          )}
        </div>
        
        {/* Right: Name - vertically centered */}
        <div className="flex-1 min-w-0 flex items-center">
          <h3 
            className="font-semibold text-foreground text-base leading-snug line-clamp-3"
            title={character.name}
          >
            {displayName}
          </h3>
        </div>
      </div>

      {/* Class & NEX - Below header, single line */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 truncate">
        {character.trilha && <span className="truncate">{character.trilha}</span>}
        {character.trilha && character.nex && <span className="flex-shrink-0">•</span>}
        {character.nex && <span className="flex-shrink-0">NEX {character.nex}</span>}
      </div>

      {/* Mini Vital Bars - Fixed position */}
      <div className="space-y-2 mt-3 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-8">PV</span>
          <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(pvPercent))}
              style={{ width: `${pvPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-14 text-right font-mono">
            {character.pvCurrent}/{character.pvMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-8">SAN</span>
          <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(sanPercent))}
              style={{ width: `${sanPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-14 text-right font-mono">
            {character.sanCurrent}/{character.sanMax}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground w-8">PE</span>
          <div className="flex-1 h-2.5 bg-background rounded-full overflow-hidden">
            <div
              className={cn('h-full transition-all', getBarColor(pePercent))}
              style={{ width: `${pePercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground w-14 text-right font-mono">
            {character.peCurrent}/{character.peMax}
          </span>
        </div>
      </div>

      {/* Conditions - Fixed at bottom */}
      <div className="h-[24px] mt-3 flex items-center">
        {character.conditions.length > 0 ? (
          <div className="flex flex-wrap gap-1 overflow-hidden">
            {character.conditions.slice(0, 4).map((condition) => (
              <ConditionBadge key={condition} condition={condition} />
            ))}
            {character.conditions.length > 4 && (
              <span className="text-xs text-muted-foreground px-1">
                +{character.conditions.length - 4}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground/50 italic">Sem condições</span>
        )}
      </div>
    </Link>
  );
}
