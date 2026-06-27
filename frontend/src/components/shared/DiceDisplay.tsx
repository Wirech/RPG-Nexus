import { cn } from '@/lib/utils';
import type { DiceValue } from '@/types';

interface DiceDisplayProps {
  value: DiceValue;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const diceColors: Record<DiceValue, string> = {
  d4: 'text-red-400 border-red-400/30',
  d6: 'text-orange-400 border-orange-400/30',
  d8: 'text-yellow-400 border-yellow-400/30',
  d12: 'text-green-400 border-green-400/30',
  d20: 'text-purple-400 border-purple-400/30',
};

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-12 h-12 text-sm',
  lg: 'w-16 h-16 text-base',
};

// Simple SVG dice shapes
function DiceShape({ value, className }: { value: DiceValue; className?: string }) {
  const commonProps = {
    className: cn('w-full h-full', className),
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
  };

  switch (value) {
    case 'd4':
      return (
        <svg {...commonProps}>
          <path d="M12 3L22 20H2L12 3Z" />
          <text x="12" y="16" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">4</text>
        </svg>
      );
    case 'd6':
      return (
        <svg {...commonProps}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">6</text>
        </svg>
      );
    case 'd8':
      return (
        <svg {...commonProps}>
          <path d="M12 2L22 12L12 22L2 12L12 2Z" />
          <text x="12" y="15" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">8</text>
        </svg>
      );
    case 'd12':
      return (
        <svg {...commonProps}>
          <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" />
          <text x="12" y="15" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">12</text>
        </svg>
      );
    case 'd20':
      return (
        <svg {...commonProps}>
          <polygon points="12,2 21,8 21,16 12,22 3,16 3,8" />
          <line x1="3" y1="8" x2="21" y2="8" />
          <line x1="3" y1="16" x2="21" y2="16" />
          <line x1="12" y1="2" x2="12" y2="22" />
          <text x="12" y="15" textAnchor="middle" fontSize="6" fill="currentColor" stroke="none">20</text>
        </svg>
      );
  }
}

export function DiceDisplay({
  value,
  label,
  size = 'md',
  onClick,
  className,
}: DiceDisplayProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'relative group',
        onClick && 'cursor-pointer',
        className
      )}
      title={label}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-lg border bg-surface/50 transition-all',
          diceColors[value],
          sizeClasses[size],
          onClick && 'hover:bg-surface hover:border-current'
        )}
      >
        <DiceShape value={value} />
      </div>
      
      {/* Tooltip */}
      {label && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-surface border border-border rounded text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {label}
        </div>
      )}
      
      {/* Value badge */}
      <span className={cn(
        'absolute -bottom-1 -right-1 px-1 rounded text-[10px] font-bold bg-surface border border-current',
        diceColors[value]
      )}>
        {value}
      </span>
    </div>
  );
}
