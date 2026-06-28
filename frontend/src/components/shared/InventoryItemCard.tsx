import { cn } from '@/lib/utils';
import type { InventoryItem, ItemCategory } from '../../types';

// Ícones por categoria
const categoryIcons: Record<ItemCategory, string> = {
  arma: '⚔️',
  proteção: '🛡️',
  escudo: '🔰',
  equipamento: '🎒',
  consumível: '🧪',
  misc: '📦',
};

const categoryLabels: Record<ItemCategory, string> = {
  arma: 'Arma',
  proteção: 'Proteção',
  escudo: 'Escudo',
  equipamento: 'Equipamento',
  consumível: 'Consumível',
  misc: 'Diversos',
};

const categoryColors: Record<ItemCategory, string> = {
  arma: 'text-red-400',
  proteção: 'text-blue-400',
  escudo: 'text-cyan-400',
  equipamento: 'text-yellow-400',
  consumível: 'text-green-400',
  misc: 'text-zinc-400',
};

interface InventoryItemCardProps {
  item: InventoryItem;
  onEdit?: () => void;
  onDelete?: () => void;
  onToggleEquip?: () => void;
  onUseCharge?: () => void;
  isAdmin?: boolean;
  compact?: boolean;
}

export function InventoryItemCard({
  item,
  onEdit,
  onDelete,
  onToggleEquip,
  onUseCharge,
  isAdmin,
  compact = false,
}: InventoryItemCardProps) {
  const category = (item.category as ItemCategory) || 'misc';
  const icon = categoryIcons[category];
  const categoryColor = categoryColors[category];

  // Para consumíveis com cargas
  const hasCharges = category === 'consumível' && item.cCharges !== null && item.cCharges !== undefined;

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 rounded-lg border bg-zinc-800/50 border-zinc-700 transition-colors',
          item.isEquipped && 'bg-green-900/20 border-green-700/50'
        )}
      >
        <span className="text-base">{icon}</span>
        <span className="flex-1 text-sm font-medium text-zinc-200 truncate">
          {item.name}
        </span>
        {item.quantity > 1 && (
          <span className="text-xs text-zinc-400">x{item.quantity}</span>
        )}
        {item.isEquipped && (
          <span className="text-xs text-green-400">Equipado</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'p-3 rounded-lg border bg-zinc-800/50 border-zinc-700 transition-colors',
        item.isEquipped && 'bg-green-900/20 border-green-700/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-lg">{icon}</span>
            <h4 className="font-medium text-zinc-200 truncate">{item.name}</h4>
            {item.quantity > 1 && (
              <span className="text-xs text-zinc-400 bg-zinc-700 px-1.5 py-0.5 rounded">
                x{item.quantity}
              </span>
            )}
            {item.isEquipped && (
              <span className="text-xs text-green-400 bg-green-500/20 px-1.5 py-0.5 rounded">
                Equipado
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span className={categoryColor}>{categoryLabels[category]}</span>
            {item.weight > 0 && (
              <>
                <span>•</span>
                <span>{item.weight} kg</span>
              </>
            )}
            {item.spaces > 0 && (
              <>
                <span>•</span>
                <span>{item.spaces} espaços</span>
              </>
            )}
            {item.inventoryLocation && (
              <>
                <span>•</span>
                <span style={{ color: item.inventoryLocation.color }}>
                  {item.inventoryLocation.icon} {item.inventoryLocation.name}
                </span>
              </>
            )}
            {item.locationCustomName && !item.inventoryLocation && (
              <>
                <span>•</span>
                <span>{item.locationCustomName}</span>
              </>
            )}
          </div>

          {/* Detalhes específicos por categoria */}
          {category === 'arma' && item.damage && (
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-red-400">{item.damage}</span>
              {item.damageType && <span className="text-zinc-500">({item.damageType})</span>}
              {item.weaponRange && <span className="text-zinc-500">• Alcance: {item.weaponRange}</span>}
              {item.criticalMargin && (
                <span className="text-zinc-500">
                  • Crítico: {item.criticalMargin}/{item.criticalMult || 2}x
                </span>
              )}
            </div>
          )}

          {category === 'proteção' && (item.defenseBonus || item.damageReduction) && (
            <div className="flex items-center gap-2 mt-1 text-xs">
              {item.defenseBonus && (
                <span className="text-blue-400">+{item.defenseBonus} Defesa</span>
              )}
              {item.damageReduction && (
                <span className="text-cyan-400">RD {item.damageReduction}</span>
              )}
              {item.pPenalty && (
                <span className="text-red-400">-{item.pPenalty} Penalidade</span>
              )}
            </div>
          )}

          {category === 'consumível' && (
            <div className="flex items-center gap-2 mt-1 text-xs">
              {hasCharges && (
                <span className={cn(
                  item.cCharges === 0 ? 'text-red-400' : 'text-green-400'
                )}>
                  {item.cCharges} cargas
                </span>
              )}
              {item.cEffect && <span className="text-zinc-400">{item.cEffect}</span>}
            </div>
          )}

          {item.description && (
            <p className="mt-2 text-sm text-zinc-400 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          {onToggleEquip && (
            <button
              onClick={onToggleEquip}
              className={cn(
                'p-1.5 rounded transition-colors',
                item.isEquipped
                  ? 'text-green-400 hover:bg-green-500/20'
                  : 'text-zinc-400 hover:bg-zinc-700'
              )}
              title={item.isEquipped ? 'Desequipar' : 'Equipar'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          {hasCharges && item.cCharges! > 0 && onUseCharge && (
            <button
              onClick={onUseCharge}
              className="p-1.5 text-purple-400 hover:bg-purple-500/20 rounded transition-colors"
              title="Usar uma carga"
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
