import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONDITIONS_MAP } from '@/data/conditions';
import { Tooltip } from './Tooltip';
import type { ConditionType } from '@/types';

interface ConditionBadgeProps {
  condition: ConditionType | string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

// Cores por categoria (estilo sólido original)
const categoryColors: Record<string, string> = {
  medo: 'bg-red-600 text-red-100',
  mental: 'bg-orange-600 text-orange-100',
  paralisia: 'bg-blue-600 text-blue-100',
  sentidos: 'bg-yellow-600 text-yellow-100',
  fadiga: 'bg-green-600 text-green-100',
  geral: 'bg-gray-600 text-gray-200',
};

// Cores do texto do tooltip por categoria
const tooltipTextColors: Record<string, string> = {
  medo: 'text-red-400',
  mental: 'text-orange-400',
  paralisia: 'text-blue-400',
  sentidos: 'text-yellow-400',
  fadiga: 'text-green-400',
  geral: 'text-gray-400',
};

export function ConditionBadge({
  condition,
  onRemove,
  size = 'md',
  className,
}: ConditionBadgeProps) {
  const conditionInfo = CONDITIONS_MAP[condition as ConditionType];
  const colorClass = conditionInfo ? categoryColors[conditionInfo.category] : 'bg-purple-600 text-purple-100';
  const tooltipColor = conditionInfo ? tooltipTextColors[conditionInfo.category] : 'text-purple-400';
  const description = conditionInfo?.description || '';

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  };

  const badge = (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-all whitespace-nowrap cursor-default',
        colorClass,
        sizeClasses[size],
        onRemove && 'pr-1',
        className
      )}
    >
      {condition}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-black/20 transition-colors"
          aria-label={`Remover ${condition}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );

  if (!description) return badge;

  return (
    <Tooltip content={description} contentClassName={tooltipColor}>
      {badge}
    </Tooltip>
  );
}
