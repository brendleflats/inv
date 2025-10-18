// FIX: This file was placeholder content. Implemented the InventoryCard component.
import React from 'react';
import { InventoryItem } from '../types';
import ConfidenceBadge from './ConfidenceBadge';
import { ImageIcon } from './icons/ImageIcon';
import { WandIcon } from './icons/WandIcon';

interface InventoryCardProps {
  item: InventoryItem;
  onClick: () => void;
  onReview: () => void;
}

const StatusBadge: React.FC<{ status: InventoryItem['status'] }> = ({ status }) => {
    const statusStyles = {
        Available: 'bg-slate-600 text-slate-200',
        Listed: 'bg-blue-500 text-white',
        Sold: 'bg-green-500 text-white',
    };
    return (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[status]}`}>
            {status}
        </span>
    );
};

const InventoryCard: React.FC<InventoryCardProps> = ({ item, onClick, onReview }) => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  
  const handleReviewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onReview();
  }

  return (
    <div 
      className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 hover:border-cyan-500 hover:shadow-cyan-500/10 transition-all duration-300 group flex flex-col"
      onClick={onClick}
    >
      <div className="relative aspect-video bg-slate-700 cursor-pointer">
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
        ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
                <ImageIcon className="w-16 h-16"/>
            </div>
        )}
        <div className="absolute top-2 right-2">
            <ConfidenceBadge score={item.confidence} />
        </div>
         <div className="absolute top-2 left-2">
            <StatusBadge status={item.status} />
        </div>
      </div>
      <div className="p-4 flex-grow flex flex-col cursor-pointer">
        <h3 className="text-lg font-bold text-slate-100 truncate group-hover:text-cyan-400 transition-colors">{item.name}</h3>
        <p className="text-sm text-slate-400 mb-3">{item.brand}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-xs font-mono text-slate-500">{item.condition}</span>
          <span className="text-2xl font-semibold text-white">{formatter.format(item.listingPrice)}</span>
        </div>
      </div>
       <div className="p-2 bg-slate-800/50 border-t border-slate-700/50">
           <button 
                onClick={handleReviewClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-indigo-300 bg-indigo-900/40 rounded-md hover:bg-indigo-900/80 transition-colors"
           >
                <WandIcon className="w-4 h-4" />
                Review with AI
           </button>
       </div>
    </div>
  );
};

export default InventoryCard;