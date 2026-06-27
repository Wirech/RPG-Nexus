import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConditionType } from '@/types';

interface ConditionBadgeProps {
  condition: ConditionType | string;
  onRemove?: () => void;
  size?: 'sm' | 'md';
  className?: string;
}

const conditionColors: Record<string, string> = {
  // Condições críticas
  Morto: 'bg-gray-600 text-gray-200',
  Inconsciente: 'bg-gray-800 text-gray-300',
  
  // Condições de dano
  Sangrando: 'bg-red-600 text-red-100',
  
  // Condições de medo
  Abalado: 'bg-yellow-600 text-yellow-100',
  Apavorado: 'bg-yellow-700 text-yellow-100',
  
  // Condições de controle
  Atordoado: 'bg-orange-600 text-orange-100',
  Confuso: 'bg-orange-500 text-orange-100',
  Fascinado: 'bg-pink-500 text-pink-100',
  Paralisado: 'bg-blue-600 text-blue-100',
  
  // Condições sensoriais
  Cego: 'bg-slate-700 text-slate-200',
  Surdo: 'bg-slate-600 text-slate-200',
  
  // Condições de movimento
  Imóvel: 'bg-indigo-600 text-indigo-100',
  Lento: 'bg-indigo-500 text-indigo-100',
  
  // Condições de debuff
  Alquebrado: 'bg-purple-700 text-purple-100',
  Debilitado: 'bg-purple-600 text-purple-100',
  Desprevenido: 'bg-purple-500 text-purple-100',
  Exausto: 'bg-amber-700 text-amber-100',
  Fraco: 'bg-amber-600 text-amber-100',
  Pressionado: 'bg-violet-600 text-violet-100',
  Vulnerável: 'bg-rose-600 text-rose-100',
};

const defaultColor = 'bg-purple-800 text-purple-200';

export function ConditionBadge({
  condition,
  onRemove,
  size = 'md',
  className,
}: ConditionBadgeProps) {
  const colorClass = conditionColors[condition] || defaultColor;

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium transition-all',
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
}
