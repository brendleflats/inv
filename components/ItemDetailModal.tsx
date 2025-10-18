import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem } from '../types';
import { TrashIcon } from './icons/TrashIcon';
import { CopyIcon } from './icons/CopyIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ImageIcon } from './icons/ImageIcon';
import Loader from './Loader';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';
import ConfirmationModal from './ConfirmationModal';

interface ItemDetailModalProps {
  item: InventoryItem;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
  onDelete: (itemId: string) => void;
  onReanalyze: (item: InventoryItem) => Promise<void>;
  onGenerateListing: (item: InventoryItem) => Promise<void>;
}

const ItemDetailModal: React.FC<ItemDetailModalProps> = ({ item, onClose, onSave, onDelete, onReanalyze, onGenerateListing }) => {
  const [editedItem, setEditedItem] = useState<InventoryItem>(item);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditedItem(item);
  }, [item]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedItem(prev => ({
      ...prev!,
      [name]: (name === 'listingPrice' || name === 'confidence' || name === 'estimatedValue') ? Number(value) : value,
    }));
  };
  
  const handleSave = () => {
    onSave(editedItem);
    onClose();
  };

  const handleDeleteClick = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    onDelete(item.id);
  };

  const handleCopyToClipboard = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [key]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [key]: false })), 2000);
  };

  const handleImage2Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setEditedItem(prev => ({ ...prev!, image2: event.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReanalyzeClick = async () => {
      setIsReanalyzing(true);
      await onReanalyze(editedItem);
      setIsReanalyzing(false);
  };
  
  const handleGenerateListingClick = async () => {
      setIsGenerating(true);
      await onGenerateListing(editedItem);
      setIsGenerating(false);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden an_modal" onClick={(e) => e.stopPropagation()}>
          <style>{`.an_modal { animation: modal-in 0.3s ease-out forwards; } @keyframes modal-in { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
          
          {/* Image Column */}
          <div className="md:w-1/2 p-6 flex flex-col gap-4 bg-slate-900/50">
            <div className="aspect-video w-full rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center">
              {editedItem.image ? <img src={editedItem.image} alt={editedItem.name} className="w-full h-full object-contain" /> : <ImageIcon className="w-24 h-24 text-slate-700"/> }
            </div>
            <div className="aspect-video w-full rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center relative">
              {editedItem.image2 ? (
                  <img src={editedItem.image2} alt="Detail view" className="w-full h-full object-contain" />
              ) : (
                  <div className="text-center text-slate-500">
                      <ImageIcon className="w-16 h-16 mx-auto"/>
                      <p className="text-sm mt-2">Add detail photo (e.g., nameplate)</p>
                  </div>
              )}
              <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  {editedItem.image2 ? 'Change Photo' : 'Upload Photo'}
              </button>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImage2Upload} className="hidden" />
            </div>
            <button onClick={handleReanalyzeClick} disabled={isReanalyzing} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400">
              {isReanalyzing ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
              {isReanalyzing ? 'Analyzing...' : 'Re-analyze with AI'}
            </button>
          </div>

          {/* Details Column */}
          <div className="md:w-1/2 flex flex-col p-6 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start">
              <input name="name" value={editedItem.name} onChange={handleChange} className="w-full text-2xl font-bold bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors py-1"/>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <label className="text-xs text-slate-400 font-semibold">Listing Price (USD)</label>
                    <input name="listingPrice" type="number" value={editedItem.listingPrice} onChange={handleChange} className="w-full font-semibold bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors py-1"/>
                </div>
                <div>
                    <label className="text-xs text-slate-400 font-semibold">AI Value Est.</label>
                    <p className="py-1 font-semibold text-slate-300">${editedItem.estimatedValue}</p>
                </div>
                <div>
                    <label className="text-xs text-slate-400 font-semibold">Status</label>
                    <select name="status" value={editedItem.status} onChange={handleChange} className="w-full font-semibold bg-slate-900 border border-slate-700 rounded-md p-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors">
                        <option>Available</option><option>Listed</option><option>Sold</option>
                    </select>
                </div>
                <div>
                    <label className="text-xs text-slate-400 font-semibold">Brand</label>
                    <input name="brand" value={editedItem.brand} onChange={handleChange} className="w-full font-semibold bg-transparent border-b-2 border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors py-1"/>
                </div>
                <div className="col-span-2">
                    <label className="text-xs text-slate-400 font-semibold">Condition</label>
                    <select name="condition" value={editedItem.condition} onChange={handleChange} className="w-full font-semibold bg-slate-900 border border-slate-700 rounded-md p-1 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors">
                        <option>New</option><option>Like New</option><option>Used</option><option>For Parts</option>
                    </select>
                </div>
            </div>

            {(editedItem.status === 'Listed' || editedItem.status === 'Sold') && (
              <div>
                  <label className="text-xs text-slate-400 font-semibold">Marketplace URL</label>
                  <input name="listingUrl" value={editedItem.listingUrl || ''} onChange={handleChange} placeholder="https://marketplace.com/..." className="w-full font-mono text-sm bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"/>
              </div>
            )}
            
            {editedItem.conditionDetails.length > 0 && <div>
                  <label className="text-xs text-slate-400 font-semibold">AI Condition Notes</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                      {editedItem.conditionDetails.map((detail, i) => <span key={i} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded-md">{detail}</span>)}
                  </div>
            </div>}

            {/* Pricing Research */}
              {editedItem.groundingChunks && editedItem.groundingChunks.length > 0 && (
                  <div className="space-y-2 pt-2">
                      <h3 className="text-sm font-semibold text-slate-300">Pricing Research (from Google Search)</h3>
                      <div className="bg-slate-900/50 border border-slate-700 rounded-md p-2 space-y-1 max-h-24 overflow-y-auto">
                          {editedItem.groundingChunks.map((chunk, i) => (
                            <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" key={i} className="flex items-center gap-2 text-xs text-cyan-400 hover:underline truncate">
                                <ExternalLinkIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{chunk.web.title}</span>
                            </a>
                          ))}
                      </div>
                  </div>
              )}

            {/* AI Marketplace Listing */}
            <div className="space-y-2 pt-2">
              <h3 className="text-lg font-semibold text-slate-300">Marketplace Listing</h3>
              {editedItem.marketplaceListing ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="flex justify-between items-center mb-1"><label className="text-xs text-slate-400">Title</label><button onClick={() => handleCopyToClipboard('title', editedItem.marketplaceListing!.title)} className="text-xs text-cyan-400 flex items-center gap-1"><CopyIcon className="w-3 h-3"/>{copiedStates['title'] ? 'Copied!' : 'Copy'}</button></div>
                    <p className="bg-slate-900/50 border border-slate-700 rounded-md p-2">{editedItem.marketplaceListing.title}</p>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1"><label className="text-xs text-slate-400">Description</label><button onClick={() => handleCopyToClipboard('desc', editedItem.marketplaceListing!.description)} className="text-xs text-cyan-400 flex items-center gap-1"><CopyIcon className="w-3 h-3"/>{copiedStates['desc'] ? 'Copied!' : 'Copy'}</button></div>
                    <p className="bg-slate-900/50 border border-slate-700 rounded-md p-2 max-h-24 overflow-y-auto">{editedItem.marketplaceListing.description}</p>
                  </div>
                </div>
              ) : (
                <button onClick={handleGenerateListingClick} disabled={isGenerating} className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-500 transition-colors disabled:bg-slate-700 disabled:text-slate-400">
                  {isGenerating ? <Loader /> : <SparklesIcon className="w-5 h-5" />}
                  {isGenerating ? 'Generating...' : 'Generate Listing with AI'}
                </button>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 mt-auto">
              <button onClick={handleDeleteClick} className="p-3 rounded-lg bg-slate-700 hover:bg-red-900/50 text-slate-400 hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-300 font-semibold hover:bg-slate-700 transition-colors">Cancel</button>
                <button onClick={handleSave} className="px-6 py-2 rounded-lg font-semibold bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">Save & Close</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to permanently delete "${item.name}"? This action cannot be undone.`}
        confirmButtonText="Delete"
      />
    </>
  );
};

export default ItemDetailModal;