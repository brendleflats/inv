import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmButtonText?: string;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmButtonText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fade-in" onClick={onClose}>
      <style>{`.animate-fade-in { animation: fade-in 0.2s ease-out forwards; } @keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }`}</style>
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md p-6 an_modal" onClick={(e) => e.stopPropagation()}>
        <style>{`.an_modal { animation: modal-in 0.3s ease-out forwards; } @keyframes modal-in { 0% { opacity: 0; transform: scale(0.95) translateY(20px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }`}</style>
        <h2 className="text-xl font-bold text-white mb-2">{title}</h2>
        <p className="text-slate-400 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-300 font-semibold hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
              onClose();
            }} 
            className="px-6 py-2 rounded-lg font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            {confirmButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
