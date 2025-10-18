import React from 'react';
import { InventoryItem } from '../types';
import InventoryCard from './InventoryCard';
import { ImageIcon } from './icons/ImageIcon';
import { TrashIcon } from './icons/TrashIcon';

interface InventoryListProps {
  items: InventoryItem[];
  onItemClick: (item: InventoryItem) => void;
  onItemReview: (item: InventoryItem) => void;
  isLoading: boolean;
  sortOption: string;
  onSortChange: (value: string) => void;
  onClearAll: () => void;
}

const InventoryList: React.FC<InventoryListProps> = ({ items, onItemClick, onItemReview, isLoading, sortOption, onSortChange, onClearAll }) => {
  if (items.length === 0 && !isLoading) {
    return (
      <div className="text-center py-20 border-2 border-dashed border-slate-700 rounded-2xl">
        <ImageIcon className="mx-auto w-16 h-16 text-slate-600" />
        <h3 className="mt-4 text-xl font-semibold text-slate-300">No Items in Inventory</h3>
        <p className="mt-1 text-slate-400">Use the AI Agent to add your first item.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-xl font-semibold text-slate-300">Inventory Items ({items.length})</h2>
        <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <label htmlFor="sort-select" className="sr-only">Sort by:</label>
            <select 
              id="sort-select"
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
              aria-label="Sort inventory items"
            >
              <option value="date-desc">Date Added (Newest)</option>
              <option value="date-asc">Date Added (Oldest)</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="value-desc">Value (High-Low)</option>
              <option value="value-asc">Value (Low-High)</option>
            </select>
          </div>
          {items.length > 0 && (
            <button 
              onClick={onClearAll} 
              className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-900/40 rounded-md hover:bg-red-900/80 transition-colors"
              aria-label="Clear all inventory items"
            >
                <TrashIcon className="w-4 h-4" />
                Clear All
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <InventoryCard 
            key={item.id} 
            item={item} 
            onClick={() => onItemClick(item)}
            onReview={() => onItemReview(item)}
          />
        ))}
      </div>
    </div>
  );
};

export default InventoryList;