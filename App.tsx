// FIX: This file was placeholder content. Implemented the main App component.
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import Header from './components/Header';
import AgentPanel from './components/AgentPanel';
import InventoryList from './components/InventoryList';
import QuickAddItemModal from './components/QuickAddItemModal';
import ItemDetailModal from './components/ItemDetailModal';
import LiveAppraisalModal from './components/LiveAppraisalModal';
import Confetti from './components/Confetti';
import { InventoryItem, AgentSuggestion } from './types';
import { analyzeItem, generateMarketplaceListing, getAgentSuggestions } from './services/geminiService';

const TARGET_GOAL = 80000; // Target liquidation goal

function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('inventory');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Failed to load inventory from local storage", error);
      return [];
    }
  });
  const [agentSuggestions, setAgentSuggestions] = useState<AgentSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [isLiveAppraisalModalOpen, setIsLiveAppraisalModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [itemToReview, setItemToReview] = useState<InventoryItem | null>(null);
  const [sortOption, setSortOption] = useState('date-desc');
  const [goalReached, setGoalReached] = useState(false);

  // Persist inventory to local storage
  useEffect(() => {
    try {
      localStorage.setItem('inventory', JSON.stringify(inventory));
    } catch (error) {
      console.error("Failed to save inventory to local storage", error);
    }
  }, [inventory]);

  // Fetch agent suggestions when inventory changes
  const fetchSuggestions = useCallback(async () => {
    if (inventory.length === 0) {
      setAgentSuggestions([{
        type: 'BULK_LIST', // A bit of a misnomer, but it serves as a "get started" prompt
        title: 'Add Your First Item',
        description: 'Use the AI agent to capture and analyze your first piece of equipment.',
        priority: 'high'
      }]);
      return;
    }
    setIsSuggestionsLoading(true);
    try {
      const suggestions = await getAgentSuggestions(inventory);
      setAgentSuggestions(suggestions);
    } catch (err: any) {
      console.error(err);
      // Don't show an error, just use a default suggestion
      setAgentSuggestions([]);
    } finally {
      setIsSuggestionsLoading(false);
    }
  }, [inventory]);

  useEffect(() => {
    const timer = setTimeout(fetchSuggestions, 500); // Debounce
    return () => clearTimeout(timer);
  }, [fetchSuggestions]);
  
  // Clear error after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleAddItem = async (image1: string | null, image2: string | null, text: string | null) => {
    setIsLoading(true);
    setIsQuickAddModalOpen(false);
    try {
      const geminiResponse = await analyzeItem(image1, image2, text);
      const newItem: InventoryItem = {
        id: uuidv4(),
        name: geminiResponse.itemName,
        description: geminiResponse.description,
        brand: geminiResponse.brand,
        estimatedValue: geminiResponse.estimatedValue,
        listingPrice: geminiResponse.estimatedValue, // Default listing price to AI estimate
        condition: geminiResponse.condition,
        conditionDetails: geminiResponse.conditionDetails,
        confidence: geminiResponse.confidenceScore,
        image: image1,
        image2: image2,
        status: 'Available',
        marketplaceListing: null,
        listingUrl: null,
        groundingChunks: geminiResponse.groundingChunks,
      };
      setInventory(prev => [newItem, ...prev]);
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLiveItem = (itemData: Omit<InventoryItem, 'id' | 'status' | 'marketplaceListing' | 'listingPrice' | 'listingUrl'>) => {
    const newItem: InventoryItem = {
      ...itemData,
      id: uuidv4(),
      listingPrice: itemData.estimatedValue,
      status: 'Available',
      marketplaceListing: null,
      listingUrl: null,
    };
    setInventory(prev => [newItem, ...prev]);
  };
  
  const handleUpdateItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    setSelectedItem(null);
  };
  
  const handleLiveUpdateItem = (updatedItem: InventoryItem) => {
      setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      setItemToReview(null);
  }

  const handleDeleteItem = (itemId: string) => {
    setInventory(prev => prev.filter(item => item.id !== itemId));
    setSelectedItem(null);
  };

  const handleReanalyzeItem = async (itemToReanalyze: InventoryItem) => {
    setIsLoading(true);
    try {
      const geminiResponse = await analyzeItem(itemToReanalyze.image, itemToReanalyze.image2, itemToReanalyze.description);
      const updatedItem: InventoryItem = {
        ...itemToReanalyze,
        name: geminiResponse.itemName,
        description: geminiResponse.description,
        brand: geminiResponse.brand,
        estimatedValue: geminiResponse.estimatedValue,
        // Keep user's price if they changed it, otherwise update with new estimate
        listingPrice: itemToReanalyze.listingPrice === itemToReanalyze.estimatedValue ? geminiResponse.estimatedValue : itemToReanalyze.listingPrice,
        condition: geminiResponse.condition,
        conditionDetails: geminiResponse.conditionDetails,
        confidence: geminiResponse.confidenceScore,
        groundingChunks: geminiResponse.groundingChunks,
      };
      // Important: update the item in the modal as well for a seamless experience
      setSelectedItem(updatedItem);
      handleUpdateItem(updatedItem);
    } catch (err: any) {
      setError(err.message || "Failed to re-analyze item.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateListing = async (itemForListing: InventoryItem) => {
    setIsLoading(true);
    try {
      const listing = await generateMarketplaceListing(itemForListing);
      const updatedItem: InventoryItem = {
        ...itemForListing,
        marketplaceListing: listing,
        status: itemForListing.status === 'Available' ? 'Listed' : itemForListing.status,
      };
      setSelectedItem(updatedItem);
      handleUpdateItem(updatedItem);
    } catch (err: any) {
      setError(err.message || "Failed to generate listing.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSuggestionClick = (suggestion: AgentSuggestion) => {
    if (suggestion.type === 'BULK_LIST') {
      // Find all 'Available' items and generate listings for them
      const availableItems = inventory.filter(item => item.status === 'Available');
      if(availableItems.length > 0) {
          // In a real app, you might show a confirmation. Here we just generate for the first one.
          const item = availableItems[0];
          setSelectedItem(item);
      } else if (inventory.length === 0) {
          setIsQuickAddModalOpen(true);
      }
    } else if (suggestion.type === 'REVIEW_ITEM' && suggestion.itemId) {
      const item = inventory.find(i => i.id === suggestion.itemId);
      if (item) setSelectedItem(item);
    } else if (suggestion.type === 'ADD_URL' && suggestion.itemId) {
      const item = inventory.find(i => i.id === suggestion.itemId);
      if (item) setSelectedItem(item);
    }
  };
  
  const handleClearAll = () => {
      setInventory([]);
  }

  // Memoized calculations for header and sorting
  const { liquidatedValue, activeValue, statusCounts, sortedInventory } = useMemo(() => {
    const counts: Record<InventoryItem['status'], number> = { Available: 0, Listed: 0, Sold: 0 };
    let liqValue = 0;
    let actValue = 0;

    inventory.forEach(item => {
      counts[item.status]++;
      if (item.status === 'Sold') {
        liqValue += item.listingPrice;
      }
      if (item.status === 'Listed') {
        actValue += item.listingPrice;
      }
    });
    
    // Sorting logic
    const sorted = [...inventory].sort((a, b) => {
        switch(sortOption) {
            case 'date-asc': return (a.id > b.id) ? 1 : -1;
            case 'name-asc': return a.name.localeCompare(b.name);
            case 'name-desc': return b.name.localeCompare(a.name);
            case 'value-desc': return b.listingPrice - a.listingPrice;
            case 'value-asc': return a.listingPrice - b.listingPrice;
            case 'date-desc':
            default:
                return (b.id > a.id) ? 1 : -1;
        }
    });

    return { liquidatedValue: liqValue, activeValue: actValue, statusCounts: counts, sortedInventory: sorted };
  }, [inventory, sortOption]);

  useEffect(() => {
    if (liquidatedValue >= TARGET_GOAL && !goalReached) {
      setGoalReached(true);
      setTimeout(() => setGoalReached(false), 8000); // Confetti lasts 8s
    }
  }, [liquidatedValue, goalReached]);

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans">
      {goalReached && <Confetti />}
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <Header 
          liquidatedValue={liquidatedValue}
          activeValue={activeValue}
          targetGoal={TARGET_GOAL}
          itemCount={inventory.length}
          statusCounts={statusCounts}
        />
        
        {error && (
            <div className="fixed top-5 right-5 bg-red-600/90 border border-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-pulse">
                <p className="font-bold">Error</p>
                <p>{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <aside className="lg:col-span-1">
            <AgentPanel 
              onQuickAdd={() => setIsQuickAddModalOpen(true)}
              onLiveAppraise={() => { setItemToReview(null); setIsLiveAppraisalModalOpen(true); }}
              suggestions={agentSuggestions}
              onSuggestionClick={handleSuggestionClick}
              isLoading={isSuggestionsLoading}
            />
          </aside>
          <section className="lg:col-span-2">
            <InventoryList
              items={sortedInventory}
              onItemClick={setSelectedItem}
              onItemReview={(item) => { setItemToReview(item); setIsLiveAppraisalModalOpen(true); }}
              isLoading={isLoading}
              sortOption={sortOption}
              onSortChange={setSortOption}
              onClearAll={handleClearAll}
            />
          </section>
        </div>
      </main>

      {isQuickAddModalOpen && (
        <QuickAddItemModal 
          onClose={() => setIsQuickAddModalOpen(false)}
          onAddItem={handleAddItem}
          isLoading={isLoading}
        />
      )}
      
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onSave={handleUpdateItem}
          onDelete={handleDeleteItem}
          onReanalyze={handleReanalyzeItem}
          onGenerateListing={handleGenerateListing}
        />
      )}

      {isLiveAppraisalModalOpen && (
        <LiveAppraisalModal
            onClose={() => { setIsLiveAppraisalModalOpen(false); setItemToReview(null); }}
            onAddItem={handleAddLiveItem}
            onUpdateItem={handleLiveUpdateItem}
            setError={setError}
            itemToReview={itemToReview}
        />
      )}
    </div>
  );
}

export default App;