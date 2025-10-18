import React, { useState, useRef, useEffect } from 'react';
import ImageInput from './ImageInput';
import { MicIcon } from './icons/MicIcon';
import Loader from './Loader';

interface QuickAddItemModalProps {
  onClose: () => void;
  onAddItem: (image1: string | null, image2: string | null, text: string | null) => void;
  isLoading: boolean;
}

const QuickAddItemModal: React.FC<QuickAddItemModalProps> = ({ onClose, onAddItem, isLoading }) => {
  const [textInput, setTextInput] = useState('');
  const [image1, setImage1] = useState<string | null>(null);
  const [image2, setImage2] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTextInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }
  }, []);

  const handleMicClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleAnalyze = () => {
    onAddItem(image1, image2, textInput);
  };

  const isAnalyzeDisabled = isLoading || (!image1 && !textInput.trim());

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative" onClick={(e) => e.stopPropagation()}>
        <style>{`.an_modal { animation: modal-in 0.3s ease-out forwards; } @keyframes modal-in { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        
        <div className="p-6 border-b border-slate-700">
            <h2 className="text-2xl font-bold text-white">Quick Add Item</h2>
            <p className="text-slate-400">Capture photos and add a description for AI analysis.</p>
        </div>
        
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="grid md:grid-cols-2 gap-6">
                <ImageInput label="Primary Photo" onImageSet={setImage1} />
                <ImageInput label="Detail Photo (Optional)" onImageSet={setImage2} />
            </div>
            <div className="mt-6">
                <h3 className="font-semibold text-slate-300 mb-2">Description</h3>
                <div className="relative">
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Describe the item or add details from a nameplate..."
                    className="w-full h-28 p-3 pr-24 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    onClick={handleMicClick}
                    className={`absolute right-2 top-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      isListening ? 'bg-red-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                    disabled={!recognitionRef.current || isLoading}
                    aria-label={isListening ? 'Stop recording' : 'Record description'}
                  >
                    <MicIcon className="w-5 h-5" />
                    {isListening ? 'Listening...' : ''}
                  </button>
                </div>
            </div>
        </div>
        
        <div className="p-6 flex justify-end items-center gap-4 border-t border-slate-700 bg-slate-800/50">
             <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-300 font-semibold hover:bg-slate-700 transition-colors">Cancel</button>
             <button 
              onClick={handleAnalyze} 
              disabled={isAnalyzeDisabled}
              className="px-6 py-2 font-bold rounded-lg transition-all duration-300 bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/40 disabled:from-slate-600 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              Analyze & Add Item
            </button>
        </div>

        {isLoading && (
            <div className="absolute inset-0 bg-slate-800/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl z-10">
              <Loader />
              <p className="mt-4 text-lg font-medium text-slate-300">AI is analyzing the item...</p>
            </div>
          )}
      </div>
    </div>
  );
};

export default QuickAddItemModal;