import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Minus, Plus } from 'lucide-react';

interface VitalBarProps {
  label: string;
  current: number;
  max: number;
  color?: 'red' | 'blue' | 'purple' | 'auto';
  showNumbers?: boolean;
  onMinus?: () => void;
  onPlus?: () => void;
  onEdit?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VitalBar({
  label,
  current,
  max,
  color = 'auto',
  showNumbers = true,
  onMinus,
  onPlus,
  onEdit,
  size = 'md',
  className,
}: VitalBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(current.toString());
  const [flash, setFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevCurrentRef = useRef(current);

  // Flash effect when value changes
  useEffect(() => {
    if (current !== prevCurrentRef.current) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 300);
      prevCurrentRef.current = current;
      return () => clearTimeout(timeout);
    }
  }, [current]);

  // Focus input when editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const percentage = max > 0 ? (current / max) * 100 : 0;

  const getAutoColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const colorClasses: Record<string, string> = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    auto: getAutoColor(),
  };

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const handleEdit = () => {
    if (onEdit) {
      setIsEditing(true);
      setEditValue(current.toString());
    }
  };

  const handleEditSubmit = () => {
    const newValue = parseInt(editValue, 10);
    if (!isNaN(newValue) && onEdit) {
      onEdit(Math.max(0, Math.min(max, newValue)));
    }
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Label */}
      <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">
        {label}
      </span>

      {/* Minus button */}
      {onMinus && (
        <button
          onClick={onMinus}
          className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Diminuir ${label}`}
        >
          <Minus className="w-3 h-3" />
        </button>
      )}

      {/* Progress bar container */}
      <div className="flex-1 flex items-center gap-2">
        <div
          className={cn(
            'flex-1 bg-surface rounded-full overflow-hidden transition-all',
            sizeClasses[size],
            flash && 'ring-2 ring-accent ring-offset-1 ring-offset-background'
          )}
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300 ease-out',
              colorClasses[color]
            )}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Numbers */}
        {showNumbers && (
          <div className="text-xs font-mono text-muted-foreground shrink-0 min-w-[50px] text-right">
            {isEditing ? (
              <input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleEditSubmit}
                onKeyDown={handleEditKeyDown}
                className="w-10 bg-surface border border-border rounded px-1 text-center text-foreground"
                min={0}
                max={max}
              />
            ) : (
              <span
                onClick={handleEdit}
                className={cn(
                  'transition-colors',
                  onEdit && 'cursor-pointer hover:text-foreground'
                )}
              >
                {current}/{max}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Plus button */}
      {onPlus && (
        <button
          onClick={onPlus}
          className="p-1 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Aumentar ${label}`}
        >
          <Plus className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
