import { cn } from '@/lib/utils';
import type { CharacterAbility, AbilityCompendium, RitualCompendium, ElementType } from '../../types';

// Cores dos elementos
const elementColors: Record<ElementType, { bg: string; text: string; border: string }> = {
  Sangue: { bg: 'bg-red-900/30', text: 'text-red-400', border: 'border-red-700' },
  Morte: { bg: 'bg-zinc-800/50', text: 'text-zinc-300', border: 'border-zinc-600' },
  Energia: { bg: 'bg-yellow-900/30', text: 'text-yellow-400', border: 'border-yellow-700' },
  Conhecimento: { bg: 'bg-blue-900/30', text: 'text-blue-400', border: 'border-blue-700' },
  Medo: { bg: 'bg-purple-900/30', text: 'text-purple-400', border: 'border-purple-700' },
};

// Ícones de tipo de ação
const actionTypeIcons: Record<string, string> = {
  passiva: '○',
  acao_padrao: '●',
  acao_movimento: '◐',
  reacao: '◆',
  acao_completa: '◉',
};

const actionTypeLabels: Record<string, string> = {
  passiva: 'Passiva',
  acao_padrao: 'Ação Padrão',
  acao_movimento: 'Ação de Movimento',
  reacao: 'Reação',
  acao_completa: 'Ação Completa',
};

interface AbilityCardProps {
  ability: CharacterAbility;
  onEdit?: () => void;
  onDelete?: () => void;
  onUse?: () => void;
  isAdmin?: boolean;
  compact?: boolean;
}

