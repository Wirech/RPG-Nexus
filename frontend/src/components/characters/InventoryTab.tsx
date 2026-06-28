import { useState, useEffect, useCallback } from 'react';
import { InventoryItemCard } from '../shared';
import { ConfirmDialog } from '../shared';
import type { Character, InventoryItem, InventoryLocation, ItemCategory } from '../../types';
import {
  getCharacterInventory,
  getInventoryLocations,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryLocation,
  deleteInventoryLocation,
} from '../../services/characterDetailApi';
import { cn } from '@/lib/utils';

interface InventoryTabProps {
  character: Character;
  isAdmin: boolean;
  onRefresh?: () => void;
}

type ViewMode = 'list' | 'byLocation' | 'byCategory';

const categoryOrder: ItemCategory[] = ['arma', 'proteção', 'escudo', 'equipamento', 'consumível', 'misc'];

export function InventoryTab({ character, isAdmin, onRefresh }: InventoryTabProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | ''>('');
  const [showEquippedOnly, setShowEquippedOnly] = useState(false);

  // Diálogos
  const [deleteConfirm, setDeleteConfirm] = useState<InventoryItem | null>(null);
  const [showCreateItem, setShowCreateItem] = useState(false);
  const [showCreateLocation, setShowCreateLocation] = useState(false);
  const [deleteLocationConfirm, setDeleteLocationConfirm] = useState<InventoryLocation | null>(null);

  // Form state para criar item rápido
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<ItemCategory>('misc');
  const [newItemQuantity, setNewItemQuantity] = useState(1);

  // Form state para criar local
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationIcon, setNewLocationIcon] = useState('📦');
  const [newLocationColor, setNewLocationColor] = useState('#6b7280');

  // Carregar dados
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsData, locationsData] = await Promise.all([
        getCharacterInventory(character.id),
        getInventoryLocations(character.id),
      ]);
      setItems(itemsData);
      setLocations(locationsData);
    } catch (error) {
      console.error('Erro ao carregar inventário:', error);
    } finally {
      setLoading(false);
    }
  }, [character.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handlers de itens
  const handleToggleEquip = async (item: InventoryItem) => {
    try {
      await updateInventoryItem(character.id, item.id, { isEquipped: !item.isEquipped });
      await loadData();
    } catch (error) {
      console.error('Erro ao equipar/desequipar:', error);
    }
  };

  const handleUseCharge = async (item: InventoryItem) => {
    if (!item.cCharges || item.cCharges <= 0) return;
    try {
      await updateInventoryItem(character.id, item.id, { cCharges: item.cCharges - 1 });
      await loadData();
    } catch (error) {
      console.error('Erro ao usar carga:', error);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryItem(character.id, deleteConfirm.id);
      setDeleteConfirm(null);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao remover item:', error);
    }
  };

  const handleCreateQuickItem = async () => {
    if (!newItemName.trim()) return;
    try {
      await createInventoryItem(character.id, {
        name: newItemName.trim(),
        category: newItemCategory,
        quantity: newItemQuantity,
      });
      setNewItemName('');
      setNewItemQuantity(1);
      setShowCreateItem(false);
      await loadData();
      onRefresh?.();
    } catch (error) {
      console.error('Erro ao criar item:', error);
    }
  };

  // Handlers de locais
  const handleCreateLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      await createInventoryLocation(character.id, {
        name: newLocationName.trim(),
        icon: newLocationIcon,
        color: newLocationColor,
      });
      setNewLocationName('');
      setNewLocationIcon('📦');
      setNewLocationColor('#6b7280');
      setShowCreateLocation(false);
      await loadData();
    } catch (error) {
      console.error('Erro ao criar local:', error);
    }
  };

  const handleDeleteLocation = async () => {
    if (!deleteLocationConfirm) return;
    try {
      await deleteInventoryLocation(character.id, deleteLocationConfirm.id);
      setDeleteLocationConfirm(null);
      await loadData();
    } catch (error) {
      console.error('Erro ao remover local:', error);
    }
  };

  // Filtrar itens
  const filteredItems = items.filter((item) => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (showEquippedOnly && !item.isEquipped) return false;
    return true;
  });

  // Agrupar por local
  const itemsByLocation = filteredItems.reduce((acc, item) => {
    const key = item.inventoryLocation?.name || item.locationCustomName || 'Sem local';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Agrupar por categoria
  const itemsByCategory = filteredItems.reduce((acc, item) => {
    const key = item.category || 'misc';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  // Calcular estatísticas
  const totalWeight = filteredItems.reduce((sum, i) => sum + (i.weight * i.quantity), 0);
  const totalSpaces = filteredItems.reduce((sum, i) => sum + (i.spaces * i.quantity), 0);
  const equippedCount = filteredItems.filter((i) => i.isEquipped).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Estatísticas */}
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-400">
              <span className="text-zinc-200 font-medium">{filteredItems.length}</span> itens
            </span>
            <span className="text-zinc-400">
              <span className="text-zinc-200 font-medium">{totalSpaces}</span>/{character.espacosInventario} espaços
            </span>
            <span className="text-zinc-400">
              <span className="text-zinc-200 font-medium">{totalWeight.toFixed(1)}</span> kg
            </span>
            <span className="text-green-400">
              <span className="font-medium">{equippedCount}</span> equipados
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Modo de visualização */}
          <div className="flex items-center bg-zinc-800 rounded-lg">
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-l-lg transition-colors',
                viewMode === 'list' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-400'
              )}
            >
              Lista
            </button>
            <button
              onClick={() => setViewMode('byLocation')}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                viewMode === 'byLocation' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-400'
              )}
            >
              Por Local
            </button>
            <button
              onClick={() => setViewMode('byCategory')}
              className={cn(
                'px-3 py-1.5 text-sm rounded-r-lg transition-colors',
                viewMode === 'byCategory' ? 'bg-zinc-700 text-zinc-200' : 'text-zinc-400'
              )}
            >
              Por Categoria
            </button>
          </div>
        </div>
      </div>

      {/* Filtros e ações */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Buscar item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as ItemCategory | '')}
          className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200"
        >
          <option value="">Todas categorias</option>
          <option value="arma">Armas</option>
          <option value="proteção">Proteções</option>
          <option value="escudo">Escudos</option>
          <option value="equipamento">Equipamentos</option>
          <option value="consumível">Consumíveis</option>
          <option value="misc">Diversos</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showEquippedOnly}
            onChange={(e) => setShowEquippedOnly(e.target.checked)}
            className="rounded bg-zinc-800 border-zinc-600"
          />
          Apenas equipados
        </label>

        <div className="flex-1" />

        {isAdmin && (
          <>
            <button
              onClick={() => setShowCreateLocation(true)}
              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg text-sm transition-colors"
            >
              + Local
            </button>
            <button
              onClick={() => setShowCreateItem(true)}
              className="px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              + Item
            </button>
          </>
        )}
      </div>

      {/* Locais de inventário */}
      {viewMode === 'byLocation' && locations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-800 rounded-lg border"
              style={{ borderColor: loc.color }}
            >
              <span>{loc.icon}</span>
              <span className="text-sm text-zinc-200">{loc.name}</span>
              <span className="text-xs text-zinc-500">
                ({itemsByLocation[loc.name]?.length || 0})
              </span>
              {isAdmin && (
                <button
                  onClick={() => setDeleteLocationConfirm(loc)}
                  className="text-zinc-500 hover:text-red-400 ml-1"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lista de itens */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {filteredItems.map((item) => (
            <InventoryItemCard
              key={item.id}
              item={item}
              isAdmin={isAdmin}
              onToggleEquip={() => handleToggleEquip(item)}
              onUseCharge={() => handleUseCharge(item)}
              onDelete={() => setDeleteConfirm(item)}
            />
          ))}
        </div>
      )}

      {viewMode === 'byLocation' && (
        <div className="space-y-6">
          {Object.entries(itemsByLocation).map(([location, locationItems]) => (
            <div key={location}>
              <h3 className="text-lg font-semibold text-zinc-200 mb-3">{location}</h3>
              <div className="space-y-2">
                {locationItems.map((item) => (
                  <InventoryItemCard
                    key={item.id}
                    item={item}
                    isAdmin={isAdmin}
                    onToggleEquip={() => handleToggleEquip(item)}
                    onUseCharge={() => handleUseCharge(item)}
                    onDelete={() => setDeleteConfirm(item)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {viewMode === 'byCategory' && (
        <div className="space-y-6">
          {categoryOrder.map((cat) => {
            const catItems = itemsByCategory[cat];
            if (!catItems?.length) return null;
            return (
              <div key={cat}>
                <h3 className="text-lg font-semibold text-zinc-200 mb-3 capitalize">{cat}</h3>
                <div className="space-y-2">
                  {catItems.map((item) => (
                    <InventoryItemCard
                      key={item.id}
                      item={item}
                      isAdmin={isAdmin}
                      onToggleEquip={() => handleToggleEquip(item)}
                      onUseCharge={() => handleUseCharge(item)}
                      onDelete={() => setDeleteConfirm(item)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filteredItems.length === 0 && (
        <div className="text-center py-8 text-zinc-500">
          Nenhum item encontrado.
        </div>
      )}

      {/* Modal criar item rápido */}
      {showCreateItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Adicionar Item</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Nome do item"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Categoria</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value as ItemCategory)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                  >
                    <option value="arma">Arma</option>
                    <option value="proteção">Proteção</option>
                    <option value="escudo">Escudo</option>
                    <option value="equipamento">Equipamento</option>
                    <option value="consumível">Consumível</option>
                    <option value="misc">Diversos</option>
                  </select>
                </div>
                <div className="w-24">
                  <label className="block text-sm text-zinc-400 mb-1">Qtd</label>
                  <input
                    type="number"
                    value={newItemQuantity}
                    onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateItem(false)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateQuickItem}
                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal criar local */}
      {showCreateLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-zinc-200 mb-4">Criar Local</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Nome</label>
                <input
                  type="text"
                  value={newLocationName}
                  onChange={(e) => setNewLocationName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  placeholder="Ex: Bolso secreto"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Ícone</label>
                  <input
                    type="text"
                    value={newLocationIcon}
                    onChange={(e) => setNewLocationIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-center"
                    maxLength={2}
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-zinc-400 mb-1">Cor</label>
                  <input
                    type="color"
                    value={newLocationColor}
                    onChange={(e) => setNewLocationColor(e.target.value)}
                    className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateLocation(false)}
                className="px-4 py-2 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateLocation}
                className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white rounded-lg transition-colors"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Diálogos de confirmação */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Remover Item"
        description={`Deseja remover "${deleteConfirm?.name}" do inventário?`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleDeleteItem}
        variant="danger"
      />

      <ConfirmDialog
        open={!!deleteLocationConfirm}
        onOpenChange={(open) => !open && setDeleteLocationConfirm(null)}
        title="Remover Local"
        description={`Deseja remover o local "${deleteLocationConfirm?.name}"? Os itens serão movidos para "Sem local".`}
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleDeleteLocation}
        variant="danger"
      />
    </div>
  );
}
