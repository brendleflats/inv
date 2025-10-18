// FIX: This file was placeholder content. Implemented the AgentPanel component.
import React from 'react';
import { AgentSuggestion } from '../types';
import { BotIcon } from './icons/BotIcon';
import { PlusIcon } from './icons/PlusIcon';
import { MicIcon } from './icons/MicIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { WandIcon } from './icons/WandIcon';
import { ExternalLinkIcon } from './icons/ExternalLinkIcon';

interface AgentPanelProps {
  onQuickAdd: () => void;
  onLiveAppraise: () => void;
  suggestions: AgentSuggestion[];
  onSuggestionClick: (suggestion: AgentSuggestion) => void;
  isLoading: boolean;
}

const suggestionIcons: Record<AgentSuggestion['type'], React.ElementType> = {
  BULK_LIST: MegaphoneIcon,
  REVIEW_ITEM: WandIcon,
  ADD_URL: ExternalLinkIcon
};

const suggestionColors: Record<AgentSuggestion['priority'], string> = {
    high: 'border-red-500/50 hover:border-red-500 bg-slate-800/50 hover:bg-slate-800',
    medium: 'border-slate-700 hover:border-cyan-500 bg-slate-800/50 hover:bg-slate-800',
    low: 'border-slate-700/50 hover:border-slate-600 bg-transparent hover:bg-slate-800/50'
};

const AgentPanel: React.FC<AgentPanelProps> = ({ onQuickAdd, onLiveAppraise, suggestions, onSuggestionClick, isLoading }) => {
  return (
    <div className="lg:sticky lg:top-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
            <BotIcon className="w-7 h-7 text-white" />
        </div>
        <div>
            <h2 className="text-2xl font-bold text-white">AI Agent</h2>
            <p className="text-slate-400">Your liquidation assistant.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button 
          onClick={onQuickAdd}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-cyan-500 transition-all text-center"
        >
          <PlusIcon className="w-6 h-6 text-cyan-400"/>
          <span className="font-semibold text-sm">Quick Add Item</span>
        </button>
        <button 
          onClick={onLiveAppraise}
          className="flex flex-col items-center justify-center gap-2 p-4 bg-slate-800 border border-slate-700 rounded-xl hover:bg-slate-700/50 hover:border-indigo-500 transition-all text-center"
        >
          <MicIcon className="w-6 h-6 text-indigo-400"/>
          <span className="font-semibold text-sm">Live AI Appraisal</span>
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-300">Action Items</h3>
        {isLoading && <p className="text-slate-500">Thinking of suggestions...</p>}
        {!isLoading && suggestions.length === 0 && <p className="text-slate-500">No suggestions right now. Great job!</p>}
        <div className="space-y-3">
            {suggestions.map((s, i) => {
                const Icon = suggestionIcons[s.type] || WandIcon;
                return (
                    <div 
                        key={i}
                        onClick={() => onSuggestionClick(s)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${suggestionColors[s.priority]}`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><Icon className="w-5 h-5 text-slate-400" /></div>
                            <div>
                                <h4 className="font-bold text-slate-100">{s.title}</h4>
                                <p className="text-sm text-slate-400">{s.description}</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
};

export default AgentPanel;