export function AbilityCard({
  ability,
  onEdit,
  onDelete,
  onUse,
  isAdmin,
  compact = false,
}: AbilityCardProps) {
  // Determinar nome e descrição (com override)
  const displayName = ability.nameOverride || ability.name;
  const displayDescription = ability.descriptionOverride || ability.description;
  const displayPeCost = ability.peCostOverride ?? ability.peCost ?? 0;

  // Determinar se é ritual e obter elemento
  const isRitual = ability.type === 'ritual';
  const element = ability.element as ElementType | undefined;
  const elementStyle = element ? elementColors[element] : null;

  // Verificar se tem limite de usos
  const usesPerScene = ability.usesPerScene || ability.compendiumAbility?.usesPerScene;
  const hasUses = usesPerScene && usesPerScene > 0;
  const remainingUses = hasUses ? usesPerScene - (ability.currentUses || 0) : null;

  const actionType = ability.actionType || 'passiva';

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border transition-colors',
          elementStyle ? elementStyle.bg : 'bg-zinc-800/50',
          elementStyle ? elementStyle.border : 'border-zinc-700',
          !ability.isActive && 'opacity-50'
        )}
      >
        <span className={cn('text-sm', elementStyle?.text || 'text-zinc-400')}>
          {actionTypeIcons[actionType]}
        </span>
        <span className="flex-1 text-sm font-medium text-zinc-200 truncate">
          {displayName}
        </span>
        {displayPeCost > 0 && (
          <span className="text-xs text-purple-400">{displayPeCost} PE</span>
        )}
        {hasUses && (
          <span className={cn(
            'text-xs',
            remainingUses === 0 ? 'text-red-400' : 'text-zinc-400'
          )}>
            {remainingUses}/{usesPerScene}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border transition-colors',
        elementStyle ? elementStyle.bg : 'bg-zinc-800/50',
        elementStyle ? elementStyle.border : 'border-zinc-700',
        !ability.isActive && 'opacity-50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm', elementStyle?.text || 'text-zinc-400')}>
              {actionTypeIcons[actionType]}
            </span>
            <h4 className="font-medium text-zinc-200 truncate">{displayName}</h4>
            {isRitual && element && (
              <span className={cn('text-xs px-1.5 py-0.5 rounded', elementStyle?.bg, elementStyle?.text)}>
                {element}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>{actionTypeLabels[actionType]}</span>
            {displayPeCost > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-400">{displayPeCost} PE</span>
              </>
            )}
            {hasUses && (
              <>
                <span>•</span>
                <span className={remainingUses === 0 ? 'text-red-400' : ''}>
                  {remainingUses}/{usesPerScene} usos
                </span>
              </>
            )}
            {ability.trilha && (
              <>
                <span>•</span>
                <span>{ability.trilha}</span>
              </>
            )}
          </div>

          {displayDescription && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
              {displayDescription}
            </p>
          )}

          {ability.notes && (
            <p className="mt-1 text-xs text-zinc-500 italic">
              Nota: {ability.notes}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasUses && remainingUses !== null && remainingUses > 0 && onUse && (
            <button
              onClick={onUse}
              className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors"
              title="Usar habilidade"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </button>
          )}
          {isAdmin && onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-zinc-400 hover:bg-zinc-700 rounded transition-colors"
              title="Editar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {isAdmin && onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-red-400 hover:bg-red-500/20 rounded transition-colors"
              title="Remover"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Card para exibir habilidade do compêndio
// ─────────────────────────────────────────

interface CompendiumAbilityCardProps {
  ability: AbilityCompendium;
  onAdd?: () => void;
  isAdded?: boolean;
}

export function CompendiumAbilityCard({ ability, onAdd, isAdded }: CompendiumAbilityCardProps) {
  const actionType = ability.actionType || 'passiva';

  return (
    <div className="p-3 rounded-lg border bg-zinc-800/50 border-zinc-700">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-400">
              {actionTypeIcons[actionType]}
            </span>
            <h4 className="font-medium text-zinc-200">{ability.name}</h4>
            {ability.trilha && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-400">
                {ability.trilha}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span>{actionTypeLabels[actionType]}</span>
            {ability.peCost > 0 && (
              <>
                <span>•</span>
                <span className="text-purple-400">{ability.peCost} PE</span>
              </>
            )}
            {ability.usesPerScene && (
              <>
                <span>•</span>
                <span>{ability.usesPerScene}x/cena</span>
              </>
            )}
            {ability.nex && (
              <>
                <span>•</span>
                <span>NEX {ability.nex}</span>
              </>
            )}
          </div>

          {ability.description && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-3">
              {ability.description}
            </p>
          )}
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            disabled={isAdded}
            className={cn(
              'p-2 rounded transition-colors',
              isAdded
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
            )}
            title={isAdded ? 'Já adicionada' : 'Adicionar ao personagem'}
          >
            {isAdded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Card para exibir ritual do compêndio
// ─────────────────────────────────────────

interface CompendiumRitualCardProps {
  ritual: RitualCompendium;
  onAdd?: () => void;
  isAdded?: boolean;
}

export function CompendiumRitualCard({ ritual, onAdd, isAdded }: CompendiumRitualCardProps) {
  const element = ritual.element as ElementType;
  const elementStyle = elementColors[element];

  return (
    <div className={cn(
      'p-3 rounded-lg border',
      elementStyle.bg,
      elementStyle.border
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-xs px-1.5 py-0.5 rounded', elementStyle.bg, elementStyle.text)}>
              {element}
            </span>
            <h4 className="font-medium text-zinc-200">{ritual.name}</h4>
            <span className="text-xs text-zinc-500">
              {ritual.circle}º Círculo
            </span>
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span className="text-purple-400">{ritual.peCost} PE</span>
            <span>•</span>
            <span>{ritual.executionTime}</span>
            <span>•</span>
            <span>{ritual.range}</span>
            {ritual.resistance && ritual.resistance !== 'nenhuma' && (
              <>
                <span>•</span>
                <span>Resist: {ritual.resistance}</span>
              </>
            )}
          </div>

          {ritual.description && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
              {ritual.description}
            </p>
          )}
        </div>

        {onAdd && (
          <button
            onClick={onAdd}
            disabled={isAdded}
            className={cn(
              'p-2 rounded transition-colors',
              isAdded
                ? 'bg-green-500/20 text-green-400 cursor-default'
                : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30'
            )}
            title={isAdded ? 'Já adicionado' : 'Adicionar ao personagem'}
          >
            {isAdded ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
